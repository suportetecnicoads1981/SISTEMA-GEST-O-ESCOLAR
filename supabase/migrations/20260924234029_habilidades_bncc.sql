create table if not exists public.bncc_skills (
  id text primary key,
  code text not null,
  education_level text,
  segment text,
  subject text,
  field_of_experience text,
  knowledge_object text,
  description text not null,
  tags jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_bncc_skills_code on public.bncc_skills (code);

create table if not exists public.bncc_skill_assessments (
  id text primary key,
  student_id text not null,
  class_id text,
  school_unit_id text,
  skill_code text not null,
  subject text,
  school_year integer not null,
  term smallint not null check (term between 1 and 4),
  level smallint not null check (level between 1 and 4),
  notes text,
  teacher_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uq_bncc_assessment unique (student_id, skill_code, school_year, term)
);
create index if not exists idx_bncc_assess_class on public.bncc_skill_assessments (class_id, school_year, term);
create index if not exists idx_bncc_assess_unit on public.bncc_skill_assessments (school_unit_id);

alter table public.bncc_skills enable row level security;
alter table public.bncc_skill_assessments enable row level security;

drop policy if exists staff_select on public.bncc_skills;
create policy staff_select on public.bncc_skills for select to authenticated using (public.is_staff());
drop policy if exists staff_insert on public.bncc_skills;
create policy staff_insert on public.bncc_skills for insert to authenticated with check (public.is_staff());
drop policy if exists staff_update on public.bncc_skills;
create policy staff_update on public.bncc_skills for update to authenticated using (public.is_staff()) with check (public.is_staff());
drop policy if exists admin_delete on public.bncc_skills;
create policy admin_delete on public.bncc_skills for delete to authenticated using (public.is_admin());

drop policy if exists staff_select on public.bncc_skill_assessments;
create policy staff_select on public.bncc_skill_assessments for select to authenticated using (public.is_staff());
drop policy if exists staff_insert on public.bncc_skill_assessments;
create policy staff_insert on public.bncc_skill_assessments for insert to authenticated with check (public.is_staff());
drop policy if exists staff_update on public.bncc_skill_assessments;
create policy staff_update on public.bncc_skill_assessments for update to authenticated using (public.is_staff()) with check (public.is_staff());
drop policy if exists staff_delete on public.bncc_skill_assessments;
create policy staff_delete on public.bncc_skill_assessments for delete to authenticated using (public.is_staff());

drop trigger if exists trg_skip_deleted_units_bncc on public.bncc_skill_assessments;
create trigger trg_skip_deleted_units_bncc
  before insert or update on public.bncc_skill_assessments
  for each row execute function public.skip_rows_of_deleted_units();
