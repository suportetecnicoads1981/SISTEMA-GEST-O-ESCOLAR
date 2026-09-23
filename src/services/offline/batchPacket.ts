/**
 * Lote de sincronização (.edusync, formato 2): Servidor Remoto (escola) -> Sede.
 *
 * - Leva TODOS os dados escolares da unidade: alunos, turmas, notas, frequência,
 *   diário de classe, provas e correções, históricos, planos e anotações, além
 *   das disciplinas/cursos/questões usados por ela.
 * - Leva também as exclusões feitas na escola, para que um aluno removido lá não
 *   continue aparecendo na Sede.
 * - Integridade verificada com SHA-256 (qualquer alteração no arquivo é detectada).
 * - Contas de usuário e senhas NÃO vão no lote.
 *
 * A importação na Sede MESCLA: nunca apaga dados de outras escolas e recusa
 * registros que pertencem a outra unidade.
 */
import { sha256Hex } from '../../utils/passwordHasher';

export const LOTE_FORMAT = 'sucessoedu-lote';
export const LOTE_FORMAT_VERSION = 2;
export const LOTE_DELETIONS_KEY = 'sucessoedu_lote_deletions_v1';
/** Chave do registro de exclusões dentro do banco do servidor da rede local. */
export const SERVER_DELETION_LOG_KEY = '__deletionLog';

/** Listas da unidade escolar (pertencem a uma escola). */
export const LOTE_UNIT_KEYS = [
  'students',
  'classes',
  'exams',
  'submissions',
  'academicHistories',
  'attendanceSheets',
  'lessonRegistries',
  'classGradeSheets',
  'teacherLessonPlans',
  'teacherStudentNotes',
] as const;

/** Cadastros compartilhados pela rede (a Sede mantém os seus; só entram os novos). */
export const LOTE_CATALOG_KEYS = ['subjects', 'courses', 'questions'] as const;

export const LOTE_KEYS: readonly string[] = [...LOTE_UNIT_KEYS, ...LOTE_CATALOG_KEYS];

/** Listas cujo tipo possui o campo schoolUnitId. */
const TAGGABLE_KEYS = new Set(['students', 'classes', 'attendanceSheets', 'lessonRegistries']);

export const LOTE_LABELS: Record<string, string> = {
  students: 'Alunos',
  classes: 'Turmas',
  exams: 'Provas',
  submissions: 'Correções de provas',
  academicHistories: 'Históricos escolares',
  attendanceSheets: 'Frequência',
  lessonRegistries: 'Diário de classe',
  classGradeSheets: 'Notas (boletim)',
  teacherLessonPlans: 'Planos de aula',
  teacherStudentNotes: 'Anotações pedagógicas',
  subjects: 'Disciplinas',
  courses: 'Cursos / níveis',
  questions: 'Banco de questões',
};

export interface LoteDeletion {
  k: string;
  id: string;
  at: string;
}

export interface LoteUnit {
  id: string;
  name: string;
  inepCode?: string;
  [key: string]: any;
}

export interface LotePacket {
  format: typeof LOTE_FORMAT;
  formatVersion: number;
  packetId: string;
  createdAt: string;
  origin: { role: string; serverName?: string; operatorName: string };
  schoolUnit: LoteUnit;
  municipality?: { name?: string; state?: string };
  counts: Record<string, number>;
  data: Record<string, any[]>;
  deletions: LoteDeletion[];
  sha256: string;
}

type AnyState = Record<string, any>;

// ---------------------------------------------------------------------------
// Integridade
// ---------------------------------------------------------------------------

/** JSON com chaves ordenadas: o mesmo conteúdo gera sempre o mesmo texto. */
export function stableStringify(value: any): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value) ?? 'null';
  if (Array.isArray(value)) return `[${value.map((v) => (v === undefined ? 'null' : stableStringify(v))).join(',')}]`;
  const keys = Object.keys(value)
    .filter((k) => value[k] !== undefined && typeof value[k] !== 'function')
    .sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(value[k])}`).join(',')}}`;
}

export function computeLoteHash(packet: Omit<LotePacket, 'sha256'> | LotePacket): string {
  const { sha256: _ignored, ...content } = packet as LotePacket;
  return sha256Hex(stableStringify(content));
}

// ---------------------------------------------------------------------------
// Exclusões registradas na escola
// ---------------------------------------------------------------------------

/** Exclusões entre dois estados, só das listas que viajam no lote. */
export function loteDeletionsBetween(prev: AnyState | null | undefined, next: AnyState | null | undefined, at = new Date().toISOString()): LoteDeletion[] {
  if (!prev || !next) return [];
  const out: LoteDeletion[] = [];
  for (const k of LOTE_UNIT_KEYS) {
    const before: any[] = Array.isArray(prev[k]) ? prev[k] : [];
    const after: any[] = Array.isArray(next[k]) ? next[k] : [];
    if (!before.length) continue;
    const keep = new Set(after.map((r) => String(r?.id)));
    const removed = before.filter((r) => r && r.id !== undefined && !keep.has(String(r.id)));
    // Remoção em massa (limpar base, restaurar backup) não é tratada como exclusão escolar.
    if (removed.length >= 20 && removed.length / before.length >= 0.5) continue;
    for (const r of removed) out.push({ k, id: String(r.id), at });
  }
  return out;
}

export function appendDeletionLog(log: LoteDeletion[] | undefined, entries: LoteDeletion[], max = 5000): LoteDeletion[] {
  const base = Array.isArray(log) ? log : [];
  if (!entries.length) return base;
  const seen = new Set(base.map((d) => `${d.k}:${d.id}`));
  const merged = [...base];
  for (const e of entries) {
    const key = `${e.k}:${e.id}`;
    if (!seen.has(key)) {
      merged.push(e);
      seen.add(key);
    }
  }
  return merged.slice(-max);
}

// ---------------------------------------------------------------------------
// Geração do lote (escola)
// ---------------------------------------------------------------------------

export interface BuildLoteOptions {
  operatorName: string;
  originRole: string;
  serverName?: string;
  deletions?: LoteDeletion[];
  /** Inclui registros sem unidade definida (escola com uma única unidade). */
  includeUntagged: boolean;
  now?: string;
  packetId?: string;
}

function list(state: AnyState, k: string): any[] {
  return Array.isArray(state?.[k]) ? state[k] : [];
}

export function buildLotePacket(state: AnyState, unit: LoteUnit, opts: BuildLoteOptions): LotePacket {
  if (!unit?.id) throw new Error('Selecione a unidade escolar que está gerando o lote.');
  const createdAt = opts.now || new Date().toISOString();
  const untagged = opts.includeUntagged;
  const ownUnit = (r: any) => (r?.schoolUnitId ? r.schoolUnitId === unit.id : untagged);

  const classes = list(state, 'classes').filter(ownUnit);
  const classIds = new Set(classes.map((c) => String(c.id)));
  const students = list(state, 'students').filter((s) =>
    s?.schoolUnitId ? s.schoolUnitId === unit.id : classIds.has(String(s?.classId)) || untagged
  );
  const studentIds = new Set(students.map((s) => String(s.id)));
  const byClass = (r: any) =>
    r?.schoolUnitId ? r.schoolUnitId === unit.id : r?.classId ? classIds.has(String(r.classId)) : untagged;
  const exams = list(state, 'exams').filter(byClass);
  const examIds = new Set(exams.map((e) => String(e.id)));

  const data: Record<string, any[]> = {
    students,
    classes,
    exams,
    submissions: list(state, 'submissions').filter(
      (s) => studentIds.has(String(s?.studentId)) || examIds.has(String(s?.examId)) || classIds.has(String(s?.classId))
    ),
    academicHistories: list(state, 'academicHistories').filter((h) => studentIds.has(String(h?.studentId))),
    attendanceSheets: list(state, 'attendanceSheets').filter(byClass),
    lessonRegistries: list(state, 'lessonRegistries').filter(byClass),
    classGradeSheets: list(state, 'classGradeSheets').filter(byClass),
    teacherLessonPlans: list(state, 'teacherLessonPlans').filter(byClass),
    teacherStudentNotes: list(state, 'teacherStudentNotes').filter(
      (n) => studentIds.has(String(n?.studentId)) || classIds.has(String(n?.classId))
    ),
    subjects: list(state, 'subjects'),
    courses: list(state, 'courses'),
    questions: list(state, 'questions'),
  };

  // Marca a unidade nos registros que têm esse campo (a Sede usa isso para separar as escolas).
  for (const k of TAGGABLE_KEYS) data[k] = data[k].map((r) => (r.schoolUnitId ? r : { ...r, schoolUnitId: unit.id }));

  // Só exclusões de registros que não existem mais (um registro recriado prevalece).
  const present = new Map<string, Set<string>>();
  for (const k of LOTE_UNIT_KEYS) present.set(k, new Set(list(state, k).map((r) => String(r?.id))));
  const deletions = appendDeletionLog([], (opts.deletions || []).filter((d) => LOTE_UNIT_KEYS.includes(d.k as any) && !present.get(d.k)?.has(String(d.id))));

  const counts: Record<string, number> = {};
  for (const k of LOTE_KEYS) counts[k] = data[k].length;
  counts.deletions = deletions.length;

  const { password: _p, ...safeUnit } = unit as any;
  const packet: Omit<LotePacket, 'sha256'> = {
    format: LOTE_FORMAT,
    formatVersion: LOTE_FORMAT_VERSION,
    packetId: opts.packetId || `LOTE-${(unit.inepCode || unit.id).toString().replace(/[^\w-]/g, '')}-${createdAt.replace(/[-:.TZ]/g, '').slice(0, 14)}`,
    createdAt,
    origin: { role: opts.originRole, serverName: opts.serverName, operatorName: opts.operatorName || 'Não informado' },
    schoolUnit: { ...safeUnit, lastSyncDate: createdAt },
    municipality: { name: state?.municipalSecretary?.city || state?.settings?.city, state: state?.municipalSecretary?.state || state?.settings?.state },
    counts,
    data,
    deletions,
  };
  return { ...packet, sha256: computeLoteHash(packet) };
}

// ---------------------------------------------------------------------------
// Leitura do arquivo (Sede)
// ---------------------------------------------------------------------------

export interface ParsedLote {
  packet: LotePacket;
  /** ok = SHA-256 confere; ausente = pacote antigo (formato 1), sem verificação. */
  integrity: 'ok' | 'ausente';
  legacy: boolean;
}

export function parseLoteFile(text: string): ParsedLote {
  let raw: any;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error('Arquivo ilegível: não é um lote .edusync válido.');
  }
  if (raw && raw.format === LOTE_FORMAT) {
    if (Number(raw.formatVersion) > LOTE_FORMAT_VERSION) {
      throw new Error('Este lote foi gerado por uma versão mais nova do sistema. Atualize o sistema da Sede antes de importar.');
    }
    if (!raw.schoolUnit?.id || !raw.data || typeof raw.data !== 'object') throw new Error('Lote incompleto: faltam a unidade escolar ou os dados.');
    if (!raw.sha256 || computeLoteHash(raw) !== raw.sha256) {
      throw new Error('O arquivo foi alterado ou está corrompido (código de integridade SHA-256 não confere). Gere um novo lote na escola.');
    }
    return { packet: raw as LotePacket, integrity: 'ok', legacy: false };
  }
  // Pacote do formato anterior (Exportar Polo .edusync, versão 4.x).
  if (raw && raw.packetId && raw.schoolUnit?.id && raw.data && typeof raw.data === 'object') {
    const data: Record<string, any[]> = {};
    for (const k of LOTE_KEYS) data[k] = Array.isArray(raw.data[k]) ? raw.data[k] : [];
    const counts: Record<string, number> = {};
    for (const k of LOTE_KEYS) counts[k] = data[k].length;
    counts.deletions = 0;
    return {
      packet: {
        format: LOTE_FORMAT,
        formatVersion: 1,
        packetId: String(raw.packetId),
        createdAt: raw.exportedAt || new Date().toISOString(),
        origin: { role: 'FORMATO-ANTIGO', operatorName: raw.operatorName || 'Não informado' },
        schoolUnit: raw.schoolUnit,
        counts,
        data,
        deletions: [],
        sha256: '',
      },
      integrity: 'ausente',
      legacy: true,
    };
  }
  throw new Error('O arquivo selecionado não é um lote de sincronização SucessoEdu (.edusync).');
}

// ---------------------------------------------------------------------------
// Importação por mescla (Sede)
// ---------------------------------------------------------------------------

export interface LoteMergeReport {
  unitId: string;
  unitName: string;
  unitCreated: boolean;
  added: Record<string, number>;
  updated: Record<string, number>;
  unchanged: Record<string, number>;
  conflicts: { k: string; id: string; ownerUnitId: string }[];
  deleted: number;
  catalogKept: number;
  alreadyImportedAt?: string;
}

function ownerResolver(state: AnyState) {
  const classOwner = new Map<string, string>();
  for (const c of list(state, 'classes')) if (c?.schoolUnitId) classOwner.set(String(c.id), c.schoolUnitId);
  const studentOwner = new Map<string, string>();
  for (const s of list(state, 'students')) {
    const owner = s?.schoolUnitId || classOwner.get(String(s?.classId));
    if (owner) studentOwner.set(String(s.id), owner);
  }
  return (r: any): string | undefined =>
    r?.schoolUnitId || (r?.classId ? classOwner.get(String(r.classId)) : undefined) || (r?.studentId ? studentOwner.get(String(r.studentId)) : undefined);
}

/** INEP real: 8 dígitos e diferente dos códigos de exemplo. */
export function isValidInep(value: unknown): boolean {
  const inep = String(value ?? '').trim();
  return /^\d{8}$/.test(inep) && !['12345678', '00000000', '11111111', '99999999'].includes(inep);
}

/**
 * Unidade da Sede que corresponde à escola do lote. O INEP tem prioridade; o código
 * interno só vale se o INEP não indicar outra escola (duas escolas podem ter o mesmo
 * código interno de modelo, mas não o mesmo INEP).
 */
export function findTargetUnit(state: AnyState, unit: LoteUnit): any | undefined {
  const units = list(state, 'schoolUnits');
  const inep = String(unit.inepCode || '').trim();
  if (isValidInep(inep)) {
    const byInep = units.find((u) => String(u?.inepCode || '').trim() === inep);
    if (byInep) return byInep;
  }
  const byId = units.find((u) => u?.id === unit.id);
  if (byId && isValidInep(byId.inepCode) && isValidInep(inep) && String(byId.inepCode).trim() !== inep) return undefined;
  return byId;
}

/** O lote é mais antigo que o último já importado desta escola? (importá-lo desfaria alterações) */
export function isOlderThanLastImport(state: AnyState, packet: LotePacket): string | undefined {
  const unit = findTargetUnit(state, packet.schoolUnit);
  const last = unit?.lastLoteCreatedAt;
  if (last && Date.parse(packet.createdAt) < Date.parse(last)) return last;
  return undefined;
}

export function mergeLotePacket(state: AnyState, packet: LotePacket, operatorName: string, now = new Date().toISOString()): { next: AnyState; report: LoteMergeReport } {
  const next: AnyState = { ...state };
  const existingUnit = findTargetUnit(state, packet.schoolUnit);
  // Código interno já usado por OUTRA escola na Sede: cria a unidade com código próprio.
  const idTaken = !existingUnit && list(state, 'schoolUnits').some((u) => u?.id === packet.schoolUnit.id);
  const unitId = existingUnit?.id || (idTaken ? `${packet.schoolUnit.id}-${String(packet.schoolUnit.inepCode || 'lote').trim()}` : packet.schoolUnit.id);
  const unitName = existingUnit?.name || packet.schoolUnit.name;
  const report: LoteMergeReport = {
    unitId,
    unitName,
    unitCreated: !existingUnit,
    added: {},
    updated: {},
    unchanged: {},
    conflicts: [],
    deleted: 0,
    catalogKept: 0,
  };
  const previousImport = list(state, 'syncLogs').find((l) => typeof l?.notes === 'string' && l.notes.includes(packet.packetId));
  if (previousImport) report.alreadyImportedAt = previousImport.importedAt;

  const ownerOf = ownerResolver(state);

  for (const k of LOTE_UNIT_KEYS) {
    const incoming = Array.isArray(packet.data?.[k]) ? packet.data[k] : [];
    if (!incoming.length) continue;
    const current = list(next, k);
    const index = new Map<string, number>();
    current.forEach((r, i) => index.set(String(r?.id), i));
    const merged = [...current];
    let added = 0;
    let updated = 0;
    let unchanged = 0;
    for (const rec of incoming) {
      if (!rec || rec.id === undefined || rec.id === null) continue;
      const id = String(rec.id);
      // A unidade do lote pode ter outro código na Sede (identificada pelo INEP).
      const value = TAGGABLE_KEYS.has(k)
        ? { ...rec, schoolUnitId: rec.schoolUnitId === packet.schoolUnit.id || !rec.schoolUnitId ? unitId : rec.schoolUnitId }
        : rec;
      if (TAGGABLE_KEYS.has(k) && value.schoolUnitId !== unitId) {
        report.conflicts.push({ k, id, ownerUnitId: value.schoolUnitId });
        continue;
      }
      const pos = index.get(id);
      if (pos === undefined) {
        index.set(id, merged.length);
        merged.push(value);
        added++;
        continue;
      }
      const owner = ownerOf(merged[pos]);
      if (owner && owner !== unitId) {
        report.conflicts.push({ k, id, ownerUnitId: owner });
        continue;
      }
      if (JSON.stringify(merged[pos]) === JSON.stringify(value)) unchanged++;
      else {
        merged[pos] = value;
        updated++;
      }
    }
    next[k] = merged;
    report.added[k] = added;
    report.updated[k] = updated;
    report.unchanged[k] = unchanged;
  }

  for (const k of LOTE_CATALOG_KEYS) {
    const incoming = Array.isArray(packet.data?.[k]) ? packet.data[k] : [];
    if (!incoming.length) continue;
    const current = list(next, k);
    const ids = new Set(current.map((r) => String(r?.id)));
    const fresh = incoming.filter((r) => r && r.id !== undefined && !ids.has(String(r.id)));
    report.catalogKept += incoming.length - fresh.length;
    next[k] = [...current, ...fresh];
    report.added[k] = fresh.length;
  }

  // Exclusões feitas na escola: só apaga o que pertence a esta unidade.
  const ownerAfter = ownerResolver(next);
  for (const d of Array.isArray(packet.deletions) ? packet.deletions : []) {
    if (!LOTE_UNIT_KEYS.includes(d.k as any)) continue;
    const current = list(next, d.k);
    const target = current.find((r) => String(r?.id) === String(d.id));
    if (!target) continue;
    const owner = ownerAfter(target);
    if (owner && owner !== unitId) continue;
    if (!owner) {
      // Registro sem dono conhecido: apaga somente se estiver ligado a turma/aluno do lote.
      const linked =
        (target.classId && (packet.data.classes || []).some((c: any) => String(c.id) === String(target.classId))) ||
        (target.studentId && (packet.data.students || []).some((s: any) => String(s.id) === String(target.studentId)));
      if (!linked) continue;
    }
    next[d.k] = current.filter((r) => r !== target);
    report.deleted++;
  }

  // Unidade escolar: cria se não existir e atualiza contadores e data da sincronização.
  const unitStudents = list(next, 'students').filter((s) => s.schoolUnitId === unitId).length;
  const unitClasses = list(next, 'classes').filter((c) => c.schoolUnitId === unitId).length;
  const units = list(next, 'schoolUnits');
  const baseUnit = existingUnit || { ...packet.schoolUnit, id: unitId };
  const prevLote = (baseUnit as any).lastLoteCreatedAt;
  const updatedUnit = {
    ...baseUnit,
    id: unitId,
    lastLoteCreatedAt: prevLote && Date.parse(prevLote) > Date.parse(packet.createdAt) ? prevLote : packet.createdAt,
    totalStudents: unitStudents,
    totalClasses: unitClasses,
    lastSyncDate: now,
    syncStatus: 'SINCRONIZADO',
  };
  next.schoolUnits = existingUnit ? units.map((u) => (u.id === unitId ? updatedUnit : u)) : [...units, updatedUnit];

  const sum = (rec: Record<string, number>) => Object.values(rec).reduce((a, b) => a + b, 0);
  const log = {
    id: `sync-${Date.parse(now) || Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    schoolUnitId: unitId,
    schoolUnitName: unitName,
    importedAt: now,
    operatorName: operatorName || 'Não informado',
    recordsMerged: {
      students: (report.added.students || 0) + (report.updated.students || 0),
      classes: (report.added.classes || 0) + (report.updated.classes || 0),
      exams: (report.added.exams || 0) + (report.updated.exams || 0),
      submissions: (report.added.submissions || 0) + (report.updated.submissions || 0),
    },
    status: report.conflicts.length ? 'AVISO' : 'SUCESSO',
    notes: `Lote ${packet.packetId} (${packet.createdAt}): ${sum(report.added)} novos, ${sum(report.updated)} atualizados, ${report.deleted} exclusões, ${report.conflicts.length} conflitos.`,
  };
  next.syncLogs = [log, ...list(next, 'syncLogs')].slice(0, 500);
  return { next, report };
}
