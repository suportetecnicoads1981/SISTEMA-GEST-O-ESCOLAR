-- Escolas excluídas de propósito (ex.: cópia duplicada de importação). Registros que
-- ainda chegarem de computadores com dados antigos para essas escolas são ignorados.
create table if not exists public.deleted_school_units (
  id text primary key,
  reason text,
  deleted_at timestamptz not null default now()
);
alter table public.deleted_school_units enable row level security;

create or replace function public.skip_rows_of_deleted_units()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.school_unit_id is not null
     and exists (select 1 from public.deleted_school_units d where d.id = new.school_unit_id) then
    return null; -- ignora a linha sem erro (não trava o lote)
  end if;
  return new;
end;
$$;

drop trigger if exists trg_skip_deleted_units_students on public.students;
create trigger trg_skip_deleted_units_students
  before insert or update on public.students
  for each row execute function public.skip_rows_of_deleted_units();

drop trigger if exists trg_skip_deleted_units_classes on public.school_classes;
create trigger trg_skip_deleted_units_classes
  before insert or update on public.school_classes
  for each row execute function public.skip_rows_of_deleted_units();

insert into public.deleted_school_units (id, reason)
values ('unit-imp-1790257373872-6y0hp', 'Cópia duplicada da EMIEIF ERMINIO BRITO (importação com erro de 24/09/2026)')
on conflict (id) do nothing;
