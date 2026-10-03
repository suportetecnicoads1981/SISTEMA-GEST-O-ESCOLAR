import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  getLocalServerInfo,
  subscribeLocalServerStatus,
  subscribeLateLocalServer,
  flushLocalChanges,
  pullFromLocalServer,
  LocalServerStatus,
  LocalServerInfo,
} from '../../services/offline/localServerSync';
import { subscribeCloudSyncStatus, runCloudSyncNow, CloudSyncStatus } from '../../services/offline/cloudAutoSync';
import { getSupabaseClient } from '../../services/datasync/supabaseClient';
import { supabaseBatchQueue, BatchQueueStatus } from '../../services/supabaseBatchQueue';
import { shouldKeepCloudSession, setKeepCloudSession } from '../../services/offline/cloudSessionPreference';

declare const __APP_BUILT_AT__: string;
/** Data e hora em que esta versão foi publicada (mostrada no selo). */
export function appBuildLabel(): string {
  try {
    const t = typeof __APP_BUILT_AT__ === 'string' ? __APP_BUILT_AT__ : '';
    return t ? new Date(t).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';
  } catch {
    return '';
  }
}

/** Espaço reservado na Barra de Tarefas (canto inferior esquerdo) para o selo de status. */
export const TASKBAR_STATUS_SLOT_ID = 'taskbar-status-slot';

/** Acompanha o espaço do selo na Barra de Tarefas (aparece depois do login, some na tela de login). */
function useTaskbarSlot(): HTMLElement | null {
  const [slot, setSlot] = useState<HTMLElement | null>(() =>
    typeof document !== 'undefined' ? document.getElementById(TASKBAR_STATUS_SLOT_ID) : null
  );
  useEffect(() => {
    if (typeof document === 'undefined' || typeof MutationObserver === 'undefined') return;
    const find = () => {
      const el = document.getElementById(TASKBAR_STATUS_SLOT_ID);
      setSlot((prev) => (prev === el ? prev : el));
    };
    find();
    const mo = new MutationObserver(find);
    mo.observe(document.body, { childList: true, subtree: true });
    return () => mo.disconnect();
  }, []);
  return slot;
}

/**
 * Lugar do selo: dentro da Barra de Tarefas (sem cobrir o Iniciar e a Pesquisa) quando ela existe;
 * fora dela (tela de login), fica flutuando no canto inferior esquerdo.
 */
const BadgeDock: React.FC<{ testId: string; children: (docked: boolean) => React.ReactNode }> = ({ testId, children }) => {
  const slot = useTaskbarSlot();
  if (slot) {
    return createPortal(
      <div data-testid={testId} data-docked="taskbar" style={{ position: 'relative', fontFamily: 'Inter, system-ui, sans-serif' }}>
        {children(true)}
      </div>,
      slot
    );
  }
  return (
    <div
      data-testid={testId}
      style={{ position: 'fixed', left: 12, bottom: 12, zIndex: 2147482000, fontFamily: 'Inter, system-ui, sans-serif' }}
    >
      {children(false)}
    </div>
  );
};

/** Janela de detalhes do selo: abre para cima, a partir do selo. */
const popoverStyle: React.CSSProperties = {
  position: 'absolute',
  left: 0,
  bottom: 'calc(100% + 10px)',
  width: 300,
  maxHeight: '70vh',
  overflowY: 'auto',
  background: '#fff',
  color: '#0f172a',
  border: '1px solid #e2e8f0',
  borderRadius: 14,
  boxShadow: '0 12px 30px rgba(0,0,0,0.18)',
  padding: 14,
  fontSize: 12,
  lineHeight: 1.45,
  zIndex: 60,
};

/** Selo (pílula): mais compacto dentro da Barra de Tarefas. */
function pillStyle(docked: boolean): React.CSSProperties {
  return {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    background: docked ? '#1e293b' : '#0f172a',
    color: '#fff',
    border: docked ? '1px solid #334155' : 0,
    borderRadius: 999,
    padding: docked ? '4px 10px' : '6px 12px',
    fontSize: 11,
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: docked ? 'none' : '0 6px 16px rgba(0,0,0,0.25)',
    maxWidth: docked ? 280 : undefined,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  };
}

/**
 * Indicador (canto inferior esquerdo).
 * - Aberto pelo Servidor Remoto ou da Sede: mostra o servidor da rede local e a nuvem.
 * - Aberto pelo link: mostra só a situação do envio à nuvem.
 */
export const LocalNetworkStatusBadge: React.FC = () => {
  const [local, setLocal] = useState<LocalServerStatus | null>(null);
  const [cloud, setCloud] = useState<CloudSyncStatus | null>(null);
  const [queue, setQueue] = useState<BatchQueueStatus | null>(null);
  const [hasSession, setHasSession] = useState<boolean | null>(null);
  const [lateServer, setLateServer] = useState<LocalServerInfo | null>(null);
  const isServerMode = !!getLocalServerInfo();
  const [open, setOpen] = useState(false);
  // Login na nuvem direto pelo selo (sem sair do sistema)
  const [loginOpen, setLoginOpen] = useState(false);
  const [email, setEmail] = useState(() => {
    try {
      return localStorage.getItem('sucessoedu_cloud_login_email') || '';
    } catch {
      return '';
    }
  });
  const [password, setPassword] = useState('');
  const [loginBusy, setLoginBusy] = useState(false);
  const [loginMsg, setLoginMsg] = useState('');
  const [keepCloud, setKeepCloud] = useState(() => shouldKeepCloudSession());

  // Tira este computador da conta da nuvem (troca de máquina, computador emprestado...).
  const cloudDisconnect = async () => {
    if (!window.confirm('Desconectar este computador da nuvem? O envio para a nuvem para até alguém entrar de novo com a senha.')) return;
    setKeepCloudSession(false);
    setKeepCloud(false);
    await getSupabaseClient().auth.signOut({ scope: 'local' }).catch(() => {});
    setHasSession(false);
    if (getLocalServerInfo()) await runCloudSyncNow(true).catch(() => {});
  };

  const cloudLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setLoginBusy(true);
    setLoginMsg('');
    try {
      const { data, error } = await getSupabaseClient().auth.signInWithPassword({ email: email.trim(), password });
      if (error || !data?.user) {
        setLoginMsg('Não foi possível entrar: confira o e-mail e a senha da conta da nuvem.');
        return;
      }
      try {
        localStorage.setItem('sucessoedu_cloud_login_email', email.trim());
      } catch {
        /* sem armazenamento */
      }
      setPassword('');
      setLoginOpen(false);
      setLoginMsg('');
      setHasSession(true);
      if (getLocalServerInfo()) await runCloudSyncNow(true);
      else await supabaseBatchQueue.flush();
    } catch (err: any) {
      setLoginMsg(`Sem resposta da nuvem agora (${err?.message || err}). Tente de novo em instantes.`);
    } finally {
      setLoginBusy(false);
    }
  };

  const renderLoginForm = () =>
    loginOpen ? (
          <form onSubmit={cloudLogin} style={{ marginTop: 8, display: 'grid', gap: 6 }}>
            <input
              type="email"
              placeholder="E-mail da conta da nuvem"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              style={fieldStyle}
            />
            <input
              type="password"
              placeholder="Senha da nuvem"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              style={fieldStyle}
            />
            <label style={{ display: 'flex', gap: 6, alignItems: 'flex-start', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={keepCloud}
                onChange={(e) => {
                  setKeepCloud(e.target.checked);
                  setKeepCloudSession(e.target.checked);
                }}
              />
              <span>Manter este computador conectado à nuvem</span>
            </label>
            {loginMsg && <span style={{ color: '#b91c1c' }}>{loginMsg}</span>}
            <div style={{ display: 'flex', gap: 6 }}>
              <button type="submit" disabled={loginBusy} style={btn('#b45309')}>
                {loginBusy ? 'Entrando...' : 'Entrar e enviar'}
              </button>
              <button type="button" onClick={() => setLoginOpen(false)} style={btn('#64748b')}>
                Cancelar
              </button>
            </div>
          </form>
    ) : null;

  useEffect(() => {
    if (!getLocalServerInfo()) return;
    const offA = subscribeLocalServerStatus(setLocal);
    const offB = subscribeCloudSyncStatus(setCloud);
    return () => {
      offA();
      offB();
    };
  }, []);

  // Modo link: acompanha a fila de envio à nuvem e o login da nuvem.
  useEffect(() => {
    if (getLocalServerInfo()) return;
    const offQ = supabaseBatchQueue.subscribe(setQueue);
    const offL = subscribeLateLocalServer(setLateServer);
    const client = getSupabaseClient();
    let alive = true;
    const check = () =>
      client.auth
        .getSession()
        .then(({ data }) => alive && setHasSession(!!data?.session))
        .catch(() => alive && setHasSession(false));
    check();
    const { data: sub } = client.auth.onAuthStateChange(() => {
      // Adiado: chamar o Supabase dentro deste callback trava o cliente de autenticação.
      setTimeout(check, 0);
    });
    // A fila só avisa quando envia; o relógio mantém "sem internet" atualizado.
    const tick = setInterval(() => setQueue(supabaseBatchQueue.getStatus()), 5000);
    return () => {
      alive = false;
      offQ();
      offL();
      clearInterval(tick);
      sub?.subscription?.unsubscribe();
    };
  }, []);

  if (!isServerMode) {
    return (
      <WebCloudBadge
        queue={queue}
        hasSession={hasSession}
        lateServer={lateServer}
        open={open}
        setOpen={setOpen}
        loginOpen={loginOpen}
        setLoginOpen={setLoginOpen}
        loginForm={renderLoginForm()}
        onDisconnect={cloudDisconnect}
      />
    );
  }

  if (!local || local.mode === 'desativado') return null;

  const connected = local.mode === 'conectado' || local.mode === 'sincronizando';
  const dot = !connected ? '#e11d48' : local.pending > 0 ? '#f59e0b' : '#10b981';
  const roleLabel = local.role === 'SEDE' ? 'Servidor da Sede' : 'Servidor Remoto';
  const label = !connected
    ? `${roleLabel}: sem resposta (rede local)`
    : local.pending > 0
      ? `${roleLabel}: enviando ${local.pending} alteração(ões)`
      : `${roleLabel}: conectado`;

  const cloudLabel: Record<CloudSyncStatus['state'], string> = {
    inativo: 'Nuvem: não verificada',
    'sem-internet': 'Nuvem: sem internet',
    'aguardando-login': 'Nuvem: internet disponível, aguardando login da nuvem',
    enviando: 'Nuvem: enviando...',
    enviado: 'Nuvem: dados enviados',
    erro: 'Nuvem: erro no envio',
  };

  return (
    <>
    {local.newAppVersion && (
      <div
        role="status"
        data-testid="new-app-version"
        style={{
          position: 'fixed',
          left: '50%',
          transform: 'translateX(-50%)',
          top: 12,
          zIndex: 2147482001,
          background: '#4f46e5',
          color: '#fff',
          borderRadius: 12,
          padding: '10px 14px',
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: 13,
          boxShadow: '0 10px 25px rgba(0,0,0,0.25)',
          display: 'flex',
          gap: 12,
          alignItems: 'center',
        }}
      >
        <span>Uma nova versão do sistema foi instalada no servidor. Salve o que estiver fazendo e recarregue.</span>
        <button type="button" onClick={() => window.location.reload()} style={btn('#16a34a')}>
          Recarregar agora
        </button>
      </div>
    )}
    <BadgeDock testId="local-network-status">
      {(docked) => (
      <>
      {open && (
        <div style={popoverStyle}>
          <strong style={{ fontSize: 13 }}>{local.serverName || roleLabel}</strong>
          {appBuildLabel() && <p style={{ margin: '2px 0 6px', color: '#64748b' }}>Versão do sistema publicada em {appBuildLabel()}</p>}
          <p style={{ margin: '6px 0' }}>{label}</p>
          {local.message && <p style={{ margin: '6px 0', color: '#b45309' }}>{local.message}</p>}
          {local.lastSyncAt && (
            <p style={{ margin: '6px 0', color: '#64748b' }}>
              Última sincronização: {new Date(local.lastSyncAt).toLocaleTimeString('pt-BR')}
            </p>
          )}
          <hr style={{ border: 0, borderTop: '1px solid #e2e8f0', margin: '8px 0' }} />
          <p style={{ margin: '6px 0' }}>{cloud ? cloudLabel[cloud.state] : cloudLabel.inativo}</p>
          {cloud?.message && <p style={{ margin: '6px 0', color: '#64748b' }}>{cloud.message}</p>}
          {cloud?.lastPushAt && (
            <p style={{ margin: '6px 0', color: '#64748b' }}>
              Último envio à nuvem: {new Date(cloud.lastPushAt).toLocaleString('pt-BR')}
            </p>
          )}
          {cloud?.state === 'aguardando-login' && !loginOpen && (
            <button type="button" onClick={() => setLoginOpen(true)} style={{ ...btn('#b45309'), marginTop: 6 }}>
              Entrar na nuvem
            </button>
          )}
          {renderLoginForm()}
          <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => {
                flushLocalChanges().then(() => pullFromLocalServer());
              }}
              style={btn('#4f46e5')}
            >
              Sincronizar agora
            </button>
            <button type="button" onClick={() => runCloudSyncNow(true)} style={btn('#0f766e')}>
              Enviar à nuvem agora
            </button>
            {cloud && cloud.state !== 'aguardando-login' && cloud.state !== 'inativo' && (
              <button type="button" onClick={cloudDisconnect} style={btn('#64748b')}>
                Desconectar da nuvem
              </button>
            )}
          </div>
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={label}
        title={label}
        style={pillStyle(docked)}
      >
        <span style={{ width: 9, height: 9, borderRadius: 999, background: dot, display: 'inline-block', flexShrink: 0 }} />
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>
      </button>
      </>
      )}
    </BadgeDock>
    </>
  );
};

const fieldStyle: React.CSSProperties = {
  width: '100%',
  padding: '6px 8px',
  border: '1px solid #cbd5e1',
  borderRadius: 8,
  fontSize: 12,
  boxSizing: 'border-box',
};

function btn(color: string): React.CSSProperties {
  return {
    background: color,
    color: '#fff',
    border: 0,
    borderRadius: 8,
    padding: '6px 10px',
    fontSize: 11,
    fontWeight: 700,
    cursor: 'pointer',
  };
}

type WebCloudBadgeProps = {
  queue: BatchQueueStatus | null;
  hasSession: boolean | null;
  lateServer: LocalServerInfo | null;
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  loginOpen: boolean;
  setLoginOpen: React.Dispatch<React.SetStateAction<boolean>>;
  loginForm: React.ReactNode;
  onDisconnect: () => void;
};

/** Selo do modo link: situação do envio à nuvem (sem servidor da rede local). */
const WebCloudBadge: React.FC<WebCloudBadgeProps> = ({
  queue,
  hasSession,
  lateServer,
  open,
  setOpen,
  loginOpen,
  setLoginOpen,
  loginForm,
  onDisconnect,
}) => {
  const online = typeof navigator === 'undefined' || navigator.onLine !== false;
  const pending = queue?.totalPendingCount || 0;
  const failed = queue?.deadLetterCount || 0;

  let dot = '#10b981';
  let label = 'Nuvem: dados enviados';
  let detail = 'Tudo o que foi feito neste computador já está na nuvem.';
  if (!online) {
    dot = '#e11d48';
    label = 'Nuvem: sem internet';
    detail = `O trabalho continua normalmente${pending ? ` (${pending} alteração(ões) guardada(s))` : ''} e é enviado quando a internet voltar.`;
  } else if (hasSession === false) {
    dot = '#f59e0b';
    label = 'Nuvem: aguardando login';
    detail = `Há internet, mas este computador não está conectado à conta da nuvem${pending ? `: ${pending} alteração(ões) esperando envio` : ''}.`;
  } else if (queue?.isFlushing || pending > 0) {
    dot = '#f59e0b';
    label = pending ? `Nuvem: enviando ${pending} alteração(ões)` : 'Nuvem: enviando...';
    detail = queue?.lastError && (queue?.consecutiveFailures || 0) > 0
      ? `Tentando de novo: ${queue.lastError}`
      : 'As alterações estão sendo enviadas. Aguarde antes de fechar o sistema.';
  } else if (failed > 0) {
    dot = '#e11d48';
    label = 'Nuvem: erro no envio';
    detail = `${failed} registro(s) foram recusados pela nuvem.${queue?.lastError ? ` Último erro: ${queue.lastError}` : ''}`;
  } else if (hasSession === null) {
    dot = '#94a3b8';
    label = 'Nuvem: verificando...';
    detail = 'Conferindo a conexão com a nuvem.';
  }

  return (
    <>
      {lateServer && (
        <div
          role="status"
          data-testid="late-local-server"
          style={{
            position: 'fixed',
            left: '50%',
            transform: 'translateX(-50%)',
            top: 12,
            zIndex: 2147482001,
            background: '#b45309',
            color: '#fff',
            borderRadius: 12,
            padding: '10px 14px',
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: 13,
            boxShadow: '0 10px 25px rgba(0,0,0,0.25)',
            display: 'flex',
            gap: 12,
            alignItems: 'center',
          }}
        >
          <span>
            O {lateServer.serverName} respondeu agora (estava demorando na abertura). Recarregue para conectar a este servidor.
          </span>
          <button type="button" onClick={() => window.location.reload()} style={btn('#16a34a')}>
            Recarregar agora
          </button>
        </div>
      )}
      <BadgeDock testId="cloud-status-web">
        {(docked) => (
        <>
        {open && (
          <div style={popoverStyle}>
            <strong style={{ fontSize: 13 }}>Acesso pelo link (nuvem)</strong>
            {appBuildLabel() && <p style={{ margin: '2px 0 6px', color: '#64748b' }}>Versão do sistema publicada em {appBuildLabel()}</p>}
            <p style={{ margin: '6px 0' }}>{label}</p>
            <p style={{ margin: '6px 0', color: '#64748b' }}>{detail}</p>
            {queue?.lastSuccessfulSync && (
              <p style={{ margin: '6px 0', color: '#64748b' }}>
                Último envio à nuvem: {new Date(queue.lastSuccessfulSync).toLocaleString('pt-BR')}
              </p>
            )}
            {hasSession === false && !loginOpen && (
              <button type="button" onClick={() => setLoginOpen(true)} style={{ ...btn('#b45309'), marginTop: 6 }}>
                Entrar na nuvem
              </button>
            )}
            {loginForm}
            <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => supabaseBatchQueue.handleNetworkRestored()}
                style={btn('#0f766e')}
              >
                Enviar à nuvem agora
              </button>
              {hasSession && (
                <button type="button" onClick={onDisconnect} style={btn('#64748b')}>
                  Desconectar da nuvem
                </button>
              )}
            </div>
          </div>
        )}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={label}
          title={label}
          style={pillStyle(docked)}
        >
          <span style={{ width: 9, height: 9, borderRadius: 999, background: dot, display: 'inline-block', flexShrink: 0 }} />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>
        </button>
        </>
        )}
      </BadgeDock>
    </>
  );
};
