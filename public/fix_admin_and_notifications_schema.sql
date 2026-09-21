-- =========================================================================
-- SUCESSOEDU GESTÃO EDUCACIONAL - SCRIPT DE CORREÇÃO E INTEGRIDADE SQL
-- DIAGNÓSTICO E CORREÇÃO: "TypeError: Cannot read properties of undefined (reading 'ADMIN')"
-- AMBIENTE: PostgreSQL / Supabase
-- =========================================================================

-- 1. Habilita extensões UUID e Criptografia (se não habilitadas)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =========================================================================
-- 2. TABELA DE CONTAS DE USUÁRIOS (user_accounts) E USUÁRIO MASTER ADMIN
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.user_accounts (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    name TEXT NOT NULL,
    login TEXT UNIQUE NOT NULL,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'ADMIN',
    sector TEXT DEFAULT 'MASTER',
    sector_title TEXT,
    active BOOLEAN DEFAULT TRUE,
    permissions JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Assegura as colunas com tipagem correta
ALTER TABLE public.user_accounts ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'ADMIN';
ALTER TABLE public.user_accounts ADD COLUMN IF NOT EXISTS sector TEXT DEFAULT 'MASTER';
ALTER TABLE public.user_accounts ADD COLUMN IF NOT EXISTS sector_title TEXT;
ALTER TABLE public.user_accounts ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT TRUE;
ALTER TABLE public.user_accounts ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{}'::jsonb;

-- Corrige contas que possam ter ficado com role nulo
UPDATE public.user_accounts 
SET role = 'ADMIN' 
WHERE role IS NULL OR TRIM(role) = '';

-- Insere ou atualiza o usuário Administrador Master ADS padrão
INSERT INTO public.user_accounts (id, name, login, email, role, sector, sector_title, active, permissions)
VALUES (
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
    active = TRUE,
    sector = 'MASTER';

-- =========================================================================
-- 3. TABELA DE NOTIFICAÇÕES (notifications) & COMPATIBILIDADE DE CAMPOS
-- Corrige a falta de 'targetRoles' e 'target_roles'
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.notifications (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'IMPORTANT_ANNOUNCEMENT',
    priority TEXT DEFAULT 'NORMAL',
    read BOOLEAN DEFAULT FALSE,
    action_tab TEXT,
    target_roles JSONB DEFAULT '["ADMIN", "TEACHER", "STUDENT", "PARENT"]'::jsonb,
    action_payload JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Garante suporte a ambas as convenções (snake_case e camelCase)
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS target_roles JSONB DEFAULT '["ADMIN", "TEACHER", "STUDENT", "PARENT"]'::jsonb;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS "targetRoles" JSONB DEFAULT '["ADMIN", "TEACHER", "STUDENT", "PARENT"]'::jsonb;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS action_payload JSONB;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS "actionPayload" JSONB;

-- Saneia qualquer registro pré-existente com valores nulos
UPDATE public.notifications 
SET target_roles = '["ADMIN", "TEACHER", "STUDENT", "PARENT"]'::jsonb 
WHERE target_roles IS NULL;

UPDATE public.notifications 
SET "targetRoles" = '["ADMIN", "TEACHER", "STUDENT", "PARENT"]'::jsonb 
WHERE "targetRoles" IS NULL;

-- =========================================================================
-- 4. TABELA DE COMUNICADOS E AVISOS (communications)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.communications (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    sender_role TEXT DEFAULT 'ADMIN',
    sender_name TEXT NOT NULL,
    recipient_type TEXT DEFAULT 'ALL',
    priority TEXT DEFAULT 'NORMAL',
    category TEXT DEFAULT 'GERAL',
    status TEXT DEFAULT 'ENVIADO',
    target_roles JSONB DEFAULT '["ADMIN", "TEACHER", "STUDENT", "PARENT"]'::jsonb,
    read_confirmations JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.communications ADD COLUMN IF NOT EXISTS sender_role TEXT DEFAULT 'ADMIN';
ALTER TABLE public.communications ADD COLUMN IF NOT EXISTS "senderRole" TEXT DEFAULT 'ADMIN';
ALTER TABLE public.communications ADD COLUMN IF NOT EXISTS target_roles JSONB DEFAULT '["ADMIN", "TEACHER", "STUDENT", "PARENT"]'::jsonb;
ALTER TABLE public.communications ADD COLUMN IF NOT EXISTS "targetRoles" JSONB DEFAULT '["ADMIN", "TEACHER", "STUDENT", "PARENT"]'::jsonb;

UPDATE public.communications 
SET sender_role = 'ADMIN' 
WHERE sender_role IS NULL;

-- =========================================================================
-- 5. TABELA DE PREFERÊNCIAS DE NOTIFICAÇÃO (role_preferences)
-- Garante que o perfil 'ADMIN' e os demais estejam sempre configurados
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.role_preferences (
    role TEXT PRIMARY KEY,
    channels JSONB NOT NULL DEFAULT '{"inApp": true, "browserPush": true, "email": true, "smsWhatsapp": true}'::jsonb,
    categories JSONB NOT NULL DEFAULT '{"enrollmentStatus": true, "examAvailable": true, "deadlines": true, "examResults": true, "announcements": true, "directMessages": true}'::jsonb,
    sound_enabled BOOLEAN DEFAULT TRUE,
    quiet_hours JSONB DEFAULT '{"enabled": false, "start": "22:00", "end": "07:00"}'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Upsert idempotente de todos os perfis obrigatórios
INSERT INTO public.role_preferences (role, channels, categories, sound_enabled, quiet_hours)
VALUES 
  ('ADMIN', 
   '{"inApp": true, "browserPush": true, "email": true, "smsWhatsapp": true}'::jsonb, 
   '{"enrollmentStatus": true, "examAvailable": true, "deadlines": true, "examResults": true, "announcements": true, "directMessages": true}'::jsonb, 
   TRUE, 
   '{"enabled": false, "start": "22:00", "end": "07:00"}'::jsonb
  ),
  ('TEACHER', 
   '{"inApp": true, "browserPush": true, "email": true, "smsWhatsapp": false}'::jsonb, 
   '{"enrollmentStatus": false, "examAvailable": true, "deadlines": true, "examResults": true, "announcements": true, "directMessages": true}'::jsonb, 
   TRUE, 
   '{"enabled": true, "start": "21:00", "end": "07:30"}'::jsonb
  ),
  ('STUDENT', 
   '{"inApp": true, "browserPush": true, "email": true, "smsWhatsapp": false}'::jsonb, 
   '{"enrollmentStatus": true, "examAvailable": true, "deadlines": true, "examResults": true, "announcements": true, "directMessages": true}'::jsonb, 
   TRUE, 
   '{"enabled": true, "start": "22:00", "end": "07:00"}'::jsonb
  ),
  ('PARENT', 
   '{"inApp": true, "browserPush": true, "email": true, "smsWhatsapp": true}'::jsonb, 
   '{"enrollmentStatus": true, "examAvailable": true, "deadlines": true, "examResults": true, "announcements": true, "directMessages": true}'::jsonb, 
   TRUE, 
   '{"enabled": true, "start": "22:00", "end": "07:00"}'::jsonb
  )
ON CONFLICT (role) DO UPDATE SET
  channels = EXCLUDED.channels,
  categories = EXCLUDED.categories,
  sound_enabled = EXCLUDED.sound_enabled,
  quiet_hours = EXCLUDED.quiet_hours,
  updated_at = NOW();

-- =========================================================================
-- 6. PERMISSÕES DE ACESSO E POLÍTICAS RLS (Row Level Security)
-- =========================================================================
ALTER TABLE public.user_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_preferences ENABLE ROW LEVEL SECURITY;

-- Políticas de Leitura e Escrita Públicas/Autenticadas
DROP POLICY IF EXISTS "user_accounts_all_read" ON public.user_accounts;
CREATE POLICY "user_accounts_all_read" ON public.user_accounts FOR SELECT USING (true);
DROP POLICY IF EXISTS "user_accounts_all_write" ON public.user_accounts;
CREATE POLICY "user_accounts_all_write" ON public.user_accounts FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "notifs_all_read" ON public.notifications;
CREATE POLICY "notifs_all_read" ON public.notifications FOR SELECT USING (true);
DROP POLICY IF EXISTS "notifs_all_write" ON public.notifications;
CREATE POLICY "notifs_all_write" ON public.notifications FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "comms_all_read" ON public.communications;
CREATE POLICY "comms_all_read" ON public.communications FOR SELECT USING (true);
DROP POLICY IF EXISTS "comms_all_write" ON public.communications;
CREATE POLICY "comms_all_write" ON public.communications FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "role_prefs_all_read" ON public.role_preferences;
CREATE POLICY "role_prefs_all_read" ON public.role_preferences FOR SELECT USING (true);
DROP POLICY IF EXISTS "role_prefs_all_write" ON public.role_preferences;
CREATE POLICY "role_prefs_all_write" ON public.role_preferences FOR ALL USING (true) WITH CHECK (true);

-- =========================================================================
-- 7. CONSULTA DE DIAGNÓSTICO FINAL E VALIDAÇÃO DE INTEGRIDADE
-- =========================================================================
SELECT 
    'user_accounts' AS tabela, 
    count(*) AS total_registros,
    count(*) FILTER (WHERE role = 'ADMIN') AS total_admins
FROM public.user_accounts
UNION ALL
SELECT 
    'role_preferences' AS tabela, 
    count(*) AS total_registros,
    count(*) FILTER (WHERE role = 'ADMIN') AS total_admins
FROM public.role_preferences
UNION ALL
SELECT 
    'notifications' AS tabela, 
    count(*) AS total_registros,
    count(*) FILTER (WHERE target_roles IS NOT NULL) AS com_target_roles
FROM public.notifications;
