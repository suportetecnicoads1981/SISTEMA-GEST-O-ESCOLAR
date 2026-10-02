import { describe, expect, it } from 'vitest';
import { activeStudentsOfUnit, hasCadastralPending, isSpecialEducationStudent, isValidInep, schoolPerformance } from '../src/utils/networkIndicators';

const classes = [{ id: 'c1', schoolUnitId: 'u1' }, { id: 'c2', schoolUnitId: 'u2' }];

describe('indicadores reais da rede', () => {
  it('conta alunos ativos pelo vínculo ou pela turma', () => {
    const st = [
      { id: 'a', schoolUnitId: 'u1', status: 'ACTIVE' },
      { id: 'b', classId: 'c1', status: 'ACTIVE' },
      { id: 'c', classId: 'c1', status: 'TRANSFERRED' },
      { id: 'd', classId: 'c2' },
    ];
    expect(activeStudentsOfUnit('u1', st, classes).map((s) => s.id)).toEqual(['a', 'b']);
  });
  it('educação especial e pendências vêm do cadastro', () => {
    expect(isSpecialEducationStudent({ hasAEE: true })).toBe(true);
    expect(isSpecialEducationStudent({ cidCodes: ['F84.0'] })).toBe(true);
    expect(isSpecialEducationStudent({ specialConditions: [] })).toBe(false);
    expect(hasCadastralPending({ pendingFields: ['CPF'] })).toBe(true);
    expect(hasCadastralPending({ cadastralStatus: 'OK' })).toBe(false);
    expect(isValidInep('15552357')).toBe(true);
    expect(isValidInep('Pendente de Regularização Censo')).toBe(false);
  });
  it('sem notas lançadas não inventa média', () => {
    const sheets = [{ classId: 'c1', subjectName: 'Matemática', grades: [{ termAverage: 0 }, { termAverage: 7 }] }];
    expect(schoolPerformance('u1', classes, sheets)).toEqual({ overall: null, portuguese: null, math: null, gradesCount: 0 });
  });
  it('calcula médias só com notas lançadas', () => {
    const sheets = [
      { classId: 'c1', subjectName: 'Língua Portuguesa', grades: [{ examScore: 8, termAverage: 8 }, { examScore: 6, termAverage: 6 }] },
      { classId: 'c1', subjectName: 'MATEMATICA', grades: [{ assessment1: 5, termAverage: 5 }, { termAverage: 9 }] },
      { classId: 'c2', subjectName: 'Matemática', grades: [{ examScore: 10, termAverage: 10 }] },
    ];
    expect(schoolPerformance('u1', classes, sheets)).toEqual({ overall: 6.3, portuguese: 7, math: 5, gradesCount: 3 });
  });
});
