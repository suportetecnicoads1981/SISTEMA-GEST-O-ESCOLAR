import { describe, it, expect } from 'vitest';
import { provisionalRaFor, isProvisionalRa } from '../src/services/raService';
import { normalizeSchoolLinks } from '../src/utils/schoolDataNormalizer';

describe('RA gerado pela nuvem', () => {
  it('RA provisório é estável por aluno e diferente entre alunos', () => {
    expect(provisionalRaFor('std-imp-1')).toBe(provisionalRaFor('std-imp-1'));
    expect(provisionalRaFor('std-imp-1')).not.toBe(provisionalRaFor('std-imp-2'));
    expect(isProvisionalRa(provisionalRaFor('x'))).toBe(true);
    expect(isProvisionalRa('RA-2026-0001')).toBe(false);
  });

  it('normalizador não numera localmente: repetido vira provisório', () => {
    const unit = { id: 'u1', name: 'ESCOLA A' } as any;
    const students = [
      { id: 'a', name: 'ANA', enrollmentNumber: 'RA-2026-0010', schoolUnitId: 'u1', createdAt: '2026-01-01' },
      { id: 'b', name: 'BIA', enrollmentNumber: 'RA-2026-0010', schoolUnitId: 'u1', createdAt: '2026-02-01' },
      { id: 'c', name: 'CAU', enrollmentNumber: '', schoolUnitId: 'u1' },
    ] as any[];
    const r = normalizeSchoolLinks({ schoolUnits: [unit], classes: [], students } as any);
    const out = (r.data.students || []) as any[];
    expect(out.find((s) => s.id === 'a').enrollmentNumber).toBe('RA-2026-0010');
    expect(out.find((s) => s.id === 'b').enrollmentNumber).toBe(provisionalRaFor('b'));
    expect(out.find((s) => s.id === 'c').enrollmentNumber).toBe(provisionalRaFor('c'));
    // segunda passada não muda mais nada (idempotente)
    expect(normalizeSchoolLinks(r.data as any).changed).toBe(false);
  });
});
