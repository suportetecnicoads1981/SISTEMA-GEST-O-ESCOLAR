-- Registro privado de melhorias e correções futuras do SucessoEdu.
-- Somente a conta do desenvolvedor (suportetecnicoads@gmail.com) lê e grava.
create table if not exists public.dev_backlog (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  kind text not null default 'MELHORIA' check (kind in ('MELHORIA','CORRECAO','REESTRUTURACAO','IDEIA')),
  priority text not null default 'MEDIA' check (priority in ('ALTA','MEDIA','BAIXA')),
  status text not null default 'PLANEJADO' check (status in ('PLANEJADO','EM_ANDAMENTO','CONCLUIDO','DESCARTADO')),
  area text,
  description text,
  steps text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.dev_backlog enable row level security;
drop policy if exists dev_backlog_somente_dono on public.dev_backlog;
create policy dev_backlog_somente_dono on public.dev_backlog
  for all to authenticated
  using ((select auth.uid()) = 'be222556-0124-4e18-8467-fb9c848000e4'::uuid)
  with check ((select auth.uid()) = 'be222556-0124-4e18-8467-fb9c848000e4'::uuid);
revoke all on public.dev_backlog from anon;
