import React, { useEffect, useState } from 'react';
import {
  getLocalServerInfo,
  subscribeLocalServerStatus,
  flushLocalChanges,
  pullFromLocalServer,
  LocalServerStatus,
} from '../../services/offline/localServerSync';
import { subscribeCloudSyncStatus, runCloudSyncNow, CloudSyncStatus } from '../../services/offline/cloudAutoSync';

/**
 * Indicador (canto inferior esquerdo) exibido somente quando o sistema foi aberto
 * a partir do Servidor Remoto ou do Servidor da Sede na rede local.
 */
export const LocalNetworkStatusBadge: React.FC = () => {
  const [local, setLocal] = useState<LocalServerStatus | null>(null);
  const [cloud, setCloud] = useState<CloudSyncStatus | null>(null);
  const [open, setOpen] = useState(false);

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
  );
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
