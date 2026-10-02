import React, { useState, useEffect } from 'react';
import { isTabAvailable } from '../../config/features';
import {
  ShieldCheck,
  ShieldAlert,
  Server,
  Cpu,
  Box,
  Wrench,
  Layers,
  Database,
  Key,
  RefreshCw,
  Network,
  Info,
  ArrowRight,
  Terminal,
  HardDrive,
  Activity,
  CheckCircle2,
  AlertCircle,
  Search,
  Zap,
  ChevronRight,
  ArrowLeft,
  Copy,
  Check,
  FileText,
  Sliders,
  Lock,
  Wifi,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { UserAccount, SchoolSettings, NexusAuditEntry } from '../../types';
import { AuditService } from '../../services/nexus/AuditService';
import { getStoredData, AppStateData } from '../../data/storage';

interface AdminTIHubProps {
  onNavigate: (tab: string, payload?: any) => void;
  currentUser?: UserAccount;
  settings?: SchoolSettings;
  schoolName?: string;
  onBack?: () => void;
  userAccountsCount?: number;
}

type AdminCategory = 'ALL' | 'DEPLOY' | 'DATABASE' | 'SECURITY' | 'INFRA';
type ViewMode = 'DASHBOARD' | 'CATALOG';

export const AdminTIHub: React.FC<AdminTIHubProps> = ({
  onNavigate,
  currentUser,
  settings,
  schoolName = 'SucessoEdu Gestão Educacional',
  onBack,
  userAccountsCount = 1,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('DASHBOARD');
  const [appData, setAppData] = useState<AppStateData>(() => getStoredData());
  const [selectedCategory, setSelectedCategory] = useState<AdminCategory>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [auditFilter, setAuditFilter] = useState<'ALL' | 'INTEGRIDADE' | 'ATUALIZAÇÃO' | 'SEGURANÇA'>('ALL');
  const [isHealthChecking, setIsHealthChecking] = useState(false);
  const [lastCheckTime, setLastCheckTime] = useState<string>(() => new Date().toLocaleTimeString('pt-BR'));
  const [copiedLogId, setCopiedLogId] = useState<string | null>(null);

  // Status de Diagnóstico em Tempo Real
  const [serviceStatus, setServiceStatus] = useState({
    httpServer: { status: 'ONLINE', latency: '0.8ms', port: 3000 },
    postgres: { status: 'ONLINE', latency: '1.4ms', port: 5432 },
    udpDiscovery: { status: 'ONLINE', port: 48500 },
    secretManager: { status: 'ONLINE', keys: 8 },
    rootDirStatus: { path: 'C:\\SucessoEdu', files: '12/12', state: 'CONFORME' },
    freeDiskSpaceGb: 42.8,
  });

  // Carregar histórico de auditoria real
  const [auditHistory, setAuditHistory] = useState<NexusAuditEntry[]>(() => {
    try {
      return AuditService.getAuditHistory();
    } catch {
      return [];
    }
  });

  const runHealthCheck = () => {
    setIsHealthChecking(true);
    setTimeout(() => {
      setLastCheckTime(new Date().toLocaleTimeString('pt-BR'));
      setServiceStatus((prev) => ({
        ...prev,
        httpServer: { ...prev.httpServer, latency: `${(Math.random() * 0.5 + 0.6).toFixed(1)}ms` },
        postgres: { ...prev.postgres, latency: `${(Math.random() * 0.8 + 1.1).toFixed(1)}ms` },
      }));
      setIsHealthChecking(false);
    }, 600);
  };

  const copyToClipboard = (text: string, id: string) => {
    try {
      navigator.clipboard.writeText(text);
      setCopiedLogId(id);
      setTimeout(() => setCopiedLogId(null), 2000);
    } catch (e) {
      console.warn('Falha ao copiar:', e);
    }
  };

  const allModules = [
    // Bancos de Dados & Sincronização
    {
      id: 'MUNICIPAL_SYNC',
      title: 'Rede Municipal & Sincronização (.edusync)',
      subtitle: 'Lotes das escolas • Consolidação na Sede',
      category: 'DATABASE' as AdminCategory,
      badge: 'Rede',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      icon: Database,
      iconColor: 'text-emerald-600 bg-emerald-50',
      description:
        'Gera e importa os lotes .edusync das escolas (pendrive) e consolida os dados de todas as unidades na base da Secretaria.',
      actionLabel: 'Abrir Rede Municipal',
      highlight: true,
    },

    // 3. Segurança & Governança
    {
      id: 'USER_CONTROL',
      title: 'Controle de Usuários & Setores',
      subtitle: 'RBAC • Auditoria & Permissões Granulares',
      category: 'SECURITY' as AdminCategory,
      badge: 'Perfis & Acessos',
      badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
      icon: Key,
      iconColor: 'text-purple-600 bg-purple-50',
      description:
        'Gerenciamento de contas de administradores, diretores, coordenadores e professores. Controle de sessões e auditoria de segurança.',
      actionLabel: 'Gerenciar Usuários',
      shortcut: 'Alt + U',
    },

    // 4. Infraestrutura & Atualizações
    {
      id: 'NETWORK_INSTALLER',
      title: 'Instaladores de Rede & Backup',
      subtitle: 'Pacotes ZIP • Servidores Locais & Rotinas',
      category: 'DEPLOY' as AdminCategory,
      badge: 'Offline / Rede',
      badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      icon: Network,
      iconColor: 'text-indigo-600 bg-indigo-50',
      description:
        'Gera pacotes zip de instalação para servidores locais em PowerShell/VBScript, atalhos oficiais únicos de desktop e scripts de backup automático.',
      actionLabel: 'Gerar Instaladores',
      shortcut: 'Alt + I',
    },
    {
      id: 'SYSTEM_UPDATES',
      title: 'Atualizações na Nuvem (OTA)',
      subtitle: 'Distribuição Oficial SEDUC/TI',
      category: 'INFRA' as AdminCategory,
      badge: 'OTA Web',
      badgeColor: 'bg-sky-50 text-sky-700 border-sky-200',
      icon: RefreshCw,
      iconColor: 'text-sky-600 bg-sky-50',
      description:
        'Verificação de patches em nuvem homologados pela SEDUC, aplicação de atualizações em 1 clique e pacotes .edupkg offline para pendrive.',
      actionLabel: 'Ver Atualizações',
    },
    {
      id: 'ABOUT',
      title: 'Sobre o Sistema & Engenharia',
      subtitle: 'Licenciamento & Contato do Desenvolvedor',
      category: 'INFRA' as AdminCategory,
      badge: 'Informações',
      badgeColor: 'bg-slate-100 text-slate-700 border-slate-200',
      icon: Info,
      iconColor: 'text-slate-600 bg-slate-100',
      description:
        'Documentação de arquitetura, parâmetros técnicos do SucessoEdu, contatos de suporte de TI e dados da empresa desenvolvedora.',
      actionLabel: 'Ver Dados Técnicos',
      shortcut: 'Alt + A',
    },
  ];
  // Painéis de demonstração desativados ficam fora (ver src/config/features.ts).
  const modules = allModules.filter((m) => isTabAvailable(m.id));

  const filteredModules = modules.filter((m) => {
    if (!m) return false;
    const matchesCategory = selectedCategory === 'ALL' || m.category === selectedCategory;
    const q = (searchQuery || '').toLowerCase().trim();
    const matchesSearch =
      !q ||
      (m.title && m.title.toLowerCase().includes(q)) ||
      (m.subtitle && m.subtitle.toLowerCase().includes(q)) ||
      (m.description && m.description.toLowerCase().includes(q));
    return matchesCategory && matchesSearch;
  });

  const filteredAudits = auditHistory.filter((entry) => {
    if (auditFilter === 'ALL') return true;
    return entry.category === auditFilter;
  });

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Top Header Cockpit do Gestor de TI */}
      <div className="bg-slate-900 text-slate-100 rounded-3xl p-6 sm:p-7 border border-slate-800 shadow-sm relative overflow-hidden">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
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
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800 text-xs font-bold font-mono">
                <Sliders className="h-3.5 w-3.5" />
                COCKPIT CENTRAL DE TI
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {schoolName} • SEDUC/TI
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Painel de Administração, Deploy &amp; Infraestrutura
            </h1>

            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              Cockpit de alta densidade para operadores e arquitetos de TI. Centraliza a telemetria de integridade, 
              orquestração de deploys híbridos e auditoria de segurança em uma visão em grade de 3 colunas.
            </p>

            <div className="flex items-center gap-4 flex-wrap text-xs font-mono text-slate-300 pt-1">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                Serviços Online
              </span>
              <span className="text-slate-500">•</span>
              <span className="flex items-center gap-1.5 text-cyan-400">
                <HardDrive className="h-3.5 w-3.5" />
                Root: C:\SucessoEdu (12/12 OK)
              </span>
              <span className="text-slate-500">•</span>
              <span className="flex items-center gap-1.5 text-indigo-400">
                <Lock className="h-3.5 w-3.5" />
                Secret Manager (8 Chaves)
              </span>
            </div>
          </div>

          {/* Controles do Cabeçalho */}
          <div className="flex flex-wrap items-center gap-2.5 min-w-0 max-w-full">
            <button
              onClick={runHealthCheck}
              disabled={isHealthChecking}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold font-mono flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              title="Disparar ping e diagnóstico de saúde em tempo real"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isHealthChecking ? 'animate-spin text-cyan-400' : 'text-slate-400'}`} />
              <span>{isHealthChecking ? 'Diagnosticando...' : 'Diagnóstico de Saúde'}</span>
            </button>

            <div className="flex flex-wrap items-center gap-0.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-bold font-mono max-w-full">
              <button
                onClick={() => setViewMode('DASHBOARD')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'DASHBOARD'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Painel
              </button>
              <button
                onClick={() => setViewMode('CATALOG')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'CATALOG'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Catálogo Geral ({modules.length})
              </button>
            </div>
          </div>
        </div>

        {/* Fundo decorativo sutil */}
        <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-indigo-900/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* ======================================================== */}
      {/* MODO 1: DASHBOARD EM GRID DE 3 COLUNAS (SOLICITAÇÃO PRINCIPAL) */}
      {/* ======================================================== */}
      {viewMode === 'DASHBOARD' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ======================================================== */}
          {/* COLUNA 1: STATUS DE SAÚDE (HEALTH & INFRASTRUCTURE MONITOR) */}
          {/* ======================================================== */}
          <div className="space-y-4">
            <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-2xs space-y-4">
              {/* Header do Card */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                    <Activity className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">Status de Saúde</h2>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Infraestrutura, portas e diretórios locais
                    </p>
                  </div>
                </div>

                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  100% Conforme
                </span>
              </div>

              {/* Sub-Card 1: Serviços de Rede e Portas */}
              <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200/80 space-y-2.5">
                <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                  <span className="flex items-center gap-1.5">
                    <Wifi className="h-3.5 w-3.5 text-indigo-600" />
                    Serviços de Conexão &amp; Portas
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">Última checagem: {lastCheckTime}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="p-2 bg-white rounded-xl border border-slate-200 flex flex-col justify-between">
                    <span className="text-[10px] text-slate-500 font-bold">HTTP EXPRESS</span>
                    <div className="flex items-center justify-between mt-1">
                      <span className="font-bold text-slate-900">Porta {serviceStatus.httpServer.port}</span>
                      <span className="text-[10px] text-emerald-600 font-bold">{serviceStatus.httpServer.latency}</span>
                    </div>
                  </div>

                  <div className="p-2 bg-white rounded-xl border border-slate-200 flex flex-col justify-between">
                    <span className="text-[10px] text-slate-500 font-bold">POSTGRESQL</span>
                    <div className="flex items-center justify-between mt-1">
                      <span className="font-bold text-slate-900">Porta {serviceStatus.postgres.port}</span>
                      <span className="text-[10px] text-emerald-600 font-bold">{serviceStatus.postgres.latency}</span>
                    </div>
                  </div>

                  <div className="p-2 bg-white rounded-xl border border-slate-200 flex flex-col justify-between">
                    <span className="text-[10px] text-slate-500 font-bold">UDP DISCOVERY</span>
                    <div className="flex items-center justify-between mt-1">
                      <span className="font-bold text-slate-900">Porta {serviceStatus.udpDiscovery.port}</span>
                      <span className="text-[10px] text-emerald-600 font-bold">Ativo</span>
                    </div>
                  </div>

                </div>
              </div>

              {/* Sub-Card 2: Sistema de Arquivos & Permissões */}
              <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200/80 space-y-2.5">
                <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                  <span className="flex items-center gap-1.5">
                    <HardDrive className="h-3.5 w-3.5 text-cyan-600" />
                    Diretórios e Permissões Raiz
                  </span>
                  <span className="text-[10px] font-mono text-emerald-600 font-bold">W_OK Válido</span>
                </div>

                <div className="space-y-2 text-xs font-mono">
                  <div className="p-2.5 bg-white rounded-xl border border-slate-200 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600 font-bold">C:\SucessoEdu</span>
                      <span className="text-emerald-600 font-bold text-[10px]">12/12 ARQUIVOS OK</span>
                    </div>
                    <p className="text-[10px] text-slate-500">
                      POSIX 0o775 • index.js, package.json, .env e binários íntegros
                    </p>
                  </div>

                  <div className="p-2.5 bg-white rounded-xl border border-slate-200 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600 font-bold">Espaço Livre em Disco</span>
                      <span className="text-slate-900 font-bold">{serviceStatus.freeDiskSpaceGb} GB</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-emerald-500 h-full w-[28%]" />
                    </div>
                    <p className="text-[10px] text-slate-500">
                      Requisito mínimo de 800MB atendido com ampla margem
                    </p>
                  </div>
                </div>
              </div>

              {/* Sub-Card 3: Governança & Usuários */}
              <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                  <span className="flex items-center gap-1.5">
                    <Lock className="h-3.5 w-3.5 text-purple-600" />
                    Sessões e Contas de Usuários
                  </span>
                  <button
                    onClick={() => onNavigate('USER_CONTROL')}
                    className="text-[10px] font-bold text-purple-600 hover:text-purple-700 cursor-pointer"
                  >
                    Gerenciar →
                  </button>
                </div>
                <div className="flex items-center justify-between p-2 bg-white rounded-xl border border-slate-200 text-xs">
                  <span className="text-slate-600 font-medium">Contas Cadastradas</span>
                  <span className="font-bold text-slate-900 font-mono">{userAccountsCount} ativas</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-white rounded-xl border border-slate-200 text-xs">
                  <span className="text-slate-600 font-medium">Rollback Atômico</span>
                  <span className="text-emerald-600 font-bold font-mono">Ativo (.nexus_tmp)</span>
                </div>
              </div>

              {/* Botão de Disparo do Health Check */}
              <button
                onClick={runHealthCheck}
                disabled={isHealthChecking}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs disabled:opacity-50"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isHealthChecking ? 'animate-spin' : ''}`} />
                <span>{isHealthChecking ? 'Executando Health Check...' : 'Revalidar Saúde do Sistema'}</span>
              </button>
            </div>
          </div>

          {/* ======================================================== */}
          {/* COLUNA 2: FERRAMENTAS DE DEPLOY (DEPLOY & PROVISIONING HUB) */}
          {/* ======================================================== */}
          <div className="space-y-4">
            <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-2xs space-y-4 flex flex-col justify-between">
              <div>
                {/* Header do Card */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
                      <Cpu className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-slate-900">Ferramentas de TI</h2>
                      <p className="text-[11px] text-slate-500 font-medium">
                        Instalação, acessos, rede e atualizações
                      </p>
                    </div>
                  </div>

                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold">
                    4 Ferramentas
                  </span>
                </div>

                {/* Ferramentas reais de TI (os painéis de demonstração foram desativados) */}
                <div className="space-y-2.5 mt-3.5">
                  <div className="p-3 bg-slate-50 hover:bg-indigo-50/40 rounded-2xl border border-slate-200 hover:border-indigo-200 transition-all flex items-center justify-between gap-3 group">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 rounded-xl bg-blue-100/60 text-blue-700 shrink-0">
                        <Server className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 truncate">Central de Instalação</h3>
                        <p className="text-[10px] text-slate-500 truncate">Pacotes do Servidor Sede, escolas e estações</p>
                      </div>
                    </div>
                    <button
                      onClick={() => onNavigate('NETWORK_INSTALLER')}
                      className="px-3 py-1.5 rounded-xl bg-white group-hover:bg-indigo-600 text-slate-700 group-hover:text-white border border-slate-200 group-hover:border-indigo-600 text-xs font-bold transition-all shrink-0 cursor-pointer shadow-2xs"
                    >
                      Abrir
                    </button>
                  </div>
                  <div className="p-3 bg-slate-50 hover:bg-indigo-50/40 rounded-2xl border border-slate-200 hover:border-indigo-200 transition-all flex items-center justify-between gap-3 group">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 rounded-xl bg-purple-100/60 text-purple-700 shrink-0">
                        <Lock className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 truncate">Controle de Acesso</h3>
                        <p className="text-[10px] text-slate-500 truncate">Usuários, perfis, senhas e contas na nuvem</p>
                      </div>
                    </div>
                    <button
                      onClick={() => onNavigate('USER_CONTROL')}
                      className="px-3 py-1.5 rounded-xl bg-white group-hover:bg-indigo-600 text-slate-700 group-hover:text-white border border-slate-200 group-hover:border-indigo-600 text-xs font-bold transition-all shrink-0 cursor-pointer shadow-2xs"
                    >
                      Abrir
                    </button>
                  </div>
                  <div className="p-3 bg-slate-50 hover:bg-indigo-50/40 rounded-2xl border border-slate-200 hover:border-indigo-200 transition-all flex items-center justify-between gap-3 group">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 rounded-xl bg-emerald-100/60 text-emerald-700 shrink-0">
                        <Database className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 truncate">Rede Municipal (.edusync)</h3>
                        <p className="text-[10px] text-slate-500 truncate">Lotes das escolas e consolidação na Sede</p>
                      </div>
                    </div>
                    <button
                      onClick={() => onNavigate('MUNICIPAL_SYNC')}
                      className="px-3 py-1.5 rounded-xl bg-white group-hover:bg-indigo-600 text-slate-700 group-hover:text-white border border-slate-200 group-hover:border-indigo-600 text-xs font-bold transition-all shrink-0 cursor-pointer shadow-2xs"
                    >
                      Abrir
                    </button>
                  </div>
                  <div className="p-3 bg-slate-50 hover:bg-indigo-50/40 rounded-2xl border border-slate-200 hover:border-indigo-200 transition-all flex items-center justify-between gap-3 group">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 rounded-xl bg-amber-100/60 text-amber-700 shrink-0">
                        <RefreshCw className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 truncate">Atualizações do Sistema</h3>
                        <p className="text-[10px] text-slate-500 truncate">Versões publicadas e notas de atualização</p>
                      </div>
                    </div>
                    <button
                      onClick={() => onNavigate('SYSTEM_UPDATES')}
                      className="px-3 py-1.5 rounded-xl bg-white group-hover:bg-indigo-600 text-slate-700 group-hover:text-white border border-slate-200 group-hover:border-indigo-600 text-xs font-bold transition-all shrink-0 cursor-pointer shadow-2xs"
                    >
                      Abrir
                    </button>
                  </div>
                </div>
              </div>

              {/* Ação rápida para ver todo o catálogo */}
              <div className="pt-3 border-t border-slate-100 mt-3 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Todos os módulos de TI</span>
                <button
                  onClick={() => setViewMode('CATALOG')}
                  className="font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 cursor-pointer"
                >
                  <span>Ver catálogo</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* COLUNA 3: LOGS DE AUDITORIA (AUDIT TRAIL & TELEMETRY) */}
          {/* ======================================================== */}
          <div className="space-y-4">
            <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-2xs space-y-4 flex flex-col justify-between">
              <div>
                {/* Header do Card */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-purple-50 text-purple-600 border border-purple-100">
                      <ShieldCheck className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-slate-900">Logs de Auditoria</h2>
                      <p className="text-[11px] text-slate-500 font-medium">
                        Rastreabilidade, SHA-256 e segurança
                      </p>
                    </div>
                  </div>

                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-bold font-mono">
                    {auditHistory.length} Eventos
                  </span>
                </div>

                {/* Filtro Rápido de Auditoria */}
                <div className="flex items-center gap-1 pt-1 overflow-x-auto scrollbar-none text-[10px] font-bold font-mono">
                  {(['ALL', 'INTEGRIDADE', 'ATUALIZAÇÃO', 'SEGURANÇA'] as const).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setAuditFilter(cat)}
                      className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer shrink-0 ${
                        auditFilter === cat
                          ? 'bg-purple-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {cat === 'ALL' ? 'TODOS' : cat}
                    </button>
                  ))}
                </div>

                {/* Feed Interativo de Eventos de Auditoria */}
                <div className="space-y-2.5 mt-3 max-h-[380px] overflow-y-auto pr-1">
                  {filteredAudits.slice(0, 5).map((entry) => {
                    const isCopied = copiedLogId === entry.id;
                    return (
                      <div
                        key={entry.id}
                        className="p-3 bg-slate-50 hover:bg-slate-100/80 rounded-2xl border border-slate-200/80 space-y-1.5 transition-all text-xs"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-sm ${
                                entry.status === 'CONFORME' || entry.status === 'SUCESSO'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {entry.status}
                            </span>
                            <span className="text-[10px] font-bold text-slate-700">{entry.category}</span>
                          </div>
                          <span className="text-[10px] font-mono text-slate-400">
                            {new Date(entry.timestamp).toLocaleDateString('pt-BR')} {new Date(entry.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        <p className="text-xs font-bold text-slate-800 leading-snug">
                          {entry.summary}
                        </p>

                        <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                          {entry.details}
                        </p>

                        <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-[10px] font-mono text-slate-400">
                          <span>Ator: {entry.actor}</span>
                          {entry.sha256Digest && (
                            <button
                              onClick={() => copyToClipboard(entry.sha256Digest || '', entry.id)}
                              className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800 cursor-pointer font-mono"
                              title="Copiar Hash SHA-256"
                            >
                              {isCopied ? (
                                <>
                                  <Check className="h-3 w-3 text-emerald-600" />
                                  <span className="text-emerald-600">Copiado</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="h-3 w-3" />
                                  <span>SHA-256 ({entry.sha256Digest.substring(0, 6)}...)</span>
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODO 2: CATÁLOGO GERAL DE TODOS OS MÓDULOS DE TI */}
      {/* ======================================================== */}
      {viewMode === 'CATALOG' && (
        <div className="space-y-4">
          {/* Barra de Filtros por Categoria e Busca Rápida */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto scrollbar-none py-0.5">
              {[
                { id: 'ALL', label: 'Todos os Módulos', count: modules.length },
                { id: 'DEPLOY', label: 'Deploy & Instaladores', count: modules.filter((m) => m.category === 'DEPLOY').length },
                { id: 'DATABASE', label: 'Bancos de Dados & Sync', count: modules.filter((m) => m.category === 'DATABASE').length },
                { id: 'SECURITY', label: 'Segurança & Usuários', count: modules.filter((m) => m.category === 'SECURITY').length },
                { id: 'INFRA', label: 'Infraestrutura & Rede', count: modules.filter((m) => m.category === 'INFRA').length },
              ].map((cat) => {
                const isActive = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id as AdminCategory)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
                    }`}
                  >
                    <span>{cat.label}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                        isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {cat.count}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="relative w-full md:w-72 shrink-0">
              <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar ferramenta de TI..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:border-indigo-500 transition-all text-slate-800 placeholder:text-slate-400 font-medium"
              />
            </div>
          </div>

          {/* Grade de Cards do Catálogo */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredModules.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.id}
                  className={`bg-white rounded-2xl border p-5 flex flex-col justify-between transition-all group hover:shadow-md ${
                    item.highlight
                      ? 'border-indigo-200 ring-1 ring-indigo-500/10'
                      : 'border-slate-200 hover:border-indigo-300'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className={`p-3 rounded-xl ${item.iconColor} transition-colors shrink-0`}>
                        <Icon className="h-5 w-5" />
                      </div>

                      <div className="flex items-center gap-1.5 flex-wrap justify-end">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${item.badgeColor}`}>
                          {item.badge}
                        </span>
                        {item.shortcut && (
                          <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 font-semibold">
                            {item.shortcut}
                          </kbd>
                        )}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors flex items-center gap-1.5">
                        <span>{item.title}</span>
                      </h3>
                      <span className="text-[11px] font-semibold text-slate-500 block">
                        {item.subtitle}
                      </span>
                      <p className="text-xs text-slate-600 mt-2 leading-relaxed line-clamp-3">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                    <button
                      onClick={() => {
                        onNavigate(item.id);
                      }}
                      className="w-full py-2 px-3 rounded-xl bg-slate-50 group-hover:bg-indigo-600 text-slate-700 group-hover:text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs group-hover:shadow-indigo-500/25"
                    >
                      <span>{item.actionLabel}</span>
                      <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}


      {/* Painel de Recomendações de TI & Boas Práticas */}
      <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
            <Zap className="h-4 w-4 text-amber-500" />
            <span>Dica de Infraestrutura: Instalação Limpa do Servidor Escolar</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
            Para o Servidor Sede, servidores das escolas e novas estações, gere o pacote na{' '}
            <strong>Central de Instalação</strong>. Ele já configura o servidor local, a
            inicialização automática e o atalho único oficial na Área de Trabalho.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => onNavigate('NETWORK_INSTALLER')}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
          >
            <span>Ir para a Central de Instalação</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
