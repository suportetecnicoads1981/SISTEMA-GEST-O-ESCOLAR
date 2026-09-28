-- Função que entrega o RA definitivo de cada aluno (mesmo aluno → mesmo número).
create or replace function public.reserve_student_ras(p_student_ids text[])
returns table(student_id text, registration_number text)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_column
declare
  v_id text;
  v_ra text;
  v_n bigint;
  v_year int := extract(year from (now() at time zone 'America/Sao_Paulo'))::int;
begin
  if auth.uid() is null then
    raise exception 'login na nuvem necessário' using errcode = '42501';
  end if;
  if p_student_ids is null or array_length(p_student_ids, 1) is null then
    return;
  end if;
  if array_length(p_student_ids, 1) > 3000 then
    raise exception 'no máximo 3000 alunos por pedido';
  end if;

  foreach v_id in array (select array_agg(distinct x) from unnest(p_student_ids) x where coalesce(trim(x), '') <> '')
  loop
    v_ra := null;
    select a.registration_number into v_ra from public.student_ra_assignments a where a.student_id = v_id;
    if v_ra is null then
      loop
        v_n := nextval('public.student_ra_seq');
        v_ra := 'RA-' || v_year || '-' || lpad(v_n::text, 4, '0');
        exit when not exists (
          select 1 from public.students s
          where s.registration_number = v_ra
             or (s.registration_number ~ '^RA-\d{4}-\d+$'
                 and (regexp_match(s.registration_number, '^RA-\d{4}-(\d+)$'))[1]::bigint = v_n)
        ) and not exists (select 1 from public.student_ra_assignments a where a.registration_number = v_ra);
      end loop;
      insert into public.student_ra_assignments as a (student_id, registration_number)
      values (v_id, v_ra)
      on conflict on constraint student_ra_assignments_pkey do nothing;
      select a.registration_number into v_ra from public.student_ra_assignments a where a.student_id = v_id;
    end if;
    return query select v_id, v_ra;
  end loop;
end;
$$;
revoke all on function public.reserve_student_ras(text[]) from public, anon;
grant execute on function public.reserve_student_ras(text[]) to authenticated;
