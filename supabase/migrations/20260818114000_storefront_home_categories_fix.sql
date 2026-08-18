-- ZZERKOFF storefront recovery + HOME CMS bootstrap
-- Forward-only migration. Does not delete products/orders/inventory.

-- Public storefront policies must not depend on private.has_role().
-- Admin draft access continues through the existing authenticated admin ALL policies.

DROP POLICY IF EXISTS "Published products are viewable by everyone" ON public.products;
CREATE POLICY "Published products are viewable by everyone"
ON public.products
FOR SELECT
USING (published = true);

DROP POLICY IF EXISTS "Published collections are viewable by everyone" ON public.collections;
CREATE POLICY "Published collections are viewable by everyone"
ON public.collections
FOR SELECT
USING (published = true);

DROP POLICY IF EXISTS "Published posts are viewable by everyone" ON public.blog_posts;
CREATE POLICY "Published posts are viewable by everyone"
ON public.blog_posts
FOR SELECT
USING (status = 'published');

-- Product/catalogue images are public storefront media.
UPDATE storage.buckets
SET public = true
WHERE id = 'product-images';

-- Existing storage:* references remain valid; SmartImage now resolves them to getPublicUrl().
-- No product-image re-upload or product-row rewrite is required.

INSERT INTO public.pages (
  page_key,
  label,
  title,
  subtitle,
  body,
  hero_image,
  content_json,
  seo_title,
  seo_description
)
VALUES (
  'home',
  'ZZ / HOME',
  'Zzerkoff',
  'Objects for the Afterdark.',
  '',
  '',
  '{
    "hero_eyebrow": "Unisex / Chrome / Vintage / Underground",
    "hero_cta_label": "",
    "hero_cta_href": "",
    "show_current_drop": true,
    "show_featured": true,
    "show_categories": true,
    "statement_title": "NOT MADE\nTO BLEND IN.",
    "statement_body": "ZZERKOFF explores metal, distortion, vintage forms and underground culture through unisex accessories.",
    "about_title": "THIS IS ZZERKOFF.",
    "about_body": "Zzerkoff is a unisex accessories label inspired by vintage metal, chrome, gothic fashion, Y2K and underground street culture.\n\nCreated for people who prefer bold identities over ordinary trends.\n\nFor those who don''t blend in.",
    "archive_images": [],
    "sections": []
  }'::jsonb,
  'ZZERKOFF',
  'Objects for the Afterdark — unisex chrome, vintage and underground accessories.'
)
ON CONFLICT (page_key) DO NOTHING;
