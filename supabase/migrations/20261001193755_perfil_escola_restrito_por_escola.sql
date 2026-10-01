-- Perfil ESCOLA na nuvem (01/10/2026)
-- Usuário lotado numa escola (ex.: Secretaria da escola) lê e grava SÓ a escola de lotação e as
-- anexas dela. Não exclui nada na nuvem (exclusões ficam com a Sede/administrador) e não altera
-- cadastros da rede (escolas, usuários, configurações).
-- O papel vem de app_metadata.role = 'ESCOLA' e a escola de app_metadata.school_unit_id
-- (definidos só pela conta Master, pela função gerenciar-conta-nuvem).

create or replace function public.is_escola()
returns boolean
language sql
stable
set search_path = ''
as $$
  select public.current_app_role() = 'ESCOLA' and public.current_app_school() <> ''
$$;

-- Escola da lotação ou anexa dela. SECURITY DEFINER: lê o cadastro de escolas sem passar pela
-- RLS (evita recursão nas políticas). Só devolve verdadeiro/falso.
create or replace function public.escola_unit_ok(p_unit text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_escola()
     and p_unit is not null
     and (
       p_unit = public.current_app_school()
       or exists (
         select 1 from public.school_units u
          where u.id = p_unit and coalesce(u.doc ->> 'parentUnitId', '') = public.current_app_school()
       )
     )
$$;

create or replace function public.escola_class_ok(p_class text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_escola() and p_class is not null and exists (
    select 1 from public.school_classes c where c.id = p_class and public.escola_unit_ok(c.school_unit_id)
  )
$$;

create or replace function public.escola_student_ok(p_student text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_escola() and p_student is not null and exists (
    select 1 from public.students s where s.id = p_student and public.escola_unit_ok(s.school_unit_id)
  )
$$;

revoke execute on function public.is_escola() from public, anon;
revoke execute on function public.escola_unit_ok(text) from public, anon;
revoke execute on function public.escola_class_ok(text) from public, anon;
revoke execute on function public.escola_student_ok(text) from public, anon;
grant execute on function public.is_escola() to authenticated;
grant execute on function public.escola_unit_ok(text) to authenticated;
grant execute on function public.escola_class_ok(text) to authenticated;
grant execute on function public.escola_student_ok(text) to authenticated;

-- Escolas: vê a dela e as anexas
create policy escola_select on public.school_units for select to authenticated using (public.escola_unit_ok(id));

-- Turmas e alunos da escola
create policy escola_select on public.school_classes for select to authenticated using (public.escola_unit_ok(school_unit_id));
create policy escola_insert on public.school_classes for insert to authenticated with check (public.escola_unit_ok(school_unit_id));
create policy escola_update on public.school_classes for update to authenticated using (public.escola_unit_ok(school_unit_id)) with check (public.escola_unit_ok(school_unit_id));

create policy escola_select on public.students for select to authenticated using (public.escola_unit_ok(school_unit_id));
create policy escola_insert on public.students for insert to authenticated with check (public.escola_unit_ok(school_unit_id));
create policy escola_update on public.students for update to authenticated using (public.escola_unit_ok(school_unit_id)) with check (public.escola_unit_ok(school_unit_id));

-- Registros ligados à turma
create policy escola_select on public.attendance_sheets for select to authenticated using (public.escola_class_ok(class_id));
create policy escola_insert on public.attendance_sheets for insert to authenticated with check (public.escola_class_ok(class_id));
create policy escola_update on public.attendance_sheets for update to authenticated using (public.escola_class_ok(class_id)) with check (public.escola_class_ok(class_id));

create policy escola_select on public.class_grade_sheets for select to authenticated using (public.escola_class_ok(class_id));
create policy escola_insert on public.class_grade_sheets for insert to authenticated with check (public.escola_class_ok(class_id));
create policy escola_update on public.class_grade_sheets for update to authenticated using (public.escola_class_ok(class_id)) with check (public.escola_class_ok(class_id));

create policy escola_select on public.lesson_registries for select to authenticated using (public.escola_class_ok(class_id));
create policy escola_insert on public.lesson_registries for insert to authenticated with check (public.escola_class_ok(class_id));
create policy escola_update on public.lesson_registries for update to authenticated using (public.escola_class_ok(class_id)) with check (public.escola_class_ok(class_id));

-- Registros ligados ao aluno
create policy escola_select on public.academic_histories for select to authenticated using (public.escola_student_ok(student_id));
create policy escola_insert on public.academic_histories for insert to authenticated with check (public.escola_student_ok(student_id));
create policy escola_update on public.academic_histories for update to authenticated using (public.escola_student_ok(student_id)) with check (public.escola_student_ok(student_id));

create policy escola_select on public.bncc_skill_assessments for select to authenticated
  using (public.escola_unit_ok(school_unit_id) or public.escola_student_ok(student_id) or public.escola_class_ok(class_id));
create policy escola_insert on public.bncc_skill_assessments for insert to authenticated
  with check (public.escola_unit_ok(school_unit_id) or public.escola_student_ok(student_id) or public.escola_class_ok(class_id));
create policy escola_update on public.bncc_skill_assessments for update to authenticated
  using (public.escola_unit_ok(school_unit_id) or public.escola_student_ok(student_id) or public.escola_class_ok(class_id))
  with check (public.escola_unit_ok(school_unit_id) or public.escola_student_ok(student_id) or public.escola_class_ok(class_id));

create policy escola_select on public.exam_submissions for select to authenticated
  using (public.escola_student_ok(student_id) or public.escola_class_ok(class_id));
create policy escola_insert on public.exam_submissions for insert to authenticated
  with check (public.escola_student_ok(student_id) or public.escola_class_ok(class_id));
create policy escola_update on public.exam_submissions for update to authenticated
  using (public.escola_student_ok(student_id) or public.escola_class_ok(class_id))
  with check (public.escola_student_ok(student_id) or public.escola_class_ok(class_id));

-- Provas: as da rede (sem turma) e as das turmas da escola
create policy escola_select on public.exams for select to authenticated
  using (public.is_escola() and (class_id is null or public.escola_class_ok(class_id)));
create policy escola_insert on public.exams for insert to authenticated
  with check (public.is_escola() and (class_id is null or public.escola_class_ok(class_id)));
create policy escola_update on public.exams for update to authenticated
  using (public.is_escola() and (class_id is null or public.escola_class_ok(class_id)))
  with check (public.is_escola() and (class_id is null or public.escola_class_ok(class_id)));

-- WhatsApp: mensagens dos alunos da escola (e avisos gerais sem aluno)
create policy escola_select on public.whatsapp_messages for select to authenticated
  using (public.is_escola() and (student_id is null or public.escola_student_ok(student_id)));
create policy escola_insert on public.whatsapp_messages for insert to authenticated
  with check (public.is_escola() and (student_id is null or public.escola_student_ok(student_id)));
create policy escola_update on public.whatsapp_messages for update to authenticated
  using (public.is_escola() and (student_id is null or public.escola_student_ok(student_id)))
  with check (public.is_escola() and (student_id is null or public.escola_student_ok(student_id)));

-- Catálogos e avisos da rede: só leitura (cadastro é da Sede)
create policy escola_select on public.courses for select to authenticated using (public.is_escola());
create policy escola_select on public.subjects for select to authenticated using (public.is_escola());
create policy escola_select on public.questions for select to authenticated using (public.is_escola());
create policy escola_select on public.bncc_skills for select to authenticated using (public.is_escola());
create policy escola_select on public.school_settings for select to authenticated using (public.is_escola());
create policy escola_select on public.role_preferences for select to authenticated using (public.is_escola());
create policy escola_select on public.system_updates for select to authenticated using (public.is_escola());
create policy escola_select on public.media_assets for select to authenticated using (public.is_escola());
create policy escola_select on public.deleted_records for select to authenticated using (public.is_escola());

-- Comunicados e notificações: lê e registra (não exclui)
create policy escola_select on public.communications for select to authenticated using (public.is_escola());
create policy escola_insert on public.communications for insert to authenticated with check (public.is_escola());
create policy escola_update on public.communications for update to authenticated using (public.is_escola()) with check (public.is_escola());
create policy escola_select on public.notifications for select to authenticated using (public.is_escola());
create policy escola_insert on public.notifications for insert to authenticated with check (public.is_escola());
create policy escola_update on public.notifications for update to authenticated using (public.is_escola()) with check (public.is_escola());
create policy escola_insert on public.sync_audit_logs for insert to authenticated with check (public.is_escola());

-- Cadastro de usuários: só o próprio
create policy escola_select on public.user_accounts for select to authenticated
  using (public.is_escola() and lower(coalesce(doc ->> 'email', '')) = lower(coalesce(auth.jwt() ->> 'email', '-')));

-- Coleções avulsas (app_records): configurações e modelos (leitura); planos e anotações do
-- professor só das turmas/alunos da escola (leitura e gravação).
create policy escola_select on public.app_records for select to authenticated
  using (
    public.is_escola() and (
      collection not in ('teacherLessonPlans', 'teacherStudentNotes')
      or public.escola_class_ok(doc ->> 'classId')
      or public.escola_student_ok(doc ->> 'studentId')
    )
  );
create policy escola_insert on public.app_records for insert to authenticated
  with check (
    public.is_escola() and collection in ('teacherLessonPlans', 'teacherStudentNotes')
    and (public.escola_class_ok(doc ->> 'classId') or public.escola_student_ok(doc ->> 'studentId'))
  );
create policy escola_update on public.app_records for update to authenticated
  using (
    public.is_escola() and collection in ('teacherLessonPlans', 'teacherStudentNotes')
    and (public.escola_class_ok(doc ->> 'classId') or public.escola_student_ok(doc ->> 'studentId'))
  )
  with check (
    public.is_escola() and collection in ('teacherLessonPlans', 'teacherStudentNotes')
    and (public.escola_class_ok(doc ->> 'classId') or public.escola_student_ok(doc ->> 'studentId'))
  );
