-- RiderGrid Resolution Center migration
-- Run once in Supabase SQL Editor on the EXISTING database.
BEGIN;

-- Normalize legacy workflow statuses before replacing the old check constraint.
ALTER TABLE public.disputes DROP CONSTRAINT IF EXISTS disputes_status_check;
ALTER TABLE public.disputes ADD COLUMN IF NOT EXISTS resolution_outcome TEXT;
UPDATE public.disputes SET status='resolved', resolution_outcome='customer_favor' WHERE status='resolved_customer_favor';
UPDATE public.disputes SET status='resolved', resolution_outcome='rider_favor' WHERE status='resolved_rider_favor';
UPDATE public.disputes SET status='resolved', resolution_outcome='split' WHERE status='resolved_split';

ALTER TABLE public.disputes ADD COLUMN IF NOT EXISTS ticket_number TEXT;
ALTER TABLE public.disputes ADD COLUMN IF NOT EXISTS priority TEXT NOT NULL DEFAULT 'normal';
ALTER TABLE public.disputes ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES public.profiles(id);
ALTER TABLE public.disputes ADD COLUMN IF NOT EXISTS waiting_on TEXT NOT NULL DEFAULT 'support';
ALTER TABLE public.disputes ADD COLUMN IF NOT EXISTS last_message_at TIMESTAMPTZ DEFAULT NOW();

DO $$ BEGIN
  ALTER TABLE public.disputes DROP CONSTRAINT IF EXISTS disputes_dispute_type_check;
  ALTER TABLE public.disputes ADD CONSTRAINT disputes_dispute_type_check CHECK (dispute_type IN ('not_delivered','damaged','wrong_item','rider_no_show','customer_no_show','payment_issue','refund_request','other'));
  ALTER TABLE public.disputes ADD CONSTRAINT disputes_status_check CHECK (status IN ('open','under_review','waiting_customer','waiting_rider','waiting_support','resolved','closed'));
  ALTER TABLE public.disputes ADD CONSTRAINT disputes_priority_check CHECK (priority IN ('low','normal','high','urgent'));
  ALTER TABLE public.disputes ADD CONSTRAINT disputes_waiting_on_check CHECK (waiting_on IN ('support','customer','rider','none'));
  ALTER TABLE public.disputes ADD CONSTRAINT disputes_resolution_outcome_check CHECK (resolution_outcome IS NULL OR resolution_outcome IN ('customer_favor','rider_favor','split','refund','partial_refund','no_action','other'));
END $$;

CREATE SEQUENCE IF NOT EXISTS public.dispute_ticket_seq START 100001;
UPDATE public.disputes SET ticket_number='RGT-'||LPAD(nextval('public.dispute_ticket_seq')::text,6,'0') WHERE ticket_number IS NULL;
ALTER TABLE public.disputes ALTER COLUMN ticket_number SET DEFAULT ('RGT-'||LPAD(nextval('public.dispute_ticket_seq')::text,6,'0'));
CREATE UNIQUE INDEX IF NOT EXISTS idx_disputes_ticket_number ON public.disputes(ticket_number);
CREATE INDEX IF NOT EXISTS idx_disputes_status_priority ON public.disputes(status,priority);
CREATE INDEX IF NOT EXISTS idx_disputes_last_message ON public.disputes(last_message_at DESC);

CREATE TABLE IF NOT EXISTS public.dispute_messages (
 id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), dispute_id UUID NOT NULL REFERENCES public.disputes(id) ON DELETE CASCADE,
 sender_id UUID NOT NULL REFERENCES public.profiles(id), sender_role TEXT NOT NULL CHECK(sender_role IN ('customer','rider','admin','system')),
 message TEXT NOT NULL CHECK(length(trim(message))>0), is_internal BOOLEAN NOT NULL DEFAULT false, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_dispute_messages_thread ON public.dispute_messages(dispute_id,created_at);

CREATE TABLE IF NOT EXISTS public.dispute_activity (
 id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), dispute_id UUID NOT NULL REFERENCES public.disputes(id) ON DELETE CASCADE,
 actor_id UUID REFERENCES public.profiles(id), action_type TEXT NOT NULL, details JSONB NOT NULL DEFAULT '{}'::jsonb, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_dispute_activity_thread ON public.dispute_activity(dispute_id,created_at);

CREATE OR REPLACE FUNCTION public.ticket_message_touch() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NOT NEW.is_internal THEN
    UPDATE disputes SET last_message_at=NEW.created_at, updated_at=NEW.created_at,
      status=CASE WHEN NEW.sender_role='admin' THEN status WHEN status IN ('resolved','closed') THEN status ELSE 'waiting_support' END,
      waiting_on=CASE WHEN NEW.sender_role='admin' THEN waiting_on WHEN status IN ('resolved','closed') THEN waiting_on ELSE 'support' END
    WHERE id=NEW.dispute_id;
  END IF;
  INSERT INTO dispute_activity(dispute_id,actor_id,action_type,details) VALUES(NEW.dispute_id,NEW.sender_id,CASE WHEN NEW.is_internal THEN 'internal_note_added' ELSE 'message_added' END,jsonb_build_object('sender_role',NEW.sender_role));
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_ticket_message_touch ON public.dispute_messages;
CREATE TRIGGER trg_ticket_message_touch AFTER INSERT ON public.dispute_messages FOR EACH ROW EXECUTE FUNCTION public.ticket_message_touch();


-- Helper functions avoid recursive RLS policy lookups.
CREATE OR REPLACE FUNCTION public.is_admin(uid UUID) RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT EXISTS(SELECT 1 FROM profiles WHERE id=uid AND user_type='admin') $$;
CREATE OR REPLACE FUNCTION public.can_access_dispute(did UUID, uid UUID) RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT EXISTS(SELECT 1 FROM disputes d JOIN dispatch_jobs j ON j.id=d.dispatch_job_id WHERE d.id=did AND (d.raised_by=uid OR j.customer_id=uid OR j.rider_id=uid OR public.is_admin(uid))) $$;

ALTER TABLE public.dispute_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dispute_activity ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Ticket participants can view disputes" ON public.disputes;
DROP POLICY IF EXISTS "Ticket creators can create disputes" ON public.disputes;
DROP POLICY IF EXISTS "Admins can update disputes" ON public.disputes;
CREATE POLICY "Ticket participants can view disputes" ON public.disputes FOR SELECT USING (raised_by=auth.uid() OR public.is_admin(auth.uid()) OR EXISTS(SELECT 1 FROM public.dispatch_jobs j WHERE j.id=dispatch_job_id AND (j.customer_id=auth.uid() OR j.rider_id=auth.uid())));
CREATE POLICY "Ticket creators can create disputes" ON public.disputes FOR INSERT WITH CHECK (raised_by=auth.uid() AND EXISTS(SELECT 1 FROM public.dispatch_jobs j WHERE j.id=dispatch_job_id AND j.customer_id=auth.uid()));
CREATE POLICY "Admins can update disputes" ON public.disputes FOR UPDATE USING(public.is_admin(auth.uid())) WITH CHECK(public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Participants read ticket messages" ON public.dispute_messages;
DROP POLICY IF EXISTS "Participants send ticket messages" ON public.dispute_messages;
CREATE POLICY "Participants read ticket messages" ON public.dispute_messages FOR SELECT USING (public.can_access_dispute(dispute_id,auth.uid()) AND (NOT is_internal OR public.is_admin(auth.uid())));
CREATE POLICY "Participants send ticket messages" ON public.dispute_messages FOR INSERT WITH CHECK (sender_id=auth.uid() AND public.can_access_dispute(dispute_id,auth.uid()) AND (NOT is_internal OR public.is_admin(auth.uid())));
CREATE POLICY "Admins manage ticket messages" ON public.dispute_messages FOR ALL USING(public.is_admin(auth.uid())) WITH CHECK(public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Participants read evidence" ON public.dispute_evidence;
DROP POLICY IF EXISTS "Participants add evidence" ON public.dispute_evidence;
CREATE POLICY "Participants read evidence" ON public.dispute_evidence FOR SELECT USING(public.can_access_dispute(dispute_id,auth.uid()));
CREATE POLICY "Participants add evidence" ON public.dispute_evidence FOR INSERT WITH CHECK(uploaded_by=auth.uid() AND public.can_access_dispute(dispute_id,auth.uid()));
CREATE POLICY "Admins manage evidence" ON public.dispute_evidence FOR ALL USING(public.is_admin(auth.uid())) WITH CHECK(public.is_admin(auth.uid()));
CREATE POLICY "Admins read ticket activity" ON public.dispute_activity FOR SELECT USING(public.is_admin(auth.uid()));
CREATE POLICY "Admins add ticket activity" ON public.dispute_activity FOR INSERT WITH CHECK(public.is_admin(auth.uid()));

INSERT INTO storage.buckets(id,name,public,file_size_limit,allowed_mime_types) VALUES('dispute-evidence','dispute-evidence',true,10485760,ARRAY['image/jpeg','image/png','image/webp','application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document']) ON CONFLICT(id) DO UPDATE SET file_size_limit=EXCLUDED.file_size_limit, allowed_mime_types=EXCLUDED.allowed_mime_types;
DROP POLICY IF EXISTS "Ticket evidence upload" ON storage.objects;
CREATE POLICY "Ticket evidence upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK(bucket_id='dispute-evidence' AND auth.uid()::text=(storage.foldername(name))[2] AND public.can_access_dispute(((storage.foldername(name))[1])::uuid,auth.uid()));
DROP POLICY IF EXISTS "Ticket evidence read" ON storage.objects;
CREATE POLICY "Ticket evidence read" ON storage.objects FOR SELECT TO authenticated USING(bucket_id='dispute-evidence' AND public.can_access_dispute(((storage.foldername(name))[1])::uuid,auth.uid()));

COMMIT;
