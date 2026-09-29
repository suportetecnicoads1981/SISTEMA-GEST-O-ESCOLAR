import { describe, expect, it } from 'vitest';
import { getDefaultSectorPermissions } from '../src/components/usuarios/UserAccessControl';
import { canOpenTab, enforceDataPermissions, isMasterAccount } from '../src/services/rbac/accessControl';

const user = (sector: any, extra: any = {}) => ({
  id: `u-${sector}`,
  sector,
  active: true,
  isMaster: false,
  permissions: getDefaultSectorPermissions(sector),
  ...extra,
});

const base = () => ({
  students: [
    { id: 's1', name: 'Ana', updatedAt: '1' },
    { id: 's2', name: 'Bia', updatedAt: '1' },
  ],
  classes: [{ id: 'c1', name: 'PRÉ I' }],
  userAccounts: [
    { id: 'm', name: 'Master', sector: 'MASTER' },
    { id: 'u-SECRETARIA', name: 'Davi', sector: 'SECRETARIA', lastLogin: 'a', password: 'x' },
  ],
  communications: [{ id: 'm1', title: 'Aviso', readBy: [] }],
  notifications: [],
});

describe('privilégios de usuário', () => {
  it('Master tem acesso total', () => {
    const master = user('MASTER');
    expect(isMasterAccount(master)).toBe(true);
    const prev = base();
    const next = { ...prev, userAccounts: [], students: [] };
    expect(enforceDataPermissions(prev, next, master).denied).toEqual([]);
  });

  it('Secretaria inclui e altera alunos, mas não exclui', () => {
    const sec = user('SECRETARIA');
    const prev = base();
    const edited = { ...prev, students: [{ ...prev.students[0], name: 'Ana Maria' }, prev.students[1], { id: 's3', name: 'Caio' }] };
    expect(enforceDataPermissions(prev, edited, sec).denied).toEqual([]);

    const removed = { ...prev, students: [prev.students[0]] };
    const r = enforceDataPermissions(prev, removed, sec);
    expect(r.denied.map((d) => d.action)).toEqual(['canDelete']);
    expect(r.next.students).toBe(prev.students); // exclusão desfeita
  });

  it('só o Master mexe em usuários; login e senha própria não contam', () => {
    const sec = user('SECRETARIA');
    const prev = base();
    const login = {
      ...prev,
      userAccounts: prev.userAccounts.map((u) => (u.id === sec.id ? { ...u, lastLogin: 'b', password: 'y' } : u)),
    };
    expect(enforceDataPermissions(prev, login, sec).denied).toEqual([]);

    const promote = { ...prev, userAccounts: prev.userAccounts.map((u) => (u.id === sec.id ? { ...u, sector: 'MASTER' } : u)) };
    const r = enforceDataPermissions(prev, promote, sec);
    expect(r.denied[0].collection).toBe('userAccounts');
    expect(r.next.userAccounts).toBe(prev.userAccounts);
  });

  it('recusa só o cadastro sem permissão e mantém o resto da gravação', () => {
    const prof = user('PROFESSOR');
    const prev = base();
    const next = { ...prev, students: [], notifications: [{ id: 'n1' }] };
    const r = enforceDataPermissions(prev, next, prof);
    expect(r.next.students).toBe(prev.students);
    expect(r.next.notifications).toEqual([{ id: 'n1' }]);
  });

  it('confirmação de leitura de comunicado não é alteração', () => {
    const prof = user('PROFESSOR', {
      permissions: { ...getDefaultSectorPermissions('PROFESSOR'), comunicacao: { canRead: true, canCreate: false, canEdit: false, canDelete: false, canApprove: false } },
    });
    const prev = base();
    const next = { ...prev, communications: [{ ...prev.communications[0], readBy: ['u-PROFESSOR'] }] };
    expect(enforceDataPermissions(prev, next, prof).denied).toEqual([]);
  });

  it('usuário inativo não grava nada', () => {
    const sec = user('SECRETARIA', { active: false });
    const prev = base();
    const next = { ...prev, students: [...prev.students, { id: 's9', name: 'Novo' }] };
    expect(enforceDataPermissions(prev, next, sec).denied.length).toBe(1);
  });

  it('abrir módulo exige leitura', () => {
    const sec = user('SECRETARIA');
    expect(canOpenTab(sec, 'STUDENTS')).toBe(true);
    expect(canOpenTab(sec, 'MAIN_DASHBOARD')).toBe(true);
    expect(canOpenTab(sec, 'USER_CONTROL')).toBe(false);
    expect(canOpenTab(sec, 'NETWORK_INSTALLER')).toBe(false);
    expect(canOpenTab(sec, 'DEV_BACKLOG')).toBe(false);
    expect(canOpenTab(user('MASTER'), 'USER_CONTROL')).toBe(true);
  });
});
