-- RiderGrid communications + notifications patch
-- Run AFTER ridergrid-ticketing-patch.sql and ridergrid-delivery-proof-patch.sql.

create table if not exists public.delivery_messages (
  id uuid primary key default gen_random_uuid(),
  dispatch_job_id uuid not null references public.dispatch_jobs(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  message text not null check (char_length(btrim(message)) between 1 and 4000),
  created_at timestamptz not null default now()
);
create index if not exists delivery_messages_job_created_idx on public.delivery_messages(dispatch_job_id, created_at);
alter table public.delivery_messages enable row level security;

drop policy if exists "Delivery participants can read chat" on public.delivery_messages;
create policy "Delivery participants can read chat" on public.delivery_messages for select to authenticated using (
  exists (select 1 from public.dispatch_jobs j where j.id=dispatch_job_id and (j.customer_id=auth.uid() or j.rider_id=auth.uid()))
  or exists (select 1 from public.profiles p where p.id=auth.uid() and p.user_type='admin')
);
drop policy if exists "Delivery participants can send chat" on public.delivery_messages;
create policy "Delivery participants can send chat" on public.delivery_messages for insert to authenticated with check (
  sender_id=auth.uid() and exists (select 1 from public.dispatch_jobs j where j.id=dispatch_job_id and (j.customer_id=auth.uid() or j.rider_id=auth.uid()) and j.status not in ('cancelled','refunded'))
);

-- Expand notification types without breaking existing rows.
alter table public.notifications drop constraint if exists notifications_type_check;
alter table public.notifications add constraint notifications_type_check check (type in (
 'job_created','job_request','job_assigned','job_funded','job_started','job_delivered','job_completed','job_cancelled',
 'payment_received','withdrawal_processed','kyc_status','dispute_opened','ticket_reply','ticket_resolved','chat_message','system'
));
alter table public.notifications add column if not exists email_status text not null default 'pending' check (email_status in ('pending','sent','failed','skipped'));
alter table public.notifications add column if not exists emailed_at timestamptz;
alter table public.notifications add column if not exists email_error text;

create or replace function public.rg_notify(p_profile uuid,p_type text,p_title text,p_message text,p_data jsonb default '{}'::jsonb)
returns void language plpgsql security definer set search_path=public as $$
begin
 if p_profile is not null then insert into public.notifications(profile_id,type,title,message,data) values(p_profile,p_type,p_title,p_message,p_data); end if;
end; $$;

-- One authoritative notifier for delivery lifecycle changes.
create or replace function public.rg_job_notifications() returns trigger language plpgsql security definer set search_path=public as $$
begin
 if tg_op='INSERT' then
   perform public.rg_notify(new.customer_id,'job_created','Delivery created','Your delivery request '||new.job_number||' was created.',jsonb_build_object('job_id',new.id));
   perform public.rg_notify(new.rider_id,'job_request','New delivery request','A customer sent you delivery request '||new.job_number||'. Review it to accept or decline.',jsonb_build_object('job_id',new.id));
   return new;
 end if;
 if old.status is distinct from new.status then
   if new.status='awaiting_funding' then
     perform public.rg_notify(new.customer_id,'job_assigned','Rider accepted your delivery','Your selected rider accepted '||new.job_number||'. You can now fund the delivery.',jsonb_build_object('job_id',new.id));
   elsif new.status='funded' then
     perform public.rg_notify(new.customer_id,'job_funded','Delivery funded','Payment for '||new.job_number||' is secured in escrow.',jsonb_build_object('job_id',new.id));
     perform public.rg_notify(new.rider_id,'job_funded','Payment secured','Delivery '||new.job_number||' is funded. You can begin the delivery.',jsonb_build_object('job_id',new.id));
   elsif new.status='in_progress' then
     perform public.rg_notify(new.customer_id,'job_started','Delivery in progress','Your rider has started delivery '||new.job_number||'.',jsonb_build_object('job_id',new.id));
   elsif new.status='rider_marked_complete' then
     perform public.rg_notify(new.customer_id,'job_delivered','Delivery awaiting confirmation','The rider submitted delivery proof for '||new.job_number||'. Review and confirm delivery.',jsonb_build_object('job_id',new.id));
   elsif new.status='completed' then
     perform public.rg_notify(new.customer_id,'job_completed','Delivery completed','Delivery '||new.job_number||' is complete.',jsonb_build_object('job_id',new.id));
     perform public.rg_notify(new.rider_id,'payment_received','Delivery completed & payment released','Delivery '||new.job_number||' is complete and its settlement has been processed.',jsonb_build_object('job_id',new.id));
   elsif new.status='cancelled' then
     perform public.rg_notify(new.customer_id,'job_cancelled','Delivery cancelled','Delivery '||new.job_number||' was cancelled.',jsonb_build_object('job_id',new.id));
     perform public.rg_notify(new.rider_id,'job_cancelled','Delivery cancelled','Delivery '||new.job_number||' was cancelled.',jsonb_build_object('job_id',new.id));
   elsif new.status='disputed' then
     perform public.rg_notify(new.rider_id,'dispute_opened','Delivery under review','A support case was opened for '||new.job_number||'.',jsonb_build_object('job_id',new.id));
   end if;
 end if;
 return new;
end; $$;
drop trigger if exists rg_job_notifications_trigger on public.dispatch_jobs;
create trigger rg_job_notifications_trigger after insert or update of status on public.dispatch_jobs for each row execute function public.rg_job_notifications();

create or replace function public.rg_chat_notification() returns trigger language plpgsql security definer set search_path=public as $$
declare j public.dispatch_jobs%rowtype; recipient uuid; sender_name text;
begin
 select * into j from public.dispatch_jobs where id=new.dispatch_job_id;
 recipient:=case when new.sender_id=j.customer_id then j.rider_id else j.customer_id end;
 select coalesce(full_name,'Delivery participant') into sender_name from public.profiles where id=new.sender_id;
 perform public.rg_notify(recipient,'chat_message','New delivery message',sender_name||' sent a message about '||j.job_number||'.',jsonb_build_object('job_id',j.id,'message_id',new.id));
 return new;
end; $$;
drop trigger if exists rg_chat_notification_trigger on public.delivery_messages;
create trigger rg_chat_notification_trigger after insert on public.delivery_messages for each row execute function public.rg_chat_notification();

-- Ticket replies notify the other delivery participant. Admin/internal notes are excluded.
create or replace function public.rg_ticket_reply_notification() returns trigger language plpgsql security definer set search_path=public as $$
declare d public.disputes%rowtype; j public.dispatch_jobs%rowtype; recipient uuid;
begin
 if coalesce(new.is_internal,false) then return new; end if;
 select * into d from public.disputes where id=new.dispute_id; select * into j from public.dispatch_jobs where id=d.dispatch_job_id;
 if new.sender_role='admin' then recipient:=case when d.waiting_on='rider' then j.rider_id else j.customer_id end;
 else recipient:=case when new.sender_id=j.customer_id then j.rider_id else j.customer_id end; end if;
 perform public.rg_notify(recipient,'ticket_reply','New support reply','There is a new reply on ticket '||coalesce(d.ticket_number,'support case')||'.',jsonb_build_object('ticket_id',d.id,'job_id',j.id));
 return new;
end; $$;
drop trigger if exists rg_ticket_reply_notification_trigger on public.dispute_messages;
create trigger rg_ticket_reply_notification_trigger after insert on public.dispute_messages for each row execute function public.rg_ticket_reply_notification();

-- Make realtime useful for bell/chat when the publication exists.
do $$ begin
 alter publication supabase_realtime add table public.delivery_messages;
exception when duplicate_object then null; when undefined_object then null; end $$;
do $$ begin
 alter publication supabase_realtime add table public.notifications;
exception when duplicate_object then null; when undefined_object then null; end $$;

-- Resolution outcome/status notification to both delivery participants.
create or replace function public.rg_dispute_resolution_notification() returns trigger language plpgsql security definer set search_path=public as $$
declare j public.dispatch_jobs%rowtype;
begin
 if old.status is distinct from new.status and new.status in ('resolved','closed') then
  select * into j from public.dispatch_jobs where id=new.dispatch_job_id;
  perform public.rg_notify(j.customer_id,'ticket_resolved','Support case updated','Ticket '||coalesce(new.ticket_number,'')||' has been '||new.status||'.',jsonb_build_object('ticket_id',new.id,'job_id',j.id));
  perform public.rg_notify(j.rider_id,'ticket_resolved','Support case updated','Ticket '||coalesce(new.ticket_number,'')||' has been '||new.status||'.',jsonb_build_object('ticket_id',new.id,'job_id',j.id));
 end if; return new;
end; $$;
drop trigger if exists rg_dispute_resolution_notification_trigger on public.disputes;
create trigger rg_dispute_resolution_notification_trigger after update of status on public.disputes for each row execute function public.rg_dispute_resolution_notification();

-- Rider verification status changes.
create or replace function public.rg_kyc_notification() returns trigger language plpgsql security definer set search_path=public as $$
begin
 if old.verification_status is distinct from new.verification_status then
  perform public.rg_notify(new.profile_id,'kyc_status','Verification status updated','Your rider verification is now '||replace(new.verification_status,'_',' ')||'.','{}'::jsonb);
 end if; return new;
end; $$;
drop trigger if exists rg_kyc_notification_trigger on public.rider_profiles;
create trigger rg_kyc_notification_trigger after update of verification_status on public.rider_profiles for each row execute function public.rg_kyc_notification();

-- Withdrawal decisions/status changes.
create or replace function public.rg_withdrawal_notification() returns trigger language plpgsql security definer set search_path=public as $$
begin
 if old.status is distinct from new.status then
  perform public.rg_notify(new.profile_id,'withdrawal_processed','Withdrawal '||replace(new.status,'_',' '),'Your withdrawal request status is now '||replace(new.status,'_',' ')||'.',jsonb_build_object('withdrawal_id',new.id));
 end if; return new;
end; $$;
drop trigger if exists rg_withdrawal_notification_trigger on public.withdrawal_requests;
create trigger rg_withdrawal_notification_trigger after update of status on public.withdrawal_requests for each row execute function public.rg_withdrawal_notification();
