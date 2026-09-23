/**
 * Operações de sincronização por registro entre as estações e o Servidor Remoto
 * (ou o Servidor da Sede) da rede local.
 *
 * Cada gravação na tela vira uma lista pequena de operações (incluir/alterar,
 * excluir ou substituir um valor). As operações são aplicadas sobre a versão
 * mais recente do banco do servidor. Assim, duas estações gravando ao mesmo
 * tempo não apagam o trabalho uma da outra: só colidem se alterarem o MESMO
 * registro, e nesse caso vale a última gravação.
 */

export type StoreOp =
  | { k: string; t: 'u'; id: string; v: any } // inclui ou altera o registro `id` da lista `k`
  | { k: string; t: 'd'; id: string } // exclui o registro `id` da lista `k`
  | { k: string; t: 's'; v: any }; // substitui o valor inteiro da chave `k`

type AnyState = Record<string, any>;

/** Acima destes limites a remoção é tratada como limpeza em massa e não é enviada (mesma regra da nuvem). */
export const LOCAL_MASS_DELETE_MIN = 20;
export const LOCAL_MASS_DELETE_RATIO = 0.5;

function isIdList(value: unknown): value is Array<{ id: unknown }> {
  return (
    Array.isArray(value) &&
    value.every((item) => item && typeof item === 'object' && (item as any).id !== undefined && (item as any).id !== null)
  );
}

function byId(list: Array<{ id: unknown }>): Map<string, any> {
  const map = new Map<string, any>();
  for (const item of list) map.set(String(item.id), item);
  return map;
}

/** Operações necessárias para transformar `prev` em `next`. */
export function diffStates(prev: AnyState | null | undefined, next: AnyState | null | undefined): { ops: StoreOp[]; skippedMass: string[] } {
  const ops: StoreOp[] = [];
  const skippedMass: string[] = [];
  if (!next) return { ops, skippedMass };
  const before = prev || {};
  const keys = new Set([...Object.keys(before), ...Object.keys(next)]);

  for (const k of keys) {
    const a = before[k];
    const b = next[k];
    if (b === undefined) continue; // chave ausente no novo estado: não apaga nada
    if (isIdList(b) && (a === undefined || isIdList(a))) {
      const oldMap = byId((a as any[]) || []);
      const newMap = byId(b);
      for (const [id, item] of newMap) {
        const old = oldMap.get(id);
        if (old === undefined || JSON.stringify(old) !== JSON.stringify(item)) ops.push({ k, t: 'u', id, v: item });
      }
      const removed = [...oldMap.keys()].filter((id) => !newMap.has(id));
      if (removed.length) {
        const isMass = removed.length >= LOCAL_MASS_DELETE_MIN && removed.length / oldMap.size >= LOCAL_MASS_DELETE_RATIO;
        if (isMass) skippedMass.push(k);
        else for (const id of removed) ops.push({ k, t: 'd', id });
      }
      continue;
    }
    if (JSON.stringify(a) !== JSON.stringify(b)) ops.push({ k, t: 's', v: b });
  }
  return { ops, skippedMass };
}

function opKey(op: StoreOp): string {
  return op.t === 's' ? `${op.k}` : `${op.k}\u0000${op.id}`;
}

/** Mantém só a última operação de cada registro, preservando a ordem. */
export function compactOps(ops: StoreOp[]): StoreOp[] {
  const last = new Map<string, number>();
  ops.forEach((op, i) => last.set(opKey(op), i));
  // Uma substituição da lista inteira torna obsoletas as operações anteriores nessa lista.
  const lastSet = new Map<string, number>();
  ops.forEach((op, i) => {
    if (op.t === 's') lastSet.set(op.k, i);
  });
  return ops.filter((op, i) => last.get(opKey(op)) === i && !(op.t !== 's' && (lastSet.get(op.k) ?? -1) > i));
}

/** Aplica as operações sobre uma cópia do estado. */
export function applyOps(base: AnyState | null | undefined, ops: StoreOp[]): AnyState {
  const state: AnyState = { ...(base || {}) };
  const touched = new Map<string, Map<string, any>>();
  const order = new Map<string, string[]>();

  const listFor = (k: string) => {
    let map = touched.get(k);
    if (!map) {
      const current = Array.isArray(state[k]) ? state[k] : [];
      map = new Map();
      const ids: string[] = [];
      for (const item of current) {
        const id = item && item.id !== undefined && item.id !== null ? String(item.id) : `__sem_id_${ids.length}`;
        map.set(id, item);
        ids.push(id);
      }
      touched.set(k, map);
      order.set(k, ids);
    }
    return map;
  };

  for (const op of ops) {
    if (op.t === 's') {
      state[op.k] = op.v;
      touched.delete(op.k);
      order.delete(op.k);
      continue;
    }
    const map = listFor(op.k);
    if (op.t === 'u') {
      const ids = order.get(op.k)!;
      if (!map.has(op.id) && !ids.includes(op.id)) ids.push(op.id);
      map.set(op.id, op.v);
    } else {
      map.delete(op.id);
    }
  }

  for (const [k, map] of touched) {
    const seen = new Set<string>();
    state[k] = order
      .get(k)!
      .filter((id) => map.has(id) && !seen.has(id) && (seen.add(id), true))
      .map((id) => map.get(id));
  }
  return state;
}
