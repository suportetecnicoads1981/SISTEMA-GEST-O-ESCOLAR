-- Logos usadas no timbre dos documentos: Gestão Municipal (Prefeitura) e SEMED nas
-- configurações; logo de cada escola no cadastro das unidades.
alter table public.school_settings add column if not exists management_logo_url text;
alter table public.school_units add column if not exists logo_url text;
alter table public.school_units add column if not exists management_logo_url text;
