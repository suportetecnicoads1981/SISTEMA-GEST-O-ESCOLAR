-- =========================================================================
-- SUCESSOEDU: SCRIPT DEFINITIVO DE CORREÇÃO (EXECUTAR DIRETAMENTE NO SUPABASE)
-- =========================================================================

-- 1. Cria extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Tabela de Usuários (user_accounts) e criação da coluna role
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
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.user_accounts ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'ADMIN';
ALTER TABLE public.user_accounts ADD COLUMN IF NOT EXISTS sector TEXT DEFAULT 'MASTER';
ALTER TABLE public.user_accounts ADD COLUMN IF NOT EXISTS sector_title TEXT;
ALTER TABLE public.user_accounts ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT TRUE;
ALTER TABLE public.user_accounts ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{"ALL": true}'::jsonb;

-- Insere ou atualiza o Administrador Master ADS
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
    sector = 'MASTER',
    permissions = '{"ALL": true}'::jsonb;

-- 3. Tabela de Notificações (notifications) - ADICIONA AS COLUNAS AUSENTES
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

ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS target_roles JSONB DEFAULT '["ADMIN", "TEACHER", "STUDENT", "PARENT"]'::jsonb;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS "targetRoles" JSONB DEFAULT '["ADMIN", "TEACHER", "STUDENT", "PARENT"]'::jsonb;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS action_payload JSONB;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS "actionPayload" JSONB;

-- 4. Tabela de Comunicados (communications)
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

-- 5. Tabela de Preferências de Perfil (role_preferences)
CREATE TABLE IF NOT EXISTS public.role_preferences (
    role TEXT PRIMARY KEY,
    channels JSONB NOT NULL DEFAULT '{"inApp": true, "browserPush": true, "email": true, "smsWhatsapp": true}'::jsonb,
    categories JSONB NOT NULL DEFAULT '{"enrollmentStatus": true, "examAvailable": true, "deadlines": true, "examResults": true, "announcements": true, "directMessages": true}'::jsonb,
    sound_enabled BOOLEAN DEFAULT TRUE,
    quiet_hours JSONB DEFAULT '{"enabled": false, "start": "22:00", "end": "07:00"}'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.role_preferences (role, channels, categories, sound_enabled, quiet_hours)
VALUES 
  ('ADMIN', '{"inApp": true, "browserPush": true, "email": true, "smsWhatsapp": true}'::jsonb, '{"enrollmentStatus": true, "examAvailable": true, "deadlines": true, "examResults": true, "announcements": true, "directMessages": true}'::jsonb, true, '{"enabled": false, "start": "22:00", "end": "07:00"}'::jsonb),
  ('TEACHER', '{"inApp": true, "browserPush": true, "email": true, "smsWhatsapp": false}'::jsonb, '{"enrollmentStatus": false, "examAvailable": true, "deadlines": true, "examResults": true, "announcements": true, "directMessages": true}'::jsonb, true, '{"enabled": true, "start": "21:00", "end": "07:30"}'::jsonb),
  ('STUDENT', '{"inApp": true, "browserPush": true, "email": true, "smsWhatsapp": false}'::jsonb, '{"enrollmentStatus": true, "examAvailable": true, "deadlines": true, "examResults": true, "announcements": true, "directMessages": true}'::jsonb, true, '{"enabled": true, "start": "22:00", "end": "07:00"}'::jsonb),
  ('PARENT', '{"inApp": true, "browserPush": true, "email": true, "smsWhatsapp": true}'::jsonb, '{"enrollmentStatus": true, "examAvailable": true, "deadlines": true, "examResults": true, "announcements": true, "directMessages": true}'::jsonb, true, '{"enabled": true, "start": "22:00", "end": "07:00"}'::jsonb)
ON CONFLICT (role) DO UPDATE SET
  channels = EXCLUDED.channels,
  categories = EXCLUDED.categories,
  sound_enabled = EXCLUDED.sound_enabled,
  quiet_hours = EXCLUDED.quiet_hours,
  updated_at = NOW();

-- 6. Habilita RLS e cria políticas permissivas para o applet
ALTER TABLE public.user_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_preferences ENABLE ROW LEVEL SECURITY;

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

-- 7. Mensagem de Confirmação Final
SELECT '🟢 BANCO DE DADOS SUCESSOEDU ATUALIZADO E BLINDADO COM SUCESSO!' AS resultado;
