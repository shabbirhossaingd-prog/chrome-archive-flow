-- 1. CATEGORIES: E = EARRINGS, F = EYEWEAR
DELETE FROM public.category_counters WHERE category_slug = 'chrome-glasses';
DELETE FROM public.categories WHERE slug = 'chrome-glasses';
UPDATE public.categories SET code_prefix = 'E', active = true, sort_order = 5 WHERE slug = 'earrings';
INSERT INTO public.categories (slug, name, code_prefix, sort_order, active)
VALUES ('eyewear', 'EYEWEAR', 'F', 6, true)
ON CONFLICT (slug) DO UPDATE SET name = 'EYEWEAR', code_prefix = 'F', sort_order = 6, active = true;

-- 2. COLLECTIONS
CREATE TABLE IF NOT EXISTS public.collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_code text NOT NULL DEFAULT '',
  drop_number integer NOT NULL DEFAULT 1,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  year text NOT NULL DEFAULT '',
  label text NOT NULL DEFAULT '',
  heading text NOT NULL DEFAULT '',
  tagline text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  hero_image text NOT NULL DEFAULT '',
  campaign_images text[] NOT NULL DEFAULT '{}',
  editorial_images text[] NOT NULL DEFAULT '{}',
  marquee_text text NOT NULL DEFAULT '',
  button_label text NOT NULL DEFAULT '',
  button_href text NOT NULL DEFAULT '',
  is_current boolean NOT NULL DEFAULT false,
  archived boolean NOT NULL DEFAULT false,
  published boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.collections TO authenticated;
GRANT SELECT ON public.collections TO anon;
GRANT ALL ON public.collections TO service_role;
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Published collections are viewable by everyone" ON public.collections;
CREATE POLICY "Published collections are viewable by everyone" ON public.collections
  FOR SELECT USING (published = true OR private.has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Admins manage collections" ON public.collections;
CREATE POLICY "Admins manage collections" ON public.collections
  FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER collections_touch_updated_at BEFORE UPDATE ON public.collections
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE UNIQUE INDEX IF NOT EXISTS collections_single_current
  ON public.collections (is_current) WHERE is_current = true;

INSERT INTO public.collections
  (collection_code, drop_number, name, slug, year, label, heading, tagline, description,
   marquee_text, button_label, button_href, is_current, published)
VALUES
  ('DROP001', 1, 'AFTERDARK', 'drop-001-afterdark', '2026', 'DROP 001 / 2026',
   'AFTERDARK', 'Objects for the Afterdark.',
   'The first ZZERKOFF drop. Chrome, vintage metal and gothic geometry, cast for the hours after midnight.',
   'DROP 001 — AFTERDARK', 'ENTER THE SHOP', '/shop', true, true)
ON CONFLICT (slug) DO NOTHING;

-- 3. PRODUCTS: extra CMS fields
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS fit_gender text NOT NULL DEFAULT 'UNISEX',
  ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS size_type text NOT NULL DEFAULT 'ONE SIZE',
  ADD COLUMN IF NOT EXISTS size_description text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS details_content text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS material_content text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS collection_id uuid REFERENCES public.collections(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS related_product_ids uuid[] NOT NULL DEFAULT '{}';

UPDATE public.products p
SET collection_id = c.id
FROM public.collections c
WHERE p.collection_id IS NULL AND c.is_current = true;

-- 4. PAGES CMS
CREATE TABLE IF NOT EXISTS public.pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_key text NOT NULL UNIQUE,
  label text NOT NULL DEFAULT '',
  title text NOT NULL DEFAULT '',
  subtitle text NOT NULL DEFAULT '',
  body text NOT NULL DEFAULT '',
  hero_image text NOT NULL DEFAULT '',
  content_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  seo_title text NOT NULL DEFAULT '',
  seo_description text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pages TO authenticated;
GRANT SELECT ON public.pages TO anon;
GRANT ALL ON public.pages TO service_role;
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Pages are viewable by everyone" ON public.pages FOR SELECT USING (true);
CREATE POLICY "Admins manage pages" ON public.pages FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER pages_touch_updated_at BEFORE UPDATE ON public.pages
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

INSERT INTO public.pages (page_key, label, title, subtitle, body, content_json, seo_title, seo_description) VALUES
 ('shop', 'ZZ / DIRECTORY', 'THE DIRECTORY',
  'Every object is cast in limited numbers. Codes are permanent; stock is not.',
  '', '{"show_filters": true, "show_categories": true, "sort": "sort_order", "per_section": 12}'::jsonb,
  'Shop — ZZERKOFF', 'Chrome rings, bracelets, chains, pant chains, earrings and eyewear. Limited ZZERKOFF objects.'),
 ('collection', 'ZZ / CURRENT DROP', 'NEW COLLECTION', 'The current ZZERKOFF drop.', '', '{}'::jsonb,
  'New Collection — ZZERKOFF', 'The current ZZERKOFF drop — chrome objects for the afterdark.'),
 ('archive', 'ZZ / ARCHIVE', 'THE ARCHIVE', 'Past drops. Retired objects. Permanent codes.', '', '{}'::jsonb,
  'Archive — ZZERKOFF', 'Past ZZERKOFF drops and retired objects.'),
 ('about', 'ZZ / LABEL', 'THIS IS ZZERKOFF.',
  'An alternative accessories label from Dhaka.',
  'ZZERKOFF makes objects for the afterdark — chrome, vintage metal and gothic geometry, cast in limited numbers for people who never intended to blend in.',
  '{"statement": "NOT MADE\nTO BLEND IN.", "tagline": "Objects for the Afterdark.", "campaign_images": [], "blocks": []}'::jsonb,
  'About — ZZERKOFF', 'The ZZERKOFF label: chrome, vintage metal and gothic geometry from Dhaka.')
ON CONFLICT (page_key) DO NOTHING;

-- 5. BLOG
CREATE TABLE IF NOT EXISTS public.blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  excerpt text NOT NULL DEFAULT '',
  content text NOT NULL DEFAULT '',
  featured_image text NOT NULL DEFAULT '',
  seo_title text NOT NULL DEFAULT '',
  seo_description text NOT NULL DEFAULT '',
  og_image text NOT NULL DEFAULT '',
  featured boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'draft',
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.blog_posts TO authenticated;
GRANT SELECT ON public.blog_posts TO anon;
GRANT ALL ON public.blog_posts TO service_role;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Published posts are viewable by everyone" ON public.blog_posts
  FOR SELECT USING (status = 'published' OR private.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins manage posts" ON public.blog_posts FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER blog_posts_touch_updated_at BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 6. SETTINGS: global product defaults
ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS default_delivery text NOT NULL DEFAULT 'Dhaka 1-2 days. Outside Dhaka 2-4 days. Cash on delivery available.',
  ADD COLUMN IF NOT EXISTS default_care text NOT NULL DEFAULT 'Keep away from water, perfume and humidity. Wipe with a dry cloth after wear. Store in the pouch provided.',
  ADD COLUMN IF NOT EXISTS default_size_guide text NOT NULL DEFAULT 'Most ZZERKOFF objects are adjustable. Message us on WhatsApp for exact measurements before ordering.';
