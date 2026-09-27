import React, { useEffect, useRef, useState } from 'react';
import {
  getLocalServerInfo,
  getServerUpdateInfo,
  checkServerUpdate,
  applyServerUpdate,
  flushLocalChanges,
} from '../../services/offline/localServerSync';
import { supabaseBatchQueue } from '../../services/supabaseBatchQueue';

/**
 * Aviso de nova versão publicada.
 * - Pelo link: confere de tempos em tempos se o sistema publicado mudou e oferece "Atualizar agora".
 * - Pelo servidor (Sede ou escola): mostra quando o servidor já baixou e conferiu uma versão nova;
 *   o administrador aplica ali mesmo. Depois de aplicada, o aviso "Recarregar agora" do selo
 *   aparece em todas as estações.
 */
const WEB_CHECK_MS = 5 * 60_000;
const SERVER_CHECK_MS = 10 * 60_000;
/** O servidor procura versão nova sozinho a cada 6 h; pedimos uma verificação se a última passou de 1 h. */
const SERVER_RECHECK_AFTER_MS = 60 * 60_000;
const SNOOZE_MS = 30 * 60_000;
const SNOOZE_KEY = 'sucessoedu_update_notice_snooze';

function currentBundle(): string {
  const el = document.querySelector('script[type="module"][src*="/assets/index-"]') as HTMLScriptElement | null;
  if (!el) return '';
  try {
    return new URL(el.src, window.location.href).pathname;
  } catch {
    return '';
  }
}

async function publishedBundle(): Promise<string> {
  const res = await fetch(`/?v=${Date.now()}`, { cache: 'no-store' });
  if (!res.ok) return '';
  const html = await res.text();
  const m = html.match(/src="(\/assets\/index-[^"]+\.js)"/);
  return m ? m[1] : '';
}

function snoozed(): boolean {
  try {
    return Date.now() < Number(localStorage.getItem(SNOOZE_KEY) || 0);
  } catch {
    return false;
  }
}

function loggedUserIsAdmin(): boolean {
  try {
    const uid = localStorage.getItem('sucessoedu_logged_user_id');
    const raw = localStorage.getItem('sucessoedu_master_store_v5');
    if (!uid || !raw) return false;
    const me = (JSON.parse(raw)?.userAccounts || []).find((u: any) => u?.id === uid);
    return String(me?.role || '').toUpperCase() === 'ADMIN';
  } catch {
    return false;
  }
}

async function flushPending(): Promise<void> {
  const wait = new Promise((r) => setTimeout(r, 8000));
  try {
    if (getLocalServerInfo()) await Promise.race([flushLocalChanges(), wait]);
    else await Promise.race([supabaseBatchQueue.flush(), wait]);
  } catch {
    /* as pendências continuam guardadas neste computador */
  }
}

export const UpdateAvailableNotice: React.FC = () => {
  const [kind, setKind] = useState<'' | 'web' | 'server'>('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const baseline = useRef('');

  useEffect(() => {
    let stop = false;
    const server = !!getLocalServerInfo();

    const checkWeb = async () => {
      if (!baseline.current) baseline.current = currentBundle();
      if (!baseline.current) return; // ambiente de desenvolvimento: sem pacote publicado
      try {
        const pub = await publishedBundle();
        if (!stop && pub && pub !== baseline.current && !snoozed()) setKind('web');
      } catch {
        /* sem internet: tenta na próxima */
      }
    };

    const checkServer = async () => {
      try {
        const upd = await getServerUpdateInfo();
        if (!upd || stop) return;
        if (upd.ready && upd.ready !== upd.current) {
          if (!snoozed()) setKind('server');
          return;
        }
        const last = Date.parse(upd.status?.checkedAt || '') || 0;
        if (upd.updateUrl && Date.now() - last > SERVER_RECHECK_AFTER_MS && upd.status?.state !== 'baixando') {
          checkServerUpdate().catch(() => {});
        }
      } catch {
        /* servidor ocupado: tenta na próxima */
      }
    };

    const run = () => (server ? checkServer() : checkWeb());
    const first = setTimeout(run, 20_000);
    const timer = setInterval(run, server ? SERVER_CHECK_MS : WEB_CHECK_MS);
    const onFocus = () => run();
    window.addEventListener('focus', onFocus);
    return () => {
      stop = true;
      clearTimeout(first);
      clearInterval(timer);
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  if (!kind) return null;

  const later = () => {
    try {
      localStorage.setItem(SNOOZE_KEY, String(Date.now() + SNOOZE_MS));
    } catch {
      /* sem armazenamento */
    }
    setKind('');
  };

  const updateNow = async () => {
    setBusy(true);
    setMsg('');
    if (kind === 'server') {
      if (!loggedUserIsAdmin()) {
        setBusy(false);
        setMsg('Somente o administrador aplica a atualização no servidor. Avise o responsável pela Secretaria.');
        return;
      }
      await flushPending();
      const r = await applyServerUpdate().catch((e) => ({ ok: false, message: String(e?.message || e) }));
      if (!r.ok) {
        setBusy(false);
        setMsg(`Não foi possível aplicar: ${r.message}`);
        return;
      }
      setTimeout(() => window.location.reload(), 2500);
      return;
    }
    await flushPending();
    window.location.reload();
  };

  return (
    <div
      role="status"
      data-testid="update-available"
      style={{
        position: 'fixed',
        right: 16,
        bottom: 16,
        zIndex: 2147482002,
        width: 320,
        background: '#0f172a',
        color: '#fff',
        borderRadius: 14,
        padding: 14,
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: 13,
        lineHeight: 1.45,
        boxShadow: '0 12px 30px rgba(0,0,0,0.3)',
      }}
    >
      <strong style={{ display: 'block', marginBottom: 4 }}>Nova versão do sistema disponível</strong>
      <span>
        {kind === 'server'
          ? 'O servidor já baixou e conferiu a versão nova. Ao aplicar, as alterações pendentes são enviadas antes e a tela recarrega.'
          : 'Uma versão mais nova foi publicada. Ao atualizar, as alterações pendentes são enviadas antes e a tela recarrega.'}
      </span>
      {msg && <p style={{ margin: '8px 0 0', color: '#fbbf24' }}>{msg}</p>}
      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
        <button type="button" disabled={busy} onClick={updateNow} style={btn('#16a34a')}>
          {busy ? 'Atualizando...' : kind === 'server' ? 'Aplicar e atualizar' : 'Atualizar agora'}
        </button>
        <button type="button" disabled={busy} onClick={later} style={btn('#475569')}>
          Depois
        </button>
      </div>
    </div>
  );
};

function btn(color: string): React.CSSProperties {
  return { background: color, color: '#fff', border: 0, borderRadius: 8, padding: '7px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer' };
}
