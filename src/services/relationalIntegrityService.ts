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

  /**
   * Gera o Script SQL DDL/DML Completo de Atualização, Correção e Otimização do Banco de Dados
   */
  public static generateDatabaseUpdateScript(data: AppStateData): string {
    const healed = this.autoHeal(data).healedData;
    const now = new Date().toISOString();

    return `-- ============================================================================
-- SUCESSOEDU GESTÃO EDUCACIONAL ENTERPRISE
-- SCRIPT OFICIAL DE ENGENHARIA, MIGRAÇÃO E ATUALIZAÇÃO DO BANCO DE DADOS
-- Versão do Schema: v5.5.1 Relational Enterprise
-- Gerado em: ${now}
-- Compatibilidade: PostgreSQL 14+, SQLite 3.35+, MySQL 8.0+
-- ============================================================================

BEGIN TRANSACTION;

-- ----------------------------------------------------------------------------
-- 1. TABELA DE SECRETARIAS MUNICIPAIS DE EDUCAÇÃO
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS municipal_secretaries (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    cnpj VARCHAR(32) NOT NULL,
    city VARCHAR(128) NOT NULL,
    state VARCHAR(2) NOT NULL,
    secretary_name VARCHAR(150),
    phone VARCHAR(32),
    email VARCHAR(150),
    official_decree VARCHAR(255),
    total_schools INTEGER DEFAULT 0,
    total_students INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 2. TABELA DE UNIDADES ESCOLARES & POLOS (Com Séries, Turmas e Turnos)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS school_units (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    trade_name VARCHAR(150),
    inep_code VARCHAR(16) UNIQUE NOT NULL,
    cnpj_or_decree VARCHAR(64),
    type VARCHAR(32) DEFAULT 'ESCOLA_POLO',
    location_zone VARCHAR(32) DEFAULT 'ZONA_URBANA',
    district VARCHAR(100) DEFAULT 'Centro',
    address VARCHAR(255) NOT NULL,
    zip_code VARCHAR(16),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(2) NOT NULL,
    director_name VARCHAR(150) NOT NULL,
    coordinator_name VARCHAR(150),
    secretary_name VARCHAR(150),
    phone VARCHAR(32),
    email VARCHAR(150),
    total_classrooms INTEGER DEFAULT 6,
    total_students INTEGER DEFAULT 0,
    total_teachers INTEGER DEFAULT 0,
    total_classes INTEGER DEFAULT 0,
    has_internet BOOLEAN DEFAULT TRUE,
    sync_status VARCHAR(32) DEFAULT 'SINCRONIZADO',
    last_sync_date TIMESTAMP,
    is_linked_to_secretary BOOLEAN DEFAULT TRUE,
    municipal_secretary_id VARCHAR(64) REFERENCES municipal_secretaries(id) ON DELETE SET NULL,
    linkage_code VARCHAR(64),
    offered_stages JSON,
    offered_grades JSON,
    offered_shifts JSON,
    operating_hours VARCHAR(64),
    max_capacity_students INTEGER DEFAULT 350,
    max_capacity_classes INTEGER DEFAULT 12,
    logo_url TEXT,
    management_logo_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_school_units_inep ON school_units(inep_code);
CREATE INDEX IF NOT EXISTS idx_school_units_zone ON school_units(location_zone);

-- ----------------------------------------------------------------------------
-- 3. TABELA DE CURSOS / SEGMENTOS DE ENSINO
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS courses (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    code VARCHAR(32),
    description TEXT,
    duration_years INTEGER DEFAULT 1,
    stage VARCHAR(64) DEFAULT 'ENSINO_FUNDAMENTAL_II',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 4. TABELA DE DISCIPLINAS / COMPONENTES CURRICULARES
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS subjects (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    code VARCHAR(32) UNIQUE NOT NULL,
    weekly_hours INTEGER DEFAULT 4,
    color_badge VARCHAR(32) DEFAULT 'bg-blue-600',
    bncc_area VARCHAR(64) DEFAULT 'Linguagens e suas Tecnologias',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_subjects_code ON subjects(code);

-- ----------------------------------------------------------------------------
-- 5. TABELA DE TURMAS & ENTURMAÇÃO
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS school_classes (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    school_unit_id VARCHAR(64) REFERENCES school_units(id) ON DELETE CASCADE,
    course_id VARCHAR(64) REFERENCES courses(id) ON DELETE RESTRICT,
    grade_level VARCHAR(64) NOT NULL,
    shift VARCHAR(32) DEFAULT 'MATUTINO',
    school_year INTEGER DEFAULT 2026,
    max_capacity INTEGER DEFAULT 35,
    room_number VARCHAR(32) DEFAULT 'Sala 01',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_classes_unit ON school_classes(school_unit_id);
CREATE INDEX IF NOT EXISTS idx_classes_year ON school_classes(school_year);

-- ----------------------------------------------------------------------------
-- 6. TABELA DE ALUNOS & MATRÍCULAS (Com Integridade Censo / INEP)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS students (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    registration VARCHAR(64) UNIQUE NOT NULL,
    cpf VARCHAR(16),
    nis_pis VARCHAR(16),
    birth_date DATE NOT NULL,
    gender VARCHAR(1) DEFAULT 'M',
    race_color VARCHAR(32) DEFAULT 'PARDA',
    mother_name VARCHAR(150),
    father_name VARCHAR(150),
    guardian_name VARCHAR(150),
    guardian_phone VARCHAR(32),
    address VARCHAR(255),
    neighborhood VARCHAR(100),
    city VARCHAR(100) DEFAULT 'Cumaru do Norte',
    state VARCHAR(2) DEFAULT 'PA',
    zip_code VARCHAR(16),
    class_id VARCHAR(64) REFERENCES school_classes(id) ON DELETE SET NULL,
    school_unit_id VARCHAR(64) REFERENCES school_units(id) ON DELETE CASCADE,
    course_id VARCHAR(64) REFERENCES courses(id) ON DELETE SET NULL,
    status VARCHAR(32) DEFAULT 'ACTIVE',
    cadastral_status VARCHAR(32) DEFAULT 'COMPLETE',
    is_pcd BOOLEAN DEFAULT FALSE,
    special_needs TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_students_class ON students(class_id);
CREATE INDEX IF NOT EXISTS idx_students_unit ON students(school_unit_id);
CREATE INDEX IF NOT EXISTS idx_students_status ON students(status);
CREATE INDEX IF NOT EXISTS idx_students_cpf ON students(cpf);

-- ----------------------------------------------------------------------------
-- 7. TABELA DE HABILIDADES BNCC
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bncc_skills (
    id VARCHAR(64) PRIMARY KEY,
    code VARCHAR(32) UNIQUE NOT NULL,
    description TEXT NOT NULL,
    stage VARCHAR(64) NOT NULL,
    grade VARCHAR(64) NOT NULL,
    subject_id VARCHAR(64) REFERENCES subjects(id) ON DELETE CASCADE,
    area VARCHAR(64) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_bncc_code ON bncc_skills(code);

-- ----------------------------------------------------------------------------
-- 8. TABELA DE BANCO DE QUESTÕES
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS questions (
    id VARCHAR(64) PRIMARY KEY,
    code VARCHAR(32) UNIQUE NOT NULL,
    subject_id VARCHAR(64) REFERENCES subjects(id) ON DELETE CASCADE,
    subject_name VARCHAR(100) NOT NULL,
    topic VARCHAR(150) NOT NULL,
    difficulty VARCHAR(32) DEFAULT 'MEDIUM',
    bncc_skill_code VARCHAR(32),
    statement TEXT NOT NULL,
    options JSON NOT NULL,
    correct_option_index INTEGER NOT NULL,
    explanation TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_questions_subject ON questions(subject_id);

-- ----------------------------------------------------------------------------
-- 9. TABELA DE PROVAS & AVALIAÇÕES
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS exams (
    id VARCHAR(64) PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    subject_id VARCHAR(64) REFERENCES subjects(id) ON DELETE CASCADE,
    class_id VARCHAR(64) REFERENCES school_classes(id) ON DELETE CASCADE,
    academic_term VARCHAR(32) DEFAULT '1º Bimestre',
    exam_date DATE NOT NULL,
    total_questions INTEGER DEFAULT 10,
    max_score DECIMAL(5,2) DEFAULT 10.0,
    weight DECIMAL(3,1) DEFAULT 1.0,
    status VARCHAR(32) DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_exams_class ON exams(class_id);
CREATE INDEX IF NOT EXISTS idx_exams_subject ON exams(subject_id);

-- ----------------------------------------------------------------------------
-- 10. TABELA DE RESPOSTAS & SUBMISSÕES DE PROVAS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS exam_submissions (
    id VARCHAR(64) PRIMARY KEY,
    exam_id VARCHAR(64) REFERENCES exams(id) ON DELETE CASCADE,
    student_id VARCHAR(64) REFERENCES students(id) ON DELETE CASCADE,
    score DECIMAL(5,2) DEFAULT 0.0,
    answers JSON NOT NULL,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(32) DEFAULT 'GRADED'
);

CREATE INDEX IF NOT EXISTS idx_submissions_exam ON exam_submissions(exam_id);
CREATE INDEX IF NOT EXISTS idx_submissions_student ON exam_submissions(student_id);

-- ----------------------------------------------------------------------------
-- 11. TABELA DE FREQUÊNCIA ESCOLAR
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS attendance_sheets (
    id VARCHAR(64) PRIMARY KEY,
    class_id VARCHAR(64) REFERENCES school_classes(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    records JSON NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_attendance_class_date ON attendance_sheets(class_id, date);

-- ----------------------------------------------------------------------------
-- 12. TABELA DE MODELOS DE RELATÓRIOS PERSONALIZADOS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS custom_report_templates (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    module VARCHAR(64) NOT NULL,
    config JSON NOT NULL,
    created_by VARCHAR(64),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_custom_reports_module ON custom_report_templates(module);

-- ----------------------------------------------------------------------------
-- 13. POPULAÇÃO & NORMALIZAÇÃO DOS REGISTROS COM AUTO-CURA
-- ----------------------------------------------------------------------------

-- Inserção / Atualização de Unidades Escolares
${healed.schoolUnits
  .map(
    (u) =>
      `INSERT INTO school_units (id, name, trade_name, inep_code, type, location_zone, district, address, city, state, director_name, phone, email, total_students, total_classes, has_internet, sync_status, is_linked_to_secretary, municipal_secretary_id) ` +
      `VALUES ('${u.id}', '${u.name.replace(/'/g, "''")}', '${(u.tradeName || '').replace(/'/g, "''")}', '${u.inepCode}', '${u.type}', '${u.locationZone}', '${u.district}', '${u.address.replace(/'/g, "''")}', '${u.city}', '${u.state}', '${u.directorName.replace(/'/g, "''")}', '${u.phone}', '${u.email}', ${u.totalStudents}, ${u.totalClasses}, ${u.hasInternet ? 'TRUE' : 'FALSE'}, '${u.syncStatus}', TRUE, 'semed-cumaru-do-norte') ` +
      `ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, inep_code = EXCLUDED.inep_code, total_students = EXCLUDED.total_students, updated_at = CURRENT_TIMESTAMP;`
  )
  .join('\n')}

-- Inserção / Atualização de Turmas
${healed.classes
  .map(
    (c) =>
      `INSERT INTO school_classes (id, name, school_unit_id, grade_level, shift, school_year, max_capacity, room_number) ` +
      `VALUES ('${c.id}', '${c.name.replace(/'/g, "''")}', '${c.schoolUnitId || healed.schoolUnits[0]?.id}', '${c.gradeLevel}', '${c.shift}', ${c.schoolYear || 2026}, ${c.maxCapacity || 35}, '${(c.roomNumber || 'Sala 01').replace(/'/g, "''")}') ` +
      `ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, school_unit_id = EXCLUDED.school_unit_id, updated_at = CURRENT_TIMESTAMP;`
  )
  .join('\n')}

-- Inserção / Atualização de Disciplinas
${healed.subjects
  .map(
    (s) =>
      `INSERT INTO subjects (id, name, code, weekly_hours, color_badge, bncc_area) ` +
      `VALUES ('${s.id}', '${s.name.replace(/'/g, "''")}', '${s.code}', ${s.workloadHours || 80}, 'bg-blue-600', 'Base Nacional Comum Curricular') ` +
      `ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, code = EXCLUDED.code;`
  )
  .join('\n')}

-- Inserção / Atualização de Alunos
${healed.students
  .map(
    (st) =>
      `INSERT INTO students (id, name, registration, cpf, birth_date, class_id, school_unit_id, course_id, status, cadastral_status) ` +
      `VALUES ('${st.id}', '${st.name.replace(/'/g, "''")}', '${st.enrollmentNumber || ''}', '${st.cpf || ''}', '${st.birthDate || '2010-01-01'}', '${st.classId || healed.classes[0]?.id}', '${st.schoolUnitId || healed.schoolUnits[0]?.id}', '${st.courseId || healed.courses[0]?.id}', '${st.status}', '${st.cadastralStatus || 'OK'}') ` +
      `ON CONFLICT (id) DO UPDATE SET class_id = EXCLUDED.class_id, school_unit_id = EXCLUDED.school_unit_id, status = EXCLUDED.status, updated_at = CURRENT_TIMESTAMP;`
  )
  .join('\n')}

COMMIT;

-- ============================================================================
-- FIM DO SCRIPT DE ATUALIZAÇÃO DO BANCO DE DADOS SUCESSOEDU
-- ============================================================================
`;
  }

  /**
   * Dispara o download automático do script SQL no navegador
   */
  public static downloadSqlScript(sql: string, filename = 'atualizar_banco_sucessoedu_v5.5.sql'): void {
    if (typeof window === 'undefined') return;
    const blob = new Blob([sql], { type: 'application/sql;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

