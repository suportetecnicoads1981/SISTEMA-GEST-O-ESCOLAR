-- JÁ APLICADA no projeto cdxvhxqpixtbycghfsre (produção). Mantida no repositório
-- apenas para o histórico de migrações ficar igual ao do banco. NÃO executar manualmente.

-- Papel do usuário autenticado, definido em app_metadata (somente o administrador/service role pode alterar).
create or replace function public.current_app_role()
returns text
language sql
stable
set search_path = ''
as $$
  select coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '')
$$;

create or replace function public.is_staff()
returns boolean
language sql
stable
set search_path = ''
as $$
  select public.current_app_role() in ('ADMIN', 'TEACHER')
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
set search_path = ''
as $$
  select public.current_app_role() = 'ADMIN'
$$;

-- Tabelas pedagógicas: equipe (ADMIN/TEACHER) lê e grava; somente ADMIN exclui.
do $$
declare
  t text;
begin
  foreach t in array array[
    'students','school_classes','subjects','courses','questions','exams','exam_submissions',
    'attendance_sheets','lesson_registries','class_grade_sheets','academic_histories',
    'communications','notifications','sync_audit_logs','media_assets'
  ]
  loop
    execute format('create policy staff_select on public.%I for select to authenticated using (public.is_staff())', t);
    execute format('create policy staff_insert on public.%I for insert to authenticated with check (public.is_staff())', t);
    execute format('create policy staff_update on public.%I for update to authenticated using (public.is_staff()) with check (public.is_staff())', t);
    execute format('create policy admin_delete on public.%I for delete to authenticated using (public.is_admin())', t);
  end loop;

  -- Tabelas administrativas: equipe lê; somente ADMIN grava e exclui.
  foreach t in array array['user_accounts','school_units','school_settings','system_updates','role_preferences']
  loop
    execute format('create policy staff_select on public.%I for select to authenticated using (public.is_staff())', t);
    execute format('create policy admin_insert on public.%I for insert to authenticated with check (public.is_admin())', t);
    execute format('create policy admin_update on public.%I for update to authenticated using (public.is_admin()) with check (public.is_admin())', t);
    execute format('create policy admin_delete on public.%I for delete to authenticated using (public.is_admin())', t);
  end loop;
end $$;
