-- ZZERKOFF COMMERCE EXPERIENCE UPGRADE
-- Run ONCE in Lovable Cloud -> SQL Editor before the GitHub installer.
-- Existing order / Steadfast / ERP flows are preserved.

-- 0) Ensure category filters exist.
INSERT INTO public.categories (slug, name, sort_order, image_url, active)
VALUES
  ('rings', 'RINGS', 1, '/products/ring.jpg', true),
  ('bracelets', 'BRACELETS', 2, '/products/bracelet.jpg', true),
  ('chains', 'CHAINS', 3, '/products/chain.jpg', true),
  ('pant-chains', 'PANT CHAINS', 4, '/products/chain.jpg', true),
  ('earrings', 'EARRINGS', 5, '/products/ring.jpg', true),
  ('eyewear', 'EYEWEAR', 6, '/products/campaign-2.jpg', true)
ON CONFLICT (slug) DO UPDATE
SET
  name = EXCLUDED.name,
  active = true;

UPDATE public.categories SET active = true WHERE slug = 'chrome-glasses';

-- 1) Product colors + order commerce metadata.
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS colors text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS color_stock jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS selected_color text,
  ADD COLUMN IF NOT EXISTS color_stock_released boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS subtotal_price numeric,
  ADD COLUMN IF NOT EXISTS discount_amount numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS promo_code text,
  ADD COLUMN IF NOT EXISTS customer_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS customer_email text;

CREATE INDEX IF NOT EXISTS orders_customer_user_idx
  ON public.orders (customer_user_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.commerce_attach_customer()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF auth.uid() IS NOT NULL THEN
    NEW.customer_user_id := COALESCE(NEW.customer_user_id, auth.uid());

    IF COALESCE(NULLIF(trim(NEW.customer_email), ''), '') = '' THEN
      SELECT email
      INTO NEW.customer_email
      FROM auth.users
      WHERE id = auth.uid();
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS orders_commerce_attach_customer ON public.orders;
CREATE TRIGGER orders_commerce_attach_customer
BEFORE INSERT ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.commerce_attach_customer();

DROP POLICY IF EXISTS "Customers view own orders" ON public.orders;
CREATE POLICY "Customers view own orders"
ON public.orders
FOR SELECT TO authenticated
USING (customer_user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.commerce_color_order_side_effects()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_available integer;
BEGIN
  IF NEW.product_id IS NULL
     OR COALESCE(trim(NEW.selected_color), '') = '' THEN
    RETURN NEW;
  END IF;

  IF NEW.status = 'cancelled'
     AND OLD.status IS DISTINCT FROM 'cancelled'
     AND COALESCE(NEW.color_stock_released, false) = false THEN

    UPDATE public.products
    SET color_stock = jsonb_set(
      COALESCE(color_stock, '{}'::jsonb),
      ARRAY[NEW.selected_color],
      to_jsonb(COALESCE((color_stock ->> NEW.selected_color)::integer, 0) + NEW.quantity),
      true
    )
    WHERE id = NEW.product_id;

    NEW.color_stock_released := true;
  END IF;

  IF OLD.status = 'cancelled'
     AND NEW.status IS DISTINCT FROM 'cancelled'
     AND COALESCE(OLD.color_stock_released, false) = true THEN

    SELECT COALESCE((color_stock ->> NEW.selected_color)::integer, 0)
    INTO v_available
    FROM public.products
    WHERE id = NEW.product_id
    FOR UPDATE;

    IF COALESCE(v_available, 0) < NEW.quantity THEN
      RAISE EXCEPTION 'Not enough stock for color % to reopen this order.', NEW.selected_color;
    END IF;

    UPDATE public.products
    SET color_stock = jsonb_set(
      COALESCE(color_stock, '{}'::jsonb),
      ARRAY[NEW.selected_color],
      to_jsonb(v_available - NEW.quantity),
      true
    )
    WHERE id = NEW.product_id;

    NEW.color_stock_released := false;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS orders_commerce_color_side_effects ON public.orders;
CREATE TRIGGER orders_commerce_color_side_effects
BEFORE UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.commerce_color_order_side_effects();

-- 2) Customer account.
CREATE TABLE IF NOT EXISTS public.customer_profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.customer_addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label text NOT NULL DEFAULT 'Home',
  recipient_name text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  full_address text NOT NULL,
  map_url text,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS customer_addresses_user_idx
  ON public.customer_addresses (user_id, is_default DESC, created_at DESC);

ALTER TABLE public.customer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.customer_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customer_addresses TO authenticated;

DROP POLICY IF EXISTS "Customers manage own profile" ON public.customer_profiles;
CREATE POLICY "Customers manage own profile"
ON public.customer_profiles
FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Customers manage own addresses" ON public.customer_addresses;
CREATE POLICY "Customers manage own addresses"
ON public.customer_addresses
FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins view customer profiles" ON public.customer_profiles;
CREATE POLICY "Admins view customer profiles"
ON public.customer_profiles
FOR SELECT TO authenticated
USING (private.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins view customer addresses" ON public.customer_addresses;
CREATE POLICY "Admins view customer addresses"
ON public.customer_addresses
FOR SELECT TO authenticated
USING (private.has_role(auth.uid(), 'admin'::public.app_role));

CREATE OR REPLACE FUNCTION public.customer_address_default_guard()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.is_default THEN
    UPDATE public.customer_addresses
    SET is_default = false
    WHERE user_id = NEW.user_id AND id IS DISTINCT FROM NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS customer_address_default_guard_trigger ON public.customer_addresses;
CREATE TRIGGER customer_address_default_guard_trigger
BEFORE INSERT OR UPDATE OF is_default ON public.customer_addresses
FOR EACH ROW EXECUTE FUNCTION public.customer_address_default_guard();

-- 3) Promo codes.
CREATE TABLE IF NOT EXISTS public.commerce_promos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  description text NOT NULL DEFAULT '',
  discount_type text NOT NULL DEFAULT 'percent'
    CHECK (discount_type IN ('percent', 'fixed')),
  discount_value numeric NOT NULL CHECK (discount_value >= 0),
  min_order_amount numeric NOT NULL DEFAULT 0 CHECK (min_order_amount >= 0),
  max_uses integer,
  usage_count integer NOT NULL DEFAULT 0 CHECK (usage_count >= 0),
  starts_at timestamptz,
  ends_at timestamptz,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.commerce_promos ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.commerce_promos TO authenticated;

DROP POLICY IF EXISTS "Admins manage commerce promos" ON public.commerce_promos;
CREATE POLICY "Admins manage commerce promos"
ON public.commerce_promos
FOR ALL TO authenticated
USING (private.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

CREATE OR REPLACE FUNCTION public.preview_promo_code(p_code text, p_subtotal numeric)
RETURNS TABLE(valid boolean, code text, discount_amount numeric, final_total numeric, message text)
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
    RETURN QUERY SELECT false, ''::text, 0::numeric, v_subtotal, 'Enter a promo code.'::text;
    RETURN;
  END IF;

  SELECT * INTO v_promo
  FROM public.commerce_promos
  WHERE upper(code) = v_code
    AND active = true
    AND (starts_at IS NULL OR starts_at <= now())
    AND (ends_at IS NULL OR ends_at >= now())
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, v_code, 0::numeric, v_subtotal, 'Promo code is not valid.'::text;
    RETURN;
  END IF;

  IF v_promo.max_uses IS NOT NULL AND v_promo.usage_count >= v_promo.max_uses THEN
    RETURN QUERY SELECT false, v_code, 0::numeric, v_subtotal, 'Promo code has reached its limit.'::text;
    RETURN;
  END IF;

  IF v_subtotal < v_promo.min_order_amount THEN
    RETURN QUERY SELECT false, v_code, 0::numeric, v_subtotal, 'Minimum order amount not reached.'::text;
    RETURN;
  END IF;

  v_discount := CASE
    WHEN v_promo.discount_type = 'percent'
      THEN round(v_subtotal * LEAST(v_promo.discount_value, 100) / 100, 2)
    ELSE LEAST(v_promo.discount_value, v_subtotal)
  END;

  RETURN QUERY SELECT true, v_code, v_discount, GREATEST(v_subtotal - v_discount, 0), 'Promo applied.'::text;
END;
$$;

REVOKE ALL ON FUNCTION public.preview_promo_code(text, numeric) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.preview_promo_code(text, numeric) TO anon, authenticated, service_role;


-- Commerce-aware order function.
-- Reuses the current safe create_public_order() so payment and aggregate stock rules stay intact.
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
RETURNS TABLE(order_number text, total_price numeric, discount_amount numeric, promo_code text)
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

  IF COALESCE(array_length(v_product.colors, 1), 0) > 0 THEN
    IF v_color IS NULL OR NOT (v_color = ANY(v_product.colors)) THEN
      RAISE EXCEPTION 'Please select a valid color.';
    END IF;

    v_color_available := COALESCE((v_product.color_stock ->> v_color)::integer, 0);

    IF v_color_available < p_quantity THEN
      RAISE EXCEPTION 'Requested quantity is not available in %.', v_color;
    END IF;
  ELSE
    v_color := NULL;
  END IF;

  IF NULLIF(trim(COALESCE(p_promo_code, '')), '') IS NOT NULL THEN
    v_code := upper(trim(p_promo_code));

    SELECT *
    INTO v_promo
    FROM public.commerce_promos
    WHERE upper(code) = v_code
      AND active = true
      AND (starts_at IS NULL OR starts_at <= now())
      AND (ends_at IS NULL OR ends_at >= now())
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Promo code is not valid.';
    END IF;

    IF v_promo.max_uses IS NOT NULL AND v_promo.usage_count >= v_promo.max_uses THEN
      RAISE EXCEPTION 'Promo code has reached its limit.';
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
      RAISE EXCEPTION 'Minimum order amount for this promo is %.', v_promo.min_order_amount;
    END IF;

    v_discount := CASE
      WHEN v_promo.discount_type = 'percent'
        THEN round(v_original_total * LEAST(v_promo.discount_value, 100) / 100, 2)
      ELSE LEAST(v_promo.discount_value, v_original_total)
    END;

    v_final_total := GREATEST(v_original_total - v_discount, 0);

    UPDATE public.commerce_promos
    SET usage_count = usage_count + 1, updated_at = now()
    WHERE id = v_promo.id;
  END IF;

  IF v_color IS NOT NULL THEN
    UPDATE public.products
    SET color_stock = jsonb_set(
      COALESCE(color_stock, '{}'::jsonb),
      ARRAY[v_color],
      to_jsonb(v_color_available - p_quantity),
      true
    )
    WHERE id = p_product_id;
  END IF;

  UPDATE public.orders
  SET
    selected_color = v_color,
    subtotal_price = v_original_total,
    discount_amount = v_discount,
    promo_code = v_code,
    total_price = v_final_total,
    customer_email = COALESCE(NULLIF(trim(COALESCE(p_customer_email, '')), ''), customer_email)
  WHERE order_number = v_order_number;

  -- The base order insert queues order_received before promo/email metadata is attached.
  -- Refresh that queued event so a future provider receives the final amount/email.
  UPDATE public.commerce_notification_events
  SET
    email = COALESCE(NULLIF(trim(COALESCE(p_customer_email, '')), ''), email),
    payload = payload || jsonb_build_object(
      'total_price', v_final_total,
      'promo_code', v_code,
      'discount_amount', v_discount,
      'selected_color', v_color
    )
  WHERE order_number = v_order_number
    AND event_type = 'order_received'
    AND delivery_status = 'queued';

  RETURN QUERY SELECT v_order_number, v_final_total, v_discount, v_code;
END;
$$;

REVOKE ALL ON FUNCTION public.create_commerce_order(
  uuid, text, text, text, text, text, text, integer,
  text, numeric, numeric, text, text, text, text, text
) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.create_commerce_order(
  uuid, text, text, text, text, text, text, integer,
  text, numeric, numeric, text, text, text, text, text
) TO anon, authenticated, service_role;

-- 4) Bundle catalogue. Checkout is intentionally future-ready through Cart.
CREATE TABLE IF NOT EXISTS public.commerce_bundles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  hero_image text NOT NULL DEFAULT '',
  product_ids uuid[] NOT NULL DEFAULT '{}',
  bundle_price numeric NOT NULL DEFAULT 0 CHECK (bundle_price >= 0),
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.commerce_bundles ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.commerce_bundles TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.commerce_bundles TO authenticated;

DROP POLICY IF EXISTS "Public view active bundles" ON public.commerce_bundles;
CREATE POLICY "Public view active bundles"
ON public.commerce_bundles
FOR SELECT
USING (active = true);

DROP POLICY IF EXISTS "Admins manage bundles" ON public.commerce_bundles;
CREATE POLICY "Admins manage bundles"
ON public.commerce_bundles
FOR ALL TO authenticated
USING (private.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

-- 5) Shop the Look.
CREATE TABLE IF NOT EXISTS public.commerce_shop_looks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  tagline text NOT NULL DEFAULT '',
  image_url text NOT NULL DEFAULT '',
  product_ids uuid[] NOT NULL DEFAULT '{}',
  published boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.commerce_shop_looks ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.commerce_shop_looks TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.commerce_shop_looks TO authenticated;

DROP POLICY IF EXISTS "Public view published shop looks" ON public.commerce_shop_looks;
CREATE POLICY "Public view published shop looks"
ON public.commerce_shop_looks
FOR SELECT
USING (published = true);

DROP POLICY IF EXISTS "Admins manage shop looks" ON public.commerce_shop_looks;
CREATE POLICY "Admins manage shop looks"
ON public.commerce_shop_looks
FOR ALL TO authenticated
USING (private.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

-- 6) Order notification event queue.
-- This records events now. Actual sending needs a provider (email/SMS/WhatsApp) later.
CREATE TABLE IF NOT EXISTS public.commerce_notification_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  order_number text NOT NULL,
  event_type text NOT NULL,
  phone text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  delivery_status text NOT NULL DEFAULT 'queued'
    CHECK (delivery_status IN ('queued', 'sent', 'failed', 'skipped')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS commerce_notification_events_created_idx
  ON public.commerce_notification_events (created_at DESC);

ALTER TABLE public.commerce_notification_events ENABLE ROW LEVEL SECURITY;
GRANT SELECT, UPDATE ON public.commerce_notification_events TO authenticated;

DROP POLICY IF EXISTS "Admins view notification events" ON public.commerce_notification_events;
CREATE POLICY "Admins view notification events"
ON public.commerce_notification_events
FOR SELECT TO authenticated
USING (private.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins update notification events" ON public.commerce_notification_events;
CREATE POLICY "Admins update notification events"
ON public.commerce_notification_events
FOR UPDATE TO authenticated
USING (private.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

CREATE OR REPLACE FUNCTION public.commerce_queue_order_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_event := 'order_received';
  ELSIF OLD.status IS DISTINCT FROM NEW.status THEN
    v_event := 'status_' || NEW.status;
  ELSIF OLD.payment_status IS DISTINCT FROM NEW.payment_status THEN
    v_event := 'payment_' || NEW.payment_status;
  ELSE
    RETURN NEW;
  END IF;

  INSERT INTO public.commerce_notification_events (
    order_id, order_number, event_type, phone, email, payload, delivery_status
  )
  VALUES (
    NEW.id,
    NEW.order_number,
    v_event,
    COALESCE(NEW.phone, ''),
    COALESCE(NEW.customer_email, ''),
    jsonb_build_object(
      'status', NEW.status,
      'payment_status', NEW.payment_status,
      'product_name', NEW.product_name,
      'total_price', NEW.total_price
    ),
    'queued'
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS orders_commerce_notification_insert ON public.orders;
CREATE TRIGGER orders_commerce_notification_insert
AFTER INSERT ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.commerce_queue_order_notification();

DROP TRIGGER IF EXISTS orders_commerce_notification_update ON public.orders;
CREATE TRIGGER orders_commerce_notification_update
AFTER UPDATE OF status, payment_status ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.commerce_queue_order_notification();

ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS commerce_email_notifications boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS commerce_sms_notifications boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS commerce_whatsapp_notifications boolean NOT NULL DEFAULT false;

-- 7) updated_at triggers.
DROP TRIGGER IF EXISTS customer_profiles_touch_updated_at ON public.customer_profiles;
CREATE TRIGGER customer_profiles_touch_updated_at
BEFORE UPDATE ON public.customer_profiles
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS customer_addresses_touch_updated_at ON public.customer_addresses;
CREATE TRIGGER customer_addresses_touch_updated_at
BEFORE UPDATE ON public.customer_addresses
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS commerce_promos_touch_updated_at ON public.commerce_promos;
CREATE TRIGGER commerce_promos_touch_updated_at
BEFORE UPDATE ON public.commerce_promos
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS commerce_bundles_touch_updated_at ON public.commerce_bundles;
CREATE TRIGGER commerce_bundles_touch_updated_at
BEFORE UPDATE ON public.commerce_bundles
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS commerce_shop_looks_touch_updated_at ON public.commerce_shop_looks;
CREATE TRIGGER commerce_shop_looks_touch_updated_at
BEFORE UPDATE ON public.commerce_shop_looks
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();


-- 8) Extend privacy-safe tracking with commerce variant/promo metadata.
DROP FUNCTION IF EXISTS public.track_public_order(text, text);

CREATE FUNCTION public.track_public_order(
  p_order_number text,
  p_phone text
)
RETURNS TABLE(
  order_number text,
  status text,
  payment_method text,
  payment_status text,
  product_name text,
  product_code text,
  quantity integer,
  selected_size text,
  selected_finish text,
  selected_color text,
  subtotal_price numeric,
  discount_amount numeric,
  promo_code text,
  total_price numeric,
  created_at timestamptz,
  confirmed_at timestamptz,
  processing_at timestamptz,
  shipped_at timestamptz,
  delivered_at timestamptz,
  cancelled_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    o.order_number,
    o.status,
    o.payment_method,
    o.payment_status,
    o.product_name,
    o.product_code,
    o.quantity,
    o.selected_size,
    o.selected_finish,
    o.selected_color,
    COALESCE(o.subtotal_price, o.total_price),
    COALESCE(o.discount_amount, 0),
    o.promo_code,
    o.total_price,
    o.created_at,
    o.confirmed_at,
    o.processing_at,
    o.shipped_at,
    o.delivered_at,
    o.cancelled_at
  FROM public.orders o
  WHERE upper(btrim(o.order_number)) = upper(btrim(COALESCE(p_order_number, '')))
    AND regexp_replace(o.phone, '\D', '', 'g')
        = regexp_replace(COALESCE(p_phone, ''), '\D', '', 'g')
    AND char_length(regexp_replace(COALESCE(p_phone, ''), '\D', '', 'g')) >= 7
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.track_public_order(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.track_public_order(text, text)
TO anon, authenticated, service_role;
