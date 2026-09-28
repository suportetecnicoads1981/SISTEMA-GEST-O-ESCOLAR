import { describe, it, expect, beforeEach, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Nuvem de mentira: reproduz a trava de versão do banco (gatilho sync_guard) e as lápides.
// ---------------------------------------------------------------------------
type Row = Record<string, any>;
const db = {
  tables: new Map<string, Map<string, Row>>(),
  tombstones: [] as Row[],
  clock: 0,
  upserts: 0,
};
const tick = () => new Date(Date.UTC(2026, 8, 28, 12, 0, 0) + ++db.clock * 1000).toISOString();
const keyOf = (table: string, r: Row) => (table === 'app_records' ? `${r.collection}/${r.id}` : String(r.id));
const tbl = (t: string) => {
  if (!db.tables.has(t)) db.tables.set(t, new Map());
  return db.tables.get(t)!;
};

class Query implements PromiseLike<any> {
  private filters: Array<(r: Row) => boolean> = [];
  private op: 'select' | 'upsert' | 'delete' = 'select';
  private payload: Row[] = [];
  private from = 0;
  private to = Infinity;
  private orderKey: string | null = null;
  private limitN = Infinity;
  private desc = false;
  constructor(private table: string) {}
  select() {
    return this;
  }
  upsert(rows: Row[]) {
    this.op = 'upsert';
    this.payload = rows;
    return this;
  }
  delete() {
    this.op = 'delete';
    return this;
  }
  eq(col: string, v: any) {
    this.filters.push((r) => r[col] === v);
    return this;
  }
  in(col: string, vs: any[]) {
    const s = new Set(vs.map(String));
    this.filters.push((r) => s.has(String(r[col])));
    return this;
  }
  gt(col: string, v: any) {
    this.filters.push((r) => String(r[col]) > String(v));
    return this;
  }
  order(col: string, opts?: { ascending?: boolean }) {
    if (!this.orderKey) {
      this.orderKey = col;
      this.desc = opts?.ascending === false;
    }
    return this;
  }
  range(a: number, b: number) {
    this.from = a;
    this.to = b;
    return this;
  }
  limit(n: number) {
    this.limitN = n;
    return this;
  }
  private exec(): { data: any; error: any } {
    if (this.table === 'deleted_records') {
      let list = db.tombstones.filter((r) => this.filters.every((f) => f(r)));
      list = list.sort((a, b) => (this.desc ? -1 : 1) * a.deleted_at.localeCompare(b.deleted_at));
      return { data: list.slice(this.from, Math.min(this.to + 1, this.from + this.limitN)), error: null };
    }
    const t = tbl(this.table);
    if (this.op === 'upsert') {
      db.upserts += this.payload.length;
      const back: Row[] = [];
      for (const row of this.payload) {
        const k = keyOf(this.table, row);
        if (db.tombstones.some((d) => d.table_name === this.table && d.record_id === (this.table === 'app_records' ? k : String(row.id)))) continue;
        const cur = t.get(k);
        if (cur) {
          const base = row.base_version;
          if (base !== null && base !== undefined && base !== -1 && base !== cur.row_version) continue; // recusado
          const next = { ...cur, ...row, base_version: null, row_version: cur.row_version + 1, server_updated_at: tick() };
          t.set(k, next);
          back.push(next);
        } else {
          const next = { ...row, base_version: null, row_version: 1, server_updated_at: tick() };
          t.set(k, next);
          back.push(next);
        }
      }
      return { data: back.map((r) => ({ id: r.id, row_version: r.row_version })), error: null };
    }
    const matched = [...t.values()].filter((r) => this.filters.every((f) => f(r)));
    if (this.op === 'delete') {
      for (const r of matched) {
        const k = keyOf(this.table, r);
        t.delete(k);
        db.tombstones.push({ table_name: this.table, record_id: this.table === 'app_records' ? k : String(r.id), deleted_at: tick() });
      }
      return { data: null, error: null };
    }
    let list = matched;
    if (this.orderKey) list = [...list].sort((a, b) => String(a[this.orderKey!]).localeCompare(String(b[this.orderKey!])) || String(a.id).localeCompare(String(b.id)));
    return { data: list.slice(this.from, this.to + 1).map((r) => JSON.parse(JSON.stringify(r))), error: null };
  }
  then<T1 = any, T2 = never>(ok?: ((v: any) => T1 | PromiseLike<T1>) | null, bad?: ((e: any) => T2 | PromiseLike<T2>) | null) {
    return Promise.resolve(this.exec()).then(ok, bad);
  }
}

const fakeClient = {
  auth: { getSession: async () => ({ data: { session: { user: { id: 'u1', app_metadata: { role: 'ADMIN' } } } } }) },
  from: (t: string) => new Query(t),
  channel: () => ({ on: () => ({ subscribe: () => {} }) }),
};

// ---------------------------------------------------------------------------
// Dois "computadores": cada um com seu estado e seu armazenamento local.
// ---------------------------------------------------------------------------
let role: 'SEDE' | undefined;
const computers: Record<string, { state: any; storage: Map<string, string> }> = {};
let current = 'A';
const pc = () => computers[current];

vi.mock('../src/services/datasync/supabaseClient', () => ({ getSupabaseClient: () => fakeClient }));
vi.mock('../src/services/offline/localServerSync', () => ({ getLocalServerInfo: () => (role ? { role } : null) }));
vi.mock('../src/data/storage', () => ({
  getStoredData: () => JSON.parse(JSON.stringify(pc().state)),
  saveStoredData: (d: any) => {
    pc().state = JSON.parse(JSON.stringify(d));
  },
  setAfterLocalSave: () => {},
  performAutoBackup: () => {
    backups++;
  },
}));
let backups = 0;

(globalThis as any).window = { dispatchEvent: () => true, addEventListener: () => {} };
(globalThis as any).localStorage = {
  getItem: (k: string) => (pc().storage.has(k) ? pc().storage.get(k)! : null),
  setItem: (k: string, v: string) => pc().storage.set(k, String(v)),
  removeItem: (k: string) => pc().storage.delete(k),
};

const base = () => ({
  students: [] as any[],
  classes: [] as any[],
  schoolUnits: [] as any[],
  settings: { name: 'SEMED' },
  userAccounts: [{ id: 'adm', name: 'Admin', email: 'a@x.com', role: 'ADMIN', password: 'segredo', isMaster: true }],
});
const aluno = (id: string, extra: any = {}) => ({ id, name: `Aluno ${id}`, enrollmentNumber: `RA-2026-${id}`, series: '1º Ano', raceColor: 'PARDA', ...extra });

async function run(on: string) {
  current = on;
  const m = await import('../src/services/sync/cloudSync');
  return m.__runOnceForTests();
}

beforeEach(() => {
  db.tables.clear();
  db.tombstones = [];
  db.clock = 0;
  db.upserts = 0;
  role = 'SEDE';
  computers.A = { state: base(), storage: new Map() };
  computers.B = { state: base(), storage: new Map() };
});

describe('Sincronização v2 (motor único com trava de versão)', () => {
  it('primeira vez envia o que só existe aqui, depois só o que mudou; a nuvem guarda o registro completo sem senha', async () => {
    computers.A.state.students = [aluno('1'), aluno('2'), aluno('3')];
    await run('A');
    expect(tbl('students').size).toBe(3);
    expect(tbl('students').get('1')!.doc.series).toBe('1º Ano'); // campo que a tabela não tinha
    expect(tbl('user_accounts').get('adm')!.doc.password).toBeUndefined();

    db.upserts = 0;
    await run('A');
    expect(db.upserts).toBe(0); // nada mudou, nada enviado

    computers.A.state.students[1] = { ...computers.A.state.students[1], name: 'Aluno 2 corrigido' };
    await run('A');
    expect(db.upserts).toBe(1);
    expect(tbl('students').get('2')!.row_version).toBe(2);
  });

  it('cópia desatualizada é recusada pela nuvem e recebe a versão atual, com aviso', async () => {
    computers.A.state.students = [aluno('1')];
    await run('A');
    computers.B.state.students = [aluno('1')];
    await run('B'); // B conhece a versão 1

    computers.A.state.students[0].name = 'Nome certo (A)';
    await run('A'); // nuvem: versão 2
    computers.B.state.students[0].name = 'Nome velho (B)';
    const st = await run('B'); // B tenta gravar sobre a versão 1

    expect(tbl('students').get('1')!.doc.name).toBe('Nome certo (A)');
    expect(computers.B.state.students[0].name).toBe('Nome certo (A)');
    expect(st.lastNotices.some((n) => n.kind === 'conflito')).toBe(true);
  });

  it('mesmo conteúdo vindo por outro caminho não gera aviso', async () => {
    computers.A.state.students = [aluno('1')];
    await run('A');
    computers.B.state.students = [aluno('1')];
    await run('B');
    computers.A.state.students[0].name = 'Igual';
    await run('A');
    computers.B.state.students[0].name = 'Igual'; // chegou pelo servidor da rede local
    const st = await run('B');
    expect(st.lastNotices.filter((n) => n.kind === 'conflito')).toHaveLength(0);
    expect(tbl('students').get('1')!.row_version).toBe(2);
  });

  it('exclusão chega aos outros computadores e o registro não volta', async () => {
    computers.A.state.students = [aluno('1'), aluno('2')];
    await run('A');
    computers.B.state.students = [aluno('1'), aluno('2')];
    await run('B');

    computers.A.state.students = [aluno('1')];
    await run('A');
    expect(tbl('students').has('2')).toBe(false);

    await run('B');
    expect(computers.B.state.students.map((s: any) => s.id)).toEqual(['1']);
  });

  it('link com cópia velha: na primeira vez a nuvem prevalece', async () => {
    computers.A.state.students = [aluno('1', { name: 'Atual' })];
    await run('A'); // Sede
    role = undefined; // B é o link no navegador
    computers.B.state.students = [aluno('1', { name: 'Cópia antiga do navegador' })];
    await run('B');
    expect(computers.B.state.students[0].name).toBe('Atual');
    expect(tbl('students').get('1')!.doc.name).toBe('Atual');
  });

  it('proteção: exclusão em massa não é enviada', async () => {
    computers.A.state.students = Array.from({ length: 30 }, (_, i) => aluno(String(i)));
    await run('A');
    computers.A.state.students = [];
    const st = await run('A');
    expect(tbl('students').size).toBe(30);
    expect(st.message || '').toMatch(/apagamento em massa/);
  });

  it('senha e marca de Master continuam só no computador', async () => {
    await run('A');
    computers.B.state.userAccounts = [{ id: 'adm', name: 'Admin', email: 'a@x.com', role: 'ADMIN', password: 'outra', isMaster: false }];
    role = undefined;
    await run('B');
    const u = computers.B.state.userAccounts[0];
    expect(u.password).toBe('outra');
    expect(u.isMaster).toBe(false);
  });

  it('dois computadores alterando alunos diferentes: nada se perde', async () => {
    computers.A.state.students = [aluno('1'), aluno('2')];
    await run('A');
    computers.B.state.students = [aluno('1'), aluno('2')];
    await run('B');
    computers.A.state.students[0].name = 'Editado em A';
    computers.B.state.students[1].name = 'Editado em B';
    await run('A');
    await run('B');
    await run('A');
    const names = (st: any) => st.students.map((x: any) => x.name).sort();
    expect(names(computers.A.state)).toEqual(['Editado em A', 'Editado em B']);
    expect(names(computers.B.state)).toEqual(['Editado em A', 'Editado em B']);
  });

  it('cadastro da SEMED (antes só local) chega ao outro computador', async () => {
    computers.A.state.municipalSecretary = { name: 'SEMED Cumaru do Norte', secretaryName: 'Fulana' };
    await run('A');
    role = undefined;
    await run('B');
    expect(computers.B.state.municipalSecretary).toEqual({ name: 'SEMED Cumaru do Norte', secretaryName: 'Fulana' });
  });

  it('marco de reinício: cadastros antigos saem (com backup), o reimportado depois fica', async () => {
    computers.A.state.students = [aluno('velho', { updatedAt: '2026-09-27T10:00:00Z' }), aluno('sem-data')];
    await run('A');
    // Secretaria reinicia a base: limpa a nuvem e grava o marco.
    tbl('students').clear();
    tbl('app_records').set('__system/epoch', { collection: '__system', id: 'epoch', doc: { epoch: 'reinicio-1', at: '2026-09-28T20:00:00Z' }, row_version: 1, server_updated_at: tick() });
    computers.A.state.students.push(aluno('reimportado', { updatedAt: '2026-09-28T21:00:00Z' }));
    backups = 0;
    const st = await run('A');
    expect(backups).toBe(1);
    expect(computers.A.state.students.map((x: any) => x.id)).toEqual(['reimportado']);
    expect([...tbl('students').keys()]).toEqual(['reimportado']);
    expect(st.message || '').toMatch(/reiniciou a base/);
    await run('A');
    expect(backups).toBe(1); // marco aplicado uma vez só
  });
});
