-- Impede o mesmo aluno (nome sem acentos/espaços + data de nascimento) duas vezes na mesma escola.
-- Homônimos com datas diferentes continuam permitidos; alunos sem data de nascimento não entram na regra.
create or replace function public.student_name_key(p text)
returns text language sql immutable parallel safe as $$
  select regexp_replace(lower(translate(coalesce(p,''),
    'ÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇÑáàâãäéèêëíìîïóòôõöúùûüçñ',
    'AAAAAEEEEIIIIOOOOOUUUUCNaaaaaeeeeiiiiooooouuuucn')), '[^a-z0-9]', '', 'g')
$$;

create unique index if not exists students_unique_per_school
  on public.students (school_unit_id, public.student_name_key(name), birth_date)
  where birth_date is not null and school_unit_id is not null;
