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
