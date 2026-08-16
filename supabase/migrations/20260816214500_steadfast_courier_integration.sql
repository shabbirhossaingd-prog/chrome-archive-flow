-- ZZERKOFF × STEADFAST COURIER INTEGRATION
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS steadfast_state text NOT NULL DEFAULT 'not_sent',
  ADD COLUMN IF NOT EXISTS steadfast_consignment_id bigint,
  ADD COLUMN IF NOT EXISTS steadfast_tracking_code text,
  ADD COLUMN IF NOT EXISTS steadfast_status text,
  ADD COLUMN IF NOT EXISTS steadfast_connected_at timestamptz,
  ADD COLUMN IF NOT EXISTS steadfast_synced_at timestamptz,
  ADD COLUMN IF NOT EXISTS steadfast_last_error text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'orders_steadfast_state_check'
  ) THEN
    ALTER TABLE public.orders
      ADD CONSTRAINT orders_steadfast_state_check
      CHECK (steadfast_state IN ('not_sent', 'creating', 'connected', 'error'));
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS orders_steadfast_tracking_code_unique
  ON public.orders (steadfast_tracking_code)
  WHERE steadfast_tracking_code IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS orders_steadfast_consignment_id_unique
  ON public.orders (steadfast_consignment_id)
  WHERE steadfast_consignment_id IS NOT NULL;
