/**
 * Schema e Definições SQL para Supabase / PostgreSQL
 * RBAC (Role-Based Access Control) e Sincronização de Profiles
 */

export const SUPABASE_RBAC_SCHEMA_SQL = `-- 1. Criação da Tabela de Usuários Públicos Sincronizada com auth.users
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  role TEXT NOT NULL DEFAULT 'STUDENT',
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Habilitação de RLS (Row Level Security)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 3. Políticas de RLS
-- Política 1: Usuários leem seus próprios dados
DROP POLICY IF EXISTS "Usuários leem seus próprios dados" ON public.users;
CREATE POLICY "Usuários leem seus próprios dados" 
  ON public.users 
  FOR SELECT 
  USING (auth.uid() = id);

-- Política 2: Admins leem todos os usuários
DROP POLICY IF EXISTS "Admins leem todos os usuários" ON public.users;
CREATE POLICY "Admins leem todos os usuários" 
  ON public.users 
  FOR SELECT 
  USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'ADMIN');

-- Política 3: Usuários atualizam seus próprios dados (exceto role)
DROP POLICY IF EXISTS "Usuários atualizam seus próprios perfis" ON public.users;
CREATE POLICY "Usuários atualizam seus próprios perfis" 
  ON public.users 
  FOR UPDATE 
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 4. Database Trigger para Sincronização Automática com auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    COALESCE(new.raw_app_meta_data->>'role', 'STUDENT')
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    updated_at = NOW();
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger disparado após INSERT em auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
`;
