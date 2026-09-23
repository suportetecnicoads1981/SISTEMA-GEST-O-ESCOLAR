import { describe, expect, it } from 'vitest';
import {
  buildLotePacket,
  computeLoteHash,
  loteDeletionsBetween,
  mergeLotePacket,
  parseLoteFile,
  stableStringify,
} from '../src/services/offline/batchPacket';

const unitRural = { id: 'unit-rural', name: 'E.M. Rio Verde', inepCode: '15012345' };
const unitOutra = { id: 'unit-outra', name: 'E.M. Centro', inepCode: '15099999' };

const rural = {
  schoolUnits: [unitRural],
  classes: [{ id: 'c1', name: '1º Ano' }],
  students: [
    { id: 's1', name: 'Ana', classId: 'c1' },
    { id: 's2', name: 'Bia', classId: 'c1' },
  ],
  classGradeSheets: [{ id: 'g1', classId: 'c1', notas: [8.5] }],
  attendanceSheets: [{ id: 'f1', classId: 'c1' }],
  lessonRegistries: [{ id: 'l1', classId: 'c1' }],
  academicHistories: [{ id: 'h1', studentId: 's1' }],
  subjects: [{ id: 'sub-mat', name: 'Matemática' }],
  userAccounts: [{ id: 'u1', password: 'hash-secreto' }],
};

function lote(state = rural, deletions: any[] = []) {
  return buildLotePacket(state, unitRural, {
    operatorName: 'Maria',
    originRole: 'REMOTO',
    includeUntagged: true,
    deletions,
    now: '2026-09-23T12:00:00.000Z',
  });
}

describe('lote .edusync formato 2', () => {
  it('leva notas, frequência, diário e históricos; não leva contas nem senhas', () => {
    const p = lote();
    expect(p.counts).toMatchObject({ students: 2, classes: 1, classGradeSheets: 1, attendanceSheets: 1, lessonRegistries: 1, academicHistories: 1, subjects: 1 });
    expect(JSON.stringify(p)).not.toContain('hash-secreto');
    expect(p.data.students.every((s: any) => s.schoolUnitId === 'unit-rural')).toBe(true);
  });

  it('SHA-256 detecta qualquer alteração no arquivo', () => {
    const p = lote();
    expect(parseLoteFile(JSON.stringify(p)).integrity).toBe('ok');
    const adulterado = JSON.parse(JSON.stringify(p));
    adulterado.data.classGradeSheets[0].notas = [10];
    expect(() => parseLoteFile(JSON.stringify(adulterado))).toThrow(/SHA-256/);
  });

  it('hash não depende da ordem das chaves', () => {
    expect(stableStringify({ b: 1, a: { d: 2, c: 3 } })).toBe(stableStringify({ a: { c: 3, d: 2 }, b: 1 }));
    const p = lote();
    const reordenado = Object.fromEntries(Object.entries(p).reverse());
    expect(computeLoteHash(reordenado as any)).toBe(p.sha256);
  });

  it('a Sede mescla sem apagar outras escolas e cria a unidade que não existia', () => {
    const sede = {
      schoolUnits: [unitOutra],
      classes: [{ id: 'cx', schoolUnitId: 'unit-outra' }],
      students: [{ id: 'sx', schoolUnitId: 'unit-outra', classId: 'cx' }],
      subjects: [{ id: 'sub-mat', name: 'Matemática (Sede)' }],
      syncLogs: [],
    };
    const { next, report } = mergeLotePacket(sede, lote(), 'Técnico', '2026-09-24T10:00:00.000Z');
    expect(next.students.map((s: any) => s.id).sort()).toEqual(['s1', 's2', 'sx']);
    expect(next.classGradeSheets).toHaveLength(1);
    expect(next.subjects).toEqual([{ id: 'sub-mat', name: 'Matemática (Sede)' }]); // catálogo da Sede prevalece
    expect(report.unitCreated).toBe(true);
    expect(next.schoolUnits.find((u: any) => u.id === 'unit-rural').totalStudents).toBe(2);
    expect(next.syncLogs[0].notes).toContain(lote().packetId);
  });

  it('identifica a escola pelo INEP quando o código interno é diferente na Sede', () => {
    const sede = { schoolUnits: [{ id: 'unit-sede-123', name: 'Rio Verde', inepCode: '15012345' }], students: [], classes: [] };
    const { next, report } = mergeLotePacket(sede, lote(), 'Técnico');
    expect(report.unitCreated).toBe(false);
    expect(next.students.every((s: any) => s.schoolUnitId === 'unit-sede-123')).toBe(true);
  });

  it('recusa sobrescrever registro de outra unidade (conflito)', () => {
    const sede = { schoolUnits: [unitRural, unitOutra], students: [{ id: 's1', name: 'Outro aluno', schoolUnitId: 'unit-outra' }], classes: [] };
    const { next, report } = mergeLotePacket(sede, lote(), 'Técnico');
    expect(next.students.find((s: any) => s.id === 's1').name).toBe('Outro aluno');
    expect(report.conflicts).toEqual([{ k: 'students', id: 's1', ownerUnitId: 'unit-outra' }]);
  });

  it('aplica na Sede as exclusões feitas na escola, só da própria escola', () => {
    const deletions = loteDeletionsBetween(
      { students: [...rural.students, { id: 's3' }] },
      { students: rural.students },
      '2026-09-23T11:00:00.000Z'
    );
    expect(deletions).toEqual([{ k: 'students', id: 's3', at: '2026-09-23T11:00:00.000Z' }]);
    const sede = {
      schoolUnits: [unitRural, unitOutra],
      students: [
        { id: 's3', schoolUnitId: 'unit-rural' },
        { id: 'sx', schoolUnitId: 'unit-outra' },
      ],
      classes: [],
    };
    const outraDeletion = { k: 'students', id: 'sx', at: '2026-09-23T11:00:00.000Z' };
    const { next, report } = mergeLotePacket(sede, lote(rural, [...deletions, outraDeletion]), 'Técnico');
    expect(next.students.map((s: any) => s.id)).not.toContain('s3');
    expect(next.students.map((s: any) => s.id)).toContain('sx');
    expect(report.deleted).toBe(1);
  });

  it('importar o mesmo lote duas vezes não duplica', () => {
    const p = lote();
    const first = mergeLotePacket({ schoolUnits: [], syncLogs: [] }, p, 'T').next;
    const { next, report } = mergeLotePacket(first, p, 'T');
    expect(next.students).toHaveLength(2);
    expect(report.alreadyImportedAt).toBeTruthy();
    expect(report.added.students).toBe(0);
  });

  it('lê pacote do formato antigo sinalizando falta de verificação', () => {
    const antigo = { packetId: 'SYNC-1', schoolUnit: unitRural, exportedAt: '2026-01-01', data: { students: [{ id: 'z' }] } };
    const parsed = parseLoteFile(JSON.stringify(antigo));
    expect(parsed.legacy).toBe(true);
    expect(parsed.integrity).toBe('ausente');
    expect(parsed.packet.data.students).toHaveLength(1);
  });

  it('rejeita arquivo que não é lote', () => {
    expect(() => parseLoteFile('{"a":1}')).toThrow(/não é um lote/);
    expect(() => parseLoteFile('xx')).toThrow(/ilegível/);
  });
});

describe('lote: proteções da Sede', () => {
  it('prioriza o INEP: mesmo código interno com INEP diferente vira outra escola', () => {
    const sede = { schoolUnits: [{ id: 'unit-rural', name: 'Outra escola', inepCode: '15088888' }], students: [], classes: [] };
    const { next, report } = mergeLotePacket(sede, lote(), 'T');
    expect(report.unitCreated).toBe(true);
    expect(report.unitId).not.toBe('unit-rural');
    expect(next.schoolUnits).toHaveLength(2);
    expect(next.students.every((s: any) => s.schoolUnitId === report.unitId)).toBe(true);
  });

  it('INEP de exemplo (12345678) não serve para identificar a escola', () => {
    const p = buildLotePacket(rural, { ...unitRural, id: 'x1', inepCode: '12345678' }, { operatorName: 'M', originRole: 'REMOTO', includeUntagged: true });
    const sede = { schoolUnits: [{ id: 'sede-u', name: 'Escola da Sede', inepCode: '12345678' }], students: [], classes: [] };
    expect(mergeLotePacket(sede, p, 'T').report.unitCreated).toBe(true);
  });

  it('não apaga registro sem dono ligado a nada do lote', () => {
    const sede = { schoolUnits: [unitRural], students: [{ id: 'solto', name: 'Sem unidade' }], classes: [] };
    const { next, report } = mergeLotePacket(sede, lote(rural, [{ k: 'students', id: 'solto', at: 'x' }]), 'T');
    expect(next.students.some((s: any) => s.id === 'solto')).toBe(true);
    expect(report.deleted).toBe(0);
  });

  it('identifica lote mais antigo que o último importado', async () => {
    const { isOlderThanLastImport } = await import('../src/services/offline/batchPacket');
    const novo = lote();
    const afterNew = mergeLotePacket({ schoolUnits: [] }, novo, 'T').next;
    const antigo = buildLotePacket(rural, unitRural, { operatorName: 'M', originRole: 'REMOTO', includeUntagged: true, now: '2026-09-01T00:00:00.000Z' });
    expect(isOlderThanLastImport(afterNew, antigo)).toBe(novo.createdAt);
    expect(isOlderThanLastImport(afterNew, novo)).toBeUndefined();
  });
});
