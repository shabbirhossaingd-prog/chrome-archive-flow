-- ZZERKOFF PROFESSIONAL WEBSITE UPGRADE
-- Run ONCE in Lovable Cloud -> SQL Editor BEFORE the GitHub workflow.

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS payment_method text NOT NULL DEFAULT 'cod',
  ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'unpaid',
  ADD COLUMN IF NOT EXISTS paid_at timestamptz,
  ADD COLUMN IF NOT EXISTS stock_released boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS confirmed_at timestamptz,
  ADD COLUMN IF NOT EXISTS processing_at timestamptz,
  ADD COLUMN IF NOT EXISTS shipped_at timestamptz,
  ADD COLUMN IF NOT EXISTS delivered_at timestamptz,
  ADD COLUMN IF NOT EXISTS cancelled_at timestamptz;

UPDATE public.orders
SET confirmed_at = COALESCE(confirmed_at, updated_at)
WHERE status = 'confirmed';

UPDATE public.orders
SET processing_at = COALESCE(processing_at, updated_at)
WHERE status = 'processing';

UPDATE public.orders
SET shipped_at = COALESCE(shipped_at, updated_at)
WHERE status = 'shipped';

UPDATE public.orders
SET delivered_at = COALESCE(delivered_at, updated_at)
WHERE status = 'delivered';

UPDATE public.orders
SET cancelled_at = COALESCE(cancelled_at, updated_at)
WHERE status = 'cancelled';

CREATE OR REPLACE FUNCTION public.zzerkoff_order_side_effects()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rows integer;
BEGIN
  IF NEW.status = 'cancelled'
     AND OLD.status IS DISTINCT FROM 'cancelled'
     AND NEW.product_id IS NOT NULL
     AND COALESCE(NEW.stock_released, false) = false THEN

    UPDATE public.products
    SET
      quantity_available = quantity_available + NEW.quantity,
      stock_status = CASE
        WHEN stock_status = 'SOLD OUT' THEN 'IN STOCK'
        ELSE stock_status
      END
    WHERE id = NEW.product_id;

    NEW.stock_released := true;
    NEW.cancelled_at := COALESCE(NEW.cancelled_at, now());
  END IF;

  IF OLD.status = 'cancelled'
     AND NEW.status IS DISTINCT FROM 'cancelled'
     AND NEW.product_id IS NOT NULL
     AND COALESCE(OLD.stock_released, false) = true THEN

    UPDATE public.products
    SET
      quantity_available = quantity_available - NEW.quantity,
      stock_status = CASE
        WHEN quantity_available - NEW.quantity <= 0 THEN 'SOLD OUT'
        ELSE stock_status
      END
    WHERE id = NEW.product_id
      AND quantity_available >= NEW.quantity;

    GET DIAGNOSTICS v_rows = ROW_COUNT;

    IF v_rows = 0 THEN
      RAISE EXCEPTION 'Not enough stock to reopen this cancelled order.';
    END IF;

    NEW.stock_released := false;
    NEW.cancelled_at := NULL;
  END IF;

  IF OLD.status IS DISTINCT FROM 'confirmed' AND NEW.status = 'confirmed' THEN
    NEW.confirmed_at := COALESCE(NEW.confirmed_at, now());
  END IF;

  IF OLD.status IS DISTINCT FROM 'processing' AND NEW.status = 'processing' THEN
    NEW.processing_at := COALESCE(NEW.processing_at, now());
  END IF;

  IF OLD.status IS DISTINCT FROM 'shipped' AND NEW.status = 'shipped' THEN
    NEW.shipped_at := COALESCE(NEW.shipped_at, now());
  END IF;

  IF OLD.status IS DISTINCT FROM 'delivered' AND NEW.status = 'delivered' THEN
    NEW.delivered_at := COALESCE(NEW.delivered_at, now());
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
FOR EACH ROW
EXECUTE FUNCTION public.zzerkoff_order_side_effects();

CREATE OR REPLACE FUNCTION public.track_public_order(
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
