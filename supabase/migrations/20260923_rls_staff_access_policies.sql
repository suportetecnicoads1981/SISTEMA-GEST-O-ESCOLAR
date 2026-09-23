-- ===================================================================
-- Políticas de acesso (RLS) do SucessoEdu — JÁ APLICADA no projeto
-- cdxvhxqpixtbycghfsre em 23/09/2026. Mantida aqui como registro.
--
-- Regras:
--  * Nenhum acesso para a chave pública (anon): os dados dos alunos não
--    ficam expostos a quem abrir o aplicativo sem login.
--  * Usuários autenticados com app_metadata.role = ADMIN ou TEACHER
--    (definido somente pelo administrador) leem e gravam dados pedagógicos.
--  * Tabelas administrativas: equipe lê, somente ADMIN grava.
--  * Exclusões: somente ADMIN.
-- ===================================================================

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

  foreach t in array array['user_accounts','school_units','school_settings','system_updates','role_preferences']
  loop
    execute format('create policy staff_select on public.%I for select to authenticated using (public.is_staff())', t);
    execute format('create policy admin_insert on public.%I for insert to authenticated with check (public.is_admin())', t);
    execute format('create policy admin_update on public.%I for update to authenticated using (public.is_admin()) with check (public.is_admin())', t);
    execute format('create policy admin_delete on public.%I for delete to authenticated using (public.is_admin())', t);
  end loop;
end $$;

-- Privilégios de tabela para usuários autenticados (as políticas acima filtram as
-- linhas e operações). O papel anon continua sem nenhum acesso.
grant usage on schema public to authenticated;
grant select, insert, update, delete on
  public.students, public.school_classes, public.subjects, public.courses, public.questions,
  public.exams, public.exam_submissions, public.attendance_sheets, public.lesson_registries,
  public.class_grade_sheets, public.academic_histories, public.communications, public.notifications,
  public.sync_audit_logs, public.media_assets, public.user_accounts, public.school_units,
  public.school_settings, public.system_updates, public.role_preferences
to authenticated;
grant execute on function public.current_app_role(), public.is_staff(), public.is_admin() to authenticated;
