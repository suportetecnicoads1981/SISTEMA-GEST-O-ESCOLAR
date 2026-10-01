// Escola em foco: usuário da rede escolhe uma escola (ou sede + anexas) e as telas mostram só ela.
import { describe, it, expect } from 'vitest';
import { focusSchoolIds, scopeDataToFocus, restoreHiddenRecords } from '../src/services/rbac/schoolFocus';

const units = [
  { id: 'erminio', name: 'ERMINIO BRITO' },
  { id: 'castro', name: 'CASTRO ALVES', parentUnitId: 'erminio' },
  { id: 'zilda', name: 'ZILDA PEREIRA' },
];
const state: any = {
  schoolUnits: units,
  classes: [
    { id: 'c-e', schoolUnitId: 'erminio' },
    { id: 'c-c', schoolUnitId: 'castro' },
    { id: 'c-z', schoolUnitId: 'zilda' },
  ],
  students: [
    { id: 's1', schoolUnitId: 'erminio', classId: 'c-e' },
    { id: 's2', schoolUnitId: 'castro', classId: 'c-c' },
    { id: 's3', schoolUnitId: 'zilda', classId: 'c-z' },
  ],
  attendanceSheets: [{ id: 'a1', classId: 'c-z' }, { id: 'a2', classId: 'c-e' }],
  exams: [{ id: 'e-rede' }, { id: 'e-z', schoolUnitId: 'zilda' }],
};

describe('escola em foco', () => {
  it('monta as escolas do foco (com ou sem anexas)', () => {
    expect(focusSchoolIds(null, units)).toEqual([]);
    expect(focusSchoolIds({ unitId: 'erminio' }, units)).toEqual(['erminio']);
    expect(focusSchoolIds({ unitId: 'erminio', withAnnexes: true }, units)).toEqual(['erminio', 'castro']);
  });

  it('mostra só a escola em foco, mas mantém o cadastro de escolas completo', () => {
    const v = scopeDataToFocus(state, ['zilda']);
    expect(v.students.map((s: any) => s.id)).toEqual(['s3']);
    expect(v.classes.map((c: any) => c.id)).toEqual(['c-z']);
    expect(v.attendanceSheets.map((a: any) => a.id)).toEqual(['a1']);
    expect(v.exams.map((e: any) => e.id)).toEqual(['e-rede', 'e-z']);
    expect(v.schoolUnits).toHaveLength(3);
    expect(scopeDataToFocus(state, [])).toBe(state);
    const g = scopeDataToFocus(state, ['erminio', 'castro']);
    expect(g.students.map((s: any) => s.id)).toEqual(['s1', 's2']);
  });

  it('a tela regravando só a lista que conhecia não apaga as outras escolas', () => {
    const view = scopeDataToFocus(state, ['zilda']);
    const next = { ...state, students: [...view.students, { id: 's4', schoolUnitId: 'zilda' }] };
    const fixed = restoreHiddenRecords(state, next, ['zilda']);
    expect(fixed.students.map((s: any) => s.id).sort()).toEqual(['s1', 's2', 's3', 's4']);
    // excluir um aluno da escola em foco continua funcionando
    const del = restoreHiddenRecords(state, { ...state, students: state.students.filter((s: any) => s.id !== 's3') }, ['zilda']);
    expect(del.students.map((s: any) => s.id)).toEqual(['s1', 's2']);
    // transferir aluno para outra escola continua funcionando
    const moved = { ...state, students: state.students.map((s: any) => (s.id === 's3' ? { ...s, schoolUnitId: 'erminio' } : s)) };
    expect(restoreHiddenRecords(state, moved, ['zilda']).students.find((s: any) => s.id === 's3').schoolUnitId).toBe('erminio');
    // sem foco, nada muda
    expect(restoreHiddenRecords(state, next, [])).toBe(next);
  });
});
