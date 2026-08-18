-- ZZERKOFF UNIVERSAL PROMO / COUPON ENGINE FIX
-- Run once in Lovable Cloud -> SQL Editor.
--
-- Goal:
--   * every future promo created from Admin Commerce works consistently
--   * APPLY validates server-side and returns the discounted total
--   * final order re-validates the same promo before saving the order
--   * promo code is case-insensitive and normalized on future insert/update
--   * usage limits / minimum order / active / date windows remain enforced
--
-- Does NOT delete or reset any promo, order, stock, payment, Steadfast or ERP data.

BEGIN;

-- ---------------------------------------------------------
-- 1) Normalize and validate every FUTURE Admin promo write
-- ---------------------------------------------------------
CREATE OR REPLACE FUNCTION public.commerce_promo_write_guard()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.code := upper(trim(COALESCE(NEW.code, '')));

  IF NEW.code = '' THEN
    RAISE EXCEPTION 'Promo code is required.';
  END IF;

  IF NEW.code !~ '^[A-Z0-9_-]{2,32}$' THEN
    RAISE EXCEPTION 'Promo code may contain only letters, numbers, - and _ (2-32 characters).';
  END IF;

  IF NEW.discount_type NOT IN ('percent', 'fixed') THEN
    RAISE EXCEPTION 'Discount type must be percent or fixed.';
  END IF;

  IF NEW.discount_value IS NULL OR NEW.discount_value <= 0 THEN
    RAISE EXCEPTION 'Discount value must be greater than 0.';
  END IF;

  IF NEW.discount_type = 'percent' AND NEW.discount_value > 100 THEN
    RAISE EXCEPTION 'Percentage discount cannot be more than 100.';
  END IF;

  NEW.min_order_amount := GREATEST(COALESCE(NEW.min_order_amount, 0), 0);

  IF NEW.max_uses IS NOT NULL AND NEW.max_uses < 1 THEN
    RAISE EXCEPTION 'Max uses must be at least 1 or left empty.';
  END IF;

  IF NEW.starts_at IS NOT NULL
     AND NEW.ends_at IS NOT NULL
     AND NEW.ends_at <= NEW.starts_at THEN
    RAISE EXCEPTION 'Promo end time must be after the start time.';
  END IF;

  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS commerce_promo_write_guard_trigger
ON public.commerce_promos;

CREATE TRIGGER commerce_promo_write_guard_trigger
BEFORE INSERT OR UPDATE
ON public.commerce_promos
FOR EACH ROW
EXECUTE FUNCTION public.commerce_promo_write_guard();


-- ---------------------------------------------------------
-- 2) Public checkout preview used by the APPLY button
--    All table columns are explicitly qualified so PL/pgSQL
--    output-column names can never collide with promo columns.
-- ---------------------------------------------------------
CREATE OR REPLACE FUNCTION public.preview_promo_code(
  p_code text,
  p_subtotal numeric
)
RETURNS TABLE(
  valid boolean,
  code text,
  discount_amount numeric,
  final_total numeric,
  message text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_promo public.commerce_promos%ROWTYPE;
  v_subtotal numeric := GREATEST(COALESCE(p_subtotal, 0), 0);
  v_discount numeric := 0;
  v_code text := upper(trim(COALESCE(p_code, '')));
BEGIN
  IF v_code = '' THEN
    RETURN QUERY
    SELECT false, ''::text, 0::numeric, v_subtotal, 'Enter a promo code.'::text;
    RETURN;
  END IF;

  SELECT promo.*
  INTO v_promo
  FROM public.commerce_promos AS promo
  WHERE upper(trim(promo.code)) = v_code
    AND promo.active = true
    AND (promo.starts_at IS NULL OR promo.starts_at <= now())
    AND (promo.ends_at IS NULL OR promo.ends_at >= now())
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN QUERY
    SELECT false, v_code, 0::numeric, v_subtotal,
           'Promo code is not valid or is inactive.'::text;
    RETURN;
  END IF;

  IF v_promo.max_uses IS NOT NULL
     AND v_promo.usage_count >= v_promo.max_uses THEN
    RETURN QUERY
    SELECT false, v_code, 0::numeric, v_subtotal,
           'Promo code has reached its usage limit.'::text;
    RETURN;
  END IF;

  IF v_subtotal < v_promo.min_order_amount THEN
    RETURN QUERY
    SELECT false, v_code, 0::numeric, v_subtotal,
           format(
             'Minimum order amount is %s.',
             trim(to_char(v_promo.min_order_amount, 'FM999999990.00'))
           )::text;
    RETURN;
  END IF;

  v_discount := CASE
    WHEN v_promo.discount_type = 'percent'
      THEN round(v_subtotal * v_promo.discount_value / 100, 2)
    ELSE LEAST(v_promo.discount_value, v_subtotal)
  END;

  v_discount := LEAST(GREATEST(v_discount, 0), v_subtotal);

  RETURN QUERY
  SELECT
    true,
    v_code,
    v_discount,
    GREATEST(v_subtotal - v_discount, 0),
    'Promo applied.'::text;
END;
$$;

REVOKE ALL
ON FUNCTION public.preview_promo_code(text, numeric)
FROM PUBLIC;

GRANT EXECUTE
ON FUNCTION public.preview_promo_code(text, numeric)
TO anon, authenticated, service_role;


-- ---------------------------------------------------------
-- 3) Final order function: re-validates the SAME promo
--    server-side, applies it to the final order total and
--    increments usage_count only when the order succeeds.
-- ---------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_commerce_order(
  p_product_id uuid,
  p_customer_name text,
  p_phone text,
  p_address text,
  p_size text,
  p_finish text,
  p_color text,
  p_quantity integer,
  p_map_url text,
  p_latitude numeric,
  p_longitude numeric,
  p_note text,
  p_payment_method text,
  p_transaction_id text,
  p_promo_code text,
  p_customer_email text
)
RETURNS TABLE(
  order_number text,
  total_price numeric,
  discount_amount numeric,
  promo_code text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_product public.products%ROWTYPE;
  v_order_number text;
  v_original_total numeric;
  v_final_total numeric;
  v_discount numeric := 0;
  v_code text := NULL;
  v_color text := NULLIF(trim(COALESCE(p_color, '')), '');
  v_color_available integer;
  v_promo public.commerce_promos%ROWTYPE;
BEGIN
  IF p_quantity IS NULL OR p_quantity < 1 THEN
    RAISE EXCEPTION 'Quantity must be at least 1.';
  END IF;

  SELECT product.*
  INTO v_product
  FROM public.products AS product
  WHERE product.id = p_product_id
    AND product.published = true
    AND COALESCE(product.archived, false) = false
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'This object is no longer available.';
  END IF;

  IF COALESCE(array_length(v_product.colors, 1), 0) > 0 THEN
    IF v_color IS NULL OR NOT (v_color = ANY(v_product.colors)) THEN
      RAISE EXCEPTION 'Please select a valid color.';
    END IF;

    v_color_available := COALESCE(
      (v_product.color_stock ->> v_color)::integer,
      0
    );

    IF v_color_available < p_quantity THEN
      RAISE EXCEPTION 'Requested quantity is not available in %.', v_color;
    END IF;
  ELSE
    v_color := NULL;
  END IF;

  IF NULLIF(trim(COALESCE(p_promo_code, '')), '') IS NOT NULL THEN
    v_code := upper(trim(p_promo_code));

    SELECT promo.*
    INTO v_promo
    FROM public.commerce_promos AS promo
    WHERE upper(trim(promo.code)) = v_code
      AND promo.active = true
      AND (promo.starts_at IS NULL OR promo.starts_at <= now())
      AND (promo.ends_at IS NULL OR promo.ends_at >= now())
    LIMIT 1
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Promo code is not valid or is inactive.';
    END IF;

    IF v_promo.max_uses IS NOT NULL
       AND v_promo.usage_count >= v_promo.max_uses THEN
      RAISE EXCEPTION 'Promo code has reached its usage limit.';
    END IF;
  END IF;

  SELECT result.order_number, result.total_price
  INTO v_order_number, v_original_total
  FROM public.create_public_order(
    p_product_id,
    p_customer_name,
    p_phone,
    p_address,
    p_size,
    p_finish,
    p_quantity,
    p_map_url,
    p_latitude,
    p_longitude,
    p_note,
    p_payment_method,
    p_transaction_id
  ) AS result;

  v_final_total := v_original_total;

  IF v_code IS NOT NULL THEN
    IF v_original_total < v_promo.min_order_amount THEN
      RAISE EXCEPTION 'Minimum order amount for this promo is %.',
        v_promo.min_order_amount;
    END IF;

    v_discount := CASE
      WHEN v_promo.discount_type = 'percent'
        THEN round(v_original_total * v_promo.discount_value / 100, 2)
      ELSE LEAST(v_promo.discount_value, v_original_total)
    END;

    v_discount := LEAST(GREATEST(v_discount, 0), v_original_total);
    v_final_total := GREATEST(v_original_total - v_discount, 0);

    UPDATE public.commerce_promos AS promo
    SET
      usage_count = promo.usage_count + 1,
      updated_at = now()
    WHERE promo.id = v_promo.id;
  END IF;

  IF v_color IS NOT NULL THEN
    UPDATE public.products AS product
    SET color_stock = jsonb_set(
      COALESCE(product.color_stock, '{}'::jsonb),
      ARRAY[v_color],
      to_jsonb(v_color_available - p_quantity),
      true
    )
    WHERE product.id = p_product_id;
  END IF;

  UPDATE public.orders AS ord
  SET
    selected_color = v_color,
    subtotal_price = v_original_total,
    discount_amount = v_discount,
    promo_code = v_code,
    total_price = v_final_total,
    customer_email = COALESCE(
      NULLIF(trim(COALESCE(p_customer_email, '')), ''),
      ord.customer_email
    )
  WHERE ord.order_number = v_order_number;

  UPDATE public.commerce_notification_events AS evt
  SET
    email = COALESCE(
      NULLIF(trim(COALESCE(p_customer_email, '')), ''),
      evt.email
    ),
    payload = evt.payload || jsonb_build_object(
      'total_price', v_final_total,
      'promo_code', v_code,
      'discount_amount', v_discount,
      'selected_color', v_color
    )
  WHERE evt.order_number = v_order_number
    AND evt.event_type = 'order_received'
    AND evt.delivery_status = 'queued';

  RETURN QUERY
  SELECT v_order_number, v_final_total, v_discount, v_code;
END;
$$;

REVOKE ALL
ON FUNCTION public.create_commerce_order(
  uuid, text, text, text, text, text, text, integer,
  text, numeric, numeric, text, text, text, text, text
)
FROM PUBLIC;

GRANT EXECUTE
ON FUNCTION public.create_commerce_order(
  uuid, text, text, text, text, text, text, integer,
  text, numeric, numeric, text, text, text, text, text
)
TO anon, authenticated, service_role;

COMMIT;

-- ---------------------------------------------------------
-- 4) VERIFY EVERY CURRENT ACTIVE ADMIN PROMO
-- Uses a subtotal that is at least each promo's minimum.
-- This does NOT consume/increment promo usage.
-- ---------------------------------------------------------
SELECT
  promo.code,
  promo.discount_type,
  promo.discount_value,
  promo.min_order_amount,
  promo.max_uses,
  promo.usage_count,
  promo.active,
  test.valid,
  test.discount_amount,
  test.final_total,
  test.message
FROM public.commerce_promos AS promo
CROSS JOIN LATERAL public.preview_promo_code(
  promo.code,
  GREATEST(promo.min_order_amount, 299)
) AS test
WHERE promo.active = true
ORDER BY promo.created_at DESC;

-- Specific check for the code shown in your screenshot.
SELECT *
FROM public.preview_promo_code('ZZA50', 299);
