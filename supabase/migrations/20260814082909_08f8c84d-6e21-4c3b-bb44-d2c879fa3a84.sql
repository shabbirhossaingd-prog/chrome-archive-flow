-- 1. CATEGORIES: code prefix
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS code_prefix text NOT NULL DEFAULT 'Z';
UPDATE public.categories SET code_prefix = 'A' WHERE slug = 'rings';
UPDATE public.categories SET code_prefix = 'B' WHERE slug = 'bracelets';
UPDATE public.categories SET code_prefix = 'C' WHERE slug = 'chains';
UPDATE public.categories SET code_prefix = 'D' WHERE slug = 'pant-chains';
UPDATE public.categories SET code_prefix = 'E' WHERE slug = 'chrome-glasses';
INSERT INTO public.categories (slug, name, sort_order, code_prefix, active)
VALUES ('earrings', 'EARRINGS', 6, 'F', false)
ON CONFLICT (slug) DO NOTHING;
CREATE UNIQUE INDEX IF NOT EXISTS categories_code_prefix_key ON public.categories (code_prefix);

-- 2. PRODUCTS: new fields
ALTER TABLE public.products RENAME COLUMN archive TO archived;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS quantity_available integer NOT NULL DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS published boolean NOT NULL DEFAULT true;
UPDATE public.products SET quantity_available = 5 WHERE stock_status <> 'SOLD OUT';

-- renumber legacy codes
UPDATE public.products SET product_code = 'A001' WHERE slug = 'chrome-signet';
UPDATE public.products SET product_code = 'B001' WHERE slug = 'gothic-cross-bracelet';
UPDATE public.products SET product_code = 'C001' WHERE slug = 'molten-curb-chain';

CREATE UNIQUE INDEX IF NOT EXISTS products_product_code_key ON public.products (product_code);
CREATE UNIQUE INDEX IF NOT EXISTS products_slug_key ON public.products (slug);

-- 3. AUTO SOLD OUT
CREATE OR REPLACE FUNCTION public.sync_stock_status()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.quantity_available <= 0 THEN
    NEW.stock_status := 'SOLD OUT';
  ELSIF NEW.stock_status = 'SOLD OUT' AND NEW.quantity_available > 0 THEN
    NEW.stock_status := 'IN STOCK';
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS products_sync_stock_status ON public.products;
CREATE TRIGGER products_sync_stock_status
BEFORE INSERT OR UPDATE OF quantity_available, stock_status ON public.products
FOR EACH ROW EXECUTE FUNCTION public.sync_stock_status();

-- 4. PRODUCT CODE COUNTERS
CREATE TABLE IF NOT EXISTS public.category_counters (
  category_slug text PRIMARY KEY REFERENCES public.categories(slug) ON UPDATE CASCADE ON DELETE CASCADE,
  last_number integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.category_counters TO authenticated;
GRANT ALL ON public.category_counters TO service_role;
ALTER TABLE public.category_counters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read counters" ON public.category_counters
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- seed counters from existing codes
INSERT INTO public.category_counters (category_slug, last_number)
SELECT c.slug, COALESCE(MAX(NULLIF(regexp_replace(p.product_code, '^[A-Z]', ''), '')::int), 0)
FROM public.categories c
LEFT JOIN public.products p ON p.category = c.slug AND p.product_code ~ '^[A-Z][0-9]+$'
GROUP BY c.slug
ON CONFLICT (category_slug) DO NOTHING;

CREATE OR REPLACE FUNCTION public.next_product_code(_category text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _prefix text;
  _n integer;
BEGIN
  SELECT code_prefix INTO _prefix FROM public.categories WHERE slug = _category;
  IF _prefix IS NULL THEN
    RAISE EXCEPTION 'Unknown category %', _category;
  END IF;
  INSERT INTO public.category_counters (category_slug, last_number)
  VALUES (_category, 1)
  ON CONFLICT (category_slug)
  DO UPDATE SET last_number = public.category_counters.last_number + 1, updated_at = now()
  RETURNING last_number INTO _n;
  RETURN _prefix || lpad(_n::text, 3, '0');
END;
$$;
REVOKE ALL ON FUNCTION public.next_product_code(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.next_product_code(text) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.peek_product_code(_category text)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.code_prefix || lpad((COALESCE(k.last_number, 0) + 1)::text, 3, '0')
  FROM public.categories c
  LEFT JOIN public.category_counters k ON k.category_slug = c.slug
  WHERE c.slug = _category;
$$;
REVOKE ALL ON FUNCTION public.peek_product_code(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.peek_product_code(text) TO authenticated, service_role;

-- 5. SITE SETTINGS
CREATE TABLE IF NOT EXISTS public.site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_name text NOT NULL DEFAULT 'ZZERKOFF',
  instagram_url text NOT NULL DEFAULT 'https://www.instagram.com/zzerkoff/',
  whatsapp_number text NOT NULL DEFAULT '8801410545930',
  email text NOT NULL DEFAULT 'zzerkoff.official@gmail.com',
  location text NOT NULL DEFAULT 'Dhaka, Bangladesh',
  currency_code text NOT NULL DEFAULT 'BDT',
  currency_symbol text NOT NULL DEFAULT '৳',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.site_settings TO anon;
GRANT SELECT, INSERT, UPDATE ON public.site_settings TO authenticated;
GRANT ALL ON public.site_settings TO service_role;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Settings are viewable by everyone" ON public.site_settings
  FOR SELECT USING (true);
CREATE POLICY "Admins manage settings" ON public.site_settings
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER site_settings_touch BEFORE UPDATE ON public.site_settings
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
INSERT INTO public.site_settings (id) VALUES ('00000000-0000-0000-0000-000000000001')
ON CONFLICT DO NOTHING;

-- 6. PRODUCTS RLS: public sees published only
DROP POLICY IF EXISTS "Products are viewable by everyone" ON public.products;
CREATE POLICY "Published products are viewable by everyone" ON public.products
  FOR SELECT USING (published = true OR public.has_role(auth.uid(), 'admin'));