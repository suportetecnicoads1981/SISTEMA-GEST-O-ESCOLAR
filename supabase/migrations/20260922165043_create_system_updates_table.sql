-- JÁ APLICADA no projeto cdxvhxqpixtbycghfsre (produção). Mantida no repositório
-- apenas para o histórico de migrações ficar igual ao do banco. NÃO executar manualmente.

-- =========================================================================
-- SISTEMA DE ATUALIZAÇÕES (SYSTEM UPDATES) - Catálogo central de versões
-- Armazena os pacotes de atualização publicados para que todas as
-- estações/usuários vejam o mesmo catálogo em tempo real via Supabase Realtime.
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.system_updates (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    version TEXT NOT NULL,
    release_date DATE DEFAULT CURRENT_DATE,
    title TEXT NOT NULL,
    summary TEXT,
    description TEXT,
    severity TEXT NOT NULL DEFAULT 'MINOR',
    size_formatted TEXT,
    sha256_checksum TEXT,
    download_url TEXT,
    cloud_storage_url TEXT,
    min_compatible_version TEXT,
    author TEXT,
    target_platform TEXT,
    is_cloud_available BOOLEAN DEFAULT TRUE,
    improvements JSONB DEFAULT '[]'::jsonb,
    published_by TEXT,
    published_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS system_updates_version_idx ON public.system_updates (version);
CREATE INDEX IF NOT EXISTS system_updates_release_date_idx ON public.system_updates (release_date DESC);

-- RLS consistente com o restante do banco (leitura/escrita liberadas para anon/authenticated,
-- já que o app ainda não tem camada de auth própria no Supabase).
ALTER TABLE public.system_updates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "system_updates_all_read" ON public.system_updates;
CREATE POLICY "system_updates_all_read" ON public.system_updates FOR SELECT USING (true);
DROP POLICY IF EXISTS "system_updates_all_write" ON public.system_updates;
CREATE POLICY "system_updates_all_write" ON public.system_updates FOR ALL USING (true) WITH CHECK (true);
