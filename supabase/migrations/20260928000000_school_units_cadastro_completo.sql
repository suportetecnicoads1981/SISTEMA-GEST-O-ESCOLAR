-- Cadastro completo da escola na nuvem (ficha da planilha padrão e tela de cadastro).
-- Antes só nome, INEP, cidade, telefone e e-mail chegavam aos outros computadores.
alter table public.school_units
  add column if not exists trade_name text,
  add column if not exists cnpj_or_decree text,
  add column if not exists location_zone text,
  add column if not exists district text,
  add column if not exists address text,
  add column if not exists zip_code text,
  add column if not exists director_name text,
  add column if not exists coordinator_name text,
  add column if not exists secretary_name text,
  add column if not exists total_classrooms integer,
  add column if not exists operating_hours text,
  add column if not exists has_internet boolean,
  add column if not exists grades_served jsonb,
  add column if not exists grades_served_text text,
  add column if not exists offered_shifts jsonb,
  add column if not exists cadastral_status text,
  add column if not exists pending_fields jsonb,
  add column if not exists is_annex boolean,
  add column if not exists parent_unit_id text,
  add column if not exists created_via_import boolean;
