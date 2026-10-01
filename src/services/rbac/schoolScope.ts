/**
 * Escola de lotação do usuário (escopo por escola).
 *
 * Quem tem uma "Unidade Escolar de Lotação" no cadastro de usuários trabalha só com a própria
 * escola: vê apenas os alunos, turmas, frequência, notas, documentos e números dela, e não
 * consegue incluir, alterar ou excluir registros de outra escola.
 * Quem está como "Rede Municipal Global (Todas as Unidades)" e o Master veem a rede inteira.
 *
 * As mesmas regras valem no servidor da rede local (public/offline/servidor_sucessoedu.ps1),
 * conferidas pelo teste tests/schoolScope.test.ts.
 */

/** Cadastros que pertencem a uma escola (os demais, como questões e BNCC, são da rede). */
export const SCHOOL_SCOPED_COLLECTIONS = [
  'schoolUnits',
  'students',
  'classes',
  'attendanceSheets',
  'lessonRegistries',
  'classGradeSheets',
  'academicHistories',
  'exams',
  'submissions',
  'bnccAssessments',
  'teacherLessonPlans',
  'teacherStudentNotes',
] as const;

export type ScopedCollection = (typeof SCHOOL_SCOPED_COLLECTIONS)[number];

/** Cadastros sem escola que continuam visíveis a todos (ex.: prova aplicada na rede inteira). */
const NETWORK_WIDE_ALLOWED: ReadonlySet<string> = new Set(['exams']);

/** Cadastros que recebem a escola do usuário quando ele inclui sem informar a escola. */
const STAMP_ON_CREATE: ReadonlySet<string> = new Set(['students', 'classes']);

type ScopeActor = { isMaster?: boolean; sector?: string; schoolUnitId?: string | null } | null | undefined;

const text = (v: unknown) => (v == null ? '' : String(v).trim());

/**
 * Escola a que o usuário está restrito, ou null quando ele vê a rede inteira.
 * A escola vale mesmo se tiver sido apagada: nesse caso ele não vê nada (nunca a rede toda).
 */
export function userSchoolScope(actor: ScopeActor): string | null {
  if (!actor) return null;
  if (actor.isMaster || actor.sector === 'MASTER') return null;
  const id = text(actor.schoolUnitId);
  return id || null;
}

/** Índice de escola por turma e por aluno, para achar a escola de qualquer registro. */
export interface SchoolIndex {
  classSchool: Map<string, string>;
  studentSchool: Map<string, string>;
}

export function buildSchoolIndex(state: any): SchoolIndex {
  const classSchool = new Map<string, string>();
  for (const c of Array.isArray(state?.classes) ? state.classes : []) {
    if (c && c.id != null) classSchool.set(String(c.id), text(c.schoolUnitId));
  }
  const studentSchool = new Map<string, string>();
  for (const s of Array.isArray(state?.students) ? state.students : []) {
    if (s && s.id != null) studentSchool.set(String(s.id), text(s.schoolUnitId) || classSchool.get(text(s.classId)) || '');
  }
  return { classSchool, studentSchool };
}

/** Escola do registro ('' quando o registro não está ligado a nenhuma escola). */
export function recordSchool(collection: string, record: any, index: SchoolIndex): string {
  if (!record || typeof record !== 'object') return '';
  if (collection === 'schoolUnits') return text(record.id);
  const own = text(record.schoolUnitId);
  if (own) return own;
  if (collection === 'classes') return '';
  const byClass = index.classSchool.get(text(record.classId));
  if (byClass) return byClass;
  if (collection === 'students') return '';
  return index.studentSchool.get(text(record.studentId)) || '';
}

/** O registro pode ser visto/gravado por quem está restrito à escola `scope`? */
function inScope(collection: string, record: any, index: SchoolIndex, scope: string): boolean {
  const school = recordSchool(collection, record, index);
  if (school) return school === scope;
  return NETWORK_WIDE_ALLOWED.has(collection);
}

/** O registro pertence a uma destas escolas? (sem escola: só os cadastros da rede, como provas) */
export function recordInSchools(collection: string, record: any, index: SchoolIndex, ids: ReadonlySet<string>): boolean {
  const school = recordSchool(collection, record, index);
  if (school) return ids.has(school);
  return NETWORK_WIDE_ALLOWED.has(collection);
}

/** Dados que o usuário enxerga: só os da escola dele (o estado completo não é alterado). */
export function scopeDataToSchool<T extends Record<string, any>>(state: T, scope: string | null): T {
  if (!scope || !state) return state;
  const index = buildSchoolIndex(state);
  const out: Record<string, any> = { ...state };
  for (const collection of SCHOOL_SCOPED_COLLECTIONS) {
    const list = (state as any)[collection];
    if (!Array.isArray(list)) continue;
    out[collection] = list.filter((r) => inScope(collection, r, index, scope));
  }
  return out as T;
}

export interface ScopeDenial {
  collection: string;
  count: number;
}

const idOf = (r: any, i: number) => (r && typeof r === 'object' && r.id != null ? String(r.id) : `#${i}`);

/**
 * Recusa, registro a registro, qualquer inclusão, alteração ou exclusão em outra escola.
 * Registros de outras escolas que sumiram da gravação (ex.: a tela só conhecia os da própria
 * escola e regravou a lista) voltam como estavam: nada de outra escola é apagado.
 */
export function enforceSchoolScope<T extends Record<string, any>>(
  prev: T,
  next: T,
  scope: string | null
): { next: T; denied: ScopeDenial[] } {
  if (!scope || !prev || !next || prev === next) return { next, denied: [] };
  const beforeIndex = buildSchoolIndex(prev);
  const afterIndex = buildSchoolIndex(next);
  let result: Record<string, any> | null = null;
  const denied: ScopeDenial[] = [];

  for (const collection of SCHOOL_SCOPED_COLLECTIONS) {
    const before = (prev as any)[collection];
    const after = (next as any)[collection];
    if (before === after || !Array.isArray(after)) continue;
    const oldList: any[] = Array.isArray(before) ? before : [];
    const oldById = new Map<string, any>();
    oldList.forEach((r, i) => oldById.set(idOf(r, i), r));

    let refused = 0;
    let changed = false;
    const seen = new Set<string>();
    const kept: any[] = [];
    after.forEach((r, i) => {
      const id = idOf(r, i);
      seen.add(id);
      const old = oldById.get(id);
      if (old === r) {
        kept.push(r);
        return;
      }
      if (old === undefined) {
        // Inclusão: sem escola informada, aluno e turma ficam na escola do usuário.
        let rec = r;
        if (STAMP_ON_CREATE.has(collection) && rec && typeof rec === 'object' && !recordSchool(collection, rec, afterIndex)) {
          rec = { ...rec, schoolUnitId: scope };
          changed = true;
        }
        if (inScope(collection, rec, afterIndex, scope)) kept.push(rec);
        else {
          refused += 1;
          changed = true;
        }
        return;
      }
      // Alteração: o registro precisa ser da escola antes e continuar nela depois.
      if (inScope(collection, old, beforeIndex, scope) && inScope(collection, r, afterIndex, scope)) kept.push(r);
      else {
        if (JSON.stringify(old) !== JSON.stringify(r)) refused += 1;
        kept.push(old);
        changed = true;
      }
    });
    // Exclusão: só de registros da própria escola.
    oldList.forEach((r, i) => {
      const id = idOf(r, i);
      if (seen.has(id)) return;
      if (!inScope(collection, r, beforeIndex, scope)) {
        kept.push(r);
        changed = true;
        // Registro que a tela nem mostrava não conta como tentativa de exclusão.
      }
    });

    if (changed) {
      result = result || { ...next };
      result[collection] = kept;
    }
    if (refused) denied.push({ collection, count: refused });
  }
  return { next: (result as T) || next, denied };
}
