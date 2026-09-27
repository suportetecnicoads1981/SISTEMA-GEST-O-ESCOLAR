-- O acesso continua limitado à conta do desenvolvedor pela regra (RLS); sem esta permissão
-- a tela recebia a lista vazia.
grant select, insert, update, delete on public.dev_backlog to authenticated;
