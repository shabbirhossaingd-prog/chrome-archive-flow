-- ZZERKOFF STUDIO ERP v1
-- Run ONCE in Lovable Cloud -> SQL Editor BEFORE the GitHub workflow.
-- Adds Purchases, Inventory Costing, Expenses, Reports and Month Close.
-- Existing website/admin/order/courier design and flows are preserved.

-- =========================================================
-- 1) ERP COLUMNS ON EXISTING TABLES
-- =========================================================

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS erp_average_cost numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS erp_low_stock_threshold integer NOT NULL DEFAULT 3;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS erp_unit_cost_snapshot numeric,
  ADD COLUMN IF NOT EXISTS erp_cogs_snapshot numeric,
  ADD COLUMN IF NOT EXISTS erp_courier_cost numeric,
  ADD COLUMN IF NOT EXISTS erp_packaging_cost numeric,
  ADD COLUMN IF NOT EXISTS erp_other_cost numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS erp_financialized_at timestamptz;

ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS erp_default_courier_cost numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS erp_default_packaging_cost numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS erp_mobile_payment_fee_percent numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS erp_auto_month_close boolean NOT NULL DEFAULT true;

-- =========================================================
-- 2) PURCHASES
-- =========================================================

CREATE SEQUENCE IF NOT EXISTS public.erp_purchase_number_seq START 1;

CREATE TABLE IF NOT EXISTS public.erp_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_number text NOT NULL UNIQUE,
  purchase_date date NOT NULL DEFAULT current_date,

  supplier_name text NOT NULL DEFAULT '',
  supplier_phone text NOT NULL DEFAULT '',

  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  product_name text NOT NULL,
  product_code text NOT NULL,

  quantity integer NOT NULL CHECK (quantity > 0),
  unit_cost numeric NOT NULL CHECK (unit_cost >= 0),
  transport_cost numeric NOT NULL DEFAULT 0 CHECK (transport_cost >= 0),
  packaging_cost numeric NOT NULL DEFAULT 0 CHECK (packaging_cost >= 0),
  other_cost numeric NOT NULL DEFAULT 0 CHECK (other_cost >= 0),
  total_cost numeric NOT NULL CHECK (total_cost >= 0),

  stock_before integer NOT NULL,
  stock_after integer NOT NULL,
  average_cost_before numeric NOT NULL DEFAULT 0,
  average_cost_after numeric NOT NULL DEFAULT 0,

  status text NOT NULL DEFAULT 'received'
    CHECK (status IN ('received', 'reversed')),
  notes text NOT NULL DEFAULT '',
  received_at timestamptz NOT NULL DEFAULT now(),
  reversed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS erp_purchases_date_idx
  ON public.erp_purchases (purchase_date DESC);

CREATE INDEX IF NOT EXISTS erp_purchases_product_idx
  ON public.erp_purchases (product_id, created_at DESC);

-- =========================================================
-- 3) STOCK MOVEMENTS
-- =========================================================

CREATE TABLE IF NOT EXISTS public.erp_stock_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  product_name text NOT NULL,
  product_code text NOT NULL,

  movement_type text NOT NULL DEFAULT 'system',
  quantity_delta integer NOT NULL DEFAULT 0,
  stock_before integer NOT NULL,
  stock_after integer NOT NULL,
  average_cost_before numeric NOT NULL DEFAULT 0,
  average_cost_after numeric NOT NULL DEFAULT 0,

  reference_id text,
  note text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS erp_stock_movements_product_idx
  ON public.erp_stock_movements (product_id, created_at DESC);

CREATE INDEX IF NOT EXISTS erp_stock_movements_created_idx
  ON public.erp_stock_movements (created_at DESC);

CREATE OR REPLACE FUNCTION public.erp_log_product_movement()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_type text;
  v_reference text;
  v_note text;
BEGIN
  IF OLD.quantity_available IS NOT DISTINCT FROM NEW.quantity_available
     AND OLD.erp_average_cost IS NOT DISTINCT FROM NEW.erp_average_cost THEN
    RETURN NEW;
  END IF;

  v_type := COALESCE(
    NULLIF(current_setting('app.erp_movement_type', true), ''),
    'system'
  );
  v_reference := NULLIF(current_setting('app.erp_reference_id', true), '');
  v_note := COALESCE(
    NULLIF(current_setting('app.erp_movement_note', true), ''),
    ''
  );

  INSERT INTO public.erp_stock_movements (
    product_id,
    product_name,
    product_code,
    movement_type,
    quantity_delta,
    stock_before,
    stock_after,
    average_cost_before,
    average_cost_after,
    reference_id,
    note
  )
  VALUES (
    NEW.id,
    NEW.name,
    NEW.product_code,
    v_type,
    NEW.quantity_available - OLD.quantity_available,
    OLD.quantity_available,
    NEW.quantity_available,
    COALESCE(OLD.erp_average_cost, 0),
    COALESCE(NEW.erp_average_cost, 0),
    v_reference,
    v_note
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS products_erp_movement_log ON public.products;
CREATE TRIGGER products_erp_movement_log
AFTER UPDATE OF quantity_available, erp_average_cost ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.erp_log_product_movement();

-- =========================================================
-- 4) EXPENSES
-- =========================================================

CREATE TABLE IF NOT EXISTS public.erp_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_date date NOT NULL DEFAULT current_date,
  title text NOT NULL CHECK (char_length(btrim(title)) BETWEEN 2 AND 160),
  category text NOT NULL DEFAULT 'miscellaneous',
  amount numeric NOT NULL CHECK (amount >= 0),
  payment_method text NOT NULL DEFAULT 'cash',
  recurring_monthly boolean NOT NULL DEFAULT false,
  recurring_until date,
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS erp_expenses_date_idx
  ON public.erp_expenses (expense_date DESC);

-- =========================================================
-- 5) MONTH CLOSE SNAPSHOTS
-- =========================================================

CREATE TABLE IF NOT EXISTS public.erp_month_closes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  year integer NOT NULL CHECK (year BETWEEN 2020 AND 2200),
  month integer NOT NULL CHECK (month BETWEEN 1 AND 12),
  status text NOT NULL DEFAULT 'closed'
    CHECK (status IN ('closed', 'reopened')),
  snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  closed_at timestamptz NOT NULL DEFAULT now(),
  reopened_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (year, month)
);

-- =========================================================
-- 6) RLS / ADMIN ACCESS
-- =========================================================

ALTER TABLE public.erp_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.erp_stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.erp_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.erp_month_closes ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.erp_purchases TO authenticated;
GRANT SELECT ON public.erp_stock_movements TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.erp_expenses TO authenticated;
GRANT SELECT ON public.erp_month_closes TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.erp_purchase_number_seq TO authenticated;

DROP POLICY IF EXISTS "Admins view ERP purchases" ON public.erp_purchases;
CREATE POLICY "Admins view ERP purchases"
ON public.erp_purchases
FOR SELECT TO authenticated
USING (private.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins view ERP stock movements" ON public.erp_stock_movements;
CREATE POLICY "Admins view ERP stock movements"
ON public.erp_stock_movements
FOR SELECT TO authenticated
USING (private.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins manage ERP expenses" ON public.erp_expenses;
CREATE POLICY "Admins manage ERP expenses"
ON public.erp_expenses
FOR ALL TO authenticated
USING (private.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins view ERP month closes" ON public.erp_month_closes;
CREATE POLICY "Admins view ERP month closes"
ON public.erp_month_closes
FOR SELECT TO authenticated
USING (private.has_role(auth.uid(), 'admin'::public.app_role));

-- =========================================================
-- 7) CREATE / RECEIVE PURCHASE ATOMICALLY
-- =========================================================

CREATE OR REPLACE FUNCTION public.create_erp_purchase(
  p_product_id uuid,
  p_purchase_date date,
  p_supplier_name text,
  p_supplier_phone text,
  p_quantity integer,
  p_unit_cost numeric,
  p_transport_cost numeric,
  p_packaging_cost numeric,
  p_other_cost numeric,
  p_notes text
)
RETURNS TABLE(purchase_id uuid, purchase_number text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_product public.products%ROWTYPE;
  v_id uuid := gen_random_uuid();
  v_number text;
  v_stock_before integer;
  v_stock_after integer;
  v_average_before numeric;
  v_average_after numeric;
  v_total numeric;
BEGIN
  IF NOT private.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Administrator access required.';
  END IF;

  IF p_quantity IS NULL OR p_quantity <= 0 THEN
    RAISE EXCEPTION 'Quantity must be greater than zero.';
  END IF;

  IF COALESCE(p_unit_cost, -1) < 0
     OR COALESCE(p_transport_cost, 0) < 0
     OR COALESCE(p_packaging_cost, 0) < 0
     OR COALESCE(p_other_cost, 0) < 0 THEN
    RAISE EXCEPTION 'Purchase costs cannot be negative.';
  END IF;

  SELECT *
  INTO v_product
  FROM public.products
  WHERE id = p_product_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Product not found.';
  END IF;

  v_stock_before := COALESCE(v_product.quantity_available, 0);
  v_average_before := COALESCE(v_product.erp_average_cost, 0);
  v_total :=
    (p_unit_cost * p_quantity)
    + COALESCE(p_transport_cost, 0)
    + COALESCE(p_packaging_cost, 0)
    + COALESCE(p_other_cost, 0);

  v_stock_after := v_stock_before + p_quantity;

  v_average_after := CASE
    WHEN v_stock_after <= 0 THEN 0
    ELSE (
      (v_stock_before * v_average_before) + v_total
    ) / v_stock_after
  END;

  v_number :=
    'PUR-' ||
    to_char(COALESCE(p_purchase_date, current_date), 'YYMM') ||
    '-' ||
    lpad(nextval('public.erp_purchase_number_seq')::text, 4, '0');

  INSERT INTO public.erp_purchases (
    id,
    purchase_number,
    purchase_date,
    supplier_name,
    supplier_phone,
    product_id,
    product_name,
    product_code,
    quantity,
    unit_cost,
    transport_cost,
    packaging_cost,
    other_cost,
    total_cost,
    stock_before,
    stock_after,
    average_cost_before,
    average_cost_after,
    notes
  )
  VALUES (
    v_id,
    v_number,
    COALESCE(p_purchase_date, current_date),
    btrim(COALESCE(p_supplier_name, '')),
    btrim(COALESCE(p_supplier_phone, '')),
    v_product.id,
    v_product.name,
    v_product.product_code,
    p_quantity,
    p_unit_cost,
    COALESCE(p_transport_cost, 0),
    COALESCE(p_packaging_cost, 0),
    COALESCE(p_other_cost, 0),
    v_total,
    v_stock_before,
    v_stock_after,
    v_average_before,
    v_average_after,
    btrim(COALESCE(p_notes, ''))
  );

  PERFORM set_config('app.erp_movement_type', 'purchase', true);
  PERFORM set_config('app.erp_reference_id', v_id::text, true);
  PERFORM set_config('app.erp_movement_note', v_number, true);

  UPDATE public.products
  SET
    quantity_available = v_stock_after,
    erp_average_cost = round(v_average_after, 4),
    stock_status = CASE
      WHEN v_stock_after <= 0 THEN 'SOLD OUT'
      ELSE 'IN STOCK'
    END
  WHERE id = v_product.id;

  RETURN QUERY SELECT v_id, v_number;
END;
$$;

REVOKE ALL ON FUNCTION public.create_erp_purchase(
  uuid, date, text, text, integer, numeric, numeric, numeric, numeric, text
) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.create_erp_purchase(
  uuid, date, text, text, integer, numeric, numeric, numeric, numeric, text
) TO authenticated;

-- Safe reverse: only if the purchase is still the latest inventory/cost movement.
CREATE OR REPLACE FUNCTION public.reverse_erp_purchase(p_purchase_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_purchase public.erp_purchases%ROWTYPE;
  v_product public.products%ROWTYPE;
  v_latest public.erp_stock_movements%ROWTYPE;
BEGIN
  IF NOT private.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Administrator access required.';
  END IF;

  SELECT *
  INTO v_purchase
  FROM public.erp_purchases
  WHERE id = p_purchase_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Purchase not found.';
  END IF;

  IF v_purchase.status <> 'received' THEN
    RAISE EXCEPTION 'This purchase is already reversed.';
  END IF;

  SELECT *
  INTO v_product
  FROM public.products
  WHERE id = v_purchase.product_id
  FOR UPDATE;

  SELECT *
  INTO v_latest
  FROM public.erp_stock_movements
  WHERE product_id = v_purchase.product_id
  ORDER BY created_at DESC, id DESC
  LIMIT 1;

  IF v_latest.id IS NULL
     OR v_latest.movement_type <> 'purchase'
     OR v_latest.reference_id IS DISTINCT FROM v_purchase.id::text THEN
    RAISE EXCEPTION
      'This purchase cannot be reversed because stock/cost changed after it. Use Inventory Adjustment instead.';
  END IF;

  PERFORM set_config('app.erp_movement_type', 'purchase_reversal', true);
  PERFORM set_config('app.erp_reference_id', v_purchase.id::text, true);
  PERFORM set_config(
    'app.erp_movement_note',
    'Reverse ' || v_purchase.purchase_number,
    true
  );

  UPDATE public.products
  SET
    quantity_available = v_purchase.stock_before,
    erp_average_cost = v_purchase.average_cost_before,
    stock_status = CASE
      WHEN v_purchase.stock_before <= 0 THEN 'SOLD OUT'
      ELSE 'IN STOCK'
    END
  WHERE id = v_purchase.product_id;

  UPDATE public.erp_purchases
  SET
    status = 'reversed',
    reversed_at = now()
  WHERE id = v_purchase.id;
END;
$$;

REVOKE ALL ON FUNCTION public.reverse_erp_purchase(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reverse_erp_purchase(uuid) TO authenticated;

-- =========================================================
-- 8) INVENTORY ADJUSTMENT
-- =========================================================

CREATE OR REPLACE FUNCTION public.erp_adjust_inventory(
  p_product_id uuid,
  p_new_quantity integer,
  p_new_average_cost numeric,
  p_low_stock_threshold integer,
  p_note text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_product public.products%ROWTYPE;
BEGIN
  IF NOT private.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Administrator access required.';
  END IF;

  IF p_new_quantity IS NULL OR p_new_quantity < 0 THEN
    RAISE EXCEPTION 'Stock quantity cannot be negative.';
  END IF;

  IF p_new_average_cost IS NULL OR p_new_average_cost < 0 THEN
    RAISE EXCEPTION 'Average cost cannot be negative.';
  END IF;

  IF p_low_stock_threshold IS NULL OR p_low_stock_threshold < 0 THEN
    RAISE EXCEPTION 'Low stock threshold cannot be negative.';
  END IF;

  SELECT *
  INTO v_product
  FROM public.products
  WHERE id = p_product_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Product not found.';
  END IF;

  PERFORM set_config('app.erp_movement_type', 'adjustment', true);
  PERFORM set_config('app.erp_reference_id', '', true);
  PERFORM set_config(
    'app.erp_movement_note',
    btrim(COALESCE(p_note, 'Manual ERP adjustment')),
    true
  );

  UPDATE public.products
  SET
    quantity_available = p_new_quantity,
    erp_average_cost = round(p_new_average_cost, 4),
    erp_low_stock_threshold = p_low_stock_threshold,
    stock_status = CASE
      WHEN p_new_quantity <= 0 THEN 'SOLD OUT'
      ELSE 'IN STOCK'
    END
  WHERE id = p_product_id;
END;
$$;

REVOKE ALL ON FUNCTION public.erp_adjust_inventory(
  uuid, integer, numeric, integer, text
) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.erp_adjust_inventory(
  uuid, integer, numeric, integer, text
) TO authenticated;

-- =========================================================
-- 9) FREEZE COGS + ORDER COSTS WHEN DELIVERED
-- =========================================================

CREATE OR REPLACE FUNCTION public.erp_order_financial_snapshot()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_average_cost numeric := 0;
  v_courier numeric := 0;
  v_packaging numeric := 0;
BEGIN
  IF OLD.status IS DISTINCT FROM 'delivered'
     AND NEW.status = 'delivered' THEN

    IF NEW.product_id IS NOT NULL THEN
      SELECT COALESCE(erp_average_cost, 0)
      INTO v_average_cost
      FROM public.products
      WHERE id = NEW.product_id;
    END IF;

    SELECT
      COALESCE(erp_default_courier_cost, 0),
      COALESCE(erp_default_packaging_cost, 0)
    INTO v_courier, v_packaging
    FROM public.site_settings
    ORDER BY created_at ASC
    LIMIT 1;

    NEW.erp_unit_cost_snapshot :=
      COALESCE(NEW.erp_unit_cost_snapshot, v_average_cost);

    NEW.erp_cogs_snapshot :=
      COALESCE(
        NEW.erp_cogs_snapshot,
        COALESCE(NEW.erp_unit_cost_snapshot, v_average_cost) * NEW.quantity
      );

    NEW.erp_courier_cost :=
      COALESCE(NEW.erp_courier_cost, v_courier);

    NEW.erp_packaging_cost :=
      COALESCE(NEW.erp_packaging_cost, v_packaging);

    NEW.erp_other_cost := COALESCE(NEW.erp_other_cost, 0);
    NEW.erp_financialized_at := COALESCE(NEW.erp_financialized_at, now());
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS orders_erp_financial_snapshot ON public.orders;
CREATE TRIGGER orders_erp_financial_snapshot
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.erp_order_financial_snapshot();

-- =========================================================
-- 10) MONTHLY METRICS
-- =========================================================

CREATE OR REPLACE FUNCTION public.erp_month_metrics(
  p_year integer,
  p_month integer
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_start date;
  v_end date;

  v_gross_sales numeric := 0;
  v_cogs numeric := 0;
  v_courier numeric := 0;
  v_packaging numeric := 0;
  v_order_other numeric := 0;
  v_payment_fees numeric := 0;
  v_operating_expenses numeric := 0;
  v_purchase_total numeric := 0;
  v_cash_received numeric := 0;
  v_cod_pending numeric := 0;
  v_stock_value numeric := 0;

  v_delivered_orders integer := 0;
  v_units_sold integer := 0;
  v_low_stock integer := 0;

  v_default_courier numeric := 0;
  v_default_packaging numeric := 0;
  v_mobile_fee_percent numeric := 0;
BEGIN
  IF NOT private.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Administrator access required.';
  END IF;

  IF p_month < 1 OR p_month > 12 THEN
    RAISE EXCEPTION 'Invalid month.';
  END IF;

  v_start := make_date(p_year, p_month, 1);
  v_end := (v_start + interval '1 month')::date;

  SELECT
    COALESCE(erp_default_courier_cost, 0),
    COALESCE(erp_default_packaging_cost, 0),
    COALESCE(erp_mobile_payment_fee_percent, 0)
  INTO
    v_default_courier,
    v_default_packaging,
    v_mobile_fee_percent
  FROM public.site_settings
  ORDER BY created_at ASC
  LIMIT 1;

  SELECT
    COUNT(*)::integer,
    COALESCE(SUM(o.quantity), 0)::integer,
    COALESCE(SUM(o.total_price), 0),
    COALESCE(SUM(
      COALESCE(
        o.erp_cogs_snapshot,
        COALESCE(p.erp_average_cost, 0) * o.quantity
      )
    ), 0),
    COALESCE(SUM(COALESCE(o.erp_courier_cost, v_default_courier)), 0),
    COALESCE(SUM(COALESCE(o.erp_packaging_cost, v_default_packaging)), 0),
    COALESCE(SUM(COALESCE(o.erp_other_cost, 0)), 0),
    COALESCE(SUM(
      CASE
        WHEN o.payment_method IN ('bkash', 'nagad')
             AND o.payment_status = 'paid'
        THEN o.total_price * v_mobile_fee_percent / 100
        ELSE 0
      END
    ), 0),
    COALESCE(SUM(
      CASE
        WHEN o.payment_status = 'paid' THEN o.total_price
        ELSE 0
      END
    ), 0),
    COALESCE(SUM(
      CASE
        WHEN o.payment_method = 'cod'
             AND o.payment_status <> 'paid'
        THEN o.total_price
        ELSE 0
      END
    ), 0)
  INTO
    v_delivered_orders,
    v_units_sold,
    v_gross_sales,
    v_cogs,
    v_courier,
    v_packaging,
    v_order_other,
    v_payment_fees,
    v_cash_received,
    v_cod_pending
  FROM public.orders o
  LEFT JOIN public.products p ON p.id = o.product_id
  WHERE o.status = 'delivered'
    AND COALESCE(o.delivered_at, o.updated_at) >= v_start
    AND COALESCE(o.delivered_at, o.updated_at) < v_end;

  SELECT COALESCE(SUM(e.amount), 0)
  INTO v_operating_expenses
  FROM public.erp_expenses e
  WHERE (
    e.recurring_monthly = false
    AND e.expense_date >= v_start
    AND e.expense_date < v_end
  )
  OR (
    e.recurring_monthly = true
    AND e.expense_date < v_end
    AND (e.recurring_until IS NULL OR e.recurring_until >= v_start)
  );

  SELECT COALESCE(SUM(total_cost), 0)
  INTO v_purchase_total
  FROM public.erp_purchases
  WHERE status = 'received'
    AND purchase_date >= v_start
    AND purchase_date < v_end;

  SELECT
    COALESCE(SUM(quantity_available * erp_average_cost), 0),
    COUNT(*) FILTER (
      WHERE quantity_available <= erp_low_stock_threshold
    )::integer
  INTO v_stock_value, v_low_stock
  FROM public.products
  WHERE archived = false;

  RETURN jsonb_build_object(
    'year', p_year,
    'month', p_month,
    'gross_sales', round(v_gross_sales, 2),
    'net_sales', round(v_gross_sales, 2),
    'cogs', round(v_cogs, 2),
    'gross_profit', round(v_gross_sales - v_cogs, 2),
    'courier_cost', round(v_courier, 2),
    'packaging_cost', round(v_packaging, 2),
    'order_other_cost', round(v_order_other, 2),
    'payment_fees', round(v_payment_fees, 2),
    'operating_expenses', round(v_operating_expenses, 2),
    'net_profit', round(
      v_gross_sales
      - v_cogs
      - v_courier
      - v_packaging
      - v_order_other
      - v_payment_fees
      - v_operating_expenses,
      2
    ),
    'purchase_total', round(v_purchase_total, 2),
    'cash_received', round(v_cash_received, 2),
    'cod_pending', round(v_cod_pending, 2),
    'stock_value', round(v_stock_value, 2),
    'delivered_orders', v_delivered_orders,
    'units_sold', v_units_sold,
    'low_stock_count', v_low_stock
  );
END;
$$;

REVOKE ALL ON FUNCTION public.erp_month_metrics(integer, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.erp_month_metrics(integer, integer) TO authenticated;

-- =========================================================
-- 11) MONTH CLOSE / REOPEN / AUTO CLOSE
-- =========================================================

CREATE OR REPLACE FUNCTION public.close_erp_month(
  p_year integer,
  p_month integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_snapshot jsonb;
BEGIN
  IF NOT private.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Administrator access required.';
  END IF;

  v_snapshot := public.erp_month_metrics(p_year, p_month);

  INSERT INTO public.erp_month_closes (
    year,
    month,
    status,
    snapshot,
    closed_at,
    reopened_at,
    updated_at
  )
  VALUES (
    p_year,
    p_month,
    'closed',
    v_snapshot,
    now(),
    NULL,
    now()
  )
  ON CONFLICT (year, month)
  DO UPDATE SET
    status = 'closed',
    snapshot = EXCLUDED.snapshot,
    closed_at = now(),
    reopened_at = NULL,
    updated_at = now();

  RETURN v_snapshot;
END;
$$;

REVOKE ALL ON FUNCTION public.close_erp_month(integer, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.close_erp_month(integer, integer) TO authenticated;

CREATE OR REPLACE FUNCTION public.reopen_erp_month(
  p_year integer,
  p_month integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT private.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Administrator access required.';
  END IF;

  UPDATE public.erp_month_closes
  SET
    status = 'reopened',
    reopened_at = now(),
    updated_at = now()
  WHERE year = p_year
    AND month = p_month;
END;
$$;

REVOKE ALL ON FUNCTION public.reopen_erp_month(integer, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reopen_erp_month(integer, integer) TO authenticated;

CREATE OR REPLACE FUNCTION public.erp_auto_close_previous_month()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_enabled boolean := true;
  v_previous date;
  v_year integer;
  v_month integer;
  v_existing_status text;
BEGIN
  IF NOT private.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Administrator access required.';
  END IF;

  SELECT COALESCE(erp_auto_month_close, true)
  INTO v_enabled
  FROM public.site_settings
  ORDER BY created_at ASC
  LIMIT 1;

  IF COALESCE(v_enabled, true) = false THEN
    RETURN jsonb_build_object('closed', false, 'reason', 'disabled');
  END IF;

  v_previous := (date_trunc('month', current_date) - interval '1 month')::date;
  v_year := EXTRACT(YEAR FROM v_previous)::integer;
  v_month := EXTRACT(MONTH FROM v_previous)::integer;

  SELECT status
  INTO v_existing_status
  FROM public.erp_month_closes
  WHERE year = v_year
    AND month = v_month;

  IF v_existing_status = 'closed' THEN
    RETURN jsonb_build_object(
      'closed', false,
      'reason', 'already_closed',
      'year', v_year,
      'month', v_month
    );
  END IF;

  PERFORM public.close_erp_month(v_year, v_month);

  RETURN jsonb_build_object(
    'closed', true,
    'year', v_year,
    'month', v_month
  );
END;
$$;

REVOKE ALL ON FUNCTION public.erp_auto_close_previous_month() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.erp_auto_close_previous_month() TO authenticated;
