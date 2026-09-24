import { describe, it, expect } from 'vitest';
import {
  skillYears,
  componentFromCode,
  classYear,
  parseLevel,
  upsertAssessments,
  distribution,
  latestByStudentSkill,
  rowsToSkills,
  mergeSkills,
  rowsToAssessments,
  assessmentsToRows,
  skillMatchesYear,
} from '../src/services/bncc/bnccAssessmentService';
import type { BnccSkillAssessment } from '../src/types';

const av = (p: Partial<BnccSkillAssessment>): BnccSkillAssessment => ({
  id: p.id || Math.random().toString(),
  studentId: 's1',
  classId: 'c1',
  skillCode: 'EF05MA03',
  subject: 'Matemática',
  schoolYear: 2026,
  term: 1,
  level: 2,
  updatedAt: '2026-03-01T00:00:00Z',
  ...p,
});

describe('BNCC - códigos e anos', () => {
  it('deduz os anos pelo código', () => {
    expect(skillYears('EF05MA03')).toEqual([5]);
    expect(skillYears('EF15LP01')).toEqual([1, 2, 3, 4, 5]);
    expect(skillYears('EF69LP01')).toEqual([6, 7, 8, 9]);
    expect(skillYears('EI03EO01')).toEqual([0]);
    expect(skillYears('EM13LGG101')).toEqual([10, 11, 12]);
  });
  it('deduz o componente', () => {
    expect(componentFromCode('EF05MA03')).toBe('Matemática');
    expect(componentFromCode('EF12EF01')).toBe('Educação Física');
    expect(componentFromCode('EM13LGG101')).toBe('Linguagens e suas Tecnologias');
  });
  it('lê o ano da turma', () => {
    expect(classYear('5º Ano')).toBe(5);
    expect(classYear('PRÉ I')).toBe(0);
    expect(classYear('1ª Série - Ensino Médio')).toBe(10);
    expect(classYear('Turma X')).toBeNull();
    expect(skillMatchesYear({ code: 'EF15LP01', educationLevel: '' }, 3)).toBe(true);
    expect(skillMatchesYear({ code: 'EF69LP01', educationLevel: '' }, 3)).toBe(false);
  });
  it('aceita níveis por número, sigla ou nome', () => {
    expect(parseLevel('PD')).toBe(4);
    expect(parseLevel('d')).toBe(3);
    expect(parseLevel('Em desenvolvimento')).toBe(2);
    expect(parseLevel('Não desenvolvida')).toBe(1);
    expect(parseLevel('7')).toBeNull();
  });
});

describe('BNCC - lançamentos e resumos', () => {
  it('upsert mantém um registro por aluno+habilidade+ano+bimestre', () => {
    const a = av({ id: 'x', level: 1 });
    const out = upsertAssessments([a], [av({ id: 'y', level: 4 }), av({ id: 'z', term: 2, level: 3 })]);
    expect(out).toHaveLength(2);
    expect(out.find((o) => o.term === 1)).toMatchObject({ id: 'x', level: 4 });
  });
  it('distribuição e situação atual', () => {
    const list = [av({ level: 1 }), av({ term: 2, level: 4 }), av({ studentId: 's2', level: 3 })];
    const d = distribution(list);
    expect(d.total).toBe(3);
    expect(d.achievedPct).toBeCloseTo(66.7, 1);
    const latest = latestByStudentSkill(list);
    expect(latest).toHaveLength(2);
    expect(latest.find((l) => l.studentId === 's1')!.level).toBe(4);
    expect(latestByStudentSkill(list, 1).find((l) => l.studentId === 's1')!.level).toBe(1);
  });
});

describe('BNCC - importação/exportação', () => {
  it('importa catálogo de habilidades com colunas variadas', () => {
    const { skills, errors } = rowsToSkills([
      { codigo: '(EF05MA03)', 'Descrição da habilidade': 'Identificar e representar frações.' },
      { Código: 'XX', Descrição: 'inválida' },
      { Código: 'EF05MA03', Descrição: 'duplicada' },
    ]);
    expect(skills).toHaveLength(1);
    expect(skills[0]).toMatchObject({ code: 'EF05MA03', subject: 'Matemática', educationLevel: '5º Ano' });
    expect(errors).toHaveLength(1);
    const merged = mergeSkills([{ ...skills[0], id: 'old', description: 'antiga' }], skills);
    expect(merged).toMatchObject({ added: 0, updated: 1 });
    expect(merged.list[0].id).toBe('old');
  });
  it('importa lançamentos por matrícula ou nome e exporta de volta', () => {
    const ctx = {
      students: [
        { id: 's1', name: 'Ana Souza', enrollmentNumber: '2026001', classId: 'c1' },
        { id: 's2', name: 'Bruno Lima', enrollmentNumber: '2026002', classId: 'c1' },
      ],
      classes: [{ id: 'c1', name: '5º ANO - MANHÃ' }],
      skills: [],
      defaultYear: 2026,
    };
    const { list, errors } = rowsToAssessments(
      [
        { Matrícula: '2026001', Código: 'EF05MA03', Bimestre: '2º', Nível: 'PD' },
        { Aluno: 'bruno lima', Turma: '5º ANO - MANHÃ', Código: 'EF05MA03', Nível: 2 },
        { Matrícula: '999', Código: 'EF05MA03', Nível: 'D' },
        { Matrícula: '2026001', Código: 'EF05MA03', Nível: 'X' },
      ],
      ctx,
      new Map()
    );
    expect(list).toHaveLength(2);
    expect(list[0]).toMatchObject({ studentId: 's1', term: 2, level: 4, subject: 'Matemática', classId: 'c1' });
    expect(list[1]).toMatchObject({ studentId: 's2', term: 1, level: 2 });
    expect(errors).toHaveLength(2);
    expect(list[0].id).toBe('bncc-av-s1-EF05MA03-2026-2');
    const rows = assessmentsToRows(list, ctx);
    expect(rows[0]).toMatchObject({ Matrícula: '2026001', Aluno: 'Ana Souza', Nível: 'PD' });
  });
});
