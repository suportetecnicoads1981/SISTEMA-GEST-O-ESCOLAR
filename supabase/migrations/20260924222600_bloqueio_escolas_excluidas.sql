-- =============================================================================
-- Escolas excluídas de propósito (24/09/2026)
--
-- Uma escola removida da nuvem (ex.: cópia duplicada de uma importação com erro)
-- pode "voltar" se algum computador ainda tiver dados antigos guardados e enviá-los.
-- Esta trava ignora, sem erro, qualquer escola, turma ou aluno que chegue para uma
-- escola listada em deleted_school_units. O restante do envio segue normalmente.
--
-- Para liberar uma escola novamente: DELETE FROM public.deleted_school_units WHERE id = '...';
-- (já aplicada no projeto em 24/09/2026; o arquivo registra a alteração no repositório)
-- =============================================================================

create table if not exists public.deleted_school_units (
  id text primary key,
  reason text,
  deleted_at timestamptz not null default now()
);
alter table public.deleted_school_units enable row level security;

-- Turmas e alunos de escola excluída
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

-- A própria escola excluída
create or replace function public.skip_deleted_school_unit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (select 1 from public.deleted_school_units d where d.id = new.id) then
    return null;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_skip_deleted_school_unit on public.school_units;
create trigger trg_skip_deleted_school_unit
  before insert or update on public.school_units
  for each row execute function public.skip_deleted_school_unit();

-- Cópia duplicada da EMIEIF ERMINIO BRITO criada pela importação com erro de 24/09/2026
insert into public.deleted_school_units (id, reason)
values ('unit-imp-1790257373872-6y0hp', 'Cópia duplicada da EMIEIF ERMINIO BRITO (importação com erro de 24/09/2026)')
on conflict (id) do nothing;
