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
  editProtocol,
  editProblem,
  deleteProtocol,
  restoreProtocol,
  protocolAuditTrail,
  historyAction,
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

describe('edição, exclusão e histórico do módulo', () => {
  const base = createProtocol(input, actor, [], new Date(2026, 9, 3, 9, 0, 0));
  const editor = { id: 'u9', name: 'Carlos Coordenador' };
  const editInput = {
    studentId: base.studentId,
    studentName: base.studentName,
    enrollmentNumber: base.enrollmentNumber,
    schoolUnitId: base.schoolUnitId,
    requesterName: 'Maria da Silva Souza',
    requesterRelation: base.requesterRelation,
    requesterPhone: '(94) 99999-0000',
    documentType: 'Boletim Escolar',
    description: base.description,
    channel: base.channel,
    dueDate: base.dueDate,
  };

  it('edição registra cada campo alterado (antes e depois) e quem alterou', () => {
    const e = editProtocol(base, editInput, editor, '', new Date(2026, 9, 3, 10));
    expect(e.documentType).toBe('Boletim Escolar');
    expect(e.requesterName).toBe('Maria da Silva Souza');
    const h = e.history[e.history.length - 1];
    expect(h.action).toBe('EDICAO');
    expect(h.userName).toBe('Carlos Coordenador');
    expect(h.changes?.map((c) => c.label)).toEqual(['Documento', 'Solicitante', 'Telefone']);
    expect(h.changes?.[0]).toMatchObject({ from: 'Histórico Escolar', to: 'Boletim Escolar' });
    expect(base.documentType).toBe('Histórico Escolar'); // o original não muda
  });

  it('sem mudança não grava; encerrado exige motivo', () => {
    expect(editProblem(base, { ...editInput, requesterName: base.requesterName, requesterPhone: '', documentType: base.documentType })).toMatch(/Nada/);
    const done = moveProtocol(moveProtocol(base, 'PRONTO', actor), 'ENTREGUE', actor, { deliveredTo: 'Maria' });
    expect(editProblem(done, { ...editInput, deliveredTo: 'Maria' })).toMatch(/motivo/);
    const fixed = editProtocol(done, { ...editInput, deliveredTo: 'Maria da Silva' }, editor, 'Nome digitado errado');
    expect(fixed.deliveredTo).toBe('Maria da Silva');
    expect(fixed.history.at(-1)?.note).toMatch(/Motivo: Nome digitado errado/);
  });

  it('exclusão não apaga: guarda quem, quando e motivo; some da lista e pode ser restaurado', () => {
    expect(() => deleteProtocol(base, editor, '')).toThrow(/motivo/);
    const d = deleteProtocol(base, editor, 'Registrado em duplicidade', new Date(2026, 9, 3, 11));
    expect(d.deletedByName).toBe('Carlos Coordenador');
    expect(d.deletedReason).toBe('Registrado em duplicidade');
    expect(filterProtocols([d], { status: 'ALL' })).toEqual([]);
    expect(filterProtocols([d], { status: 'DELETED' })).toEqual([d]);
    expect(isOverdue(d, '2030-01-01')).toBe(false);
    expect(moveProblem(d, 'EM_ANDAMENTO')).toMatch(/excluído/);
    const r = restoreProtocol(d, actor);
    expect(r.deletedAt).toBeUndefined();
    expect(r.history.at(-1)?.action).toBe('RESTAURACAO');
    expect(filterProtocols([r], { status: 'ALL' })).toEqual([r]);
  });

  it('histórico do módulo junta tudo, mais recente primeiro, com tipo e usuário', () => {
    const p1 = moveProtocol(base, 'EM_ANDAMENTO', actor, {}, new Date(2026, 9, 3, 9, 30));
    const p2 = deleteProtocol(editProtocol(p1, editInput, editor, '', new Date(2026, 9, 3, 10)), editor, 'Duplicado', new Date(2026, 9, 3, 11));
    // registro antigo, sem "action"
    const legacy = { ...base, id: 'old', number: 'X', history: [{ at: '2026-01-01T10:00:00.000Z', status: 'ABERTO' as const, userId: 'u1', userName: 'Ana' }, { at: '2026-01-02T10:00:00.000Z', status: 'PRONTO' as const, userId: 'u1', userName: 'Ana' }] };
    const rows = protocolAuditTrail([p2, legacy]);
    expect(rows.map((r) => r.action).slice(0, 4)).toEqual(['EXCLUSAO', 'EDICAO', 'MOVIMENTACAO', 'ABERTURA']);
    expect(rows[0].userName).toBe('Carlos Coordenador');
    expect(rows.slice(-2).map((r) => r.action)).toEqual(['MOVIMENTACAO', 'ABERTURA']);
    expect(historyAction(legacy.history[1], 1, legacy.history[0])).toBe('MOVIMENTACAO');
  });
});

describe('escola de destino', () => {
  it('é obrigatória e a troca fica no histórico com o nome da escola', () => {
    expect(protocolInputProblem({ ...input, schoolUnitId: '' })).toMatch(/escola/);
    const p = createProtocol(input, actor, [], new Date(2026, 9, 3));
    const names: Record<string, string> = { esc1: 'EMEF IRON FERNANDES', esc2: 'EMEF CASTRO ALVES' };
    const e = editProtocol(
      p,
      { ...input, schoolUnitId: 'esc2', requesterRelation: p.requesterRelation, dueDate: p.dueDate },
      actor,
      '',
      new Date(2026, 9, 3, 10),
      (id) => names[id]
    );
    expect(e.schoolUnitId).toBe('esc2');
    expect(e.history.at(-1)?.changes?.[0]).toMatchObject({ label: 'Escola', from: 'EMEF IRON FERNANDES', to: 'EMEF CASTRO ALVES' });
  });
});
