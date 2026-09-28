import { describe, it, expect } from 'vitest';
import { mergeGradeHistories, groupStats, studentBimesters, studentFinal, avg1 } from '../src/services/gradeAnalytics';

const sheet = (term: string, subject: string, grades: any[]) =>
  ({ id: `${term}-${subject}`, classId: 'c1', className: '1º A', subjectId: subject, subjectName: subject, teacherName: 'Prof', schoolYear: 2026, term, grades, averagePassingGrade: 6, status: 'RASCUNHO', updatedAt: '' }) as any;
const e = (studentId: string, termAverage: number, extra: any = {}) => ({ studentId, studentName: studentId, enrollmentNumber: '', termAverage, status: 'EM_ANDAMENTO', ...extra });

describe('gradeAnalytics', () => {
  it('usa as notas do Diário de Notas por bimestre e ignora linhas sem nota', () => {
    const hs = mergeGradeHistories([], [
      sheet('1º Bimestre', 'Matemática', [e('a', 7, { examScore: 7 }), e('b', 0)]),
      sheet('2º Bimestre', 'Matemática', [e('a', 8, { examScore: 8 })]),
      sheet('1º Bimestre', 'Português', [e('a', 5, { examScore: 5 })]),
    ]);
    expect(hs.map((h) => h.studentId)).toEqual(['a']); // 'b' só tinha a média 0 inicial
    const a = hs[0];
    expect(studentBimesters(a, 'Matemática')).toEqual([7, 8, null, null]);
    expect(studentBimesters(a)).toEqual([6, 8, null, null]);
    expect(studentFinal(a, 'Matemática')).toBe(7.5);
    expect(studentFinal(a)).toBe(6.3); // (7,5 + 5) / 2 = 6,25 → 6,3
  });

  it('diário prevalece sobre o histórico no mesmo bimestre e mantém os demais', () => {
    const hist = [{ id: 'h', studentId: 'a', records: [{ id: 'r', subjectId: 'm', subjectName: 'Matemática', bimonthlyGrades: { b1: 4, b2: null, b3: 9, b4: null }, finalGrade: 6.5 }], generalAverage: 6.5, attendanceRate: 90 }] as any;
    const [a] = mergeGradeHistories(hist, [sheet('1º Bimestre', 'matematica', [e('a', 6, { examScore: 6 })])]);
    expect(a.records).toHaveLength(1);
    expect(a.records[0].bimonthlyGrades).toEqual({ b1: 6, b2: null, b3: 9, b4: null });
    expect(a.records[0].finalGrade).toBe(7.5);
  });

  it('sem notas devolve null (nunca número de exemplo)', () => {
    const st = groupStats(['x', 'y'], new Map(), 'ALL');
    expect(st).toEqual({ students: 2, withGrades: 0, bimesters: [null, null, null, null], bimesterApproval: [null, null, null, null], average: null, approval: null });
    expect(avg1([])).toBeNull();
  });

  it('aprovação da turma = % de alunos com média >= 6', () => {
    const hs = mergeGradeHistories([], [sheet('1º Bimestre', 'Matemática', [e('a', 8, { examScore: 8 }), e('b', 5, { examScore: 5 }), e('c', 6, { examScore: 6 })])]);
    const st = groupStats(['a', 'b', 'c', 'd'], new Map(hs.map((h) => [h.studentId, h])));
    expect(st.withGrades).toBe(3);
    expect(st.average).toBe(6.3);
    expect(st.approval).toBe(67);
  });
});
