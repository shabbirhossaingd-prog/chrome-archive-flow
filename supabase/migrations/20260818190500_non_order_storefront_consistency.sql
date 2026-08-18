-- ZZERKOFF NON-ORDER STOREFRONT / CMS CONSISTENCY FIX
-- Safe, idempotent, forward-only.
--
-- INTENTIONALLY NOT MODIFIED:
--   orders
--   order functions / Place Order
--   payment settings
--   Steadfast
--   ERP / accounting / stock history
--   order notifications

BEGIN;

-- =========================================================
-- 1) ADMIN ROLE HELPER
-- =========================================================

GRANT USAGE ON SCHEMA private TO authenticated;

GRANT EXECUTE
ON FUNCTION private.has_role(uuid, public.app_role)
TO authenticated;

REVOKE EXECUTE
ON FUNCTION private.has_role(uuid, public.app_role)
FROM anon;


-- =========================================================
-- 2) API TABLE GRANTS
-- =========================================================

GRANT SELECT ON public.products TO anon, authenticated;
GRANT SELECT ON public.categories TO anon, authenticated;
GRANT SELECT ON public.collections TO anon, authenticated;
GRANT SELECT ON public.pages TO anon, authenticated;
GRANT SELECT ON public.blog_posts TO anon, authenticated;
GRANT SELECT ON public.site_settings TO anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE
ON public.products TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE
ON public.categories TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE
ON public.collections TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE
ON public.pages TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE
ON public.blog_posts TO authenticated;


-- =========================================================
-- 3) PRODUCTS RLS
-- Public storefront:
--   - published
--   - category is active
-- Archive visibility is still controlled by the relevant frontend route.
-- Admin management remains a separate authenticated policy.
-- =========================================================

DROP POLICY IF EXISTS "Products are viewable by everyone"
ON public.products;

DROP POLICY IF EXISTS "Published products are viewable by everyone"
ON public.products;

CREATE POLICY "Published products are viewable by everyone"
ON public.products
FOR SELECT
TO anon, authenticated
USING (
  published = true
  AND EXISTS (
    SELECT 1
    FROM public.categories c
    WHERE c.slug = products.category
      AND c.active = true
  )
);

DROP POLICY IF EXISTS "Admins manage products"
ON public.products;

CREATE POLICY "Admins manage products"
ON public.products
FOR ALL
TO authenticated
USING (
  private.has_role(auth.uid(), 'admin')
)
WITH CHECK (
  private.has_role(auth.uid(), 'admin')
);


-- =========================================================
-- 4) CATEGORIES RLS
-- =========================================================

DROP POLICY IF EXISTS "Categories are viewable by everyone"
ON public.categories;

DROP POLICY IF EXISTS "Active categories are viewable by everyone"
ON public.categories;

CREATE POLICY "Active categories are viewable by everyone"
ON public.categories
FOR SELECT
TO anon, authenticated
USING (active = true);

DROP POLICY IF EXISTS "Admins manage categories"
ON public.categories;

CREATE POLICY "Admins manage categories"
ON public.categories
FOR ALL
TO authenticated
USING (
  private.has_role(auth.uid(), 'admin')
)
WITH CHECK (
  private.has_role(auth.uid(), 'admin')
);


-- =========================================================
-- 5) COLLECTIONS RLS
-- =========================================================

DROP POLICY IF EXISTS "Published collections are viewable by everyone"
ON public.collections;

CREATE POLICY "Published collections are viewable by everyone"
ON public.collections
FOR SELECT
TO anon, authenticated
USING (published = true);

DROP POLICY IF EXISTS "Admins manage collections"
ON public.collections;

CREATE POLICY "Admins manage collections"
ON public.collections
FOR ALL
TO authenticated
USING (
  private.has_role(auth.uid(), 'admin')
)
WITH CHECK (
  private.has_role(auth.uid(), 'admin')
);


-- =========================================================
-- 6) BLOG RLS
-- =========================================================

DROP POLICY IF EXISTS "Published posts are viewable by everyone"
ON public.blog_posts;

CREATE POLICY "Published posts are viewable by everyone"
ON public.blog_posts
FOR SELECT
TO anon, authenticated
USING (status = 'published');

DROP POLICY IF EXISTS "Admins manage posts"
ON public.blog_posts;

CREATE POLICY "Admins manage posts"
ON public.blog_posts
FOR ALL
TO authenticated
USING (
  private.has_role(auth.uid(), 'admin')
)
WITH CHECK (
  private.has_role(auth.uid(), 'admin')
);


-- =========================================================
-- 7) PRODUCT / CMS IMAGE DELIVERY
-- =========================================================

UPDATE storage.buckets
SET public = true
WHERE id = 'product-images';


-- =========================================================
-- 8) HELPFUL PUBLIC READ INDEXES
-- =========================================================

CREATE INDEX IF NOT EXISTS products_public_storefront_idx
ON public.products (sort_order, created_at DESC)
WHERE published = true AND archived = false;

CREATE INDEX IF NOT EXISTS products_public_category_idx
ON public.products (category, sort_order, created_at DESC)
WHERE published = true AND archived = false;

CREATE INDEX IF NOT EXISTS categories_active_sort_idx
ON public.categories (sort_order, name)
WHERE active = true;

CREATE INDEX IF NOT EXISTS blog_posts_public_idx
ON public.blog_posts (published_at DESC)
WHERE status = 'published';


-- =========================================================
-- 9) HOME CMS BOOTSTRAP
-- Does not overwrite the current Home configuration.
-- =========================================================

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

COMMIT;


-- =========================================================
-- 10) VERIFICATION RESULTS
-- Read-only checks after the transaction.
-- =========================================================

SELECT
  tablename,
  policyname,
  cmd,
  roles,
  qual
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'products',
    'categories',
    'collections',
    'blog_posts'
  )
ORDER BY tablename, policyname;

SELECT
  id,
  public
FROM storage.buckets
WHERE id = 'product-images';

SELECT
  page_key,
  title
FROM public.pages
WHERE page_key = 'home';
