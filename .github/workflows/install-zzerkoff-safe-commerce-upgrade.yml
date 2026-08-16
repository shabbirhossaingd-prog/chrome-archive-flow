-- ZZERKOFF SAFE COMMERCE UPGRADE
-- Run ONCE in Lovable Cloud -> SQL Editor.

ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS cod_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS bkash_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS bkash_number text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS nagad_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS nagad_number text NOT NULL DEFAULT '';

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS payment_method text NOT NULL DEFAULT 'cod',
  ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'unpaid',
  ADD COLUMN IF NOT EXISTS transaction_id text,
  ADD COLUMN IF NOT EXISTS paid_at timestamptz,
  ADD COLUMN IF NOT EXISTS stock_released boolean NOT NULL DEFAULT false;

CREATE UNIQUE INDEX IF NOT EXISTS orders_payment_trx_unique
  ON public.orders (payment_method, lower(transaction_id))
  WHERE transaction_id IS NOT NULL AND btrim(transaction_id) <> '';

CREATE OR REPLACE FUNCTION public.create_public_order(
  p_product_id uuid,
  p_customer_name text,
  p_phone text,
  p_address text,
  p_size text,
  p_finish text,
  p_quantity integer,
  p_map_url text,
  p_latitude numeric,
  p_longitude numeric,
  p_note text,
  p_payment_method text,
  p_transaction_id text
)
RETURNS TABLE(order_number text, total_price numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_product public.products%ROWTYPE;
  v_settings public.site_settings%ROWTYPE;
  v_order_number text;
  v_total numeric;
  v_method text;
  v_payment_status text;
BEGIN
  IF char_length(trim(COALESCE(p_customer_name, ''))) < 2 THEN
    RAISE EXCEPTION 'Please enter your name.';
  END IF;
  IF char_length(regexp_replace(COALESCE(p_phone, ''), '\D', '', 'g')) < 7 THEN
    RAISE EXCEPTION 'Please enter a valid phone number.';
  END IF;
  IF char_length(trim(COALESCE(p_address, ''))) < 5 THEN
    RAISE EXCEPTION 'Please enter your full delivery address.';
  END IF;
  IF p_quantity IS NULL OR p_quantity < 1 OR p_quantity > 20 THEN
    RAISE EXCEPTION 'Invalid quantity.';
  END IF;

  SELECT *
  INTO v_product
  FROM public.products
  WHERE id = p_product_id
    AND published = true
    AND COALESCE(archived, false) = false
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'This object is no longer available.';
  END IF;

  IF v_product.stock_status = 'SOLD OUT'
     OR v_product.quantity_available <= 0
     OR p_quantity > v_product.quantity_available THEN
    RAISE EXCEPTION 'Requested quantity is not available.';
  END IF;

  IF COALESCE(array_length(v_product.sizes, 1), 0) > 0
     AND NOT (COALESCE(p_size, '') = ANY(v_product.sizes)) THEN
    RAISE EXCEPTION 'Please select a valid size.';
  END IF;

  IF COALESCE(array_length(v_product.finish, 1), 0) > 0
     AND NOT (COALESCE(p_finish, '') = ANY(v_product.finish)) THEN
    RAISE EXCEPTION 'Please select a valid finish.';
  END IF;

  SELECT * INTO v_settings
  FROM public.site_settings
  ORDER BY created_at ASC
  LIMIT 1;

  v_method := lower(COALESCE(NULLIF(trim(p_payment_method), ''), 'cod'));

  IF v_method NOT IN ('cod', 'bkash', 'nagad') THEN
    RAISE EXCEPTION 'Invalid payment method.';
  END IF;

  IF v_method = 'cod' AND COALESCE(v_settings.cod_enabled, true) = false THEN
    RAISE EXCEPTION 'Cash on delivery is unavailable.';
  END IF;

  IF v_method = 'bkash' THEN
    IF COALESCE(v_settings.bkash_enabled, false) = false OR char_length(trim(COALESCE(v_settings.bkash_number, ''))) < 7 THEN
      RAISE EXCEPTION 'bKash payment is unavailable.';
    END IF;
    IF char_length(trim(COALESCE(p_transaction_id, ''))) < 4 THEN
      RAISE EXCEPTION 'Please enter the bKash transaction ID.';
    END IF;
  END IF;

  IF v_method = 'nagad' THEN
    IF COALESCE(v_settings.nagad_enabled, false) = false OR char_length(trim(COALESCE(v_settings.nagad_number, ''))) < 7 THEN
      RAISE EXCEPTION 'Nagad payment is unavailable.';
    END IF;
    IF char_length(trim(COALESCE(p_transaction_id, ''))) < 4 THEN
      RAISE EXCEPTION 'Please enter the Nagad transaction ID.';
    END IF;
  END IF;

  v_payment_status := CASE
    WHEN v_method = 'cod' THEN 'unpaid'
    ELSE 'pending_verification'
  END;

  v_order_number :=
    'ZZ-' || to_char(now(), 'YYMMDD') || '-' ||
    lpad(nextval('public.order_number_seq')::text, 4, '0');

  v_total := v_product.price * p_quantity;

  UPDATE public.products
  SET
    quantity_available = quantity_available - p_quantity,
    stock_status = CASE
      WHEN quantity_available - p_quantity <= 0 THEN 'SOLD OUT'
      ELSE stock_status
    END
  WHERE id = v_product.id;

  INSERT INTO public.orders (
    order_number, source, status, customer_name, phone, delivery_address,
    map_url, latitude, longitude, customer_note, product_id, product_name,
    product_code, unit_price, quantity, selected_size, selected_finish,
    total_price, payment_method, payment_status, transaction_id
  )
  VALUES (
    v_order_number, 'website', 'new', trim(p_customer_name), trim(p_phone),
    trim(p_address), NULLIF(trim(COALESCE(p_map_url, '')), ''), p_latitude,
    p_longitude, NULLIF(trim(COALESCE(p_note, '')), ''), v_product.id,
    v_product.name, v_product.product_code, v_product.price, p_quantity,
    NULLIF(trim(COALESCE(p_size, '')), ''),
    NULLIF(trim(COALESCE(p_finish, '')), ''), v_total,
    v_method, v_payment_status, NULLIF(trim(COALESCE(p_transaction_id, '')), '')
  );

  RETURN QUERY SELECT v_order_number, v_total;
END;
$$;

REVOKE ALL ON FUNCTION public.create_public_order(
  uuid, text, text, text, text, text, integer, text, numeric, numeric, text, text, text
) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.create_public_order(
  uuid, text, text, text, text, text, integer, text, numeric, numeric, text, text, text
) TO anon, authenticated, service_role;

-- Keep old live checkout working during deployment, but route it through the new safe function.
CREATE OR REPLACE FUNCTION public.create_public_order(
  p_product_id uuid,
  p_customer_name text,
  p_phone text,
  p_address text,
  p_size text,
  p_finish text,
  p_quantity integer,
  p_map_url text,
  p_latitude numeric,
  p_longitude numeric,
  p_note text
)
RETURNS TABLE(order_number text, total_price numeric)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.create_public_order(
    p_product_id, p_customer_name, p_phone, p_address, p_size, p_finish,
    p_quantity, p_map_url, p_latitude, p_longitude, p_note, 'cod', NULL
  );
$$;

REVOKE ALL ON FUNCTION public.create_public_order(
  uuid, text, text, text, text, text, integer, text, numeric, numeric, text
) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.create_public_order(
  uuid, text, text, text, text, text, integer, text, numeric, numeric, text
) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.zzerkoff_order_side_effects()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'cancelled'
     AND OLD.status IS DISTINCT FROM 'cancelled'
     AND NEW.product_id IS NOT NULL
     AND COALESCE(NEW.stock_released, false) = false THEN

    UPDATE public.products
    SET
      quantity_available = quantity_available + NEW.quantity,
      stock_status = CASE WHEN stock_status = 'SOLD OUT' THEN 'IN STOCK' ELSE stock_status END
    WHERE id = NEW.product_id;

    NEW.stock_released := true;
  END IF;

  IF OLD.payment_status IS DISTINCT FROM 'paid' AND NEW.payment_status = 'paid' THEN
    NEW.paid_at := COALESCE(NEW.paid_at, now());
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS orders_zzerkoff_side_effects ON public.orders;
CREATE TRIGGER orders_zzerkoff_side_effects
BEFORE UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.zzerkoff_order_side_effects();
