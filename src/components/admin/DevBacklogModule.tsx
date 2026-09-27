import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Lock, Plus, Save, Trash2, RefreshCw, NotebookPen } from 'lucide-react';
import { getSupabaseClient } from '../../services/datasync/supabaseClient';

/**
 * Plano de Desenvolvimento (privado).
 * Registro das melhorias e correções futuras do SucessoEdu. Os itens ficam na nuvem
 * (tabela dev_backlog) e a regra de acesso do Supabase só deixa a conta do desenvolvedor
 * ler e gravar. Para abrir, a senha da nuvem dessa conta é pedida de novo.
 */
export const DEV_BACKLOG_OWNER_EMAIL = 'suportetecnicoads@gmail.com';

export function isDevBacklogOwner(email?: string | null): boolean {
  return String(email || '').trim().toLowerCase() === DEV_BACKLOG_OWNER_EMAIL;
}

type Kind = 'MELHORIA' | 'CORRECAO' | 'REESTRUTURACAO' | 'IDEIA';
type Priority = 'ALTA' | 'MEDIA' | 'BAIXA';
type Status = 'PLANEJADO' | 'EM_ANDAMENTO' | 'CONCLUIDO' | 'DESCARTADO';

interface BacklogItem {
  id?: string;
  title: string;
  kind: Kind;
  priority: Priority;
  status: Status;
  area?: string | null;
  description?: string | null;
  steps?: string | null;
  created_at?: string;
  updated_at?: string;
}

const KIND_LABEL: Record<Kind, string> = { MELHORIA: 'Melhoria', CORRECAO: 'Correção', REESTRUTURACAO: 'Reestruturação', IDEIA: 'Ideia' };
const PRIORITY_LABEL: Record<Priority, string> = { ALTA: 'Alta', MEDIA: 'Média', BAIXA: 'Baixa' };
const STATUS_LABEL: Record<Status, string> = { PLANEJADO: 'Planejado', EM_ANDAMENTO: 'Em andamento', CONCLUIDO: 'Concluído', DESCARTADO: 'Descartado' };
const PRIORITY_COLOR: Record<Priority, string> = { ALTA: 'bg-rose-100 text-rose-700', MEDIA: 'bg-amber-100 text-amber-700', BAIXA: 'bg-slate-100 text-slate-600' };
const STATUS_COLOR: Record<Status, string> = {
  PLANEJADO: 'bg-indigo-100 text-indigo-700',
  EM_ANDAMENTO: 'bg-sky-100 text-sky-700',
  CONCLUIDO: 'bg-emerald-100 text-emerald-700',
  DESCARTADO: 'bg-slate-200 text-slate-500',
};

const EMPTY: BacklogItem = { title: '', kind: 'MELHORIA', priority: 'MEDIA', status: 'PLANEJADO', area: '', description: '', steps: '' };
const PRIORITY_ORDER: Record<Priority, number> = { ALTA: 0, MEDIA: 1, BAIXA: 2 };
const STATUS_ORDER: Record<Status, number> = { EM_ANDAMENTO: 0, PLANEJADO: 1, CONCLUIDO: 2, DESCARTADO: 3 };

export const DevBacklogModule: React.FC<{ userEmail?: string | null; onBack?: () => void }> = ({ userEmail, onBack }) => {
  const owner = isDevBacklogOwner(userEmail);
  const [unlocked, setUnlocked] = useState(false);
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [items, setItems] = useState<BacklogItem[]>([]);
  const [editing, setEditing] = useState<BacklogItem | null>(null);
  const [filter, setFilter] = useState<'ABERTOS' | 'TODOS' | Status>('ABERTOS');

  const load = async () => {
    setBusy(true);
    setMsg('');
    const { data, error } = await getSupabaseClient().from('dev_backlog').select('*');
    setBusy(false);
    if (error) {
      setMsg(`Não foi possível carregar da nuvem: ${error.message}`);
      return;
    }
    setItems((data || []) as BacklogItem[]);
  };

  const unlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    setBusy(true);
    setMsg('');
    try {
      const { error } = await getSupabaseClient().auth.signInWithPassword({ email: DEV_BACKLOG_OWNER_EMAIL, password });
      if (error) {
        setMsg(Number((error as any).status) === 400 ? 'Senha incorreta.' : 'Não foi possível falar com a nuvem agora. Tente de novo em instantes.');
        return;
      }
      setPassword('');
      setUnlocked(true);
    } catch {
      setMsg('Não foi possível falar com a nuvem agora. Tente de novo em instantes.');
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (unlocked) load();
  }, [unlocked]);

  const save = async () => {
    if (!editing || !editing.title.trim()) {
      setMsg('Informe o título.');
      return;
    }
    setBusy(true);
    setMsg('');
    const row = {
      title: editing.title.trim(),
      kind: editing.kind,
      priority: editing.priority,
      status: editing.status,
      area: editing.area?.trim() || null,
      description: editing.description?.trim() || null,
      steps: editing.steps?.trim() || null,
      updated_at: new Date().toISOString(),
    };
    const client = getSupabaseClient();
    const { error } = editing.id
      ? await client.from('dev_backlog').update(row).eq('id', editing.id)
      : await client.from('dev_backlog').insert(row);
    setBusy(false);
    if (error) {
      setMsg(`Não foi possível salvar: ${error.message}`);
      return;
    }
    setEditing(null);
    load();
  };

  const remove = async (item: BacklogItem) => {
    if (!item.id || !window.confirm(`Excluir "${item.title}"? Esta ação não pode ser desfeita.`)) return;
    setBusy(true);
    const { error } = await getSupabaseClient().from('dev_backlog').delete().eq('id', item.id);
    setBusy(false);
    if (error) setMsg(`Não foi possível excluir: ${error.message}`);
    load();
  };

  const visible = useMemo(() => {
    const list = items.filter((i) =>
      filter === 'TODOS' ? true : filter === 'ABERTOS' ? i.status === 'PLANEJADO' || i.status === 'EM_ANDAMENTO' : i.status === filter
    );
    return list.sort(
      (a, b) =>
        STATUS_ORDER[a.status] - STATUS_ORDER[b.status] ||
        PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority] ||
        String(a.created_at || '').localeCompare(String(b.created_at || ''))
    );
  }, [items, filter]);

  const field = 'w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20';
  const btn = 'px-3 py-2 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer disabled:opacity-50';

  if (!owner) {
    return (
      <div className="p-8 text-center text-sm text-slate-600" data-testid="dev-backlog-denied">
        <Lock className="h-8 w-8 mx-auto mb-3 text-slate-400" />
        Este módulo é restrito ao desenvolvedor do sistema.
      </div>
    );
  }

  return (
    <div className="space-y-4" data-testid="dev-backlog">
      <div className="flex items-center gap-3">
        {onBack && (
          <button type="button" onClick={onBack} className={`${btn} bg-white border border-slate-200 text-slate-700`}>
            <ArrowLeft className="h-4 w-4" /> Voltar
          </button>
        )}
        <NotebookPen className="h-6 w-6 text-indigo-600" />
        <div>
          <h1 className="text-lg font-black text-slate-900">Plano de Desenvolvimento</h1>
          <p className="text-xs text-slate-500">Melhorias e correções futuras. Visível somente para o desenvolvedor.</p>
        </div>
      </div>

      {!unlocked ? (
        <form onSubmit={unlock} className="max-w-sm bg-white p-5 rounded-2xl border border-slate-200 space-y-3">
          <label className="block text-xs font-bold text-slate-600">Confirme a senha da nuvem para abrir</label>
          <input type="password" autoFocus autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className={field} />
          {msg && <p className="text-xs text-rose-600">{msg}</p>}
          <button type="submit" disabled={busy || !password} className={`${btn} bg-indigo-600 text-white`}>
            <Lock className="h-4 w-4" /> {busy ? 'Conferindo...' : 'Abrir'}
          </button>
        </form>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2">
            {(['ABERTOS', 'EM_ANDAMENTO', 'PLANEJADO', 'CONCLUIDO', 'DESCARTADO', 'TODOS'] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`${btn} ${filter === f ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}
              >
                {f === 'ABERTOS' ? 'Em aberto' : f === 'TODOS' ? 'Todos' : STATUS_LABEL[f]}
              </button>
            ))}
            <div className="flex-1" />
            <button type="button" onClick={load} disabled={busy} className={`${btn} bg-white border border-slate-200 text-slate-600`}>
              <RefreshCw className="h-4 w-4" /> Atualizar
            </button>
            <button type="button" onClick={() => setEditing({ ...EMPTY })} className={`${btn} bg-indigo-600 text-white`}>
              <Plus className="h-4 w-4" /> Novo item
            </button>
          </div>
          {msg && <p className="text-xs text-rose-600">{msg}</p>}

          {editing && (
            <div className="bg-white p-5 rounded-2xl border-2 border-indigo-200 space-y-3">
              <input placeholder="Título" value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} className={field} />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <select value={editing.kind} onChange={(e) => setEditing({ ...editing, kind: e.target.value as Kind })} className={field}>
                  {Object.entries(KIND_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
                <select value={editing.priority} onChange={(e) => setEditing({ ...editing, priority: e.target.value as Priority })} className={field}>
                  {Object.entries(PRIORITY_LABEL).map(([k, v]) => <option key={k} value={k}>Prioridade {v}</option>)}
                </select>
                <select value={editing.status} onChange={(e) => setEditing({ ...editing, status: e.target.value as Status })} className={field}>
                  {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
                <input placeholder="Área (ex: Sincronização)" value={editing.area || ''} onChange={(e) => setEditing({ ...editing, area: e.target.value })} className={field} />
              </div>
              <textarea placeholder="Descrição: o problema ou a ideia" rows={3} value={editing.description || ''} onChange={(e) => setEditing({ ...editing, description: e.target.value })} className={field} />
              <textarea placeholder="Passos (um por linha)" rows={4} value={editing.steps || ''} onChange={(e) => setEditing({ ...editing, steps: e.target.value })} className={field} />
              <div className="flex gap-2">
                <button type="button" onClick={save} disabled={busy} className={`${btn} bg-emerald-600 text-white`}>
                  <Save className="h-4 w-4" /> Salvar
                </button>
                <button type="button" onClick={() => setEditing(null)} className={`${btn} bg-white border border-slate-200 text-slate-600`}>
                  Cancelar
                </button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {!busy && visible.length === 0 && <p className="text-sm text-slate-500">Nenhum item neste filtro.</p>}
            {visible.map((i) => (
              <div key={i.id} className="bg-white p-4 rounded-2xl border border-slate-200">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_COLOR[i.status]}`}>{STATUS_LABEL[i.status]}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${PRIORITY_COLOR[i.priority]}`}>Prioridade {PRIORITY_LABEL[i.priority]}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-100 text-violet-700">{KIND_LABEL[i.kind]}</span>
                  {i.area && <span className="text-[10px] text-slate-500">{i.area}</span>}
                  <div className="flex-1" />
                  <button type="button" onClick={() => setEditing({ ...i })} className="text-xs font-bold text-indigo-600 cursor-pointer">Editar</button>
                  <button type="button" onClick={() => remove(i)} className="text-rose-500 cursor-pointer" title="Excluir">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <h3 className="mt-2 text-sm font-black text-slate-900">{i.title}</h3>
                {i.description && <p className="mt-1 text-xs text-slate-600 whitespace-pre-line">{i.description}</p>}
                {i.steps && <p className="mt-2 text-xs text-slate-700 whitespace-pre-line bg-slate-50 rounded-xl p-2">{i.steps}</p>}
                <p className="mt-2 text-[10px] text-slate-400">
                  Registrado em {i.created_at ? new Date(i.created_at).toLocaleDateString('pt-BR') : '-'}
                  {i.updated_at ? ` · atualizado em ${new Date(i.updated_at).toLocaleString('pt-BR')}` : ''}
                </p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default DevBacklogModule;
