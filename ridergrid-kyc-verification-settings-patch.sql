-- Dispatch NG: lightweight KYC + account verification controls
-- Safe to run more than once.

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS verification_status text DEFAULT 'pending';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email_verified_at timestamptz;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone_verified_at timestamptz;

DO $$ BEGIN
  ALTER TABLE public.profiles ADD CONSTRAINT profiles_verification_status_check CHECK (verification_status IS NULL OR verification_status IN ('pending','verified','rejected','expired'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

INSERT INTO public.platform_settings (setting_key,setting_value,setting_type,description)
VALUES
 ('require_customer_kyc','false','boolean','Require customers to complete identity verification'),
 ('require_rider_kyc','true','boolean','Require riders to complete identity verification'),
 ('enable_email_verification','false','boolean','Require Dispatch NG email code verification'),
 ('enable_phone_verification','false','boolean','Require SMS/phone OTP verification')
ON CONFLICT (setting_key) DO NOTHING;

-- Verification challenges support Resend now and Vonage/Twilio later.
CREATE TABLE IF NOT EXISTS public.account_verification_challenges (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
 channel text NOT NULL CHECK (channel IN ('email','phone')),
 code_hash text NOT NULL,
 destination text NOT NULL,
 expires_at timestamptz NOT NULL,
 attempts integer NOT NULL DEFAULT 0,
 consumed_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_account_verification_challenges_profile_channel ON public.account_verification_challenges(profile_id,channel,created_at DESC);
ALTER TABLE public.account_verification_challenges ENABLE ROW LEVEL SECURITY;

-- KYC table already exists in RiderGrid; make its access rules explicit.
ALTER TABLE public.kyc_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own KYC" ON public.kyc_records;
CREATE POLICY "Users can view own KYC" ON public.kyc_records FOR SELECT USING (profile_id = auth.uid());
DROP POLICY IF EXISTS "Users can submit own KYC" ON public.kyc_records;
CREATE POLICY "Users can submit own KYC" ON public.kyc_records FOR INSERT WITH CHECK (profile_id = auth.uid());
DROP POLICY IF EXISTS "Users can resubmit own KYC" ON public.kyc_records;
CREATE POLICY "Users can resubmit own KYC" ON public.kyc_records FOR UPDATE USING (profile_id = auth.uid()) WITH CHECK (profile_id = auth.uid());
DROP POLICY IF EXISTS "Admins can manage all KYC" ON public.kyc_records;
CREATE POLICY "Admins can manage all KYC" ON public.kyc_records FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id=auth.uid() AND p.user_type='admin')) WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id=auth.uid() AND p.user_type='admin'));

-- Admin verification actions update the user's profile status as well.
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
CREATE POLICY "Admins can update all profiles" ON public.profiles FOR UPDATE USING (EXISTS (SELECT 1 FROM public.profiles a WHERE a.id=auth.uid() AND a.user_type='admin')) WITH CHECK (EXISTS (SELECT 1 FROM public.profiles a WHERE a.id=auth.uid() AND a.user_type='admin'));

-- Private KYC storage. Never expose identity documents as public URLs.
INSERT INTO storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
VALUES ('kyc-documents','kyc-documents',false,10485760,ARRAY['image/jpeg','image/png','image/webp','application/pdf'])
ON CONFLICT (id) DO UPDATE SET public=false,file_size_limit=10485760,allowed_mime_types=EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Users upload own KYC files" ON storage.objects;
CREATE POLICY "Users upload own KYC files" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id='kyc-documents' AND (storage.foldername(name))[1]=auth.uid()::text);
DROP POLICY IF EXISTS "Users read own KYC files" ON storage.objects;
CREATE POLICY "Users read own KYC files" ON storage.objects FOR SELECT TO authenticated USING (bucket_id='kyc-documents' AND ((storage.foldername(name))[1]=auth.uid()::text OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id=auth.uid() AND p.user_type='admin')));
DROP POLICY IF EXISTS "Admins manage KYC files" ON storage.objects;
CREATE POLICY "Admins manage KYC files" ON storage.objects FOR ALL TO authenticated USING (bucket_id='kyc-documents' AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id=auth.uid() AND p.user_type='admin')) WITH CHECK (bucket_id='kyc-documents' AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id=auth.uid() AND p.user_type='admin'));
