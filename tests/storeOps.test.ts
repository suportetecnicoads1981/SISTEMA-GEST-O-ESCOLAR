import { describe, expect, it } from 'vitest';
import { applyOps, compactOps, diffStates } from '../src/services/offline/storeOps';

describe('storeOps: sincronização por registro', () => {
  it('gera inclusão, alteração, exclusão e substituição de valor', () => {
    const prev = { students: [{ id: 'a', n: 1 }, { id: 'b', n: 1 }], settings: { name: 'X' } };
    const next = { students: [{ id: 'a', n: 2 }, { id: 'c', n: 1 }], settings: { name: 'Y' } };
    const { ops } = diffStates(prev, next);
    expect(ops).toEqual(
      expect.arrayContaining([
        { k: 'students', t: 'u', id: 'a', v: { id: 'a', n: 2 } },
        { k: 'students', t: 'u', id: 'c', v: { id: 'c', n: 1 } },
        { k: 'students', t: 'd', id: 'b' },
        { k: 'settings', t: 's', v: { name: 'Y' } },
      ])
    );
    expect(ops).toHaveLength(4);
  });

  it('duas estações gravando ao mesmo tempo não apagam o trabalho uma da outra', () => {
    const server = { students: [{ id: 'a', n: 1 }] };
    const opsA = diffStates(server, { students: [{ id: 'a', n: 1 }, { id: 'da-estacao-A', n: 1 }] }).ops;
    const opsB = diffStates(server, { students: [{ id: 'a', n: 9 }, { id: 'da-estacao-B', n: 1 }] }).ops;
    const afterA = applyOps(server, opsA);
    const afterB = applyOps(afterA, opsB);
    expect(afterB.students.map((s: any) => s.id).sort()).toEqual(['a', 'da-estacao-A', 'da-estacao-B']);
    expect(afterB.students.find((s: any) => s.id === 'a').n).toBe(9);
  });

  it('não envia remoção em massa (limpeza/restauração acidental)', () => {
    const prev = { students: Array.from({ length: 30 }, (_, i) => ({ id: `s${i}` })) };
    const { ops, skippedMass } = diffStates(prev, { students: [] });
    expect(ops).toHaveLength(0);
    expect(skippedMass).toEqual(['students']);
  });

  it('chave ausente no novo estado não apaga nada no servidor', () => {
    expect(diffStates({ __deletionLog: [{ id: 'x' }] }, {}).ops).toHaveLength(0);
  });

  it('compacta mantendo só a última operação por registro', () => {
    const ops = compactOps([
      { k: 'students', t: 'u', id: 'a', v: 1 },
      { k: 'students', t: 'u', id: 'a', v: 2 },
      { k: 'students', t: 'd', id: 'b' },
      { k: 'settings', t: 's', v: 1 },
      { k: 'settings', t: 's', v: 2 },
    ]);
    expect(ops).toEqual([
      { k: 'students', t: 'u', id: 'a', v: 2 },
      { k: 'students', t: 'd', id: 'b' },
      { k: 'settings', t: 's', v: 2 },
    ]);
  });

  it('excluir e recriar o mesmo registro não duplica', () => {
    const out = applyOps({ students: [{ id: 'a' }, { id: 'b' }] }, [
      { k: 'students', t: 'd', id: 'a' },
      { k: 'students', t: 'u', id: 'a', v: { id: 'a', novo: true } },
    ]);
    expect(out.students).toEqual([{ id: 'a', novo: true }, { id: 'b' }]);
  });

  it('não altera o objeto original', () => {
    const base = { students: [{ id: 'a' }] };
    applyOps(base, [{ k: 'students', t: 'd', id: 'a' }]);
    expect(base.students).toHaveLength(1);
  });
});

describe('localServerSync: fila preserva numeração', () => {
  it('uma nova gravação durante o envio não renumera o que já estava na fila', async () => {
    const mem: Record<string, string> = {};
    (globalThis as any).localStorage = {
      getItem: (k: string) => (k in mem ? mem[k] : null),
      setItem: (k: string, v: string) => { mem[k] = String(v); },
      removeItem: (k: string) => { delete mem[k]; },
    };
    (globalThis as any).window = { addEventListener() {}, dispatchEvent() {}, location: { protocol: 'http:', href: 'http://x/' } };
    const mod = await import('../src/services/offline/localServerSync');
    mod.__setLocalServerInfoForTests({ role: 'REMOTO', serverName: 'T', version: 0 });
    mod.enqueueLocalChanges({ students: [] }, { students: [{ id: 'a', n: 1 }] });
    const first = JSON.parse(mem[mod.LOCAL_OPS_KEY]);
    mod.enqueueLocalChanges({ students: [{ id: 'a', n: 1 }] }, { students: [{ id: 'a', n: 1 }, { id: 'b', n: 1 }] });
    const second = JSON.parse(mem[mod.LOCAL_OPS_KEY]);
    expect(second[0].seq).toBe(first[0].seq);
    expect(second.map((q: any) => q.op.id)).toEqual(['a', 'b']);
    mod.__resetLocalServerForTests();
  });
});
