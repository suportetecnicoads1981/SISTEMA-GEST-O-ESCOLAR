import React, { useCallback, useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  ChevronRight,
  Cloud,
  Database,
  Info,
  Key,
  Monitor,
  Network,
  RefreshCw,
  Server,
  ShieldCheck,
  Sliders,
  Users,
  Zap,
} from 'lucide-react';
import { SecurityAuditLog } from '../../types';
import { isTabAvailable } from '../../config/features';
import { moduleName, moduleGroup } from '../../config/moduleNames';
import {
  getLocalServerInfo,
  getLocalServerStatus,
  getServerUpdateInfo,
  subscribeLocalServerStatus,
  LocalServerStatus,
} from '../../services/offline/localServerSync';
import { getCloudSyncStatus, subscribeCloudSync, CloudSyncStatus } from '../../services/sync/cloudSync';
import { isCloudReachable } from '../../services/offline/connectivity';

declare const __APP_BUILT_AT__: string;

/**
 * Hub de Engenharia & TI (grupo Administração & TI) — mostra SOMENTE informações reais deste computador, do servidor local e da
 * nuvem (nada simulado). As ferramentas levam aos módulos que de fato fazem o trabalho.
 */
interface AdminTIHubProps {
  onNavigate: (tab: string, payload?: any) => void;
  schoolName?: string;
  onBack?: () => void;
  userAccountsCount?: number;
  counts?: { schools: number; classes: number; students: number; activeUsers: number };
  auditLogs?: SecurityAuditLog[];
}

const fmtDateTime = (iso?: string) => {
  if (!iso) return '';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
};

const builtAt = () => {
  const t = typeof __APP_BUILT_AT__ === 'string' ? __APP_BUILT_AT__ : '';
  return fmtDateTime(t) || 'não informada';
};

type Tone = 'ok' | 'warn' | 'off' | 'error';
const TONE: Record<Tone, string> = {
  ok: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  warn: 'bg-amber-50 text-amber-700 border-amber-200',
  off: 'bg-slate-100 text-slate-600 border-slate-200',
  error: 'bg-red-50 text-red-700 border-red-200',
};

const StatusRow: React.FC<{ icon: React.ElementType; title: string; badge: string; tone: Tone; lines: string[] }> = ({
  icon: Icon,
  title,
  badge,
  tone,
  lines,
}) => (
  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
    <div className="flex items-center justify-between gap-2">
      <span className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
        <Icon className="h-3.5 w-3.5 text-slate-500" />
        {title}
      </span>
      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${TONE[tone]}`}>{badge}</span>
    </div>
    {lines.filter(Boolean).map((l, i) => (
      <p key={i} className="text-[11px] text-slate-600 leading-snug">
        {l}
      </p>
    ))}
  </div>
);

const LOCAL_LABEL: Record<LocalServerStatus['mode'], { badge: string; tone: Tone }> = {
  conectado: { badge: 'Conectado', tone: 'ok' },
  sincronizando: { badge: 'Sincronizando', tone: 'ok' },
  'sem-conexao': { badge: 'Sem conexão', tone: 'error' },
  desativado: { badge: 'Não usado', tone: 'off' },
};

const CLOUD_LABEL: Record<CloudSyncStatus['state'], { badge: string; tone: Tone }> = {
  ok: { badge: 'Em dia', tone: 'ok' },
  sincronizando: { badge: 'Sincronizando', tone: 'ok' },
  'aguardando-login': { badge: 'Aguardando login', tone: 'warn' },
  'sem-internet': { badge: 'Sem internet', tone: 'warn' },
  erro: { badge: 'Erro', tone: 'error' },
  inativo: { badge: 'Inativa', tone: 'off' },
};

const TOOLS = [
  { id: 'NETWORK_INSTALLER', title: moduleName('NETWORK_INSTALLER'), desc: 'Pacotes do Servidor Sede, servidores das escolas e estações', icon: Server, color: 'bg-blue-100/60 text-blue-700' },
  { id: 'USER_CONTROL', title: moduleName('USER_CONTROL'), desc: 'Usuários, perfis, senhas e contas na nuvem', icon: Key, color: 'bg-purple-100/60 text-purple-700' },
  { id: 'MUNICIPAL_SYNC', title: moduleName('MUNICIPAL_SYNC'), desc: 'Lotes das escolas e consolidação na Sede', icon: Database, color: 'bg-emerald-100/60 text-emerald-700' },
  { id: 'SYSTEM_UPDATES', title: moduleName('SYSTEM_UPDATES'), desc: 'Versões publicadas e notas de atualização', icon: RefreshCw, color: 'bg-amber-100/60 text-amber-700' },
  { id: 'ABOUT', title: moduleName('ABOUT'), desc: 'Dados do sistema e contato do suporte', icon: Info, color: 'bg-slate-100 text-slate-700' },
].filter((t) => isTabAvailable(t.id));

const AUDIT_TONE: Record<SecurityAuditLog['status'], string> = {
  SUCESSO: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  ALERTA: 'bg-amber-50 text-amber-700 border-amber-200',
  BLOQUEADO: 'bg-red-50 text-red-700 border-red-200',
};

export const AdminTIHub: React.FC<AdminTIHubProps> = ({
  onNavigate,
  schoolName = 'SucessoEdu Gestão Educacional',
  onBack,
  userAccountsCount = 0,
  counts,
  auditLogs = [],
}) => {
  const [online, setOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine !== false));
  const [cloudReachable, setCloudReachable] = useState<boolean | null>(null);
  const [local, setLocal] = useState<LocalServerStatus>(() => getLocalServerStatus());
  const [cloud, setCloud] = useState<CloudSyncStatus>(() => getCloudSyncStatus());
  const [serverVersion, setServerVersion] = useState<string>('');
  const [checking, setChecking] = useState(false);
  const [checkedAt, setCheckedAt] = useState('');

  const info = getLocalServerInfo();

  const check = useCallback(async () => {
    setChecking(true);
    setOnline(typeof navigator === 'undefined' ? true : navigator.onLine !== false);
    try {
      const [reach, upd] = await Promise.all([
        isCloudReachable(3000, true).catch(() => false),
        getLocalServerInfo() ? getServerUpdateInfo().catch(() => null) : Promise.resolve(null),
      ]);
      setCloudReachable(reach);
      setServerVersion(upd?.current || '');
    } finally {
      setLocal(getLocalServerStatus());
      setCloud(getCloudSyncStatus());
      setCheckedAt(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    check();
    const offLocal = subscribeLocalServerStatus(setLocal);
    const offCloud = subscribeCloudSync(setCloud);
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      offLocal();
      offCloud();
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, [check]);

  const localLabel = LOCAL_LABEL[local.mode] || LOCAL_LABEL.desativado;
  const cloudLabel = CLOUD_LABEL[cloud.state] || CLOUD_LABEL.inativo;
  const recentLogs = [...auditLogs]
    .sort((a, b) => String(b.timestamp).localeCompare(String(a.timestamp)))
    .slice(0, 8);

  const serverLines = info
    ? [
        `${info.role === 'SEDE' ? 'Servidor Sede' : 'Servidor da escola'}: ${info.serverName || local.serverName || 'sem nome'}`,
        info.role === 'REMOTO' && info.schoolName ? `Escola atendida: ${info.schoolName}` : '',
        serverVersion ? `Versão instalada no servidor: ${serverVersion}` : '',
        local.pending ? `${local.pending} alteração(ões) aguardando envio ao servidor` : 'Nenhuma alteração pendente',
        local.lastSyncAt ? `Última sincronização: ${fmtDateTime(local.lastSyncAt)}` : '',
        local.message || '',
      ]
    : ['Este computador abriu o sistema pelo link publicado (sem servidor da rede local).'];

  const cloudLines = [
    cloudReachable === null ? 'Verificando acesso à nuvem...' : cloudReachable ? 'Nuvem acessível a partir deste computador.' : 'A nuvem não respondeu a partir deste computador.',
    cloud.message || '',
    cloud.pending ? `${cloud.pending} registro(s) aguardando envio à nuvem` : '',
    cloud.lastSyncAt ? `Última sincronização: ${fmtDateTime(cloud.lastSyncAt)}` : '',
    cloud.rejected ? `${cloud.rejected} registro(s) recusado(s) pela nuvem (ver avisos de sincronização)` : '',
  ];

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Cabeçalho */}
      <div className="bg-slate-900 text-slate-100 rounded-3xl p-6 sm:p-7 border border-slate-800 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-2.5 flex-wrap">
              {onBack && (
                <button
                  onClick={onBack}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
                  title="Voltar"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
              )}
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800 text-xs font-bold">
                <Sliders className="h-3.5 w-3.5" />
                {moduleGroup('ADMIN_TI').toUpperCase()}
              </span>
              <span className="text-xs text-slate-400">{schoolName}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">{moduleName('ADMIN_TI')}</h1>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              Situação real deste computador, do servidor da rede local e da nuvem, e acesso às ferramentas de TI.
            </p>
          </div>
          <button
            onClick={check}
            disabled={checking}
            className="self-start lg:self-center px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            title="Verificar de novo a conexão com o servidor e a nuvem"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${checking ? 'animate-spin text-cyan-400' : 'text-slate-400'}`} />
            <span>{checking ? 'Verificando...' : 'Verificar agora'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna 1: situação real */}
        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">Situação agora</h2>
                <p className="text-[11px] text-slate-500 font-medium">
                  {checkedAt ? `Verificado às ${checkedAt}` : 'Verificando...'}
                </p>
              </div>
            </div>
          </div>

          <StatusRow
            icon={Monitor}
            title="Este computador"
            badge={online ? 'Com rede' : 'Sem rede'}
            tone={online ? 'ok' : 'error'}
            lines={[`Versão do sistema aberta: ${builtAt()}`]}
          />
          <StatusRow icon={Network} title="Servidor da rede local" badge={localLabel.badge} tone={localLabel.tone} lines={serverLines} />
          <StatusRow
            icon={Cloud}
            title="Nuvem (sincronização)"
            badge={cloudReachable === false && cloud.state !== 'erro' ? 'Sem acesso' : cloudLabel.badge}
            tone={cloudReachable === false && cloud.state !== 'erro' ? 'warn' : cloudLabel.tone}
            lines={cloudLines}
          />
        </div>

        {/* Coluna 2: ferramentas reais */}
        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-2xs space-y-3">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3.5">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Ferramentas de TI</h2>
              <p className="text-[11px] text-slate-500 font-medium">Instalação, acessos, rede e atualizações</p>
            </div>
          </div>
          {TOOLS.map((t) => {
            const Icon = t.icon;
            return (
              <div
                key={t.id}
                className="p-3 bg-slate-50 hover:bg-indigo-50/40 rounded-2xl border border-slate-200 hover:border-indigo-200 transition-all flex items-center justify-between gap-3 group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`p-2 rounded-xl shrink-0 ${t.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 truncate">{t.title}</h3>
                    <p className="text-[10px] text-slate-500 truncate">{t.desc}</p>
                  </div>
                </div>
                <button
                  onClick={() => onNavigate(t.id)}
                  className="px-3 py-1.5 rounded-xl bg-white group-hover:bg-indigo-600 text-slate-700 group-hover:text-white border border-slate-200 group-hover:border-indigo-600 text-xs font-bold transition-all shrink-0 cursor-pointer shadow-2xs"
                >
                  Abrir
                </button>
              </div>
            );
          })}
        </div>

        {/* Coluna 3: dados e registro de acessos reais */}
        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-2xs space-y-3">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3.5">
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600 border border-purple-100">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Dados neste computador</h2>
              <p className="text-[11px] text-slate-500 font-medium">Cadastros e registro de acessos</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            {[
              ['Escolas', counts?.schools],
              ['Turmas', counts?.classes],
              ['Alunos', counts?.students],
              ['Usuários ativos', counts?.activeUsers ?? userAccountsCount],
            ].map(([label, value]) => (
              <div key={String(label)} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-500 font-bold block">{label}</span>
                <span className="text-base font-black text-slate-900">{typeof value === 'number' ? value.toLocaleString('pt-BR') : '—'}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-xs font-bold text-slate-800">Últimos registros de acesso</span>
            <button
              onClick={() => onNavigate('USER_CONTROL')}
              className="text-[10px] font-bold text-purple-600 hover:text-purple-700 cursor-pointer flex items-center gap-0.5"
            >
              Ver todos <ChevronRight className="h-3 w-3" />
            </button>
          </div>
          {recentLogs.length === 0 ? (
            <p className="text-[11px] text-slate-500 p-3 bg-slate-50 rounded-xl border border-slate-200">
              Nenhum registro de acesso neste computador ainda.
            </p>
          ) : (
            <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
              {recentLogs.map((log) => (
                <div key={log.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 space-y-0.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold text-slate-800 truncate">{log.userName || log.userLogin || 'Usuário'}</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border shrink-0 ${AUDIT_TONE[log.status] || TONE.off}`}>
                      {log.status}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-600 line-clamp-2">{log.details}</p>
                  <p className="text-[9px] text-slate-400">{fmtDateTime(log.timestamp)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Dica */}
      <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
            <Zap className="h-4 w-4 text-amber-500" />
            <span>Instalação do Servidor Sede, das escolas e das estações</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
            Gere o pacote em <strong>{moduleName('NETWORK_INSTALLER')}</strong>. Ele já configura o servidor local, a inicialização
            automática e o atalho único oficial na Área de Trabalho.
          </p>
        </div>
        <button
          onClick={() => onNavigate('NETWORK_INSTALLER')}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all cursor-pointer shadow-xs flex items-center gap-1.5 shrink-0"
        >
          <span>Ir para {moduleName('NETWORK_INSTALLER')}</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};
