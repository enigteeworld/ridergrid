-- Dispatch NG branding persistence repair
-- Safe to run after the existing branding settings patch.

INSERT INTO public.platform_settings (setting_key, setting_value, setting_type, description)
VALUES
 ('site_name', 'Dispatch NG', 'string', 'Public platform/brand name'),
 ('logo_url', '', 'string', 'Public URL of the platform logo'),
 ('favicon_url', '', 'string', 'Public URL of the browser favicon')
ON CONFLICT (setting_key) DO NOTHING;

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Platform settings are publicly readable" ON public.platform_settings;
CREATE POLICY "Platform settings are publicly readable"
ON public.platform_settings FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Admins can insert platform settings" ON public.platform_settings;
CREATE POLICY "Admins can insert platform settings"
ON public.platform_settings FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.user_type = 'admin'));

DROP POLICY IF EXISTS "Admins can update platform settings" ON public.platform_settings;
CREATE POLICY "Admins can update platform settings"
ON public.platform_settings FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.user_type = 'admin'))
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.user_type = 'admin'));

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('branding', 'branding', true, 5242880, ARRAY['image/png','image/jpeg','image/webp','image/svg+xml','image/x-icon','image/vnd.microsoft.icon'])
ON CONFLICT (id) DO UPDATE SET public = true, file_size_limit = EXCLUDED.file_size_limit, allowed_mime_types = EXCLUDED.allowed_mime_types;
