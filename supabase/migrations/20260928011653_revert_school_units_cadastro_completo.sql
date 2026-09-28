-- Desfaz 20260928000000_school_units_cadastro_completo: a ficha da escola da planilha padrão
-- fica só na planilha (a SEMED completa o cadastro à mão). Aplicado na nuvem em 28/09/2026.
alter table public.school_units
  drop column if exists trade_name,
  drop column if exists cnpj_or_decree,
  drop column if exists location_zone,
  drop column if exists district,
  drop column if exists address,
  drop column if exists zip_code,
  drop column if exists director_name,
  drop column if exists coordinator_name,
  drop column if exists secretary_name,
  drop column if exists total_classrooms,
  drop column if exists operating_hours,
  drop column if exists has_internet,
  drop column if exists grades_served,
  drop column if exists grades_served_text,
  drop column if exists offered_shifts,
  drop column if exists cadastral_status,
  drop column if exists pending_fields,
  drop column if exists is_annex,
  drop column if exists parent_unit_id,
  drop column if exists created_via_import;
