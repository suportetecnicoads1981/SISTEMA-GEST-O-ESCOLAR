import { describe, expect, it } from 'vitest';
import { computeDropoutRisk, describeDropoutCriterion, normalizeDropoutConfig } from '../src/utils/dropoutRiskEngine';

const today = new Date(2026, 8, 29); // 29/09/2026

const sheet = (date: string, entries: Array<[string, 'PRESENTE' | 'FALTA' | 'FALTA_JUSTIFICADA']>, lesson = 1) =>
  ({
    id: `sh-${date}-${lesson}`,
    date,
    classId: 'c1',
    className: '5º ANO - MANHÃ',
    subjectId: 'x',
    subjectName: 'Português',
    teacherName: 'Prof',
    lessonNumber: lesson,
    term: '3º Bimestre',
    entries: entries.map(([studentId, status]) => ({ studentId, studentName: studentId, enrollmentNumber: '', status })),
    totalStudents: 0,
    totalPresent: 0,
    totalAbsent: 0,
    totalJustified: 0,
    attendanceRate: 0,
    createdAt: '',
    updatedAt: '',
  }) as any;

const students = [
  { id: 'ana', name: 'Ana', status: 'ACTIVE', classId: 'c1', schoolUnitId: 'u1' },
  { id: 'bia', name: 'Bia', status: 'ACTIVE', classId: 'c1', schoolUnitId: 'u1' },
  { id: 'caio', name: 'Caio', status: 'TRANSFERRED', classId: 'c1', schoolUnitId: 'u1' },
  { id: 'davi', name: 'Davi', status: 'ACTIVE', classId: 'c2', schoolUnitId: 'u2' },
] as any[];

describe('gatilho de risco de evasão por faltas sem justificativa', () => {
  const days = ['2026-09-01', '2026-09-02', '2026-09-03', '2026-09-04', '2026-09-08'];
  const sheets = [
    // Ana: 5 dias com falta (2 aulas no dia 01 contam 1 dia)
    ...days.map((d) => sheet(d, [['ana', 'FALTA'], ['bia', 'FALTA_JUSTIFICADA'], ['caio', 'FALTA'], ['davi', 'FALTA']])),
    sheet('2026-09-01', [['ana', 'FALTA'], ['bia', 'FALTA']], 2),
    // Falta de outro ano não conta no ano letivo
    sheet('2025-11-10', [['bia', 'FALTA']]),
  ];

  it('conta dias com falta sem justificativa e dispara no limite', () => {
    const r = computeDropoutRisk(students, sheets, { maxUnjustifiedAbsences: 5 }, { today });
    expect(r.atLimit.map((x) => [x.studentId, x.absences])).toEqual([
      ['ana', 5],
      ['davi', 5],
    ]);
    expect(r.atLimit[0].justified).toBe(0);
    expect(r.atLimit[0].lastAbsenceDate).toBe('2026-09-08');
  });

  it('falta justificada, aluno transferido e faltas de outro ano não contam', () => {
    const r = computeDropoutRisk(students, sheets, { maxUnjustifiedAbsences: 2, warnAtPercent: 50 }, { today });
    const ids = [...r.atLimit, ...r.nearLimit].map((x) => x.studentId);
    expect(ids).not.toContain('caio');
    // Bia: só 1 dia de falta sem justificativa (a de 2025 fica fora)
    expect(r.nearLimit.find((x) => x.studentId === 'bia')?.absences).toBe(1);
  });

  it('modo por aula conta cada aula', () => {
    const r = computeDropoutRisk(students, sheets, { maxUnjustifiedAbsences: 6, countMode: 'AULAS' }, { today });
    expect(r.atLimit.map((x) => [x.studentId, x.absences])).toEqual([['ana', 6]]);
  });

  it('período dos últimos dias', () => {
    const r = computeDropoutRisk(students, sheets, { maxUnjustifiedAbsences: 2, warnAtPercent: 50, period: 'ULTIMOS_DIAS', windowDays: 25 }, { today });
    // de 05/09 a 29/09: só o dia 08
    expect(r.atLimit).toEqual([]);
    expect(r.nearLimit.map((x) => x.studentId)).toEqual(['ana', 'davi']);
  });

  it('em atenção a partir do percentual e escopo por escola', () => {
    const r = computeDropoutRisk(students, sheets, { maxUnjustifiedAbsences: 6, warnAtPercent: 80 }, { today, schoolUnitId: 'u2' });
    expect(r.warnFrom).toBe(5);
    expect(r.nearLimit.map((x) => x.studentId)).toEqual(['davi']);
    expect(r.atLimit).toEqual([]);
  });

  it('alerta desligado não lista ninguém; valores inválidos voltam ao padrão', () => {
    expect(computeDropoutRisk(students, sheets, { enabled: false, maxUnjustifiedAbsences: 1 }, { today }).atLimit).toEqual([]);
    const c = normalizeDropoutConfig({ maxUnjustifiedAbsences: -3, windowDays: 9999, countMode: 'x' as any });
    expect(c.maxUnjustifiedAbsences).toBe(1);
    expect(c.windowDays).toBe(365);
    expect(c.countMode).toBe('DIAS');
    expect(describeDropoutCriterion(normalizeDropoutConfig({}))).toBe('10 dias com falta sem justificativa no ano letivo');
  });
});
