/**
 * Escola sede (polo) e escolas anexas.
 *
 * A anexa é uma escola própria (com turmas, alunos e INEP, se tiver), ligada à escola sede pelo
 * campo `parentUnitId`. Assim cada escola continua com os seus dados, e os relatórios podem
 * juntar a sede com as anexas dela (relatório conjunto).
 */
import type { SchoolUnit } from '../types';

type UnitLike = Pick<SchoolUnit, 'id' | 'name'> & Partial<Pick<SchoolUnit, 'parentUnitId' | 'isAnnex' | 'type'>>;

const text = (v: unknown) => (v == null ? '' : String(v).trim());

/** É escola anexa (ligada a uma escola sede). */
export function isAnnexUnit(unit: UnitLike | undefined | null): boolean {
  return !!unit && !!text(unit.parentUnitId);
}

/** Escolas anexas de uma escola sede, em ordem alfabética. */
export function annexesOf<T extends UnitLike>(unitId: string | undefined | null, units: T[] | undefined | null): T[] {
  const id = text(unitId);
  if (!id) return [];
  return (units || [])
    .filter((u) => u && text(u.parentUnitId) === id && u.id !== id)
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
}

/** Escola sede de uma anexa (undefined quando a escola não é anexa ou a sede não existe mais). */
export function parentOf<T extends UnitLike>(unit: UnitLike | undefined | null, units: T[] | undefined | null): T | undefined {
  const pid = text(unit?.parentUnitId);
  if (!pid) return undefined;
  return (units || []).find((u) => u && u.id === pid);
}

/** Ids da escola e, se pedido, das anexas dela (para o relatório conjunto sede + anexas). */
export function schoolGroupIds(unitId: string | undefined | null, units: UnitLike[] | undefined | null, includeAnnexes: boolean): Set<string> {
  const id = text(unitId);
  const ids = new Set<string>();
  if (!id) return ids;
  ids.add(id);
  if (includeAnnexes) annexesOf(id, units).forEach((a) => ids.add(a.id));
  return ids;
}

/** Nome da escola para cabeçalhos: "ESCOLA X (anexa de ESCOLA Y)". */
export function unitDisplayName(unit: UnitLike | undefined | null, units: UnitLike[] | undefined | null): string {
  if (!unit) return '';
  const parent = parentOf(unit, units);
  return parent ? `${unit.name} (anexa de ${parent.name})` : unit.name;
}

/**
 * Confere se a escola pode ficar como anexa da sede escolhida.
 * Devolve a mensagem do problema, ou '' quando está tudo certo.
 */
export function annexLinkProblem(unitId: string | undefined | null, parentId: string | undefined | null, units: UnitLike[] | undefined | null): string {
  const id = text(unitId);
  const pid = text(parentId);
  if (!pid) return 'Escolha a escola sede desta escola anexa.';
  if (id && pid === id) return 'A escola não pode ser anexa dela mesma.';
  const parent = (units || []).find((u) => u && u.id === pid);
  if (!parent) return 'A escola sede escolhida não está mais cadastrada.';
  if (isAnnexUnit(parent)) return `"${parent.name}" já é anexa de outra escola. Escolha a escola sede principal.`;
  if (id) {
    const own = annexesOf(id, units);
    if (own.length > 0) {
      return `Esta escola é sede de ${own.length === 1 ? 'uma anexa' : `${own.length} anexas`} (${own.map((a) => a.name).join(', ')}). Desvincule as anexas antes de torná-la anexa de outra escola.`;
    }
  }
  return '';
}

/**
 * Anexas escolhidas para o relatório conjunto: só as que ainda são anexas da sede
 * (uma escolha antiga de outra sede é ignorada), na ordem alfabética das anexas.
 */
export function chosenAnnexIds(unitId: string | undefined | null, units: UnitLike[] | undefined | null, chosen: string[] | undefined | null): string[] {
  const set = new Set(chosen || []);
  return annexesOf(unitId, units)
    .filter((a) => set.has(a.id))
    .map((a) => a.id);
}

export interface SchoolTotalsLine {
  unitId: string;
  values: Record<string, number>;
}

/**
 * Quadro totalizador: soma as medidas de cada escola (na ordem em que as escolas aparecem
 * nos blocos do relatório: sede e depois as anexas) e o total geral de todas.
 */
export function totalsBySchool<T>(
  groups: { schoolUnitId?: string; rows: T[] }[],
  measure: (rows: T[]) => Record<string, number>
): { lines: SchoolTotalsLine[]; total: Record<string, number> } {
  const rowsBySchool = new Map<string, T[]>();
  for (const g of groups) {
    const id = text(g.schoolUnitId);
    if (!rowsBySchool.has(id)) rowsBySchool.set(id, []);
    rowsBySchool.get(id)!.push(...g.rows);
  }
  const lines = Array.from(rowsBySchool.entries()).map(([unitId, rows]) => ({ unitId, values: measure(rows) }));
  const total: Record<string, number> = {};
  for (const l of lines) for (const [k, v] of Object.entries(l.values)) total[k] = (total[k] || 0) + (Number(v) || 0);
  return { lines, total };
}
