-- JÁ APLICADA no projeto cdxvhxqpixtbycghfsre (produção). Mantida no repositório
-- apenas para o histórico de migrações ficar igual ao do banco. NÃO executar manualmente.

-- Remove registros de teste reenviados pelo app antigo do AI Studio (pedido de Leandro, 23/09 15:00).
create schema if not exists backup_20260923_1505;
revoke all on schema backup_20260923_1505 from public, anon, authenticated;
create table backup_20260923_1505.students as table public.students;
create table backup_20260923_1505.exams as table public.exams;
create table backup_20260923_1505.notifications as table public.notifications;
revoke all on all tables in schema backup_20260923_1505 from public, anon, authenticated;
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
delete from public.school_classes;
delete from public.subjects;
delete from public.school_units;
delete from public.user_accounts where id <> 'user-master-01';
