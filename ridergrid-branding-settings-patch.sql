-- Dispatch NG branding/settings patch
-- Safe to run on an existing project. Adds platform branding settings and a public branding bucket.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.platform_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value TEXT,
  setting_type TEXT NOT NULL DEFAULT 'string' CHECK (setting_type IN ('string','number','boolean','json')),
  description TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

INSERT INTO public.platform_settings (setting_key, setting_value, setting_type, description)
VALUES
  ('site_name', 'Dispatch NG', 'string', 'Public platform/brand name'),
  ('logo_url', '', 'string', 'Public URL of the platform logo'),
  ('favicon_url', '', 'string', 'Public URL of the browser favicon')
ON CONFLICT (setting_key) DO NOTHING;

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Platform settings are publicly readable" ON public.platform_settings;
CREATE POLICY "Platform settings are publicly readable"
ON public.platform_settings FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Admins can insert platform settings" ON public.platform_settings;
CREATE POLICY "Admins can insert platform settings"
ON public.platform_settings FOR INSERT
TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.user_type = 'admin'));

DROP POLICY IF EXISTS "Admins can update platform settings" ON public.platform_settings;
CREATE POLICY "Admins can update platform settings"
ON public.platform_settings FOR UPDATE
TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.user_type = 'admin'))
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.user_type = 'admin'));

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('branding', 'branding', true, 5242880, ARRAY['image/png','image/jpeg','image/webp','image/svg+xml','image/x-icon'])
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public, file_size_limit = EXCLUDED.file_size_limit, allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Public can view branding assets" ON storage.objects;
CREATE POLICY "Public can view branding assets"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'branding');

DROP POLICY IF EXISTS "Admins can upload branding assets" ON storage.objects;
CREATE POLICY "Admins can upload branding assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'branding' AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.user_type = 'admin'));

DROP POLICY IF EXISTS "Admins can update branding assets" ON storage.objects;
CREATE POLICY "Admins can update branding assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'branding' AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.user_type = 'admin'))
WITH CHECK (bucket_id = 'branding' AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.user_type = 'admin'));

DROP POLICY IF EXISTS "Admins can delete branding assets" ON storage.objects;
CREATE POLICY "Admins can delete branding assets"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'branding' AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.user_type = 'admin'));
