-- RiderGrid delivery photo proof migration
-- Run AFTER ridergrid-ticketing-patch.sql.

ALTER TABLE public.delivery_proofs
  ADD COLUMN IF NOT EXISTS storage_path TEXT;

CREATE INDEX IF NOT EXISTS idx_delivery_proofs_job_created
  ON public.delivery_proofs(dispatch_job_id, created_at DESC);

ALTER TABLE public.delivery_proofs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Delivery participants can view proofs" ON public.delivery_proofs;
DROP POLICY IF EXISTS "Assigned rider can add delivery proofs" ON public.delivery_proofs;
DROP POLICY IF EXISTS "Admins can manage delivery proofs" ON public.delivery_proofs;

CREATE POLICY "Delivery participants can view proofs"
ON public.delivery_proofs FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.dispatch_jobs j
    WHERE j.id = delivery_proofs.dispatch_job_id
      AND (j.customer_id = auth.uid() OR j.rider_id = auth.uid())
  )
  OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.user_type = 'admin')
);

CREATE POLICY "Assigned rider can add delivery proofs"
ON public.delivery_proofs FOR INSERT TO authenticated
WITH CHECK (
  uploaded_by = auth.uid()
  AND proof_type = 'photo'
  AND EXISTS (
    SELECT 1 FROM public.dispatch_jobs j
    WHERE j.id = delivery_proofs.dispatch_job_id
      AND j.rider_id = auth.uid()
      AND j.status = 'in_progress'
  )
);

CREATE POLICY "Admins can manage delivery proofs"
ON public.delivery_proofs FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.user_type = 'admin'))
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.user_type = 'admin'));

-- Create the private bucket automatically. If you prefer the Dashboard, create a PRIVATE
-- bucket named exactly: delivery-proofs. This statement is safe if it already exists.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('delivery-proofs', 'delivery-proofs', false, 8388608, ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 8388608,
  allowed_mime_types = ARRAY['image/jpeg','image/png','image/webp'];

DROP POLICY IF EXISTS "Riders upload own delivery proof objects" ON storage.objects;
DROP POLICY IF EXISTS "Delivery participants read proof objects" ON storage.objects;
DROP POLICY IF EXISTS "Admins manage delivery proof objects" ON storage.objects;

-- Object path is: <job UUID>/<rider UUID>/<unique filename>
CREATE POLICY "Riders upload own delivery proof objects"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'delivery-proofs'
  AND (storage.foldername(name))[2] = auth.uid()::text
  AND EXISTS (
    SELECT 1 FROM public.dispatch_jobs j
    WHERE j.id::text = (storage.foldername(name))[1]
      AND j.rider_id = auth.uid()
      AND j.status = 'in_progress'
  )
);

CREATE POLICY "Delivery participants read proof objects"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'delivery-proofs'
  AND EXISTS (
    SELECT 1 FROM public.dispatch_jobs j
    WHERE j.id::text = (storage.foldername(name))[1]
      AND (j.customer_id = auth.uid() OR j.rider_id = auth.uid())
  )
  OR (
    bucket_id = 'delivery-proofs'
    AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.user_type = 'admin')
  )
);

-- Riders deliberately receive no UPDATE/DELETE policy: submitted proof is immutable to them.
CREATE POLICY "Admins manage delivery proof objects"
ON storage.objects FOR ALL TO authenticated
USING (
  bucket_id = 'delivery-proofs'
  AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.user_type = 'admin')
)
WITH CHECK (
  bucket_id = 'delivery-proofs'
  AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.user_type = 'admin')
);
