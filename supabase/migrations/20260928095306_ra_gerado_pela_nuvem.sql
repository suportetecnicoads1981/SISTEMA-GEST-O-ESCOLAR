-- RA (matrícula) gerado pela nuvem: um número por aluno, sem repetição entre computadores.
create sequence if not exists public.student_ra_seq;

select setval('public.student_ra_seq',
  greatest(1, coalesce((select max((regexp_match(registration_number, '^RA-\d{4}-(\d+)$'))[1]::bigint) from public.students), 0)),
  true);

-- Registro de qual RA cada aluno recebeu: pedir de novo para o mesmo aluno devolve o mesmo número
-- (vários computadores podem pedir ao mesmo tempo sem gastar números nem gerar RAs diferentes).
create table if not exists public.student_ra_assignments (
  student_id text primary key,
  registration_number text not null unique,
  created_at timestamptz not null default now(),
  created_by uuid default auth.uid()
);
alter table public.student_ra_assignments enable row level security;
revoke all on public.student_ra_assignments from anon, authenticated;
grant select on public.student_ra_assignments to authenticated;
drop policy if exists ra_assignments_read on public.student_ra_assignments;
create policy ra_assignments_read on public.student_ra_assignments for select to authenticated using (true);
-- A função reserve_student_ras está na migração seguinte (20260928095324).
