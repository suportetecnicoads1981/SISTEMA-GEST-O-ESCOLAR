-- JÁ APLICADA no projeto cdxvhxqpixtbycghfsre (produção). Mantida no repositório
-- apenas para o histórico de migrações ficar igual ao do banco. NÃO executar manualmente.

-- Usuários autenticados precisam de privilégio de tabela; as políticas RLS
-- (is_staff / is_admin) continuam decidindo quais linhas e operações são permitidas.
-- O papel anon continua sem nenhum acesso.
grant usage on schema public to authenticated;
grant select, insert, update, delete on
  public.students, public.school_classes, public.subjects, public.courses, public.questions,
  public.exams, public.exam_submissions, public.attendance_sheets, public.lesson_registries,
  public.class_grade_sheets, public.academic_histories, public.communications, public.notifications,
  public.sync_audit_logs, public.media_assets, public.user_accounts, public.school_units,
  public.school_settings, public.system_updates, public.role_preferences
to authenticated;
grant execute on function public.current_app_role(), public.is_staff(), public.is_admin() to authenticated;
