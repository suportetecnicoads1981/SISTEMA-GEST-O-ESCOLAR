import React, { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, Download, RefreshCw, RotateCcw, ShieldCheck } from 'lucide-react';
import {
  applyServerUpdate,
  checkServerUpdate,
  getLocalServerInfo,
  getServerUpdateInfo,
  rollbackServerUpdate,
  ServerUpdateInfo,
  setServerUpdateUrl,
} from '../../services/offline/localServerSync';
import { confirmDialog } from '../../utils/dialogs';

const fmt = (iso?: string) => {
  if (!iso) return 'desconhecida';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString('pt-BR');
};

/**
 * Atualização segura do sistema no Servidor Remoto / Sede.
 * O servidor baixa e confere (SHA-256) sozinho; aplicar e voltar exigem o administrador.
 */
export const ServerUpdateCard: React.FC<{ isAdmin: boolean }> = ({ isAdmin }) => {
  const server = getLocalServerInfo();
  const [data, setData] = useState<ServerUpdateInfo | null>(null);
  const [url, setUrl] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const load = useCallback(async () => {
    const info = await getServerUpdateInfo().catch(() => null);
    setData(info);
    if (info && !url) setUrl(info.updateUrl || '');
  }, [url]);

  useEffect(() => {
    if (!server) return;
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, [server, load]);

  if (!server) return null;

  const run = async (key: string, fn: () => Promise<{ ok: boolean; message: string }>) => {
    setBusy(key);
    setMsg(null);
    try {
      const r = await fn();
      setMsg({ ok: r.ok, text: r.message });
    } catch (e: any) {
      setMsg({ ok: false, text: e?.message || String(e) });
    } finally {
      setBusy(null);
      load();
    }
  };

  const state = data?.status?.state;
  const ready = data?.ready || '';
  const input = 'w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20';
  const btn = 'px-3 py-2 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer disabled:opacity-50';

  return (
    <div className="bg-white p-5 rounded-2xl border-2 border-indigo-200 shadow-xs space-y-3" data-testid="server-update-card">
      <div className="flex items-start gap-2">
        <ShieldCheck className="h-5 w-5 text-indigo-600 mt-0.5" />
        <div>
          <h2 className="text-base font-black text-slate-900">Atualização do servidor ({server.role === 'SEDE' ? 'Sede' : 'Servidor Remoto'})</h2>
          <p className="text-xs text-slate-600">
            Com internet, o servidor verifica a cada 6 horas, baixa a versão nova e confere cada arquivo (SHA-256). Ela só entra em uso quando o
            administrador aprovar. A versão anterior fica guardada e o banco de dados nunca é alterado.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
          <span className="block text-[10px] font-bold text-slate-400 uppercase">Versão em uso</span>
          <span className="font-semibold text-slate-800" data-testid="update-current">{fmt(data?.current)}</span>
        </div>
        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
          <span className="block text-[10px] font-bold text-slate-400 uppercase">Versão baixada e conferida</span>
          <span className="font-semibold text-slate-800" data-testid="update-ready">{ready ? fmt(ready) : 'nenhuma'}</span>
        </div>
        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
          <span className="block text-[10px] font-bold text-slate-400 uppercase">Última verificação</span>
          <span className="font-semibold text-slate-800">{data?.status?.checkedAt ? fmt(data.status.checkedAt) : 'ainda não verificado'}</span>
        </div>
      </div>

      {data?.status?.message && (
        <p className={`text-xs font-semibold ${state === 'erro' ? 'text-rose-700' : state === 'pronta' ? 'text-emerald-700' : 'text-slate-700'}`} data-testid="update-message">
          {data.status.message}
        </p>
      )}

      {!isAdmin ? (
        <p className="text-xs text-amber-700 font-semibold">Somente o administrador pode aplicar ou desfazer atualizações.</p>
      ) : (
        <>
          <label className="block text-[11px] font-semibold text-slate-600">
            Endereço do sistema publicado (de onde vêm as atualizações)
            <div className="flex gap-2 mt-1">
              <input className={input} value={url} placeholder="https://seu-sistema.run.app" onChange={(e) => setUrl(e.target.value)} />
              <button
                type="button"
                className={`${btn} bg-slate-700 text-white shrink-0`}
                disabled={!!busy || !url.trim()}
                onClick={() => run('url', () => setServerUpdateUrl(url.trim()))}
              >
                Salvar
              </button>
            </div>
          </label>

          <div className="flex flex-wrap gap-2">
            <button type="button" className={`${btn} bg-indigo-50 text-indigo-700 border border-indigo-200`} disabled={!!busy} onClick={() => run('check', checkServerUpdate)}>
              {busy === 'check' ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Verificar atualização agora
            </button>
            <button
              type="button"
              className={`${btn} bg-emerald-600 text-white`}
              disabled={!!busy || !ready}
              onClick={async () => {
                const ok = await confirmDialog(
                  `Aplicar a versão de ${fmt(ready)} neste servidor?\n\nOs arquivos já foram baixados e conferidos. O banco de dados não é alterado e a versão atual fica guardada para voltar, se precisar. As estações serão avisadas para recarregar.`,
                  { title: 'Aplicar atualização', confirmLabel: 'Aplicar agora' }
                );
                if (ok) run('apply', applyServerUpdate);
              }}
            >
              {busy === 'apply' ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              Aplicar atualização
            </button>
            <button
              type="button"
              className={`${btn} bg-white text-slate-700 border border-slate-300`}
              disabled={!!busy || !data?.hasPrevious}
              onClick={async () => {
                const ok = await confirmDialog(
                  `Voltar para a versão anterior (${fmt(data?.previous)})? O banco de dados não é alterado.`,
                  { title: 'Voltar versão', confirmLabel: 'Voltar versão', tone: 'danger' }
                );
                if (ok) run('rollback', rollbackServerUpdate);
              }}
            >
              <RotateCcw className="h-4 w-4" />
              Voltar à versão anterior
            </button>
          </div>
        </>
      )}

      {msg && (
        <p role="status" className={`text-xs font-semibold ${msg.ok ? 'text-emerald-700' : 'text-rose-700'}`}>
          {msg.text}
        </p>
      )}
    </div>
  );
};
