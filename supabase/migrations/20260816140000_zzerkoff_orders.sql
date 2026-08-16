-- ZZERKOFF WEBSITE ORDER SYSTEM
-- Run this ONCE in Lovable Cloud -> SQL editor.

CREATE SEQUENCE IF NOT EXISTS public.order_number_seq START 1;

CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text NOT NULL UNIQUE,
  source text NOT NULL DEFAULT 'website',
  status text NOT NULL DEFAULT 'new'
    CHECK (status IN ('new', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')),

  customer_name text NOT NULL CHECK (char_length(customer_name) BETWEEN 2 AND 120),
  phone text NOT NULL CHECK (char_length(phone) BETWEEN 7 AND 30),
  delivery_address text NOT NULL CHECK (char_length(delivery_address) BETWEEN 5 AND 600),
  map_url text,
  latitude numeric,
  longitude numeric,
  customer_note text,

  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  product_code text NOT NULL,
  unit_price numeric NOT NULL CHECK (unit_price >= 0),
  quantity integer NOT NULL CHECK (quantity BETWEEN 1 AND 20),
  selected_size text,
  selected_finish text,
  total_price numeric NOT NULL CHECK (total_price >= 0),

  admin_note text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS orders_created_at_idx
  ON public.orders (created_at DESC);

CREATE INDEX IF NOT EXISTS orders_status_idx
  ON public.orders (status);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

GRANT SELECT, UPDATE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;

DROP POLICY IF EXISTS "Admins view orders" ON public.orders;
CREATE POLICY "Admins view orders"
ON public.orders
FOR SELECT TO authenticated
USING (private.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins update orders" ON public.orders;
CREATE POLICY "Admins update orders"
ON public.orders
FOR UPDATE TO authenticated
USING (private.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

DROP TRIGGER IF EXISTS orders_touch_updated_at ON public.orders;
CREATE TRIGGER orders_touch_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

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
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_product public.products%ROWTYPE;
  v_order_number text;
  v_total numeric;
BEGIN
  IF char_length(trim(COALESCE(p_customer_name, ''))) < 2 THEN
    RAISE EXCEPTION 'Please enter your name.';
  END IF;

  IF char_length(trim(COALESCE(p_phone, ''))) < 7 THEN
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
  LIMIT 1;

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

  v_order_number :=
    'ZZ-' ||
    to_char(now(), 'YYMMDD') ||
    '-' ||
    lpad(nextval('public.order_number_seq')::text, 4, '0');

  v_total := v_product.price * p_quantity;

  INSERT INTO public.orders (
    order_number, source, status, customer_name, phone, delivery_address,
    map_url, latitude, longitude, customer_note, product_id, product_name,
    product_code, unit_price, quantity, selected_size, selected_finish, total_price
  )
  VALUES (
    v_order_number, 'website', 'new', trim(p_customer_name), trim(p_phone),
    trim(p_address), NULLIF(trim(COALESCE(p_map_url, '')), ''), p_latitude,
    p_longitude, NULLIF(trim(COALESCE(p_note, '')), ''), v_product.id,
    v_product.name, v_product.product_code, v_product.price, p_quantity,
    NULLIF(trim(COALESCE(p_size, '')), ''),
    NULLIF(trim(COALESCE(p_finish, '')), ''), v_total
  );

  RETURN QUERY SELECT v_order_number, v_total;
END;
$$;

REVOKE ALL ON FUNCTION public.create_public_order(
  uuid, text, text, text, text, text, integer, text, numeric, numeric, text
) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.create_public_order(
  uuid, text, text, text, text, text, integer, text, numeric, numeric, text
) TO anon, authenticated, service_role;
