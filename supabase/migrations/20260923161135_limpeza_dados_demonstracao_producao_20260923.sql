-- JÁ APLICADA no projeto cdxvhxqpixtbycghfsre (produção). Mantida no repositório
-- apenas para o histórico de migrações ficar igual ao do banco. NÃO executar manualmente.

-- Limpeza para início dos testes de produção (autorizada por Leandro em 23/09/2026).
-- Mantidos: conta ADMIN (user-master-01), school_settings, school_classes, subjects,
-- courses (níveis de ensino), role_preferences e system_updates (configuração).
-- Cópia integral anterior: schema backup_20260923_pre_producao.
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
delete from public.user_accounts where id <> 'user-master-01';
update public.user_accounts set school_unit_id = null where id = 'user-master-01';
update public.school_classes set school_unit_id = null;
delete from public.school_units;
