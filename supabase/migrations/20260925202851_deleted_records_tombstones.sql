-- Registros excluídos (provas, correções e questões) não podem ser recriados por cópias antigas de outros computadores.
create table if not exists public.deleted_records (
  table_name text not null,
  record_id text not null,
  deleted_at timestamptz not null default now(),
  primary key (table_name, record_id)
);
alter table public.deleted_records enable row level security;
drop policy if exists staff_select on public.deleted_records;
create policy staff_select on public.deleted_records for select to authenticated using (is_staff());

create or replace function public.tombstone_on_delete() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.deleted_records(table_name, record_id) values (TG_TABLE_NAME, OLD.id::text)
  on conflict (table_name, record_id) do update set deleted_at = now();
  return OLD;
end $$;

create or replace function public.block_tombstoned() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if exists (select 1 from public.deleted_records d where d.table_name = TG_TABLE_NAME and d.record_id = NEW.id::text) then
    return null; -- ignora a recriação silenciosamente
  end if;
  return NEW;
end $$;

do $$
declare t text;
begin
  foreach t in array array['exams','exam_submissions','questions'] loop
    execute format('drop trigger if exists trg_tombstone_on_delete on public.%I', t);
    execute format('create trigger trg_tombstone_on_delete after delete on public.%I for each row execute function public.tombstone_on_delete()', t);
    execute format('drop trigger if exists trg_block_tombstoned on public.%I', t);
    execute format('create trigger trg_block_tombstoned before insert on public.%I for each row execute function public.block_tombstoned()', t);
  end loop;
end $$;
