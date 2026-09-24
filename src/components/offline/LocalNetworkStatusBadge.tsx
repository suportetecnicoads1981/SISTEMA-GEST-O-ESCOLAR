import React, { useEffect, useState } from 'react';
import {
  getLocalServerInfo,
  subscribeLocalServerStatus,
  flushLocalChanges,
  pullFromLocalServer,
  LocalServerStatus,
} from '../../services/offline/localServerSync';
import { subscribeCloudSyncStatus, runCloudSyncNow, CloudSyncStatus } from '../../services/offline/cloudAutoSync';
import { getSupabaseClient } from '../../services/datasync/supabaseClient';

/**
 * Indicador (canto inferior esquerdo) exibido somente quando o sistema foi aberto
 * a partir do Servidor Remoto ou do Servidor da Sede na rede local.
 */
export const LocalNetworkStatusBadge: React.FC = () => {
  const [local, setLocal] = useState<LocalServerStatus | null>(null);
  const [cloud, setCloud] = useState<CloudSyncStatus | null>(null);
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
      await runCloudSyncNow(true);
    } catch (err: any) {
      setLoginMsg(`Sem resposta da nuvem agora (${err?.message || err}). Tente de novo em instantes.`);
    } finally {
      setLoginBusy(false);
    }
  };

  useEffect(() => {
    if (!getLocalServerInfo()) return;
    const offA = subscribeLocalServerStatus(setLocal);
    const offB = subscribeCloudSyncStatus(setCloud);
    return () => {
      offA();
      offB();
    };
  }, []);

  if (!local || local.mode === 'desativado') return null;

  const connected = local.mode === 'conectado' || local.mode === 'sincronizando';
  const dot = !connected ? '#e11d48' : local.pending > 0 ? '#f59e0b' : '#10b981';
  const roleLabel = local.role === 'SEDE' ? 'Servidor da Sede' : 'Servidor Remoto';
  const label = !connected
    ? `${roleLabel}: sem conexão`
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
    <div
      data-testid="local-network-status"
      style={{ position: 'fixed', left: 12, bottom: 12, zIndex: 2147482000, fontFamily: 'Inter, system-ui, sans-serif' }}
    >
      {open && (
        <div
          style={{
            marginBottom: 8,
            width: 300,
            background: '#fff',
            color: '#0f172a',
            border: '1px solid #e2e8f0',
            borderRadius: 14,
            boxShadow: '0 12px 30px rgba(0,0,0,0.18)',
            padding: 14,
            fontSize: 12,
            lineHeight: 1.45,
          }}
        >
          <strong style={{ fontSize: 13 }}>{local.serverName || roleLabel}</strong>
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
          {loginOpen && (
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
          )}
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
          </div>
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={label}
        title={label}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: '#0f172a',
          color: '#fff',
          border: 0,
          borderRadius: 999,
          padding: '6px 12px',
          fontSize: 11,
          fontWeight: 700,
          cursor: 'pointer',
          boxShadow: '0 6px 16px rgba(0,0,0,0.25)',
        }}
      >
        <span style={{ width: 9, height: 9, borderRadius: 999, background: dot, display: 'inline-block' }} />
        {label}
      </button>
    </div>
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
