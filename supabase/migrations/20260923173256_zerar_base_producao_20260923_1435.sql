-- JÁ APLICADA no projeto cdxvhxqpixtbycghfsre (produção). Mantida no repositório
-- apenas para o histórico de migrações ficar igual ao do banco. NÃO executar manualmente.

-- Base zerada para início dos testes em produção (pedido de Leandro, 23/09/2026 14:29).
-- Cópia antes da limpeza: schema backup_20260923_1435.
create schema if not exists backup_20260923_1435;
revoke all on schema backup_20260923_1435 from public, anon, authenticated;
do $$
declare t record;
begin
  for t in select tablename from pg_tables where schemaname = 'public' loop
    execute format('create table backup_20260923_1435.%I as table public.%I', t.tablename, t.tablename);
  end loop;
end $$;
revoke all on all tables in schema backup_20260923_1435 from public, anon, authenticated;

delete from public.exam_submissions;
delete from public.exams;
delete from public.questions;
delete from public.students;
delete from public.notifications;
delete from public.communications;
delete from public.attendance_sheets;
delete from public.lesson_registries;
delete from public.class_grade_sheets;
delete from public.academic_histories;
delete from public.sync_audit_logs;
delete from public.media_assets;
delete from public.school_classes;
delete from public.subjects;
delete from public.user_accounts where id <> 'user-master-01';
update public.user_accounts set school_unit_id = null;
delete from public.school_units;
