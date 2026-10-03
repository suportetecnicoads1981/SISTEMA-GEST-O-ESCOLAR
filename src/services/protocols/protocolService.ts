/**
 * Protocolos & Solicitações.
 *
 * A Secretaria registra cada pedido de documento (declaração, histórico, boletim...) e o
 * sistema gera um número de protocolo para o solicitante acompanhar. Cada mudança de
 * situação fica no histórico do protocolo, com data, hora e usuário.
 *
 * Situações: Aberto → Em andamento → Pronto para entrega → Entregue (ou Cancelado).
 * Entregue e Cancelado encerram o protocolo: depois disso só se acrescentam observações.
 */
import type {
  ProtocolChannel,
  ProtocolHistoryEntry,
  ProtocolRequest,
  ProtocolRequesterRelation,
  ProtocolStatus,
} from '../../types';

export const PROTOCOL_STATUSES: ProtocolStatus[] = ['ABERTO', 'EM_ANDAMENTO', 'PRONTO', 'ENTREGUE', 'CANCELADO'];

export const PROTOCOL_STATUS_LABEL: Record<ProtocolStatus, string> = {
  ABERTO: 'Aberto',
  EM_ANDAMENTO: 'Em andamento',
  PRONTO: 'Pronto para entrega',
  ENTREGUE: 'Entregue',
  CANCELADO: 'Cancelado',
};

/** Classes de cor (Tailwind) do selo de cada situação. */
export const PROTOCOL_STATUS_STYLE: Record<ProtocolStatus, string> = {
  ABERTO: 'bg-sky-50 text-sky-800 border-sky-200',
  EM_ANDAMENTO: 'bg-amber-50 text-amber-800 border-amber-200',
  PRONTO: 'bg-violet-50 text-violet-800 border-violet-200',
  ENTREGUE: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  CANCELADO: 'bg-slate-100 text-slate-600 border-slate-300',
};

export const PROTOCOL_DOCUMENT_TYPES = [
  'Declaração de Matrícula / Vínculo',
  'Declaração de Frequência',
  'Declaração de Transferência',
  'Histórico Escolar',
  'Boletim Escolar',
  'Certificado de Conclusão',
  'Ficha Individual do Aluno',
  'Segunda via de documento',
  'Outro documento',
] as const;

export const PROTOCOL_RELATION_LABEL: Record<ProtocolRequesterRelation, string> = {
  RESPONSAVEL: 'Pai, mãe ou responsável',
  ALUNO: 'O próprio aluno',
  PROFESSOR: 'Professor(a)',
  SERVIDOR: 'Servidor(a) da escola / SEMED',
  OUTRO: 'Outro',
};

export const PROTOCOL_CHANNEL_LABEL: Record<ProtocolChannel, string> = {
  BALCAO: 'Balcão (presencial)',
  TELEFONE: 'Telefone',
  WHATSAPP: 'WhatsApp',
  EMAIL: 'E-mail',
  OUTRO: 'Outro',
};

/** Prazo padrão de entrega (dias corridos a partir da abertura). */
export const DEFAULT_DUE_DAYS = 5;

/** Situações que encerram o protocolo. */
export const isFinalStatus = (s: ProtocolStatus): boolean => s === 'ENTREGUE' || s === 'CANCELADO';

/** Letras e números sem os que se confundem ao ditar ou ler (0/O, 1/I/L). */
const CODE_CHARS = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';

const pad = (n: number) => String(n).padStart(2, '0');

/** Data local AAAA-MM-DD. */
export function localIsoDate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function addDays(isoDate: string, days: number): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  const dt = new Date(y, (m || 1) - 1, d || 1);
  dt.setDate(dt.getDate() + days);
  return localIsoDate(dt);
}

/**
 * Número do protocolo: ano, mês e dia da abertura e um código de 4 caracteres
 * (ex.: 2026-1003-4F7K). Não depende de um contador central, então não repete entre
 * computadores diferentes, mesmo sem internet; a lista atual garante que não repete aqui.
 */
export function generateProtocolNumber(existing: Iterable<string>, now = new Date(), random: () => number = Math.random): string {
  const used = new Set(Array.from(existing, (n) => String(n || '').toUpperCase()));
  const prefix = `${now.getFullYear()}-${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
  for (let attempt = 0; attempt < 200; attempt++) {
    let code = '';
    for (let i = 0; i < 4; i++) code += CODE_CHARS[Math.floor(random() * CODE_CHARS.length) % CODE_CHARS.length];
    const n = `${prefix}-${code}`;
    if (!used.has(n)) return n;
  }
  // Praticamente impossível (mais de 900 mil combinações por dia): usa a hora completa.
  return `${prefix}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
}

/** Normaliza o que a pessoa digita na busca (com ou sem traços, maiúsculas/minúsculas). */
export const normalizeProtocolNumber = (v: string) => String(v || '').toUpperCase().replace(/[^0-9A-Z]/g, '');

export interface ProtocolActor {
  id: string;
  name: string;
}

export interface NewProtocolInput {
  schoolUnitId?: string;
  studentId?: string;
  studentName: string;
  enrollmentNumber?: string;
  className?: string;
  requesterName: string;
  requesterRelation: ProtocolRequesterRelation;
  requesterPhone?: string;
  documentType: string;
  description?: string;
  channel?: ProtocolChannel;
  dueDate?: string;
}

/** Problema no preenchimento ('' quando está tudo certo). */
export function protocolInputProblem(input: Partial<NewProtocolInput>): string {
  if (!String(input.studentName || '').trim()) return 'Escolha o aluno a que o documento se refere.';
  if (!String(input.requesterName || '').trim()) return 'Informe o nome de quem está pedindo o documento.';
  if (!String(input.documentType || '').trim()) return 'Escolha o documento solicitado.';
  if (input.documentType === 'Outro documento' && !String(input.description || '').trim())
    return 'Em "Outro documento", descreva qual documento foi pedido.';
  if (input.dueDate && !/^\d{4}-\d{2}-\d{2}$/.test(input.dueDate)) return 'Prazo de entrega inválido.';
  return '';
}

/** Novo protocolo (situação Aberto), com o número e o primeiro registro do histórico. */
export function createProtocol(
  input: NewProtocolInput,
  actor: ProtocolActor,
  existingNumbers: Iterable<string>,
  now = new Date()
): ProtocolRequest {
  const at = now.toISOString();
  const number = generateProtocolNumber(existingNumbers, now);
  const trim = (v?: string) => (v == null ? undefined : String(v).trim() || undefined);
  return {
    id: `prot-${now.getTime()}-${Math.random().toString(36).slice(2, 8)}`,
    number,
    schoolUnitId: trim(input.schoolUnitId),
    studentId: trim(input.studentId),
    studentName: String(input.studentName).trim(),
    enrollmentNumber: trim(input.enrollmentNumber),
    className: trim(input.className),
    requesterName: String(input.requesterName).trim(),
    requesterRelation: input.requesterRelation,
    requesterPhone: trim(input.requesterPhone),
    documentType: String(input.documentType).trim(),
    description: trim(input.description),
    channel: input.channel,
    dueDate: trim(input.dueDate) || addDays(localIsoDate(now), DEFAULT_DUE_DAYS),
    status: 'ABERTO',
    createdAt: at,
    updatedAt: at,
    createdByUserId: actor.id,
    createdByName: actor.name,
    history: [{ at, status: 'ABERTO', userId: actor.id, userName: actor.name, note: 'Solicitação registrada.' }],
  };
}

/** Situações para as quais o protocolo pode ir agora. */
export function nextStatuses(current: ProtocolStatus): ProtocolStatus[] {
  if (isFinalStatus(current)) return [];
  // Primeiro a próxima etapa (o mais comum), depois as seguintes, a volta e o cancelamento.
  const flow: ProtocolStatus[] = ['ABERTO', 'EM_ANDAMENTO', 'PRONTO', 'ENTREGUE'];
  const i = flow.indexOf(current);
  const forward = flow.slice(i + 1);
  const back = flow.slice(0, Math.max(0, i)).reverse();
  return [...forward, ...back, 'CANCELADO'];
}

/** Problema na movimentação ('' quando pode). */
export function moveProblem(p: ProtocolRequest, to: ProtocolStatus, note?: string, deliveredTo?: string): string {
  if (isFinalStatus(p.status)) return `O protocolo já está "${PROTOCOL_STATUS_LABEL[p.status]}". Só é possível acrescentar observações.`;
  if (to === p.status) return 'O protocolo já está nessa situação.';
  if (to === 'CANCELADO' && !String(note || '').trim()) return 'Informe o motivo do cancelamento.';
  if (to === 'ENTREGUE' && !String(deliveredTo || '').trim()) return 'Informe a quem o documento foi entregue.';
  return '';
}

/** Muda a situação e registra no histórico (não altera o protocolo original). */
export function moveProtocol(
  p: ProtocolRequest,
  to: ProtocolStatus,
  actor: ProtocolActor,
  opts: { note?: string; deliveredTo?: string } = {},
  now = new Date()
): ProtocolRequest {
  const problem = moveProblem(p, to, opts.note, opts.deliveredTo);
  if (problem) throw new Error(problem);
  const at = now.toISOString();
  const deliveredTo = String(opts.deliveredTo || '').trim();
  const entry: ProtocolHistoryEntry = {
    at,
    status: to,
    userId: actor.id,
    userName: actor.name,
    note: [String(opts.note || '').trim(), to === 'ENTREGUE' ? `Entregue a: ${deliveredTo}` : ''].filter(Boolean).join(' • ') || undefined,
  };
  return {
    ...p,
    status: to,
    updatedAt: at,
    ...(to === 'ENTREGUE' ? { deliveredTo, deliveredAt: at } : {}),
    history: [...(p.history || []), entry],
  };
}

/** Acrescenta uma observação sem mudar a situação. */
export function addProtocolNote(p: ProtocolRequest, note: string, actor: ProtocolActor, now = new Date()): ProtocolRequest {
  const text = String(note || '').trim();
  if (!text) return p;
  const at = now.toISOString();
  return {
    ...p,
    updatedAt: at,
    history: [...(p.history || []), { at, status: p.status, userId: actor.id, userName: actor.name, note: text }],
  };
}

/** Passou do prazo e ainda não foi entregue nem cancelado. */
export function isOverdue(p: ProtocolRequest, today = localIsoDate(new Date())): boolean {
  return !isFinalStatus(p.status) && !!p.dueDate && p.dueDate < today;
}

/** "03/10/2026" a partir de AAAA-MM-DD ou de data ISO. */
export function formatDateBr(value?: string): string {
  const s = String(value || '');
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return '';
  if (s.length > 10) {
    const d = new Date(s);
    if (!Number.isNaN(d.getTime())) return d.toLocaleDateString('pt-BR');
  }
  return `${m[3]}/${m[2]}/${m[1]}`;
}

export function formatDateTimeBr(value?: string): string {
  const d = new Date(String(value || ''));
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export interface ProtocolFilters {
  search?: string;
  status?: ProtocolStatus | 'ALL' | 'OVERDUE' | 'OPEN_ANY';
  schoolUnitId?: string | 'ALL';
  documentType?: string | 'ALL';
  createdBy?: string | 'ALL';
  from?: string;
  to?: string;
}

const fold = (v: unknown) =>
  String(v ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

/** Filtros da tela e do relatório (por situação, aluno, escola, usuário, responsável e período). */
export function filterProtocols(list: ProtocolRequest[], f: ProtocolFilters, today = localIsoDate(new Date())): ProtocolRequest[] {
  const term = fold(f.search).trim();
  const termNum = normalizeProtocolNumber(f.search || '');
  return list.filter((p) => {
    if (f.status && f.status !== 'ALL') {
      if (f.status === 'OVERDUE') {
        if (!isOverdue(p, today)) return false;
      } else if (f.status === 'OPEN_ANY') {
        if (isFinalStatus(p.status)) return false;
      } else if (p.status !== f.status) return false;
    }
    if (f.schoolUnitId && f.schoolUnitId !== 'ALL' && p.schoolUnitId !== f.schoolUnitId) return false;
    if (f.documentType && f.documentType !== 'ALL' && p.documentType !== f.documentType) return false;
    if (f.createdBy && f.createdBy !== 'ALL' && p.createdByUserId !== f.createdBy) return false;
    const day = String(p.createdAt || '').slice(0, 10);
    if (f.from && day < f.from) return false;
    if (f.to && day > f.to) return false;
    if (term) {
      const hit =
        (termNum.length >= 4 && normalizeProtocolNumber(p.number).includes(termNum)) ||
        fold(p.studentName).includes(term) ||
        fold(p.enrollmentNumber).includes(term) ||
        fold(p.requesterName).includes(term) ||
        fold(p.documentType).includes(term);
      if (!hit) return false;
    }
    return true;
  });
}

/** Mais novos primeiro. */
export const sortProtocols = (list: ProtocolRequest[]) =>
  [...list].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
