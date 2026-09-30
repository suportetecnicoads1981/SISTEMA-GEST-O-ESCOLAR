-- Lápides: os computadores precisam LER deleted_records para receber as exclusões.
-- As políticas staff_select/server_select já existiam, mas faltava a permissão da tabela.
-- A gravação continua só pelos gatilhos (security definer), sem permissão direta.
grant select on public.deleted_records to authenticated;
