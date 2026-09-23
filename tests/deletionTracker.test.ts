import { beforeEach, describe, expect, it } from 'vitest';
import {
  computeRemovals,
  recordDeletions,
  clearRecreated,
  getPendingDeletes,
  withoutTombstones,
  flushPendingDeletes,
  PENDING_DELETES_KEY,
} from '../src/services/datasync/deletionTracker';

const mem: Record<string, string> = {};
(globalThis as any).localStorage = {
  getItem: (k: string) => (k in mem ? mem[k] : null),
  setItem: (k: string, v: string) => { mem[k] = String(v); },
  removeItem: (k: string) => { delete mem[k]; },
};

const many = (n: number, p = 's') => Array.from({ length: n }, (_, i) => ({ id: `${p}${i}` }));

beforeEach(() => { for (const k of Object.keys(mem)) delete mem[k]; });

describe('computeRemovals', () => {
  it('detecta exclusões por tabela', () => {
    const { removals } = computeRemovals(
      { students: [{ id: 'a' }, { id: 'b' }], classes: [{ id: 'c1' }] },
      { students: [{ id: 'a' }], classes: [] }
    );
    expect(removals).toEqual({ students: ['b'], school_classes: ['c1'] });
  });

  it('não envia remoção em massa (limpar base / restaurar backup)', () => {
    const { removals, skippedMass } = computeRemovals({ students: many(40) }, { students: [] });
    expect(removals).toEqual({});
    expect(skippedMass).toEqual(['students']);
  });

  it('muitas exclusões numa tabela grande não contam como massa', () => {
    const { removals } = computeRemovals({ students: many(100) }, { students: many(100).slice(0, 75) });
    expect(removals.students).toHaveLength(25);
  });
});

describe('fila de exclusões', () => {
  it('registra sem duplicar e esquece o que foi recriado', () => {
    recordDeletions({ students: [{ id: 'a' }, { id: 'b' }] }, { students: [{ id: 'a' }] });
    recordDeletions({ students: [{ id: 'a' }, { id: 'b' }] }, { students: [{ id: 'a' }] });
    expect(getPendingDeletes()).toHaveLength(1);
    clearRecreated({ students: [{ id: 'a' }, { id: 'b' }] });
    expect(getPendingDeletes()).toHaveLength(0);
  });

  it('esconde da leitura da nuvem o que foi excluído localmente', () => {
    recordDeletions({ subjects: [{ id: 'x' }, { id: 'y' }] }, { subjects: [{ id: 'y' }] });
    expect(withoutTombstones('subjects', [{ id: 'x' }, { id: 'y' }])).toEqual([{ id: 'y' }]);
    expect(withoutTombstones('students', [{ id: 'x' }])).toEqual([{ id: 'x' }]);
  });
});

describe('flushPendingDeletes', () => {
  const fakeClient = (fail: string[] = []) => {
    const calls: Array<{ table: string; ids: string[] }> = [];
    return {
      calls,
      from: (table: string) => ({
        delete: () => ({
          in: async (_c: string, ids: string[]) => {
            calls.push({ table, ids });
            return { error: fail.includes(table) ? { message: 'rls' } : null };
          },
        }),
      }),
    };
  };

  it('ADMIN: envia DELETE e limpa a fila', async () => {
    recordDeletions({ students: [{ id: 'a' }], classes: [{ id: 'c' }] }, { students: [], classes: [] });
    const c = fakeClient();
    const r = await flushPendingDeletes(c, true);
    expect(r).toEqual({ deleted: 2, failed: 0 });
    expect(c.calls).toHaveLength(2);
    expect(getPendingDeletes()).toHaveLength(0);
  });

  it('falha mantém a pendência para tentar de novo', async () => {
    recordDeletions({ students: [{ id: 'a' }], classes: [{ id: 'c' }] }, { students: [], classes: [] });
    const r = await flushPendingDeletes(fakeClient(['school_classes']), true);
    expect(r).toEqual({ deleted: 1, failed: 1 });
    expect(getPendingDeletes().map((p) => p.table)).toEqual(['school_classes']);
  });

  it('não-ADMIN não envia nada (RLS) e mantém as pendências', async () => {
    recordDeletions({ students: [{ id: 'a' }] }, { students: [] });
    const c = fakeClient();
    expect(await flushPendingDeletes(c, false)).toEqual({ deleted: 0, failed: 0 });
    expect(c.calls).toHaveLength(0);
    expect(JSON.parse(mem[PENDING_DELETES_KEY])).toHaveLength(1);
  });
});
