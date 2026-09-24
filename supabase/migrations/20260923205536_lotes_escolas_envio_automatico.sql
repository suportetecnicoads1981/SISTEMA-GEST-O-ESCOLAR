-- JÁ APLICADA no projeto cdxvhxqpixtbycghfsre (produção). Mantida no repositório
-- apenas para o histórico de migrações ficar igual ao do banco. NÃO executar manualmente.

-- Lotes (.edusync) enviados automaticamente pelos Servidores Remotos quando há internet.
-- A Sede importa por mescla (mesma regra do arquivo levado em pendrive).
create table if not exists public.lotes_escolas (
  id text primary key,                       -- packetId do lote
  school_unit_id text not null,
  school_inep text,
  school_name text,
  sha256 text not null,
  lote_created_at timestamptz not null,
  payload jsonb not null,
  sent_by uuid default auth.uid(),
  sent_at timestamptz not null default now(),
  imported_at timestamptz,
  imported_by uuid
);
create index if not exists lotes_escolas_pendentes_idx on public.lotes_escolas (imported_at, lote_created_at);
alter table public.lotes_escolas enable row level security;

create policy lotes_escolas_select on public.lotes_escolas for select to authenticated using (public.is_staff());
create policy lotes_escolas_insert on public.lotes_escolas for insert to authenticated with check (public.is_staff() and imported_at is null);
create policy lotes_escolas_update on public.lotes_escolas for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy lotes_escolas_delete on public.lotes_escolas for delete to authenticated using (public.is_admin());

revoke all on public.lotes_escolas from anon;
grant select, insert, update, delete on public.lotes_escolas to authenticated;
