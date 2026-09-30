import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import {
  SCHOOL_SCOPED_COLLECTIONS,
  enforceSchoolScope,
  scopeDataToSchool,
  userSchoolScope,
} from '../src/services/rbac/schoolScope';
import { describeDenials, enforceDataPermissions } from '../src/services/rbac/accessControl';
import { buildRow, knownSchoolIds } from '../src/services/sync/cloudSync';
import { SYNC_TABLES } from '../src/services/sync/syncTables';

const full = (p: any) => ({ canRead: p, canCreate: p, canEdit: p, canDelete: p, canApprove: p });
const davi = {
  id: 'u-davi',
  sector: 'SECRETARIA',
  active: true,
  schoolUnitId: 'A',
  permissions: { secretaria: full(true), turmas: full(true), diarioClasse: full(true) } as any,
};
const rede = { ...davi, id: 'u-rede', schoolUnitId: '' };
const master = { ...davi, id: 'u-master', sector: 'MASTER', isMaster: true };

const base = () => ({
  schoolUnits: [{ id: 'A', name: 'EMEF CANAÃ' }, { id: 'B', name: 'OUTRA' }],
  classes: [
    { id: 'c1', name: '1º A', schoolUnitId: 'A' },
    { id: 'c2', name: '1º B', schoolUnitId: 'B' },
  ],
  students: [
    { id: 's1', name: 'Aluno A', classId: 'c1' },
    { id: 's2', name: 'Aluno B', classId: 'c2', schoolUnitId: 'B' },
  ],
  attendanceSheets: [
    { id: 'f1', classId: 'c1' },
    { id: 'f2', classId: 'c2' },
  ],
  academicHistories: [
    { id: 'h1', studentId: 's1' },
    { id: 'h2', studentId: 's2' },
  ],
  exams: [{ id: 'e0', title: 'Prova da rede' }, { id: 'e2', classId: 'c2' }],
  questions: [{ id: 'q1' }],
});

describe('escola de lotação: quem vê o quê', () => {
  it('Master e "Rede Municipal Global" veem a rede inteira', () => {
    expect(userSchoolScope(master)).toBeNull();
    expect(userSchoolScope(rede)).toBeNull();
    expect(userSchoolScope(davi)).toBe('A');
  });

  it('usuário lotado vê só a própria escola em todos os cadastros', () => {
    const v = scopeDataToSchool(base(), 'A');
    expect(v.schoolUnits.map((x) => x.id)).toEqual(['A']);
    expect(v.classes.map((x) => x.id)).toEqual(['c1']);
    expect(v.students.map((x) => x.id)).toEqual(['s1']); // escola pela turma
    expect(v.attendanceSheets.map((x) => x.id)).toEqual(['f1']);
    expect(v.academicHistories.map((x) => x.id)).toEqual(['h1']); // escola pelo aluno
    expect(v.exams.map((x) => x.id)).toEqual(['e0']); // prova da rede continua visível
    expect(v.questions).toHaveLength(1); // questões são da rede
  });

  it('escola apagada: o usuário não passa a ver a rede toda', () => {
    const v = scopeDataToSchool(base(), 'ESCOLA-APAGADA');
    expect(v.students).toHaveLength(0);
    expect(v.schoolUnits).toHaveLength(0);
  });

  it('sem escola de lotação, os dados passam intactos', () => {
    const d = base();
    expect(scopeDataToSchool(d, null)).toBe(d);
  });
});

describe('escola de lotação: gravação', () => {
  it('lista regravada só com a própria escola não apaga as outras escolas', () => {
    const prev = base();
    const next = { ...prev, students: [{ ...prev.students[0], name: 'Aluno A (editado)' }] };
    const r = enforceSchoolScope(prev, next, 'A');
    expect(r.next.students.map((s: any) => s.id).sort()).toEqual(['s1', 's2']);
    expect(r.next.students.find((s: any) => s.id === 's1').name).toBe('Aluno A (editado)');
    expect(r.denied).toEqual([]);
  });

  it('recusa alterar, mover ou excluir aluno de outra escola', () => {
    const prev = base();
    const edit = { ...prev, students: [prev.students[0], { ...prev.students[1], name: 'X' }] };
    expect(enforceSchoolScope(prev, edit, 'A').next.students[1].name).toBe('Aluno B');
    const move = { ...prev, students: [{ ...prev.students[0], classId: 'c2' }, prev.students[1]] };
    const moved = enforceSchoolScope(prev, move, 'A');
    expect(moved.next.students[0].classId).toBe('c1');
    expect(moved.denied).toEqual([{ collection: 'students', count: 1 }]);
  });

  it('inclusão sem escola recebe a escola do usuário; em outra escola é recusada', () => {
    const prev = base();
    const next = { ...prev, students: [...prev.students, { id: 's3', name: 'Novo' }, { id: 's4', name: 'Intruso', schoolUnitId: 'B' }] };
    const r = enforceSchoolScope(prev, next, 'A');
    expect(r.next.students.find((s: any) => s.id === 's3').schoolUnitId).toBe('A');
    expect(r.next.students.find((s: any) => s.id === 's4')).toBeUndefined();
    expect(r.denied).toEqual([{ collection: 'students', count: 1 }]);
  });

  it('frequência e histórico seguem a escola da turma e do aluno', () => {
    const prev = base();
    const next = {
      ...prev,
      attendanceSheets: [prev.attendanceSheets[0], { ...prev.attendanceSheets[1], present: 3 }],
      academicHistories: [{ ...prev.academicHistories[0], ok: true } as any],
    };
    const r = enforceSchoolScope(prev, next, 'A');
    expect(r.next.attendanceSheets[1]).toBe(prev.attendanceSheets[1]);
    expect(r.next.academicHistories.map((h: any) => h.id).sort()).toEqual(['h1', 'h2']);
    expect(r.next.academicHistories.find((h: any) => h.id === 'h1').ok).toBe(true);
  });

  it('entra no ponto único de gravação com aviso próprio', () => {
    const prev = base();
    const next = { ...prev, students: [prev.students[0], { ...prev.students[1], name: 'X' }] };
    const r = enforceDataPermissions(prev as any, next as any, davi as any);
    expect((r.next as any).students[1].name).toBe('Aluno B');
    expect(r.denied[0].otherSchool).toBe(true);
    expect(describeDenials(r.denied)).toContain('outra escola');
    // Rede e Master gravam em qualquer escola.
    expect((enforceDataPermissions(prev as any, next as any, rede as any).next as any).students[1].name).toBe('X');
    expect((enforceDataPermissions(prev as any, next as any, master as any).next as any).students[1].name).toBe('X');
  });
});

describe('vínculo com escola apagada na nuvem', () => {
  const users = SYNC_TABLES.find((t) => t.key === 'userAccounts')!;
  const u = { id: 'u1', name: 'Marcia', email: 'm@x.com', schoolUnitId: 'APAGADA' };

  it('coluna vai vazia (a nuvem não recusa) e o registro completo guarda a escola original', () => {
    const row = buildRow(users, 'u1', u, 3, knownSchoolIds({ schoolUnits: [{ id: 'A' }] }))!;
    expect(row.school_unit_id).toBeNull();
    expect(row.doc.schoolUnitId).toBe('APAGADA');
  });

  it('escola existente continua indo normalmente', () => {
    const row = buildRow(users, 'u1', { ...u, schoolUnitId: 'A' }, 3, knownSchoolIds({ schoolUnits: [{ id: 'A' }] }))!;
    expect(row.school_unit_id).toBe('A');
  });
});

describe('servidor da rede local: mesma regra de escola', () => {
  const ps = readFileSync(join(__dirname, '../public/offline/servidor_sucessoedu.ps1'), 'utf8');
  it('mesma lista de cadastros por escola', () => {
    const start = ps.indexOf("$SchoolScopedJson = @'\n");
    expect(start).toBeGreaterThan(0);
    const body = ps.slice(start + "$SchoolScopedJson = @'\n".length);
    expect(JSON.parse(body.slice(0, body.indexOf("\n'@")))).toEqual([...SCHOOL_SCOPED_COLLECTIONS]);
  });
  it('confere a escola em cada gravação', () => {
    expect(ps).toContain('return (Test-SchoolScopeOp $user $op $db $work $label)');
    expect(ps).toContain("$script:NetworkWideAllowed = @('exams')");
  });
});
