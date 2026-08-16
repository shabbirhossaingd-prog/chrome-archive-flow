-- ZZERKOFF STEADFAST TEST MODE + CANCELLED ORDER DELETE
-- Run ONCE in Lovable Cloud -> SQL Editor BEFORE the GitHub workflow.

ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS steadfast_test_mode boolean NOT NULL DEFAULT true;

ALTER TABLE public.orders
  DROP CONSTRAINT IF EXISTS orders_steadfast_state_check;

ALTER TABLE public.orders
  ADD CONSTRAINT orders_steadfast_state_check
  CHECK (steadfast_state IN ('not_sent', 'creating', 'connected', 'error', 'test'));

GRANT DELETE ON public.orders TO authenticated;

DROP POLICY IF EXISTS "Admins delete orders" ON public.orders;
CREATE POLICY "Admins delete orders"
ON public.orders
FOR DELETE TO authenticated
USING (private.has_role(auth.uid(), 'admin'::app_role));
