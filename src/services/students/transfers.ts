import type { ExternalNetworkType, SchoolClass, SchoolUnit, Student, StudentTransfer } from '../../types';

/**
 * Transferência de alunos com rastreio de origem e destino.
 *
 * - Entre escolas da rede: o aluno continua o MESMO cadastro (mesmo RA, histórico, notas e
 *   frequência já lançados ficam na escola de origem) e passa para a escola/turma de destino.
 * - Para fora da rede: a situação vira "Transferido" e fica registrada a escola de destino.
 * - Vindo de fora da rede: registra a escola de origem (estadual, particular, outro município...).
 * Cada movimentação vira um registro em student.transfers, que nunca é apagado.
 */

export const EXTERNAL_NETWORK_LABEL: Record<ExternalNetworkType, string> = {
  ESTADUAL: 'Rede estadual',
  MUNICIPAL_OUTRO: 'Rede municipal de outro município',
  PARTICULAR: 'Escola particular',
  FEDERAL: 'Rede federal',
  OUTRA: 'Outra',
};

// Data local (no Brasil, depois das 21h o toISOString já seria o dia seguinte).
const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const newId = () => `trf-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
const clean = (v?: string) => String(v || '').trim();

export interface TransferBase {
  date?: string;
  reason?: string;
  registeredBy?: string;
}

export interface NetworkTransferInput extends TransferBase {
  toUnit: Pick<SchoolUnit, 'id' | 'name'>;
  toClass?: Pick<SchoolClass, 'id' | 'name' | 'gradeLevel' | 'shift'> | null;
  fromUnitName?: string;
  fromClassName?: string;
}

export interface ExternalTransferInput extends TransferBase {
  schoolName: string;
  city?: string;
  state?: string;
  network?: ExternalNetworkType;
  fromUnitName?: string;
  fromClassName?: string;
}

function withTransfer(student: Student, t: StudentTransfer): Student['transfers'] {
  return [...(student.transfers || []), t];
}

/** Transfere para outra escola da rede municipal (mesmo cadastro, novo vínculo). */
export function transferWithinNetwork(student: Student, input: NetworkTransferInput): Student {
  if (!input.toUnit?.id) throw new Error('Escolha a escola de destino.');
  if (input.toUnit.id === student.schoolUnitId) throw new Error('O aluno já está nesta escola. Escolha outra escola de destino.');
  const t: StudentTransfer = {
    id: newId(),
    kind: 'REDE',
    date: input.date || today(),
    fromUnitId: student.schoolUnitId || undefined,
    fromUnitName: clean(input.fromUnitName) || undefined,
    fromClassId: student.classId || undefined,
    fromClassName: clean(input.fromClassName) || undefined,
    toUnitId: input.toUnit.id,
    toUnitName: input.toUnit.name,
    toClassId: input.toClass?.id || undefined,
    toClassName: input.toClass?.name || undefined,
    reason: clean(input.reason) || undefined,
    registeredBy: clean(input.registeredBy) || undefined,
    registeredAt: new Date().toISOString(),
  };
  return {
    ...student,
    schoolUnitId: input.toUnit.id,
    // O nome da escola da planilha também acompanha (senão o aluno continuaria aparecendo na escola antiga).
    schoolOriginName: student.schoolOriginName ? input.toUnit.name : student.schoolOriginName,
    classId: input.toClass?.id || '',
    series: input.toClass?.gradeLevel || student.series,
    shift: input.toClass?.shift || student.shift,
    status: 'ACTIVE',
    transfers: withTransfer(student, t),
  };
}

/** Transfere para uma escola de fora da rede municipal: situação passa a "Transferido". */
export function transferOutOfNetwork(student: Student, input: ExternalTransferInput): Student {
  if (!clean(input.schoolName)) throw new Error('Informe o nome da escola de destino.');
  const t: StudentTransfer = {
    id: newId(),
    kind: 'SAIDA_EXTERNA',
    date: input.date || today(),
    fromUnitId: student.schoolUnitId || undefined,
    fromUnitName: clean(input.fromUnitName) || undefined,
    fromClassId: student.classId || undefined,
    fromClassName: clean(input.fromClassName) || undefined,
    externalSchoolName: clean(input.schoolName),
    externalCity: clean(input.city) || undefined,
    externalState: clean(input.state).toUpperCase() || undefined,
    externalNetwork: input.network,
    reason: clean(input.reason) || undefined,
    registeredBy: clean(input.registeredBy) || undefined,
    registeredAt: new Date().toISOString(),
  };
  return { ...student, status: 'TRANSFERRED', transfers: withTransfer(student, t) };
}

/** Registra que o aluno chegou de uma escola de fora da rede (não muda a escola atual). */
export function registerExternalArrival(student: Student, input: ExternalTransferInput): Student {
  if (!clean(input.schoolName)) throw new Error('Informe o nome da escola de origem.');
  const t: StudentTransfer = {
    id: newId(),
    kind: 'ENTRADA_EXTERNA',
    date: input.date || today(),
    toUnitId: student.schoolUnitId || undefined,
    toUnitName: clean(input.fromUnitName) || undefined,
    toClassId: student.classId || undefined,
    toClassName: clean(input.fromClassName) || undefined,
    externalSchoolName: clean(input.schoolName),
    externalCity: clean(input.city) || undefined,
    externalState: clean(input.state).toUpperCase() || undefined,
    externalNetwork: input.network,
    reason: clean(input.reason) || undefined,
    registeredBy: clean(input.registeredBy) || undefined,
    registeredAt: new Date().toISOString(),
  };
  return { ...student, transfers: withTransfer(student, t) };
}

// ---------------------------------------------------------------------------
// Filtros dos relatórios
// ---------------------------------------------------------------------------

export type MovementFilter =
  | 'ALL'
  | 'REDE'
  | 'REDE_RECEBIDOS'
  | 'REDE_ENVIADOS'
  | 'FORA_ENTRADAS'
  | 'FORA_SAIDAS';

export const MOVEMENT_FILTER_LABEL: Record<MovementFilter, string> = {
  ALL: 'Todas as movimentações',
  REDE: 'Transferidos entre escolas da rede',
  REDE_RECEBIDOS: 'Recebidos de outra escola da rede',
  REDE_ENVIADOS: 'Enviados para outra escola da rede',
  FORA_ENTRADAS: 'Vindos de fora da rede municipal',
  FORA_SAIDAS: 'Transferidos para fora da rede',
};

const list = (s: Student) => (Array.isArray(s?.transfers) ? s.transfers : []);
const inSet = (id: string | undefined, ids: ReadonlySet<string> | null) => !ids || (!!id && ids.has(id));

/**
 * O aluno se encaixa no filtro de movimentação? `unitIds` = escolas escolhidas no filtro
 * (null = rede inteira). Para "enviados", vale a escola de ORIGEM (o aluno já está em outra).
 */
export function matchesMovement(student: Student, filter: MovementFilter, unitIds: ReadonlySet<string> | null): boolean {
  if (filter === 'ALL') return true;
  const ts = list(student);
  const rede = ts.filter((t) => t.kind === 'REDE');
  switch (filter) {
    case 'REDE_RECEBIDOS':
      return rede.some((t) => inSet(t.toUnitId, unitIds));
    case 'REDE_ENVIADOS':
      return rede.some((t) => inSet(t.fromUnitId, unitIds));
    case 'REDE':
      return rede.some((t) => inSet(t.toUnitId, unitIds) || inSet(t.fromUnitId, unitIds));
    case 'FORA_ENTRADAS':
      return ts.some((t) => t.kind === 'ENTRADA_EXTERNA') && inSet(student.schoolUnitId, unitIds);
    case 'FORA_SAIDAS':
      return (
        (ts.some((t) => t.kind === 'SAIDA_EXTERNA') || student.status === 'TRANSFERRED') && inSet(student.schoolUnitId, unitIds)
      );
    default:
      return true;
  }
}

/** Filtros que mostram alunos que já SAÍRAM da escola escolhida (o filtro de escola usa a origem). */
export const movementUsesOriginSchool = (f: MovementFilter) => f === 'REDE_ENVIADOS' || f === 'REDE';

const place = (name?: string, city?: string, state?: string) =>
  [name, [city, state].filter(Boolean).join('/')].filter(Boolean).join(' – ');

/** Texto de procedência (de onde veio) para relatórios. */
export function originText(student: Student): string {
  const ts = list(student);
  const last = [...ts].reverse().find((t) => t.kind === 'ENTRADA_EXTERNA' || t.kind === 'REDE');
  if (!last) return '—';
  if (last.kind === 'ENTRADA_EXTERNA') {
    const net = last.externalNetwork ? ` (${EXTERNAL_NETWORK_LABEL[last.externalNetwork]})` : '';
    return `Fora da rede: ${place(last.externalSchoolName, last.externalCity, last.externalState)}${net}`;
  }
  return `Rede: ${last.fromUnitName || 'escola da rede'}`;
}

/** Texto do destino / última transferência para relatórios. */
export function destinationText(student: Student): string {
  const last = [...list(student)].reverse().find((t) => t.kind === 'SAIDA_EXTERNA' || t.kind === 'REDE');
  if (!last) return student.status === 'TRANSFERRED' ? 'Transferido (destino não registrado)' : '—';
  if (last.kind === 'SAIDA_EXTERNA') {
    const net = last.externalNetwork ? ` (${EXTERNAL_NETWORK_LABEL[last.externalNetwork]})` : '';
    return `Fora da rede: ${place(last.externalSchoolName, last.externalCity, last.externalState)}${net}`;
  }
  return `Rede: ${last.fromUnitName || 'escola da rede'} → ${last.toUnitName || 'escola da rede'}`;
}

/** Data (dd/mm/aaaa) da última movimentação, ou '—'. */
export function lastTransferDate(student: Student): string {
  const ts = list(student);
  if (!ts.length) return '—';
  const d = ts[ts.length - 1].date;
  const [y, m, dd] = String(d || '').split('-');
  return y && m && dd ? `${dd}/${m}/${y}` : d || '—';
}
