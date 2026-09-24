-- JÁ APLICADA no projeto cdxvhxqpixtbycghfsre (produção). Mantida no repositório
-- apenas para o histórico de migrações ficar igual ao do banco. NÃO executar manualmente.

create schema if not exists backup_20260923;
revoke all on schema backup_20260923 from public, anon, authenticated;
do $$
declare t record;
begin
  for t in select tablename from pg_tables where schemaname = 'public' loop
    execute format('create table backup_20260923.%I as table public.%I', t.tablename, t.tablename);
  end loop;
  create table backup_20260923._policies as select * from pg_policies where schemaname = 'public';
end $$;
revoke all on all tables in schema backup_20260923 from public, anon, authenticated;
