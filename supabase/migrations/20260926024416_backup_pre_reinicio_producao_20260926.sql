-- Cópia de segurança antes do reinício da produção (26/09/2026).
-- Já aplicada no projeto; o arquivo registra a alteração no repositório.
create schema if not exists backup_20260926;
revoke all on schema backup_20260926 from public, anon, authenticated;
create table if not exists backup_20260926.school_units as table public.school_units;
create table if not exists backup_20260926.school_classes as table public.school_classes;
create table if not exists backup_20260926.students as table public.students;
create table if not exists backup_20260926.bncc_skill_assessments as table public.bncc_skill_assessments;
create table if not exists backup_20260926.exams as table public.exams;
create table if not exists backup_20260926.exam_submissions as table public.exam_submissions;
create table if not exists backup_20260926.whatsapp_messages as table public.whatsapp_messages;
create table if not exists backup_20260926.lotes_escolas as table public.lotes_escolas;
create table if not exists backup_20260926.user_accounts as table public.user_accounts;
create table if not exists backup_20260926.school_settings as table public.school_settings;
