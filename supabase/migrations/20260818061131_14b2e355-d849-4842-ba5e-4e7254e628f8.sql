-- Trigger / internal functions: no direct API execution
REVOKE ALL ON FUNCTION public.zzerkoff_order_side_effects() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.erp_log_product_movement() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.erp_order_financial_snapshot() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.commerce_attach_customer() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.commerce_color_order_side_effects() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.customer_address_default_guard() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.commerce_queue_order_notification() FROM PUBLIC, anon, authenticated;

-- Private helper: never callable through the API
REVOKE ALL ON FUNCTION private.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;

-- Unused legacy order RPCs
REVOKE ALL ON FUNCTION public.create_public_order(uuid, text, text, text, text, text, integer, text, numeric, numeric, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.create_public_order(uuid, text, text, text, text, text, integer, text, numeric, numeric, text, text, text) FROM PUBLIC, anon, authenticated;

-- Admin-only functions: signed-in only (each verifies admin internally)
REVOKE ALL ON FUNCTION public.close_erp_month(integer, integer) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.reopen_erp_month(integer, integer) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.erp_auto_close_previous_month() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.erp_month_metrics(integer, integer) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.create_erp_purchase(uuid, date, text, text, integer, numeric, numeric, numeric, numeric, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.reverse_erp_purchase(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.erp_adjust_inventory(uuid, integer, numeric, integer, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.close_erp_month(integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reopen_erp_month(integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.erp_auto_close_previous_month() TO authenticated;
GRANT EXECUTE ON FUNCTION public.erp_month_metrics(integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_erp_purchase(uuid, date, text, text, integer, numeric, numeric, numeric, numeric, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reverse_erp_purchase(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.erp_adjust_inventory(uuid, integer, numeric, integer, text) TO authenticated;

-- Storefront functions stay public
GRANT EXECUTE ON FUNCTION public.create_commerce_order(uuid, text, text, text, text, text, text, integer, text, numeric, numeric, text, text, text, text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.preview_promo_code(text, numeric) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.track_public_order(text, text) TO anon, authenticated;
