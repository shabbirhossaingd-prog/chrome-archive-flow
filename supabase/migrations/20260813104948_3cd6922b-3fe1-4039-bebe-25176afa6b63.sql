-- roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- categories
CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  image_url text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Categories are viewable by everyone"
ON public.categories FOR SELECT USING (true);
CREATE POLICY "Admins manage categories"
ON public.categories FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- products
CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_code text NOT NULL UNIQUE,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  category text NOT NULL REFERENCES public.categories(slug) ON UPDATE CASCADE,
  price numeric NOT NULL DEFAULT 0,
  old_price numeric,
  short_description text NOT NULL DEFAULT '',
  full_description text NOT NULL DEFAULT '',
  material text NOT NULL DEFAULT '',
  sizes text[] NOT NULL DEFAULT '{}',
  finish text[] NOT NULL DEFAULT '{}',
  stock_status text NOT NULL DEFAULT 'IN STOCK',
  featured boolean NOT NULL DEFAULT false,
  new_collection boolean NOT NULL DEFAULT false,
  archive boolean NOT NULL DEFAULT false,
  collection_name text NOT NULL DEFAULT 'DROP 001',
  primary_image text NOT NULL DEFAULT '',
  gallery_images text[] NOT NULL DEFAULT '{}',
  whatsapp_available boolean NOT NULL DEFAULT true,
  size_guide text NOT NULL DEFAULT '',
  care text NOT NULL DEFAULT '',
  delivery text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Products are viewable by everyone"
ON public.products FOR SELECT USING (true);
CREATE POLICY "Admins manage products"
ON public.products FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER products_touch_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- storage policies
CREATE POLICY "Product images are viewable by everyone"
ON storage.objects FOR SELECT USING (bucket_id = 'product-images');
CREATE POLICY "Admins upload product images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update product images"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete product images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));

-- seed categories
INSERT INTO public.categories (slug, name, sort_order, image_url) VALUES
  ('rings', 'RINGS', 1, '/products/ring.jpg'),
  ('bracelets', 'BRACELETS', 2, '/products/bracelet.jpg'),
  ('chains', 'CHAINS', 3, '/products/chain.jpg'),
  ('pant-chains', 'PANT CHAINS', 4, '/products/chain.jpg'),
  ('chrome-glasses', 'CHROME GLASSES', 5, '/products/campaign-2.jpg');

-- seed products
INSERT INTO public.products (product_code, name, slug, category, price, short_description, full_description, material, sizes, finish, stock_status, featured, new_collection, archive, primary_image, gallery_images, size_guide, care, delivery, sort_order) VALUES
  ('ZZ / 001', 'CHROME SIGNET', 'chrome-signet', 'rings', 650,
   'Polished metal. Adjustable. Unisex.',
   'A heavy signet cast in polished metal. Distorted relief, mirror shoulders, built to catch light in dark rooms.',
   'Polished stainless alloy. Hand-finished relief face. Weight approx. 14g.',
   ARRAY['ADJUSTABLE'], ARRAY['CHROME'], 'IN STOCK', true, true, false,
   '/products/ring.jpg', ARRAY['/products/campaign-1.jpg','/products/chain.jpg'],
   'Adjustable band, fits most. Face width 17mm.',
   'Wipe with a dry cloth. Keep away from perfume and water.',
   'Dhaka 1-2 days. Outside Dhaka 2-4 days. Cash on delivery available.', 1),
  ('ZZ / 002', 'MOLTEN CURB CHAIN', 'molten-curb-chain', 'chains', 1250,
   'Polished metal. Lobster clasp. Unisex.',
   'Flattened curb links with a molten finish and a star charm terminal. Worn tight or long.',
   'Polished stainless alloy links, 8mm gauge, star charm terminal.',
   ARRAY['50CM','55CM'], ARRAY['CHROME'], 'IN STOCK', true, true, false,
   '/products/chain.jpg', ARRAY['/products/campaign-2.jpg','/products/bracelet.jpg'],
   'Length 50cm. Adjustable 5cm extender.',
   'Wipe with a dry cloth. Store flat and dry.',
   'Dhaka 1-2 days. Outside Dhaka 2-4 days. Cash on delivery available.', 2),
  ('ZZ / 003', 'GOTHIC CROSS BRACELET', 'gothic-cross-bracelet', 'bracelets', 890,
   'Polished metal. Adjustable. Unisex.',
   'Interlocked chrome links broken by an ornamental cross station. Vintage metal, afterdark form.',
   'Polished stainless alloy. Cross station 14mm. Weight approx. 22g.',
   ARRAY['18CM','20CM'], ARRAY['CHROME'], 'IN STOCK', false, true, false,
   '/products/bracelet.jpg', ARRAY['/products/campaign-1.jpg','/products/ring.jpg'],
   'Length 20cm, adjustable to 18cm.',
   'Wipe with a dry cloth. Remove before showering.',
   'Dhaka 1-2 days. Outside Dhaka 2-4 days. Cash on delivery available.', 3);
