alter table public.communications
  add column if not exists sender_title text,
  add column if not exists target_class_id text,
  add column if not exists target_student_id text,
  add column if not exists target_student_name text,
  add column if not exists attachments jsonb not null default '[]'::jsonb,
  add column if not exists send_push_notification boolean not null default true,
  add column if not exists require_read_confirmation boolean not null default true;

alter table public.user_accounts add column if not exists phone text;

create table if not exists public.whatsapp_messages (
  id text primary key,
  recipient_name text not null,
  recipient_phone text,
  recipient_role text,
  message_type text,
  content text not null,
  student_id text,
  student_name text,
  student_class text,
  status text not null default 'ENVIADO',
  source text,
  batch_id text,
  title text,
  operator_name text,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists whatsapp_messages_status_idx on public.whatsapp_messages(status);

alter table public.whatsapp_messages enable row level security;
drop policy if exists staff_select on public.whatsapp_messages;
create policy staff_select on public.whatsapp_messages for select to authenticated using (is_staff());
drop policy if exists staff_insert on public.whatsapp_messages;
create policy staff_insert on public.whatsapp_messages for insert to authenticated with check (is_staff());
drop policy if exists staff_update on public.whatsapp_messages;
create policy staff_update on public.whatsapp_messages for update to authenticated using (is_staff()) with check (is_staff());
drop policy if exists admin_delete on public.whatsapp_messages;
create policy admin_delete on public.whatsapp_messages for delete to authenticated using (is_admin());
