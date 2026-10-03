import { describe, it, expect } from 'vitest';
import {
  addProtocolNote,
  createProtocol,
  filterProtocols,
  generateProtocolNumber,
  isOverdue,
  moveProblem,
  moveProtocol,
  nextStatuses,
  protocolInputProblem,
} from '../src/services/protocols/protocolService';

const actor = { id: 'u1', name: 'Ana Secretária' };
const input = {
  schoolUnitId: 'esc1',
  studentId: 's1',
  studentName: 'JOÃO DA SILVA',
  enrollmentNumber: 'RA-2026-0001',
  requesterName: 'Maria da Silva',
  requesterRelation: 'RESPONSAVEL' as const,
  documentType: 'Histórico Escolar',
};

describe('número do protocolo', () => {
  it('tem data e código de 4 caracteres sem letras que confundem', () => {
    const n = generateProtocolNumber([], new Date(2026, 9, 3, 10, 0, 0));
    expect(n).toMatch(/^2026-1003-[2-9A-HJKMNP-Z]{4}$/);
  });
  it('não repete um número já usado', () => {
    let calls = 0;
    // Primeiro sorteio repete um número existente; o segundo é diferente.
    const seq = [0, 0, 0, 0, 0.5, 0.5, 0.5, 0.5];
    const rnd = () => seq[calls++ % seq.length];
    const first = generateProtocolNumber([], new Date(2026, 9, 3), () => 0);
    const n = generateProtocolNumber([first], new Date(2026, 9, 3), rnd);
    expect(n).not.toBe(first);
  });
});

describe('abertura e movimentação', () => {
  it('confere o preenchimento', () => {
    expect(protocolInputProblem({ ...input, studentName: '' })).toMatch(/aluno/);
    expect(protocolInputProblem({ ...input, requesterName: '' })).toMatch(/pedindo/);
    expect(protocolInputProblem({ ...input, documentType: 'Outro documento' })).toMatch(/descreva/);
    expect(protocolInputProblem(input)).toBe('');
  });

  it('abre como Aberto, com prazo padrão de 5 dias e histórico', () => {
    const p = createProtocol(input, actor, [], new Date(2026, 9, 3, 9, 0, 0));
    expect(p.status).toBe('ABERTO');
    expect(p.dueDate).toBe('2026-10-08');
    expect(p.history).toHaveLength(1);
    expect(p.createdByName).toBe('Ana Secretária');
  });

  it('movimenta e registra quem mudou; entregue e cancelado encerram', () => {
    const p = createProtocol(input, actor, [], new Date(2026, 9, 3));
    const p2 = moveProtocol(p, 'EM_ANDAMENTO', actor);
    const p3 = moveProtocol(p2, 'PRONTO', actor);
    expect(moveProblem(p3, 'ENTREGUE')).toMatch(/a quem/);
    const p4 = moveProtocol(p3, 'ENTREGUE', actor, { deliveredTo: 'Maria da Silva' });
    expect(p4.status).toBe('ENTREGUE');
    expect(p4.deliveredTo).toBe('Maria da Silva');
    expect(p4.history).toHaveLength(4);
    expect(nextStatuses('ENTREGUE')).toEqual([]);
    expect(nextStatuses('ABERTO')[0]).toBe('EM_ANDAMENTO');
    expect(nextStatuses('PRONTO')).toEqual(['ENTREGUE', 'EM_ANDAMENTO', 'ABERTO', 'CANCELADO']);
    expect(() => moveProtocol(p4, 'ABERTO', actor)).toThrow();
    expect(p.status).toBe('ABERTO'); // o original não muda
  });

  it('cancelamento exige motivo', () => {
    const p = createProtocol(input, actor, [], new Date(2026, 9, 3));
    expect(moveProblem(p, 'CANCELADO', '')).toMatch(/motivo/);
    expect(moveProtocol(p, 'CANCELADO', actor, { note: 'Pedido em duplicidade' }).status).toBe('CANCELADO');
  });

  it('observação não muda a situação', () => {
    const p = createProtocol(input, actor, [], new Date(2026, 9, 3));
    const p2 = addProtocolNote(p, 'Responsável ligou perguntando', actor);
    expect(p2.status).toBe('ABERTO');
    expect(p2.history).toHaveLength(2);
  });
});

describe('prazo e filtros', () => {
  const a = createProtocol(input, actor, [], new Date(2026, 9, 1));
  const b = moveProtocol(
    createProtocol({ ...input, studentName: 'BIA SOUZA', requesterName: 'Carla', schoolUnitId: 'esc2' }, { id: 'u2', name: 'Pedro' }, [], new Date(2026, 9, 2)),
    'CANCELADO',
    actor,
    { note: 'x' }
  );
  it('atrasado = passou do prazo sem entregar', () => {
    expect(isOverdue(a, '2026-10-10')).toBe(true);
    expect(isOverdue(a, '2026-10-03')).toBe(false);
    expect(isOverdue(b, '2026-12-01')).toBe(false);
  });
  it('filtra por situação, escola, usuário, aluno, responsável e número', () => {
    const list = [a, b];
    expect(filterProtocols(list, { status: 'CANCELADO' })).toEqual([b]);
    expect(filterProtocols(list, { status: 'OPEN_ANY' })).toEqual([a]);
    expect(filterProtocols(list, { schoolUnitId: 'esc2' })).toEqual([b]);
    expect(filterProtocols(list, { createdBy: 'u2' })).toEqual([b]);
    expect(filterProtocols(list, { search: 'joao' })).toEqual([a]);
    expect(filterProtocols(list, { search: 'carla' })).toEqual([b]);
    expect(filterProtocols(list, { search: a.number.replace(/-/g, '').toLowerCase() })).toEqual([a]);
    expect(filterProtocols(list, { status: 'OVERDUE' }, '2026-10-30')).toEqual([a]);
  });
});
