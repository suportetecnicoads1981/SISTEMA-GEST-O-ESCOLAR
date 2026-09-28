-- =============================================================================
-- Sincronização v2 (28/09/2026)
--
-- 1) A nuvem carimba a hora de cada alteração (server_updated_at) e numera as
--    versões de cada registro (row_version). A ordem das alterações deixa de
--    depender do relógio de cada computador.
-- 2) Gravação velha é recusada: o computador envia em base_version a versão que
--    conhecia. Se a nuvem já tem outra, a gravação é ignorada (o registro não volta
--    na resposta) e o computador recebe a versão atual. base_version = -1 força a
--    gravação (registro novo ou primeira sincronização da Sede); base_version nulo
--    é aceito por compatibilidade com versões antigas do sistema.
-- 3) doc guarda o registro completo como o sistema usa (todos os campos), para que
--    um computador que recebe da nuvem não perca série, turno, raça/cor, PCD etc.
-- 4) Lápides (deleted_records) em todas as tabelas sincronizadas: uma exclusão
--    chega a todos os computadores e o registro não é recriado por cópia antiga.
-- 5) app_records: coleções e cadastros que ainda não tinham tabela na nuvem
--    (SEMED, planos de aula, anotações do professor, modelos do WhatsApp...).
-- =============================================================================

create or replace function public.sync_guard()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_base bigint;
begin
  if TG_OP = 'INSERT' then
    -- base_version NÃO é limpo aqui: num "insere ou atualiza" o valor enviado chega à
    -- atualização (EXCLUDED) depois de passar por este gatilho.
    NEW.row_version := 1;
    NEW.server_updated_at := clock_timestamp();
    return NEW;
  end if;
  -- UPDATE. Valor igual ao guardado = não foi enviado nesta gravação (versão antiga do sistema).
  v_base := case when NEW.base_version is not distinct from OLD.base_version then null else NEW.base_version end;
  NEW.base_version := null;
  -- Versão diferente da atual = cópia desatualizada -> ignora a gravação.
  if v_base is not null and v_base <> -1 and v_base <> OLD.row_version then
    return null;
  end if;
  NEW.row_version := OLD.row_version + 1;
  NEW.server_updated_at := clock_timestamp();
  return NEW;
end $$;

do $$
declare
  t text;
  synced text[] := array[
    'students', 'school_classes', 'subjects', 'courses', 'questions', 'exams',
    'exam_submissions', 'attendance_sheets', 'lesson_registries', 'class_grade_sheets',
    'academic_histories', 'bncc_skills', 'bncc_skill_assessments', 'school_units',
    'user_accounts', 'communications', 'notifications', 'whatsapp_messages',
    'school_settings', 'system_updates'
  ];
begin
  foreach t in array synced loop
    execute format('alter table public.%I add column if not exists doc jsonb', t);
    execute format('alter table public.%I add column if not exists row_version bigint not null default 1', t);
    execute format('alter table public.%I add column if not exists base_version bigint', t);
    execute format('alter table public.%I add column if not exists server_updated_at timestamptz not null default clock_timestamp()', t);
    execute format('create index if not exists %I on public.%I (server_updated_at)', t || '_server_updated_at_idx', t);

    execute format('drop trigger if exists trg_sync_guard on public.%I', t);
    execute format('create trigger trg_sync_guard before insert or update on public.%I for each row execute function public.sync_guard()', t);

    -- Lápides: exclusão registrada e recriação por cópia antiga bloqueada.
    execute format('drop trigger if exists trg_tombstone_on_delete on public.%I', t);
    execute format('create trigger trg_tombstone_on_delete after delete on public.%I for each row execute function public.tombstone_on_delete()', t);
    execute format('drop trigger if exists trg_block_tombstoned on public.%I', t);
    execute format('create trigger trg_block_tombstoned before insert on public.%I for each row execute function public.block_tombstoned()', t);
  end loop;
end $$;

create index if not exists deleted_records_deleted_at_idx on public.deleted_records (deleted_at);

-- -----------------------------------------------------------------------------
-- app_records: coleções sem tabela própria (uma linha por registro) e cadastros
-- únicos (collection = '__singleton', id = nome do cadastro).
-- -----------------------------------------------------------------------------
create table if not exists public.app_records (
  collection text not null,
  id text not null,
  doc jsonb,
  row_version bigint not null default 1,
  base_version bigint,
  server_updated_at timestamptz not null default clock_timestamp(),
  primary key (collection, id)
);
create index if not exists app_records_server_updated_at_idx on public.app_records (server_updated_at);

create or replace function public.app_records_tombstone()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.deleted_records(table_name, record_id)
  values ('app_records', OLD.collection || '/' || OLD.id)
  on conflict (table_name, record_id) do update set deleted_at = now();
  return OLD;
end $$;

create or replace function public.app_records_block_tombstoned()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (
    select 1 from public.deleted_records d
    where d.table_name = 'app_records' and d.record_id = NEW.collection || '/' || NEW.id
  ) then
    return null;
  end if;
  return NEW;
end $$;

drop trigger if exists trg_sync_guard on public.app_records;
create trigger trg_sync_guard before insert or update on public.app_records
  for each row execute function public.sync_guard();
drop trigger if exists trg_tombstone_on_delete on public.app_records;
create trigger trg_tombstone_on_delete after delete on public.app_records
  for each row execute function public.app_records_tombstone();
drop trigger if exists trg_block_tombstoned on public.app_records;
create trigger trg_block_tombstoned before insert on public.app_records
  for each row execute function public.app_records_block_tombstoned();

alter table public.app_records enable row level security;
drop policy if exists staff_select on public.app_records;
drop policy if exists staff_insert on public.app_records;
drop policy if exists staff_update on public.app_records;
drop policy if exists admin_delete on public.app_records;
create policy staff_select on public.app_records for select to authenticated using (public.is_staff());
create policy staff_insert on public.app_records for insert to authenticated with check (public.is_staff());
create policy staff_update on public.app_records for update to authenticated using (public.is_staff()) with check (public.is_staff());
create policy admin_delete on public.app_records for delete to authenticated using (public.is_admin());
grant select, insert, update, delete on public.app_records to authenticated;
