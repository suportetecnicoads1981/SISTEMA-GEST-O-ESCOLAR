import React, { useEffect, useState } from 'react';
import { Cloud, CloudOff, RefreshCw, AlertTriangle, CheckCircle2, X, ShieldCheck } from 'lucide-react';
import {
  CloudSyncStatus,
  SyncNotice,
  getCloudSyncStatus,
  subscribeCloudSync,
  syncNow,
  fullResync,
  isCloudSyncActiveHere,
} from '../../services/sync/cloudSync';
import { confirmDialog } from '../../utils/dialogs';

const fmtTime = (iso?: string) =>
  iso ? new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—';

/**
 * Indicador da sincronização com a nuvem (cabeçalho).
 * Verde: em dia. Azul girando: sincronizando. Âmbar: pendências/recusados. Vermelho: erro.
 */
export const CloudSyncIndicator: React.FC<{ isAdmin?: boolean }> = ({ isAdmin }) => {
  const [st, setSt] = useState<CloudSyncStatus>(getCloudSyncStatus());
  const [open, setOpen] = useState(false);
  useEffect(() => subscribeCloudSync(setSt), []);
  if (!isCloudSyncActiveHere()) return null;

  const busy = st.state === 'sincronizando';
  const warn = st.pending > 0 || st.rejected > 0 || st.notices.some((n) => n.kind !== 'excluido');
  const color =
    st.state === 'erro'
      ? 'text-rose-600 bg-rose-50 border-rose-200'
      : busy
        ? 'text-sky-700 bg-sky-50 border-sky-200'
        : st.state === 'ok' && !warn
          ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
          : st.state === 'ok'
            ? 'text-amber-700 bg-amber-50 border-amber-200'
            : 'text-slate-500 bg-slate-50 border-slate-200';
  const Icon = st.state === 'sem-internet' || st.state === 'aguardando-login' || st.state === 'erro' ? CloudOff : Cloud;

  return (
    <div className="relative">
      <button
        type="button"
        id="btn-header-cloud-sync"
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-xs font-bold shadow-2xs cursor-pointer ${color}`}
        title={st.message || 'Sincronização com a nuvem'}
      >
        {busy ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Icon className="h-3.5 w-3.5" />}
        <span className="hidden xl:inline">Nuvem</span>
        {st.pending > 0 && <span className="px-1.5 rounded-full bg-white/80 text-[10px]">{st.pending}</span>}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-[360px] max-w-[90vw] bg-white border border-slate-200 rounded-2xl shadow-xl z-50 p-4 space-y-3 text-xs text-slate-700">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
              <Cloud className="h-4 w-4 text-sky-600" /> Sincronização com a nuvem
            </h4>
            <button type="button" onClick={() => setOpen(false)} className="p-1 rounded-lg hover:bg-slate-100 cursor-pointer" aria-label="Fechar">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
              <div className="text-[10px] text-slate-500">Última sincronização</div>
              <div className="font-bold text-slate-900">{fmtTime(st.lastSyncAt)}</div>
            </div>
            <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
              <div className="text-[10px] text-slate-500">Aguardando envio</div>
              <div className="font-bold text-slate-900">{st.pending}</div>
            </div>
            <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
              <div className="text-[10px] text-slate-500">Última rodada</div>
              <div className="font-bold text-slate-900">
                {st.lastPushed} enviado(s) • {st.lastPulled} recebido(s)
              </div>
            </div>
            <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
              <div className="text-[10px] text-slate-500">Recusados pela nuvem</div>
              <div className={`font-bold ${st.rejected ? 'text-rose-700' : 'text-slate-900'}`}>{st.rejected}</div>
            </div>
          </div>

          {st.message && (
            <p className={`p-2 rounded-xl border ${st.state === 'erro' ? 'bg-rose-50 border-rose-200 text-rose-800' : 'bg-slate-50 border-slate-200'}`}>{st.message}</p>
          )}

          {st.notices.length > 0 && (
            <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
              <div className="text-[10px] font-bold text-slate-500 uppercase">Avisos recentes</div>
              {st.notices.slice(0, 12).map((n: SyncNotice, i) => (
                <div key={i} className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 flex gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  <span>
                    {n.message} <span className="text-amber-700/70">({fmtTime(n.at)})</span>
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="button"
              disabled={busy}
              onClick={() => syncNow().catch(() => {})}
              className="px-3 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Sincronizar agora
            </button>
            {isAdmin && (
              <button
                type="button"
                disabled={busy}
                onClick={async () => {
                  const ok = await confirmDialog(
                    'A conferência completa compara TODOS os registros deste computador com a nuvem. Onde houver diferença, fica a versão da nuvem; o que só existe aqui é enviado. Pode levar alguns minutos. Continuar?',
                    { title: 'Conferência completa', confirmLabel: 'Fazer a conferência' }
                  );
                  if (ok) fullResync().catch(() => {});
                }}
                className="px-3 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> Conferência completa
              </button>
            )}
          </div>
          <p className="text-[10px] text-slate-500 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
            Só o que muda é enviado e recebido. Cópias desatualizadas são recusadas pela nuvem.
          </p>
        </div>
      )}
    </div>
  );
};

/** Aviso discreto (canto da tela) quando uma alteração daqui foi substituída pela da nuvem. */
export const CloudSyncNoticeToast: React.FC = () => {
  const [items, setItems] = useState<SyncNotice[]>([]);
  useEffect(() => {
    const onNotices = (e: Event) => {
      const list = ((e as CustomEvent).detail || []) as SyncNotice[];
      const relevant = list.filter((n) => n.kind !== 'excluido' || list.length < 5);
      if (!relevant.length) return;
      setItems((prev) => [...relevant, ...prev].slice(0, 4));
    };
    window.addEventListener('sucessoedu_sync_notices', onNotices);
    return () => window.removeEventListener('sucessoedu_sync_notices', onNotices);
  }, []);
  useEffect(() => {
    if (!items.length) return;
    const t = setTimeout(() => setItems((prev) => prev.slice(0, -1)), 15000);
    return () => clearTimeout(t);
  }, [items]);
  if (!items.length) return null;
  return (
    <div className="no-print fixed bottom-4 right-4 z-[60] space-y-2 w-[380px] max-w-[92vw]">
      {items.map((n, i) => (
        <div key={`${n.at}-${i}`} className="p-3 rounded-xl bg-white border border-amber-300 shadow-lg text-xs text-slate-800 flex gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
          <span className="flex-1">{n.message}</span>
          <button type="button" onClick={() => setItems((prev) => prev.filter((_, k) => k !== i))} className="p-0.5 rounded hover:bg-slate-100 cursor-pointer" aria-label="Fechar aviso">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};

export default CloudSyncIndicator;
