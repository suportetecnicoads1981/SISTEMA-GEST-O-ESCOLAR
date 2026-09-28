-- =============================================================================
-- Conta própria para cada Servidor Remoto de escola (28/09/2026)
--
-- Antes, o servidor de uma escola entrava na nuvem com a conta de uma pessoa (muitas
-- vezes administradora): enxergava e podia gravar a rede inteira. Agora cada escola
-- tem uma conta de papel SERVIDOR, presa à escola (app_metadata.school_unit_id), que:
--   - envia o lote SÓ da própria escola (lotes_escolas);
--   - lê SÓ a própria escola, as turmas e os alunos dela (recebimento da Sede);
--   - não grava direto em nenhuma tabela de cadastro.
-- Desligar/renovar a conta de uma escola não afeta as outras.
-- As contas são criadas pela função criar-conta-servidor (somente administrador).
-- =============================================================================

create or replace function public.current_app_school()
returns text
language sql
stable
set search_path = ''
as $$
  select coalesce(auth.jwt() -> 'app_metadata' ->> 'school_unit_id', '')
$$;

create or replace function public.is_school_server()
returns boolean
language sql
stable
set search_path = ''
as $$
  select public.current_app_role() = 'SERVIDOR' and public.current_app_school() <> ''
$$;

drop policy if exists server_select on public.school_units;
create policy server_select on public.school_units for select to authenticated
  using (public.is_school_server() and id = public.current_app_school());

drop policy if exists server_select on public.school_classes;
create policy server_select on public.school_classes for select to authenticated
  using (public.is_school_server() and school_unit_id = public.current_app_school());

drop policy if exists server_select on public.students;
create policy server_select on public.students for select to authenticated
  using (public.is_school_server() and school_unit_id = public.current_app_school());

drop policy if exists server_select on public.deleted_records;
create policy server_select on public.deleted_records for select to authenticated
  using (public.is_school_server());

drop policy if exists lotes_server_insert on public.lotes_escolas;
create policy lotes_server_insert on public.lotes_escolas for insert to authenticated
  with check (public.is_school_server() and school_unit_id = public.current_app_school() and imported_at is null);

drop policy if exists lotes_server_select on public.lotes_escolas;
create policy lotes_server_select on public.lotes_escolas for select to authenticated
  using (public.is_school_server() and school_unit_id = public.current_app_school());
