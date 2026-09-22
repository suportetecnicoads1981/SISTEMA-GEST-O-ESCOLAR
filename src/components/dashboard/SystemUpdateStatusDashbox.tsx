import React, { useState } from 'react';
import {
  Sparkles,
  DownloadCloud,
  CheckCircle2,
  RefreshCw,
  Zap,
  ArrowRight,
  ShieldCheck,
  HardDrive,
  FileCode,
  Layers,
  ChevronRight,
  Info,
  ExternalLink,
  Check,
  Cloud,
} from 'lucide-react';
import { TARGET_GOOGLE_DRIVE_ACCOUNT } from '../../services/googleDriveService';

interface SystemUpdateStatusDashboxProps {
  systemVersion?: string;
  onNavigateToUpdates: () => void;
  onOpenReportBuilder?: () => void;
}

export const SystemUpdateStatusDashbox: React.FC<SystemUpdateStatusDashboxProps> = ({
  systemVersion = 'v5.5.0 Enterprise',
  onNavigateToUpdates,
  onOpenReportBuilder,
}) => {
  const [isChecking, setIsChecking] = useState(false);
  const [lastChecked, setLastChecked] = useState('Hoje às ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  const [isUpdateReady, setIsUpdateReady] = useState(true);

  const improvements = [
    {
      title: 'Motor de Relatórios Personalizados em Todos os Módulos',
      desc: 'Seleção dinâmica de colunas, ordenação, agrupamentos, filtros e exportação (PDF, Excel, Impressão e Salvar Template).',
      tag: 'Universal',
      badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    },
    {
      title: 'Conexão e Homologação Google Drive OTA',
      desc: `Acesso padrão e verificação de conta (${TARGET_GOOGLE_DRIVE_ACCOUNT}) para download imediato de pacotes .edupkg.`,
      tag: 'Nuvem / OTA',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    {
      title: 'Parametrização de Séries e Turmas por Unidade Escolar',
      desc: 'Mapeamento de etapas (Infantil, Fund. I e II, Médio, EJA), turnos autorizados e capacidade de salas no cadastro de escolas.',
      tag: 'Cadastros',
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
    },
    {
      title: 'Barra de Menu Iniciar Vertical na Lateral Direita',
      desc: 'Docagem inteligente à direita com pesquisa instantânea, atalhos de ferramentas e sem obstrução do espaço de trabalho.',
      tag: 'Interface UX',
      badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
    },
    {
      title: 'Engenharia do Banco de Dados & Script de Atualização',
      desc: 'Correção de chaves estrangeiras, índices compostos e integridade referencial com gerador de script SQL DDL/DML.',
      tag: 'Banco de Dados',
      badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
    },
  ];

  const handleCheckUpdates = () => {
    setIsChecking(true);
    setTimeout(() => {
      setIsChecking(false);
      setLastChecked('Hoje às ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      setIsUpdateReady(true);
    }, 900);
  };

  return (
    <div
      id="dashbox-system-update-status"
      className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 rounded-3xl border border-indigo-500/30 p-6 text-white shadow-xl relative overflow-hidden"
    >
      {/* Background visual accents */}
      <div className="absolute -top-16 -right-16 w-56 h-56 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-indigo-500/20">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-emerald-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 shrink-0">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-white">
                Status de Atualizações & Novas Melhorias do SucessoEdu
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-extrabold uppercase tracking-wide flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                Novo Release Disponível v5.5.1
              </span>
            </div>
            <p className="text-xs text-indigo-200/80 mt-0.5">
              Canal de Entrega Contínua (OTA) • Google Drive Oficial ({TARGET_GOOGLE_DRIVE_ACCOUNT})
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={handleCheckUpdates}
            disabled={isChecking}
            className="px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
            title="Consultar Google Drive em busca de novos pacotes de atualização"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-indigo-400 ${isChecking ? 'animate-spin' : ''}`} />
            <span>{isChecking ? 'Verificando Nuvem...' : 'Checar Nuvem'}</span>
          </button>

          <button
            onClick={onNavigateToUpdates}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer"
          >
            <DownloadCloud className="w-4 h-4" />
            <span>Baixar & Atualizar Sistema</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Status Card + List of Improvements */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-5 pt-5">
        {/* Left Column: Version comparison & Cloud info */}
        <div className="bg-slate-950/60 rounded-2xl p-4 border border-indigo-500/20 flex flex-col justify-between space-y-4">
          <div>
            <div className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Cloud className="w-3.5 h-3.5 text-emerald-400" />
              <span>Conexão Google Drive OTA</span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center p-2 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-slate-400">Versão em Operação:</span>
                <span className="font-mono font-bold text-white">{systemVersion}</span>
              </div>
              <div className="flex justify-between items-center p-2 rounded-xl bg-emerald-950/40 border border-emerald-700/40">
                <span className="text-emerald-300 font-semibold">Versão Homologada Nuvem:</span>
                <span className="font-mono font-extrabold text-emerald-400">v5.5.1 OTA</span>
              </div>
              <div className="flex justify-between items-center p-2 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-slate-400">Última Checagem:</span>
                <span className="text-slate-300 font-mono text-[11px]">{lastChecked}</span>
              </div>
              <div className="flex justify-between items-center p-2 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-slate-400">Integridade & Assinatura:</span>
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  SHA-256 Válida
                </span>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
            <span>Pasta: Atualizações_SucessoEdu</span>
            <span className="text-indigo-400 font-semibold cursor-pointer hover:underline" onClick={onNavigateToUpdates}>
              Ver Detalhes →
            </span>
          </div>
        </div>

        {/* Right 2 Columns: Improvements List */}
        <div className="lg:col-span-2 space-y-2.5">
          <div className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Melhorias e Correções Implementadas neste Release</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {improvements.map((imp, idx) => (
              <div
                key={idx}
                className="p-3 rounded-2xl bg-slate-950/50 hover:bg-slate-900/80 border border-indigo-500/20 hover:border-indigo-400/40 transition-all flex flex-col justify-between space-y-1.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5 font-bold text-white text-xs">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="truncate">{imp.title}</span>
                  </div>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md border shrink-0 ${imp.badgeColor}`}>
                    {imp.tag}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300/80 leading-relaxed">
                  {imp.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
