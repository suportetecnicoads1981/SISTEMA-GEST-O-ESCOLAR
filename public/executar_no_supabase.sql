-- ⚠️  ATENÇÃO: NÃO EXECUTE ESTE SCRIPT NO PROJETO ATUAL.
-- Ele cria políticas USING (true), que deixam os dados dos alunos acessíveis a
-- qualquer pessoa com a chave pública do aplicativo (violação da LGPD).
-- As políticas corretas estão em supabase/migrations/20260923_rls_staff_access_policies.sql

-- =============================================================================
-- SUCESSOEDU & SUPABASE: SCRIPT COMPLETO DE AUDITORIA, VERIFICAÇÃO E CORREÇÃO
-- 100% IDEMPOTENTE E DEFENSIVO (Executa com sucesso mesmo em tabelas existentes)
-- Execute no SQL Editor do Supabase (Dashboard -> SQL Editor -> New Query)
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- PARTE 1: VERIFICAÇÃO E CORREÇÃO DA TABELA DE USUÁRIOS (user_accounts)
-- Garante que exista role, active, sector, permissions e o perfil ADMIN Master
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.user_accounts (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    name TEXT NOT NULL,
    login TEXT UNIQUE NOT NULL,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'ADMIN',
    sector TEXT DEFAULT 'MASTER',
    sector_title TEXT,
    active BOOLEAN DEFAULT TRUE,
    permissions JSONB DEFAULT '{"ALL": true}'::jsonb,
    school_unit_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Adiciona colunas defensivamente caso a tabela já existisse sem elas
ALTER TABLE public.user_accounts ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'ADMIN';
ALTER TABLE public.user_accounts ADD COLUMN IF NOT EXISTS sector TEXT DEFAULT 'MASTER';
ALTER TABLE public.user_accounts ADD COLUMN IF NOT EXISTS sector_title TEXT;
ALTER TABLE public.user_accounts ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT TRUE;
ALTER TABLE public.user_accounts ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{"ALL": true}'::jsonb;
ALTER TABLE public.user_accounts ADD COLUMN IF NOT EXISTS school_unit_id TEXT;
ALTER TABLE public.user_accounts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Corrige quaisquer registros antigos onde role estava NULL ou vazio
UPDATE public.user_accounts 
SET role = 'ADMIN' 
WHERE role IS NULL OR TRIM(role) = '' OR role NOT IN ('ADMIN', 'TEACHER', 'STUDENT', 'PARENT');

-- Garante o usuário Administrador Master ADS
INSERT INTO public.user_accounts (
    id, name, login, email, role, sector, sector_title, active, permissions
) VALUES (
    'usr-master-001',
    'Administrador Master ADS',
    'master',
    'suportetecnicoads@gmail.com',
    'ADMIN',
    'MASTER',
    'Administrador de Infraestrutura & Engenheiro de Software',
    TRUE,
    '{"ALL": true}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
    role = 'ADMIN',
    email = 'suportetecnicoads@gmail.com',
    active = TRUE,
    sector = 'MASTER',
    permissions = '{"ALL": true}'::jsonb,
    updated_at = NOW();

-- =============================================================================
-- PARTE 2: TABELA DE PREFERÊNCIAS DE NOTIFICAÇÃO POR PAPEL (role_preferences)
-- Impede o erro de leitura de 'ADMIN' persistindo a estrutura completa
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.role_preferences (
    role TEXT PRIMARY KEY,
    channels JSONB NOT NULL DEFAULT '{"inApp": true, "browserPush": true, "email": true, "smsWhatsapp": true}'::jsonb,
    categories JSONB NOT NULL DEFAULT '{"enrollmentStatus": true, "examAvailable": true, "deadlines": true, "examResults": true, "announcements": true, "directMessages": true}'::jsonb,
    sound_enabled BOOLEAN DEFAULT TRUE,
    quiet_hours JSONB DEFAULT '{"enabled": false, "start": "22:00", "end": "07:00"}'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Popula ou atualiza todas as 4 roles (ADMIN, TEACHER, STUDENT, PARENT) com as preferências completas
INSERT INTO public.role_preferences (role, channels, categories, sound_enabled, quiet_hours)
VALUES 
  (
    'ADMIN',
    '{"inApp": true, "browserPush": true, "email": true, "smsWhatsapp": true}'::jsonb,
    '{"enrollmentStatus": true, "examAvailable": true, "deadlines": true, "examResults": true, "announcements": true, "directMessages": true}'::jsonb,
    true,
    '{"enabled": false, "start": "22:00", "end": "07:00"}'::jsonb
  ),
  (
    'TEACHER',
    '{"inApp": true, "browserPush": true, "email": true, "smsWhatsapp": false}'::jsonb,
    '{"enrollmentStatus": false, "examAvailable": true, "deadlines": true, "examResults": true, "announcements": true, "directMessages": true}'::jsonb,
    true,
    '{"enabled": true, "start": "21:00", "end": "07:30"}'::jsonb
  ),
  (
    'STUDENT',
    '{"inApp": true, "browserPush": true, "email": true, "smsWhatsapp": false}'::jsonb,
    '{"enrollmentStatus": true, "examAvailable": true, "deadlines": true, "examResults": true, "announcements": true, "directMessages": true}'::jsonb,
    true,
    '{"enabled": true, "start": "22:00", "end": "07:00"}'::jsonb
  ),
  (
    'PARENT',
    '{"inApp": true, "browserPush": true, "email": true, "smsWhatsapp": true}'::jsonb,
    '{"enrollmentStatus": true, "examAvailable": true, "deadlines": true, "examResults": true, "announcements": true, "directMessages": true}'::jsonb,
    true,
    '{"enabled": true, "start": "22:00", "end": "07:00"}'::jsonb
  )
ON CONFLICT (role) DO UPDATE SET
  channels = EXCLUDED.channels,
  categories = EXCLUDED.categories,
  sound_enabled = EXCLUDED.sound_enabled,
  quiet_hours = EXCLUDED.quiet_hours,
  updated_at = NOW();

-- =============================================================================
-- PARTE 3: VERIFICAÇÃO E CORREÇÃO DA TABELA DE NOTIFICAÇÕES (notifications)
-- Suporta snake_case e camelCase nas colunas JSON de papéis e payload
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.notifications (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'IMPORTANT_ANNOUNCEMENT',
    priority TEXT DEFAULT 'NORMAL',
    read BOOLEAN DEFAULT FALSE,
    action_tab TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Adiciona colunas ausentes sem falhas de tipo
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS target_roles JSONB DEFAULT '["ADMIN", "TEACHER", "STUDENT", "PARENT"]'::jsonb;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS "targetRoles" JSONB DEFAULT '["ADMIN", "TEACHER", "STUDENT", "PARENT"]'::jsonb;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS action_payload JSONB;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS "actionPayload" JSONB;

-- Saneia dados de notificações existentes onde target_roles está nulo
UPDATE public.notifications 
SET target_roles = '["ADMIN", "TEACHER", "STUDENT", "PARENT"]'::jsonb 
WHERE target_roles IS NULL;

UPDATE public.notifications 
SET "targetRoles" = '["ADMIN", "TEACHER", "STUDENT", "PARENT"]'::jsonb 
WHERE "targetRoles" IS NULL;

-- =============================================================================
-- PARTE 4: VERIFICAÇÃO E CORREÇÃO DA TABELA DE COMUNICADOS (communications)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.communications (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    sender_name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.communications ADD COLUMN IF NOT EXISTS sender_role TEXT DEFAULT 'ADMIN';
ALTER TABLE public.communications ADD COLUMN IF NOT EXISTS "senderRole" TEXT DEFAULT 'ADMIN';
ALTER TABLE public.communications ADD COLUMN IF NOT EXISTS recipient_type TEXT DEFAULT 'ALL';
ALTER TABLE public.communications ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'NORMAL';
ALTER TABLE public.communications ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'GERAL';
ALTER TABLE public.communications ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'ENVIADO';
ALTER TABLE public.communications ADD COLUMN IF NOT EXISTS target_roles JSONB DEFAULT '["ADMIN", "TEACHER", "STUDENT", "PARENT"]'::jsonb;
ALTER TABLE public.communications ADD COLUMN IF NOT EXISTS "targetRoles" JSONB DEFAULT '["ADMIN", "TEACHER", "STUDENT", "PARENT"]'::jsonb;
ALTER TABLE public.communications ADD COLUMN IF NOT EXISTS read_confirmations JSONB DEFAULT '[]'::jsonb;

UPDATE public.communications 
SET sender_role = 'ADMIN' 
WHERE sender_role IS NULL;

UPDATE public.communications 
SET "senderRole" = 'ADMIN' 
WHERE "senderRole" IS NULL;

-- =============================================================================
-- PARTE 5: CONFIGURAÇÕES ESCOLARES (school_settings)
-- Adiciona defensivamente todas as colunas possíveis antes de qualquer inserção
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.school_settings (
    id TEXT PRIMARY KEY DEFAULT 'school_settings_main',
    name TEXT NOT NULL DEFAULT 'Escola Municipal SucessoEdu',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Adiciona todas as colunas com IF NOT EXISTS para prevenir erros de tabela preexistente
ALTER TABLE public.school_settings ADD COLUMN IF NOT EXISTS trade_name TEXT;
ALTER TABLE public.school_settings ADD COLUMN IF NOT EXISTS inep_code TEXT DEFAULT '35128490';
ALTER TABLE public.school_settings ADD COLUMN IF NOT EXISTS cnpj TEXT;
ALTER TABLE public.school_settings ADD COLUMN IF NOT EXISTS accreditation_decree TEXT;
ALTER TABLE public.school_settings ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.school_settings ADD COLUMN IF NOT EXISTS neighborhood TEXT;
ALTER TABLE public.school_settings ADD COLUMN IF NOT EXISTS city TEXT DEFAULT 'São Paulo';
ALTER TABLE public.school_settings ADD COLUMN IF NOT EXISTS state TEXT DEFAULT 'SP';
ALTER TABLE public.school_settings ADD COLUMN IF NOT EXISTS zip_code TEXT;
ALTER TABLE public.school_settings ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.school_settings ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.school_settings ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE public.school_settings ADD COLUMN IF NOT EXISTS principal_name TEXT;
ALTER TABLE public.school_settings ADD COLUMN IF NOT EXISTS principal_title TEXT;
ALTER TABLE public.school_settings ADD COLUMN IF NOT EXISTS secretary_name TEXT;
ALTER TABLE public.school_settings ADD COLUMN IF NOT EXISTS secretary_registration TEXT;
ALTER TABLE public.school_settings ADD COLUMN IF NOT EXISTS system_version TEXT DEFAULT 'v5.4.2-ENTERPRISE';
ALTER TABLE public.school_settings ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE public.school_settings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Inserção segura apenas nos campos base garantidos
INSERT INTO public.school_settings (id, name)
VALUES ('school_settings_main', 'Escola Municipal SucessoEdu')
ON CONFLICT (id) DO UPDATE SET
    name = COALESCE(public.school_settings.name, 'Escola Municipal SucessoEdu'),
    system_version = 'v5.4.2-ENTERPRISE',
    updated_at = NOW();

-- =============================================================================
-- PARTE 6: CRIAÇÃO DEFENSIVA DE DEMAIS TABELAS DO ECOSSISTEMA
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.students (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    name TEXT NOT NULL,
    registration_number TEXT,
    status TEXT DEFAULT 'ACTIVE',
    class_id TEXT,
    birth_date TEXT,
    cpf TEXT,
    rg TEXT,
    parent_name TEXT,
    parent_contact TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.school_classes (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    name TEXT NOT NULL,
    grade TEXT,
    shift TEXT DEFAULT 'MATUTINO',
    academic_year INTEGER DEFAULT 2026,
    capacity INTEGER DEFAULT 35,
    max_capacity INTEGER DEFAULT 35,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.subjects (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    name TEXT NOT NULL,
    code TEXT,
    workload_hours INTEGER DEFAULT 80,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.courses (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    name TEXT NOT NULL,
    level TEXT DEFAULT 'ENSINO_FUNDAMENTAL',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.questions (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    title TEXT,
    enunciation TEXT NOT NULL,
    discipline TEXT NOT NULL,
    difficulty TEXT DEFAULT 'MEDIUM',
    type TEXT DEFAULT 'MULTIPLE_CHOICE',
    options JSONB,
    correct_answer TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.exams (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    title TEXT NOT NULL,
    discipline TEXT,
    duration_minutes INTEGER DEFAULT 60,
    status TEXT DEFAULT 'PUBLISHED',
    questions JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.exam_submissions (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    exam_id TEXT NOT NULL,
    student_id TEXT NOT NULL,
    answers JSONB,
    score NUMERIC(5,2),
    submitted_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.attendance_sheets (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    class_id TEXT NOT NULL,
    date DATE NOT NULL,
    records JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.lesson_registries (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    class_id TEXT NOT NULL,
    subject_id TEXT,
    date DATE NOT NULL,
    content TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.class_grade_sheets (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    class_id TEXT NOT NULL,
    subject_id TEXT,
    term TEXT,
    grades JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.academic_histories (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    student_id TEXT NOT NULL,
    records JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.school_units (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    name TEXT NOT NULL,
    code TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.sync_audit_logs (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    action TEXT NOT NULL,
    entity_name TEXT,
    status TEXT DEFAULT 'SUCCESS',
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- PARTE 7: ROW LEVEL SECURITY (RLS) - POLÍTICAS PERMISSIVAS PARA O APPLET
-- =============================================================================
DO $$
DECLARE
    tbl text;
    tables_list text[] := ARRAY[
        'user_accounts', 'role_preferences', 'notifications', 'communications',
        'school_settings', 'students', 'school_classes', 'subjects', 'courses',
        'questions', 'exams', 'exam_submissions', 'attendance_sheets',
        'lesson_registries', 'class_grade_sheets', 'academic_histories',
        'school_units', 'sync_audit_logs'
    ];
BEGIN
    FOREACH tbl IN ARRAY tables_list LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', tbl);
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I;', tbl || '_policy_select', tbl);
        EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT USING (true);', tbl || '_policy_select', tbl);
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I;', tbl || '_policy_all', tbl);
        EXECUTE format('CREATE POLICY %I ON public.%I FOR ALL USING (true) WITH CHECK (true);', tbl || '_policy_all', tbl);
    END LOOP;
END $$;

-- =============================================================================
-- PARTE 8: CONSULTA DIAGNÓSTICA DE VALIDAÇÃO FINAL
-- =============================================================================
SELECT 
    'user_accounts' AS tabela, 
    COUNT(*)::text AS total_registros, 
    COUNT(*) FILTER (WHERE role = 'ADMIN')::text AS total_admins
FROM public.user_accounts
UNION ALL
SELECT 
    'role_preferences' AS tabela, 
    COUNT(*)::text AS total_registros, 
    COUNT(*) FILTER (WHERE role = 'ADMIN')::text AS total_admins
FROM public.role_preferences
UNION ALL
SELECT 
    'notifications' AS tabela, 
    COUNT(*)::text AS total_registros, 
    'OK' AS total_admins
FROM public.notifications
UNION ALL
SELECT 
    'school_settings' AS tabela, 
    COUNT(*)::text AS total_registros, 
    'OK' AS total_admins
FROM public.school_settings;
