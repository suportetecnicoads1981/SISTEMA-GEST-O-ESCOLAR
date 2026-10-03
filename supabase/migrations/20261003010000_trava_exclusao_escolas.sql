-- Trava no banco: no máximo uma escola apagada por comando.
-- Incidente de 02/10/2026: um computador com a cópia incompleta apagou as 16 escolas de uma vez.
-- Para uma limpeza intencional (suporte), rodar antes, na mesma transação:
--   set local sucessoedu.permitir_exclusao_escolas = 'on';
create or replace function public.trava_exclusao_escolas()
returns trigger
language plpgsql
set search_path to 'public'
as $$
declare
  n int;
begin
  if coalesce(current_setting('sucessoedu.permitir_exclusao_escolas', true), '') = 'on' then
    return null;
  end if;
  select count(*) into n from old_rows;
  if n > 1 then
    raise exception 'Exclusão de % escolas de uma vez recusada (proteção contra apagamento acidental). Apague uma por vez.', n
      using errcode = 'P0001';
  end if;
  return null;
end $$;

drop trigger if exists trg_trava_exclusao_escolas on public.school_units;
create trigger trg_trava_exclusao_escolas
  after delete on public.school_units
  referencing old table as old_rows
  for each statement
  execute function public.trava_exclusao_escolas();
