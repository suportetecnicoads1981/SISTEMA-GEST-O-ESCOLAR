-- Segurança (01/10/2026)
-- 1) Conta Master marcada no app_metadata (só o servidor/Master altera; o usuário não consegue mudar).
--    As funções de criação de contas na nuvem passam a aceitar só quem tem master = true.
update auth.users
   set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"master": true}'::jsonb
 where lower(email) = 'suportetecnicoads@gmail.com';

create or replace function public.is_master()
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'master')::boolean, false)
$$;

-- 2) Funções internas (gatilhos) não podem ser chamadas pela API (/rest/v1/rpc/...).
--    O privilégio EXECUTE de função de gatilho só é conferido ao criar o gatilho: os gatilhos continuam funcionando.
revoke execute on function public.app_records_block_tombstoned() from public, anon, authenticated;
revoke execute on function public.app_records_tombstone() from public, anon, authenticated;
revoke execute on function public.block_tombstoned() from public, anon, authenticated;
revoke execute on function public.skip_deleted_school_unit() from public, anon, authenticated;
revoke execute on function public.skip_rows_of_deleted_units() from public, anon, authenticated;
revoke execute on function public.tombstone_on_delete() from public, anon, authenticated;

-- 3) Reserva de RA: só usuário logado na nuvem (nunca anônimo).
revoke execute on function public.reserve_student_ras(text[]) from public, anon;
grant execute on function public.reserve_student_ras(text[]) to authenticated;

-- 4) search_path fixo (aviso do Supabase)
alter function public.student_name_key(text) set search_path = '';
