import { describe, expect, it } from 'vitest';
import {
  destinationText,
  matchesMovement,
  originText,
  registerExternalArrival,
  transferOutOfNetwork,
  transferWithinNetwork,
} from '../src/services/students/transfers';

const base: any = { id: 's1', name: 'Ana', enrollmentNumber: '123', schoolUnitId: 'u1', classId: 'c1', status: 'ACTIVE', series: '1º ANO', schoolOriginName: 'ESCOLA A' };

describe('transferência de alunos', () => {
  it('entre escolas da rede: mesmo cadastro, nova escola/turma e registro de origem e destino', () => {
    const t = transferWithinNetwork(base, {
      toUnit: { id: 'u2', name: 'ESCOLA B' },
      toClass: { id: 'c9', name: '2A', gradeLevel: '2º ANO', shift: 'TARDE' as any },
      fromUnitName: 'ESCOLA A',
      fromClassName: '1A',
      date: '2026-10-02',
      registeredBy: 'Leandro',
    });
    expect(t.id).toBe('s1');
    expect(t.enrollmentNumber).toBe('123');
    expect(t.schoolUnitId).toBe('u2');
    expect(t.classId).toBe('c9');
    expect(t.schoolOriginName).toBe('ESCOLA B');
    expect(t.series).toBe('2º ANO');
    expect(t.status).toBe('ACTIVE');
    expect(t.transfers).toHaveLength(1);
    expect(t.transfers![0]).toMatchObject({ kind: 'REDE', fromUnitId: 'u1', fromUnitName: 'ESCOLA A', fromClassId: 'c1', toUnitId: 'u2', toUnitName: 'ESCOLA B', date: '2026-10-02', registeredBy: 'Leandro' });
    expect(destinationText(t)).toBe('Rede: ESCOLA A → ESCOLA B');
    expect(originText(t)).toBe('Rede: ESCOLA A');
  });

  it('não transfere para a mesma escola nem sem destino', () => {
    expect(() => transferWithinNetwork(base, { toUnit: { id: 'u1', name: 'A' } })).toThrow();
    expect(() => transferOutOfNetwork(base, { schoolName: '  ' })).toThrow();
  });

  it('para fora da rede: situação Transferido com destino registrado', () => {
    const t = transferOutOfNetwork(base, { schoolName: 'E.E. Tiradentes', city: 'Redenção', state: 'pa', network: 'ESTADUAL' });
    expect(t.status).toBe('TRANSFERRED');
    expect(t.schoolUnitId).toBe('u1');
    expect(destinationText(t)).toBe('Fora da rede: E.E. Tiradentes – Redenção/PA (Rede estadual)');
  });

  it('vindo de fora da rede: registra procedência sem mudar escola', () => {
    const t = registerExternalArrival(base, { schoolName: 'Colégio X', city: 'Marabá', state: 'PA', network: 'PARTICULAR' });
    expect(t.schoolUnitId).toBe('u1');
    expect(t.status).toBe('ACTIVE');
    expect(originText(t)).toBe('Fora da rede: Colégio X – Marabá/PA (Escola particular)');
  });

  it('filtros de movimentação por escola', () => {
    const moved = transferWithinNetwork(base, { toUnit: { id: 'u2', name: 'B' } });
    const outside = registerExternalArrival({ ...base, id: 's2' }, { schoolName: 'X' });
    const left = transferOutOfNetwork({ ...base, id: 's3' }, { schoolName: 'Y' });
    const u1 = new Set(['u1']);
    const u2 = new Set(['u2']);
    expect(matchesMovement(moved, 'REDE_ENVIADOS', u1)).toBe(true);
    expect(matchesMovement(moved, 'REDE_RECEBIDOS', u1)).toBe(false);
    expect(matchesMovement(moved, 'REDE_RECEBIDOS', u2)).toBe(true);
    expect(matchesMovement(moved, 'REDE', null)).toBe(true);
    expect(matchesMovement(base, 'REDE', null)).toBe(false);
    expect(matchesMovement(outside, 'FORA_ENTRADAS', u1)).toBe(true);
    expect(matchesMovement(outside, 'FORA_ENTRADAS', u2)).toBe(false);
    expect(matchesMovement(left, 'FORA_SAIDAS', null)).toBe(true);
    expect(matchesMovement(base, 'ALL', u2)).toBe(true);
  });
});
