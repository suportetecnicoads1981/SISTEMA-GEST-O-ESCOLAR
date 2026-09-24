import { describe, it, expect } from 'vitest';
import { mergeDown } from '../src/services/offline/schoolDownSync';
import { buildSchoolSeed } from '../src/services/offline/offlinePackageBuilder';

describe('Servidor Remoto: recebimento da Sede (mescla em 3 vias)', () => {
  it('recebe registros novos e atualiza o que a escola não alterou', () => {
    const first = mergeDown([], [{ id: 'a', name: 'ANA' }], {});
    expect(first.added).toBe(1);
    const second = mergeDown(first.list, [{ id: 'a', name: 'ANA MARIA' }], first.hashes);
    expect(second.updated).toBe(1);
    expect(second.list[0].name).toBe('ANA MARIA');
  });

  it('mantém a alteração feita na escola que ainda não foi enviada', () => {
    const first = mergeDown([], [{ id: 'b', name: 'BIA' }], {});
    const r = mergeDown([{ id: 'b', name: 'BIA SOUZA' }], [{ id: 'b', name: 'BIA' }], first.hashes);
    expect(r.keptLocal).toBe(1);
    expect(r.list[0].name).toBe('BIA SOUZA');
  });

  it('nunca remove registros que só existem na escola', () => {
    const r = mergeDown([{ id: 't', name: 'TAKA' }], [{ id: 'a', name: 'ANA' }], {});
    expect(r.list.map((x) => x.id)).toEqual(['t', 'a']);
  });
});

describe('Pacote do Servidor Remoto: dados iniciais da escola', () => {
  it('leva só a escola escolhida e não leva senhas', () => {
    const seed: any = buildSchoolSeed(
      {
        schoolUnits: [{ id: 'u1', name: 'E1' }, { id: 'u2', name: 'E2' }],
        classes: [{ id: 'c1', schoolUnitId: 'u1' }, { id: 'c2', schoolUnitId: 'u2' }],
        students: [{ id: 's1', schoolUnitId: 'u1' }, { id: 's2', schoolUnitId: 'u2' }],
        userAccounts: [{ id: 'adm', role: 'ADMIN', password: 'x' }, { id: 'p2', role: 'TEACHER', schoolUnitId: 'u2' }],
      },
      'u1'
    );
    expect(seed.schoolUnits.map((u: any) => u.id)).toEqual(['u1']);
    expect(seed.students.map((s: any) => s.id)).toEqual(['s1']);
    expect(seed.userAccounts).toEqual([{ id: 'adm', role: 'ADMIN' }]);
  });
});
