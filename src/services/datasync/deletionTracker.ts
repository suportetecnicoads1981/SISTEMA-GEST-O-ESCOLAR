/**
 * Propagação de exclusões para a nuvem.
 *
 * A sincronização envia os registros por upsert e a leitura da nuvem é uma mescla
 * não destrutiva. Por isso, um registro excluído na tela continuava no Supabase e
 * "voltava" na próxima leitura. Aqui cada exclusão local vira uma pendência
 * (tombstone) que é enviada como DELETE na próxima sincronização e que impede o
 * registro de reaparecer enquanto a exclusão não for confirmada.
 *
 * Proteção: se uma única gravação remover muitos registros de uma tabela de uma
 * vez (ex.: restauração de backup ou "limpar base"), isso NÃO é enviado à nuvem.
 * Limpezas em massa na nuvem devem ser feitas de forma consciente pelo administrador.
 */

/** Chave do estado local -> tabela no Supabase. */
export const ENTITY_TABLES: Record<string, string> = {
  students: 'students',
  classes: 'school_classes',
  subjects: 'subjects',
  courses: 'courses',
  questions: 'questions',
  exams: 'exams',
  submissions: 'exam_submissions',
  attendanceSheets: 'attendance_sheets',
  lessonRegistries: 'lesson_registries',
  classGradeSheets: 'class_grade_sheets',
  academicHistories: 'academic_histories',
  schoolUnits: 'school_units',
  userAccounts: 'user_accounts',
  communications: 'communications',
  notifications: 'notifications',
};

export const PENDING_DELETES_KEY = 'sucessoedu_pending_deletes_v1';

/** Acima destes limites, a remoção é tratada como operação em massa e não vai à nuvem. */
export const MASS_DELETE_MIN = 20;
export const MASS_DELETE_RATIO = 0.5;

export interface PendingDelete {
  table: string;
  id: string;
  at: string;
}

type AnyState = Record<string, any> | null | undefined;

function idsOf(list: unknown): Set<string> {
  const out = new Set<string>();
  if (!Array.isArray(list)) return out;
  for (const item of list) {
    if (item && (item as any).id !== undefined && (item as any).id !== null) out.add(String((item as any).id));
  }
  return out;
}

/** Ids removidos entre dois estados, por tabela, já aplicando a proteção contra remoção em massa. */
export function computeRemovals(prev: AnyState, next: AnyState): { removals: Record<string, string[]>; skippedMass: string[] } {
  const removals: Record<string, string[]> = {};
  const skippedMass: string[] = [];
  if (!prev || !next) return { removals, skippedMass };

  for (const [key, table] of Object.entries(ENTITY_TABLES)) {
    const before = idsOf(prev[key]);
    if (before.size === 0) continue;
    const after = idsOf(next[key]);
    const removed = [...before].filter((id) => !after.has(id));
    if (removed.length === 0) continue;
    const isMass = removed.length >= MASS_DELETE_MIN && removed.length / before.size >= MASS_DELETE_RATIO;
    if (isMass) {
      skippedMass.push(table);
      continue;
    }
    removals[table] = removed;
  }
  return { removals, skippedMass };
}

function readQueue(): PendingDelete[] {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(PENDING_DELETES_KEY) : null;
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((p) => p && p.table && p.id) : [];
  } catch {
    return [];
  }
}

function writeQueue(queue: PendingDelete[]): void {
  try {
    if (typeof localStorage !== 'undefined') localStorage.setItem(PENDING_DELETES_KEY, JSON.stringify(queue));
  } catch {
    /* armazenamento cheio ou indisponível */
  }
}

export function getPendingDeletes(): PendingDelete[] {
  return readQueue();
}

/** Registra as exclusões feitas entre o estado anterior e o novo. */
export function recordDeletions(prev: AnyState, next: AnyState): void {
  const { removals, skippedMass } = computeRemovals(prev, next);
  if (skippedMass.length) {
    console.warn('[SucessoEdu] Remoção em massa não enviada à nuvem:', skippedMass.join(', '));
  }
  const entries = Object.entries(removals);
  if (!entries.length) return;
  const queue = readQueue();
  const known = new Set(queue.map((p) => `${p.table}:${p.id}`));
  const now = new Date().toISOString();
  for (const [table, ids] of entries) {
    for (const id of ids) {
      const key = `${table}:${id}`;
      if (!known.has(key)) {
        queue.push({ table, id, at: now });
        known.add(key);
      }
    }
  }
  writeQueue(queue);
}

/** Um registro recriado localmente (mesmo id) deixa de estar pendente de exclusão. */
export function clearRecreated(next: AnyState): void {
  if (!next) return;
  const queue = readQueue();
  if (!queue.length) return;
  const present = new Map<string, Set<string>>();
  for (const [key, table] of Object.entries(ENTITY_TABLES)) present.set(table, idsOf(next[key]));
  const kept = queue.filter((p) => !present.get(p.table)?.has(String(p.id)));
  if (kept.length !== queue.length) writeQueue(kept);
}

export function tombstonedIds(table: string): Set<string> {
  return new Set(readQueue().filter((p) => p.table === table).map((p) => String(p.id)));
}

/** Remove das linhas vindas da nuvem as que foram excluídas localmente e ainda aguardam confirmação. */
export function withoutTombstones<T extends { id?: any }>(table: string, rows: T[] | null | undefined): T[] | null | undefined {
  if (!Array.isArray(rows) || rows.length === 0) return rows;
  const dead = tombstonedIds(table);
  if (!dead.size) return rows;
  return rows.filter((r) => !dead.has(String(r?.id)));
}

export interface DeleteClient {
  from(table: string): {
    delete(): { in(column: string, values: string[]): PromiseLike<{ error: any }> };
  };
}

/**
 * Envia as exclusões pendentes. Só ADMIN pode excluir (políticas RLS); para os
 * demais papéis as pendências ficam guardadas e o registro continua oculto localmente.
 */
export async function flushPendingDeletes(client: DeleteClient, isAdmin: boolean): Promise<{ deleted: number; failed: number }> {
  const queue = readQueue();
  if (!queue.length || !isAdmin) return { deleted: 0, failed: 0 };

  const byTable = new Map<string, string[]>();
  for (const p of queue) {
    const list = byTable.get(p.table) || [];
    list.push(String(p.id));
    byTable.set(p.table, list);
  }

  const done = new Set<string>();
  let deleted = 0;
  let failed = 0;
  for (const [table, ids] of byTable) {
    for (let i = 0; i < ids.length; i += 100) {
      const chunk = ids.slice(i, i + 100);
      try {
        const { error } = await client.from(table).delete().in('id', chunk);
        if (error) {
          failed += chunk.length;
          console.warn(`[SucessoEdu] Falha ao excluir em ${table}:`, error.message || error);
        } else {
          deleted += chunk.length;
          chunk.forEach((id) => done.add(`${table}:${id}`));
        }
      } catch (err) {
        failed += chunk.length;
      }
    }
  }
  // Relê a fila: exclusões feitas durante o envio não podem se perder.
  writeQueue(readQueue().filter((p) => !done.has(`${p.table}:${p.id}`)));
  return { deleted, failed };
}
