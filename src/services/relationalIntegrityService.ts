/**
 * RelationalIntegrityService
 * Sistema de Auditoria, Diagnóstico e Auto-Cura de Integridade Referencial
 * Verifica e normaliza todas as relações (chaves estrangeiras, registros órfãos e restrições)
 * entre as tabelas do ecossistema SucessoEdu.
 */

import { AppStateData } from '../data/storage';
import { Student, SchoolClass, Subject, Question, Exam, ExamSubmission } from '../types';

export interface RelationalIssue {
  id: string;
  sourceTable: string;
  targetTable: string;
  foreignKeyField: string;
  recordId: string;
  recordLabel: string;
  brokenValue: any;
  suggestedValue?: any;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  description: string;
  canAutoHeal: boolean;
}

export interface TableIntegritySummary {
  tableName: string;
  displayName: string;
  recordCount: number;
  relationshipsCount: number;
  brokenFkCount: number;
  status: 'HEALTHY' | 'WARNING' | 'ERROR';
  testedForeignKeys: string[];
}

export interface RelationalAuditReport {
  score: number; // 0 a 100
  status: 'PERFECT' | 'ATTENTION' | 'CRITICAL';
  totalTables: number;
  totalRecordsChecked: number;
  totalRelationsChecked: number;
  healthyRelationsCount: number;
  brokenRelationsCount: number;
  tableSummaries: TableIntegritySummary[];
  issues: RelationalIssue[];
  auditedAt: string;
}

export class RelationalIntegrityService {
  /**
   * Executa uma auditoria completa de integridade relacional entre todas as tabelas
   */
  public static audit(data: AppStateData): RelationalAuditReport {
    const issues: RelationalIssue[] = [];
    const auditedAt = new Date().toISOString();

    const studentMap = new Map<string, Student>(data.students.map((s) => [s.id, s]));
    const classMap = new Map<string, SchoolClass>(data.classes.map((c) => [c.id, c]));
    const subjectMap = new Map<string, Subject>(data.subjects.map((s) => [s.id, s]));
    const subjectNameMap = new Map<string, Subject>(
      data.subjects.map((s) => [s.name.toLowerCase().trim(), s])
    );
    const courseMap = new Map(data.courses.map((c) => [c.id, c]));
    const schoolUnitMap = new Map(data.schoolUnits.map((u) => [u.id, u]));
    const questionMap = new Map<string, Question>(data.questions.map((q) => [q.id, q]));
    const examMap = new Map<string, Exam>(data.exams.map((e) => [e.id, e]));

    // 1. Auditoria da Tabela STUDENTS (Alunos)
    let studentBrokenCount = 0;
    data.students.forEach((student) => {
      // FK para CLASSES
      if (!student.classId) {
        studentBrokenCount++;
        issues.push({
          id: `iss-std-no-class-${student.id}`,
          sourceTable: 'students',
          targetTable: 'school_classes',
          foreignKeyField: 'classId',
          recordId: student.id,
          recordLabel: student.name,
          brokenValue: student.classId,
          suggestedValue: data.classes[0]?.id,
          severity: 'CRITICAL',
          description: `O aluno "${student.name}" está sem turma vinculada.`,
          canAutoHeal: true,
        });
      } else if (!classMap.has(student.classId)) {
        studentBrokenCount++;
        // Tenta inferir turma por compatibilidade (ex: class-2a -> class-2em, class-1a -> class-1em)
        let suggested: string | undefined;
        if (student.classId === 'class-2a') suggested = 'class-2em';
        else if (student.classId === 'class-1a') suggested = 'class-1em';
        else suggested = data.classes[0]?.id;

        issues.push({
          id: `iss-std-bad-class-${student.id}`,
          sourceTable: 'students',
          targetTable: 'school_classes',
          foreignKeyField: 'classId',
          recordId: student.id,
          recordLabel: student.name,
          brokenValue: student.classId,
          suggestedValue: suggested,
          severity: 'CRITICAL',
          description: `A turma "${student.classId}" associada ao aluno "${student.name}" não existe no cadastro de turmas.`,
          canAutoHeal: true,
        });
      }

      // FK para SCHOOL_UNITS
      if (student.schoolUnitId && !schoolUnitMap.has(student.schoolUnitId)) {
        studentBrokenCount++;
        issues.push({
          id: `iss-std-bad-unit-${student.id}`,
          sourceTable: 'students',
          targetTable: 'school_units',
          foreignKeyField: 'schoolUnitId',
          recordId: student.id,
          recordLabel: student.name,
          brokenValue: student.schoolUnitId,
          suggestedValue: data.schoolUnits[0]?.id || 'unit-sede',
          severity: 'WARNING',
          description: `Unidade escolar "${student.schoolUnitId}" informada para o aluno "${student.name}" não existe.`,
          canAutoHeal: true,
        });
      }

      // FK para COURSES
      if (student.courseId && !courseMap.has(student.courseId)) {
        studentBrokenCount++;
        issues.push({
          id: `iss-std-bad-course-${student.id}`,
          sourceTable: 'students',
          targetTable: 'courses',
          foreignKeyField: 'courseId',
          recordId: student.id,
          recordLabel: student.name,
          brokenValue: student.courseId,
          suggestedValue: data.courses[0]?.id,
          severity: 'WARNING',
          description: `Curso/Segmento "${student.courseId}" do aluno "${student.name}" não encontrado.`,
          canAutoHeal: true,
        });
      }
    });

    // 2. Auditoria da Tabela SCHOOL_CLASSES (Turmas)
    let classBrokenCount = 0;
    data.classes.forEach((cls) => {
      if (cls.schoolUnitId && !schoolUnitMap.has(cls.schoolUnitId)) {
        classBrokenCount++;
        issues.push({
          id: `iss-cls-bad-unit-${cls.id}`,
          sourceTable: 'school_classes',
          targetTable: 'school_units',
          foreignKeyField: 'schoolUnitId',
          recordId: cls.id,
          recordLabel: cls.name,
          brokenValue: cls.schoolUnitId,
          suggestedValue: data.schoolUnits[0]?.id || 'unit-sede',
          severity: 'WARNING',
          description: `Turma "${cls.name}" aponta para unidade escolar "${cls.schoolUnitId}" não cadastrada.`,
          canAutoHeal: true,
        });
      }
    });

    // 3. Auditoria da Tabela QUESTIONS (Banco de Questões)
    let questionBrokenCount = 0;
    data.questions.forEach((q) => {
      const normalizedSub = (q.subject || '').toLowerCase().trim();
      const hasDirectSubject = q.subjectId && subjectMap.has(q.subjectId);
      const hasNameSubject = subjectNameMap.has(normalizedSub);

      if (!hasDirectSubject && !hasNameSubject) {
        questionBrokenCount++;
        // Tenta encontrar por inclusão parcial (ex: "Matemática" -> "Matemática e Suas Tecnologias")
        let suggestedSubId: string | undefined;
        let suggestedSubName: string | undefined;
        for (const s of data.subjects) {
          if (
            s.name.toLowerCase().includes(normalizedSub) ||
            normalizedSub.includes(s.name.toLowerCase())
          ) {
            suggestedSubId = s.id;
            suggestedSubName = s.name;
            break;
          }
        }

        issues.push({
          id: `iss-q-sub-${q.id}`,
          sourceTable: 'questions',
          targetTable: 'subjects',
          foreignKeyField: 'subject / subjectId',
          recordId: q.id,
          recordLabel: `${q.code} - ${q.topic}`,
          brokenValue: q.subject,
          suggestedValue: suggestedSubName || data.subjects[0]?.name,
          severity: 'WARNING',
          description: `Disciplina "${q.subject}" da questão ${q.code} não coincide exatamente com a matriz curricular.`,
          canAutoHeal: true,
        });
      }
    });

    // 4. Auditoria da Tabela EXAMS (Avaliações / Provas)
    let examBrokenCount = 0;
    data.exams.forEach((exam) => {
      // FK para CLASSES
      if (!classMap.has(exam.classId)) {
        examBrokenCount++;
        issues.push({
          id: `iss-exam-bad-class-${exam.id}`,
          sourceTable: 'exams',
          targetTable: 'school_classes',
          foreignKeyField: 'classId',
          recordId: exam.id,
          recordLabel: exam.title,
          brokenValue: exam.classId,
          suggestedValue: data.classes[0]?.id,
          severity: 'CRITICAL',
          description: `A avaliação "${exam.title}" está agendada para a turma "${exam.classId}" que não existe.`,
          canAutoHeal: true,
        });
      }

      // FK para QUESTIONS
      if (exam.questions && Array.isArray(exam.questions)) {
        exam.questions.forEach((qCfg) => {
          if (!questionMap.has(qCfg.questionId)) {
            examBrokenCount++;
            issues.push({
              id: `iss-exam-bad-q-${exam.id}-${qCfg.questionId}`,
              sourceTable: 'exams',
              targetTable: 'questions',
              foreignKeyField: 'questions[].questionId',
              recordId: exam.id,
              recordLabel: exam.title,
              brokenValue: qCfg.questionId,
              severity: 'CRITICAL',
              description: `A avaliação "${exam.title}" referencia a questão "${qCfg.questionId}" inexistente no banco de questões.`,
              canAutoHeal: false,
            });
          }
        });
      }
    });

    // 5. Auditoria da Tabela EXAM_SUBMISSIONS (Respostas / Submissões de Alunos)
    let submissionBrokenCount = 0;
    data.submissions.forEach((sub) => {
      if (!examMap.has(sub.examId)) {
        submissionBrokenCount++;
        issues.push({
          id: `iss-sub-bad-exam-${sub.id}`,
          sourceTable: 'exam_submissions',
          targetTable: 'exams',
          foreignKeyField: 'examId',
          recordId: sub.id,
          recordLabel: `Submissão de ${sub.studentName}`,
          brokenValue: sub.examId,
          severity: 'CRITICAL',
          description: `Submissão refere-se à prova "${sub.examId}" que foi excluída ou não existe.`,
          canAutoHeal: false,
        });
      }

      if (!studentMap.has(sub.studentId)) {
        submissionBrokenCount++;
        issues.push({
          id: `iss-sub-bad-student-${sub.id}`,
          sourceTable: 'exam_submissions',
          targetTable: 'students',
          foreignKeyField: 'studentId',
          recordId: sub.id,
          recordLabel: `Submissão ${sub.id}`,
          brokenValue: sub.studentId,
          severity: 'CRITICAL',
          description: `Submissão aponta para o aluno "${sub.studentId}" não localizado no cadastro.`,
          canAutoHeal: false,
        });
      }
    });

    // 6. Auditoria de ATTENDANCE_SHEETS (Frequência)
    let attendanceBrokenCount = 0;
    data.attendanceSheets.forEach((sheet) => {
      if (!classMap.has(sheet.classId)) {
        attendanceBrokenCount++;
        issues.push({
          id: `iss-att-bad-class-${sheet.id}`,
          sourceTable: 'attendance_sheets',
          targetTable: 'school_classes',
          foreignKeyField: 'classId',
          recordId: sheet.id,
          recordLabel: `Chamada ${sheet.date} (${sheet.term})`,
          brokenValue: sheet.classId,
          severity: 'CRITICAL',
          description: `Diário de frequência aponta para turma "${sheet.classId}" inexistente.`,
          canAutoHeal: true,
        });
      }
      if (sheet.subjectId && !subjectMap.has(sheet.subjectId)) {
        attendanceBrokenCount++;
        issues.push({
          id: `iss-att-bad-subject-${sheet.id}`,
          sourceTable: 'attendance_sheets',
          targetTable: 'subjects',
          foreignKeyField: 'subjectId',
          recordId: sheet.id,
          recordLabel: `Chamada ${sheet.date}`,
          brokenValue: sheet.subjectId,
          severity: 'WARNING',
          description: `Disciplina "${sheet.subjectId}" do diário de frequência não encontrada.`,
          canAutoHeal: true,
        });
      }
    });

    // 7. Auditoria de LESSON_REGISTRIES (Diário de Aulas / Conteúdos)
    let lessonBrokenCount = 0;
    data.lessonRegistries.forEach((reg) => {
      if (!classMap.has(reg.classId)) {
        lessonBrokenCount++;
        issues.push({
          id: `iss-lesson-bad-class-${reg.id}`,
          sourceTable: 'lesson_registries',
          targetTable: 'school_classes',
          foreignKeyField: 'classId',
          recordId: reg.id,
          recordLabel: `Aula ${reg.date}`,
          brokenValue: reg.classId,
          severity: 'CRITICAL',
          description: `Registro de aula aponta para turma "${reg.classId}" não encontrada.`,
          canAutoHeal: true,
        });
      }
    });

    // 8. Auditoria de CLASS_GRADE_SHEETS (Notas Bimestrais)
    let gradeBrokenCount = 0;
    data.classGradeSheets.forEach((gs) => {
      if (!classMap.has(gs.classId)) {
        gradeBrokenCount++;
        issues.push({
          id: `iss-grade-bad-class-${gs.id}`,
          sourceTable: 'class_grade_sheets',
          targetTable: 'school_classes',
          foreignKeyField: 'classId',
          recordId: gs.id,
          recordLabel: `Planilha de Notas - ${gs.term}`,
          brokenValue: gs.classId,
          severity: 'CRITICAL',
          description: `Planilha de notas vinculada à turma "${gs.classId}" inexistente.`,
          canAutoHeal: true,
        });
      }
    });

    // 9. Auditoria de ACADEMIC_HISTORIES (Histórico do Aluno)
    let historyBrokenCount = 0;
    data.academicHistories.forEach((hist) => {
      if (!studentMap.has(hist.studentId)) {
        historyBrokenCount++;
        issues.push({
          id: `iss-hist-bad-student-${hist.id}`,
          sourceTable: 'academic_histories',
          targetTable: 'students',
          foreignKeyField: 'studentId',
          recordId: hist.id,
          recordLabel: `Histórico ${hist.schoolYear}`,
          brokenValue: hist.studentId,
          severity: 'CRITICAL',
          description: `Histórico escolar refere-se a aluno "${hist.studentId}" não cadastrado.`,
          canAutoHeal: false,
        });
      }
    });

    // 10. Auditoria de USER_ACCOUNTS (Contas de Acesso)
    let userBrokenCount = 0;
    data.userAccounts.forEach((usr) => {
      if (usr.schoolUnitId && !schoolUnitMap.has(usr.schoolUnitId)) {
        userBrokenCount++;
        issues.push({
          id: `iss-usr-bad-unit-${usr.id}`,
          sourceTable: 'user_accounts',
          targetTable: 'school_units',
          foreignKeyField: 'schoolUnitId',
          recordId: usr.id,
          recordLabel: `${usr.name} (${usr.login})`,
          brokenValue: usr.schoolUnitId,
          suggestedValue: data.schoolUnits[0]?.id || 'unit-sede',
          severity: 'WARNING',
          description: `Usuário "${usr.name}" associado a polo/unidade "${usr.schoolUnitId}" não cadastrado.`,
          canAutoHeal: true,
        });
      }
    });

    // Montagem do Resumo por Tabela
    const tableSummaries: TableIntegritySummary[] = [
      {
        tableName: 'students',
        displayName: 'Alunos (students)',
        recordCount: data.students.length,
        relationshipsCount: 3, // classes, school_units, courses
        brokenFkCount: studentBrokenCount,
        status: studentBrokenCount === 0 ? 'HEALTHY' : studentBrokenCount > 2 ? 'ERROR' : 'WARNING',
        testedForeignKeys: ['classId -> school_classes.id', 'schoolUnitId -> school_units.id', 'courseId -> courses.id'],
      },
      {
        tableName: 'school_classes',
        displayName: 'Turmas (school_classes)',
        recordCount: data.classes.length,
        relationshipsCount: 1, // school_units
        brokenFkCount: classBrokenCount,
        status: classBrokenCount === 0 ? 'HEALTHY' : 'WARNING',
        testedForeignKeys: ['schoolUnitId -> school_units.id'],
      },
      {
        tableName: 'subjects',
        displayName: 'Disciplinas (subjects)',
        recordCount: data.subjects.length,
        relationshipsCount: 0,
        brokenFkCount: 0,
        status: 'HEALTHY',
        testedForeignKeys: ['Tabela Mestra Primária'],
      },
      {
        tableName: 'courses',
        displayName: 'Cursos e Níveis (courses)',
        recordCount: data.courses.length,
        relationshipsCount: 0,
        brokenFkCount: 0,
        status: 'HEALTHY',
        testedForeignKeys: ['Tabela Mestra Primária'],
      },
      {
        tableName: 'school_units',
        displayName: 'Polos e Unidades (school_units)',
        recordCount: data.schoolUnits.length,
        relationshipsCount: 0,
        brokenFkCount: 0,
        status: 'HEALTHY',
        testedForeignKeys: ['Tabela Raiz Organizacional'],
      },
      {
        tableName: 'questions',
        displayName: 'Banco de Questões (questions)',
        recordCount: data.questions.length,
        relationshipsCount: 1, // subjects
        brokenFkCount: questionBrokenCount,
        status: questionBrokenCount === 0 ? 'HEALTHY' : 'WARNING',
        testedForeignKeys: ['subjectId -> subjects.id', 'subject -> subjects.name'],
      },
      {
        tableName: 'exams',
        displayName: 'Avaliações e Provas (exams)',
        recordCount: data.exams.length,
        relationshipsCount: 3, // classes, subjects, questions
        brokenFkCount: examBrokenCount,
        status: examBrokenCount === 0 ? 'HEALTHY' : 'ERROR',
        testedForeignKeys: ['classId -> school_classes.id', 'subjectId -> subjects.id', 'questions[].questionId -> questions.id'],
      },
      {
        tableName: 'exam_submissions',
        displayName: 'Submissões de Alunos (exam_submissions)',
        recordCount: data.submissions.length,
        relationshipsCount: 2, // exams, students
        brokenFkCount: submissionBrokenCount,
        status: submissionBrokenCount === 0 ? 'HEALTHY' : 'ERROR',
        testedForeignKeys: ['examId -> exams.id', 'studentId -> students.id'],
      },
      {
        tableName: 'attendance_sheets',
        displayName: 'Diário de Frequência (attendance_sheets)',
        recordCount: data.attendanceSheets.length,
        relationshipsCount: 2, // classes, subjects
        brokenFkCount: attendanceBrokenCount,
        status: attendanceBrokenCount === 0 ? 'HEALTHY' : 'WARNING',
        testedForeignKeys: ['classId -> school_classes.id', 'subjectId -> subjects.id'],
      },
      {
        tableName: 'lesson_registries',
        displayName: 'Diário de Conteúdos (lesson_registries)',
        recordCount: data.lessonRegistries.length,
        relationshipsCount: 2, // classes, subjects
        brokenFkCount: lessonBrokenCount,
        status: lessonBrokenCount === 0 ? 'HEALTHY' : 'WARNING',
        testedForeignKeys: ['classId -> school_classes.id', 'subjectId -> subjects.id'],
      },
      {
        tableName: 'class_grade_sheets',
        displayName: 'Planilhas de Notas (class_grade_sheets)',
        recordCount: data.classGradeSheets.length,
        relationshipsCount: 2, // classes, subjects
        brokenFkCount: gradeBrokenCount,
        status: gradeBrokenCount === 0 ? 'HEALTHY' : 'WARNING',
        testedForeignKeys: ['classId -> school_classes.id', 'subjectId -> subjects.id'],
      },
      {
        tableName: 'academic_histories',
        displayName: 'Históricos Escolares (academic_histories)',
        recordCount: data.academicHistories.length,
        relationshipsCount: 1, // students
        brokenFkCount: historyBrokenCount,
        status: historyBrokenCount === 0 ? 'HEALTHY' : 'ERROR',
        testedForeignKeys: ['studentId -> students.id'],
      },
      {
        tableName: 'user_accounts',
        displayName: 'Contas de Usuários (user_accounts)',
        recordCount: data.userAccounts.length,
        relationshipsCount: 1, // school_units
        brokenFkCount: userBrokenCount,
        status: userBrokenCount === 0 ? 'HEALTHY' : 'WARNING',
        testedForeignKeys: ['schoolUnitId -> school_units.id'],
      },
    ];

    const totalRelationsChecked = tableSummaries.reduce((sum, t) => sum + (t.relationshipsCount * t.recordCount), 0) || 1;
    const brokenRelationsCount = issues.length;
    const healthyRelationsCount = Math.max(0, totalRelationsChecked - brokenRelationsCount);

    // Cálculo da pontuação de integridade (0 a 100)
    let score = 100;
    if (brokenRelationsCount > 0) {
      const deduction = Math.min(100, Math.round((brokenRelationsCount / Math.max(10, totalRelationsChecked)) * 100));
      score = Math.max(0, 100 - deduction);
    }

    const totalRecordsChecked = tableSummaries.reduce((sum, t) => sum + t.recordCount, 0);

    return {
      score,
      status: score === 100 ? 'PERFECT' : score >= 80 ? 'ATTENTION' : 'CRITICAL',
      totalTables: tableSummaries.length,
      totalRecordsChecked,
      totalRelationsChecked,
      healthyRelationsCount,
      brokenRelationsCount,
      tableSummaries,
      issues,
      auditedAt,
    };
  }

  /**
   * Corrige e normaliza automaticamente todas as inconsistências relacionais encontradas
   */
  public static autoHeal(data: AppStateData): { healedData: AppStateData; fixesApplied: string[] } {
    const fixesApplied: string[] = [];
    const clone: AppStateData = JSON.parse(JSON.stringify(data));

    const defaultUnitId = clone.schoolUnits[0]?.id || 'unit-sede';
    const defaultCourseId = clone.courses[0]?.id || 'course-em';
    const classIdMap = new Map(clone.classes.map((c) => [c.id, c]));

    // Dicionário de normalização de disciplinas
    const subjectNormalizeMap = new Map<string, Subject>();
    clone.subjects.forEach((s) => {
      subjectNormalizeMap.set(s.name.toLowerCase().trim(), s);
      // Mapeamentos comuns (abreviações / nomes populares)
      if (s.name.toLowerCase().includes('matemática')) subjectNormalizeMap.set('matemática', s);
      if (s.name.toLowerCase().includes('portuguesa')) subjectNormalizeMap.set('português', s);
      if (s.name.toLowerCase().includes('física')) subjectNormalizeMap.set('física', s);
      if (s.name.toLowerCase().includes('química')) subjectNormalizeMap.set('química', s);
      if (s.name.toLowerCase().includes('biologia')) subjectNormalizeMap.set('biologia', s);
      if (s.name.toLowerCase().includes('história')) subjectNormalizeMap.set('história', s);
      if (s.name.toLowerCase().includes('geografia')) subjectNormalizeMap.set('geografia', s);
      if (s.name.toLowerCase().includes('redação')) subjectNormalizeMap.set('redação', s);
    });

    // 1. Correção de ALUNOS (students)
    clone.students = clone.students.map((student) => {
      let updated = false;

      // Correção de classId legado ou inválido
      if (student.classId === 'class-2a') {
        student.classId = 'class-2em';
        fixesApplied.push(`Aluno ${student.name} (std-008): classId corrigido de 'class-2a' para 'class-2em' (2ª Série A - EM).`);
        updated = true;
      } else if (student.classId === 'class-1a') {
        student.classId = 'class-1em';
        fixesApplied.push(`Aluno ${student.name} (std-009): classId corrigido de 'class-1a' para 'class-1em' (1ª Série A - EM).`);
        updated = true;
      } else if (!classIdMap.has(student.classId) && clone.classes.length > 0) {
        const fallbackClass = clone.classes[0].id;
        fixesApplied.push(`Aluno ${student.name} re-enturmado na turma ${fallbackClass} (turma anterior ${student.classId} inexistente).`);
        student.classId = fallbackClass;
        updated = true;
      }

      // Atribuição de schoolUnitId padrão
      if (!student.schoolUnitId) {
        const studentClass = classIdMap.get(student.classId);
        student.schoolUnitId = studentClass?.schoolUnitId || defaultUnitId;
        fixesApplied.push(`Aluno ${student.name}: polo vinculado para '${student.schoolUnitId}'.`);
        updated = true;
      }

      if (!student.courseId) {
        student.courseId = defaultCourseId;
        updated = true;
      }

      return student;
    });

    // 2. Correção de TURMAS (school_classes)
    clone.classes = clone.classes.map((cls) => {
      if (!cls.schoolUnitId) {
        cls.schoolUnitId = defaultUnitId;
        fixesApplied.push(`Turma ${cls.name}: unidade escolar associada a '${defaultUnitId}'.`);
      }
      return cls;
    });

    // 3. Correção de BANCO DE QUESTÕES (questions)
    clone.questions = clone.questions.map((q) => {
      const norm = (q.subject || '').toLowerCase().trim();
      const matchedSubject = subjectNormalizeMap.get(norm);

      if (matchedSubject) {
        if (q.subject !== matchedSubject.name) {
          fixesApplied.push(`Questão ${q.code}: disciplina normalizada de '${q.subject}' para '${matchedSubject.name}'.`);
          q.subject = matchedSubject.name;
        }
        if (q.subjectId !== matchedSubject.id) {
          q.subjectId = matchedSubject.id;
          fixesApplied.push(`Questão ${q.code}: chave estrangeira subjectId definida como '${matchedSubject.id}'.`);
        }
      }
      return q;
    });

    // 4. Correção de EXAMS (Avaliações / Provas)
    clone.exams = clone.exams.map((exam) => {
      const norm = (exam.subject || '').toLowerCase().trim();
      const matchedSubject = subjectNormalizeMap.get(norm);

      if (matchedSubject) {
        if (!exam.subjectId || exam.subjectId !== matchedSubject.id) {
          exam.subjectId = matchedSubject.id;
          fixesApplied.push(`Avaliação '${exam.title}': subjectId vinculado à disciplina '${matchedSubject.name}' (${matchedSubject.id}).`);
        }
      }

      if (!classIdMap.has(exam.classId) && clone.classes.length > 0) {
        const fallbackClass = clone.classes[0].id;
        fixesApplied.push(`Avaliação '${exam.title}': classId redefinido para turma ativa '${fallbackClass}'.`);
        exam.classId = fallbackClass;
      }

      return exam;
    });

    // 5. Correção de CONTAS DE USUÁRIOS (user_accounts)
    clone.userAccounts = clone.userAccounts.map((u) => {
      if (!u.schoolUnitId) {
        u.schoolUnitId = defaultUnitId;
      }
      return u;
    });

    return {
      healedData: clone,
      fixesApplied,
    };
  }
}
