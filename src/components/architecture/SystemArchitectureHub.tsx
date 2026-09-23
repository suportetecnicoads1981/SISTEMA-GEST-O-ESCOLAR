import React, { useState, useMemo } from 'react';
import {
  SYSTEM_MODULES_CATALOG,
  SystemModuleInfo,
  SystemModuleCategory,
  ModuleEngineeringRequest,
  EngineeringRequestType,
  EngineeringRequestPriority,
  EngineeringRequestStatus,
  generateAiEngineeringPrompt,
  saveEngineeringRequest,
  getEngineeringRequests,
  updateEngineeringRequestStatus,
  deleteEngineeringRequest,
  exportEngineeringRequestsMarkdown,
  exportEngineeringRequestsJson,
  downloadArchitectureDiagramHtml,
  downloadArchitectureDiagramJson,
  downloadArchitectureDiagramMarkdown,
  downloadArchitectureDiagramWord,
  copyArchitectureDiagramFormattedForWord,
  MODULES_ROADMAP_AND_FIXES,
  sendArchitectureDiagramToCloud,
} from '../../utils/systemArchitectureDiagram';
import {
  Layers,
  Search,
  Filter,
  Download,
  UploadCloud,
  FileCode,
  FileText,
  CheckCircle2,
  AlertCircle,
  Copy,
  Plus,
  Trash2,
  ExternalLink,
  ChevronRight,
  Shield,
  Server,
  Zap,
  Clock,
  Sparkles,
  RefreshCw,
  GitBranch,
  Database,
  Sliders,
  Terminal,
  FileSpreadsheet,
} from 'lucide-react';
import { confirmDialog, notify } from '../../utils/dialogs';

interface SystemArchitectureHubProps {
  onNavigateToTab?: (tabId: string) => void;
  initialModuleId?: string;
  isModalMode?: boolean;
  onClose?: () => void;
}

export const SystemArchitectureHub: React.FC<SystemArchitectureHubProps> = ({
  onNavigateToTab,
  initialModuleId,
  isModalMode = false,
  onClose,
}) => {
  // Navigation / View Modes
  const [activeView, setActiveView] = useState<'GRAPH' | 'CATALOG' | 'NEW_REQUEST' | 'BACKLOG' | 'WORD_ROADMAP'>(
    initialModuleId ? 'NEW_REQUEST' : 'GRAPH'
  );

  // Copied for Word feedback
  const [copiedForWord, setCopiedForWord] = useState(false);
  const [wordCheckedFixes, setWordCheckedFixes] = useState<Record<string, boolean>>({});

  const handleCopyForWord = async () => {
    const success = await copyArchitectureDiagramFormattedForWord();
    if (success) {
      setCopiedForWord(true);
      setTimeout(() => setCopiedForWord(false), 3000);
    }
  };

  const toggleFixCheck = (fixId: string) => {
    setWordCheckedFixes((prev) => ({
      ...prev,
      [fixId]: !prev[fixId],
    }));
  };

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('TODAS');
  const [selectedTier, setSelectedTier] = useState<number | 'TODOS'>('TODOS');

  // Module Inspection Drawer / Modal
  const [inspectedModule, setInspectedModule] = useState<SystemModuleInfo | null>(
    initialModuleId
      ? SYSTEM_MODULES_CATALOG.find((m) => m.id === initialModuleId) || null
      : null
  );

  // Cloud sync status
  const [isSyncingCloud, setIsSyncingCloud] = useState(false);
  const [cloudSyncResult, setCloudSyncResult] = useState<{ success: boolean; message: string } | null>(null);

  // Engineering Request Form State
  const [requestModuleId, setRequestModuleId] = useState<string>(
    initialModuleId || SYSTEM_MODULES_CATALOG[0].id
  );
  const [requestType, setRequestType] = useState<EngineeringRequestType>('IMPLEMENTATION');
  const [requestPriority, setRequestPriority] = useState<EngineeringRequestPriority>('ALTA');
  const [requestTitle, setRequestTitle] = useState('');
  const [requestDescription, setRequestDescription] = useState('');
  const [requestExpectedBehavior, setRequestExpectedBehavior] = useState('');
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Backlog state
  const [backlog, setBacklog] = useState<ModuleEngineeringRequest[]>(() => getEngineeringRequests());
  const [backlogSearch, setBacklogSearch] = useState('');
  const [backlogFilterStatus, setBacklogFilterStatus] = useState<string>('TODOS');
  const [viewingRequest, setViewingRequest] = useState<ModuleEngineeringRequest | null>(null);

  // Selected module data for the request form
  const currentTargetModule = useMemo(() => {
    return SYSTEM_MODULES_CATALOG.find((m) => m.id === requestModuleId) || SYSTEM_MODULES_CATALOG[0];
  }, [requestModuleId]);

  // Live generated prompt
  const livePrompt = useMemo(() => {
    return generateAiEngineeringPrompt({
      moduleId: currentTargetModule.id,
      moduleName: currentTargetModule.name,
      type: requestType,
      priority: requestPriority,
      title: requestTitle || 'Definir título da solicitação...',
      description: requestDescription || 'Descreva aqui detalhadamente a funcionalidade ou correção solicitada...',
      expectedBehavior: requestExpectedBehavior || 'Critérios de aceitação da funcionalidade...',
      affectedFiles: currentTargetModule.sourceFiles,
      affectedComponents: currentTargetModule.components,
      affectedEntities: currentTargetModule.databaseEntities,
    });
  }, [
    currentTargetModule,
    requestType,
    requestPriority,
    requestTitle,
    requestDescription,
    requestExpectedBehavior,
  ]);

  // Filter modules
  const filteredModules = useMemo(() => {
    const q = (searchTerm || '').toLowerCase().trim();
    return SYSTEM_MODULES_CATALOG.filter((m) => {
      if (!m) return false;
      const matchSearch =
        !q ||
        (m.name && m.name.toLowerCase().includes(q)) ||
        (m.tagline && m.tagline.toLowerCase().includes(q)) ||
        (m.id && m.id.toLowerCase().includes(q)) ||
        (m.sourceFiles && m.sourceFiles.some((f) => f && f.toLowerCase().includes(q))) ||
        (m.databaseEntities && m.databaseEntities.some((e) => e && e.toLowerCase().includes(q)));

      const matchCategory = selectedCategory === 'TODAS' || m.category === selectedCategory;
      const matchTier = selectedTier === 'TODOS' || m.tier === selectedTier;

      return matchSearch && matchCategory && matchTier;
    });
  }, [searchTerm, selectedCategory, selectedTier]);

  // Handlers
  const handleOpenRequestForModule = (mod: SystemModuleInfo) => {
    setRequestModuleId(mod.id);
    setRequestTitle('');
    setRequestDescription('');
    setRequestExpectedBehavior('');
    setActiveView('NEW_REQUEST');
  };

  const handleCopyPrompt = (textToCopy: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(textToCopy);
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 3000);
    }
  };

  const handleSaveRequest = () => {
    if (!requestTitle.trim()) {
      notify('Por favor, informe um título objetivo para a solicitação.');
      return;
    }

    const saved = saveEngineeringRequest({
      moduleId: currentTargetModule.id,
      moduleName: currentTargetModule.name,
      type: requestType,
      priority: requestPriority,
      title: requestTitle,
      description: requestDescription,
      expectedBehavior: requestExpectedBehavior,
      affectedFiles: currentTargetModule.sourceFiles,
      affectedComponents: currentTargetModule.components,
      affectedEntities: currentTargetModule.databaseEntities,
      requesterEmail: 'suportetecnicoads@gmail.com',
    });

    setBacklog(getEngineeringRequests());
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleStatusChange = (id: string, newStatus: EngineeringRequestStatus) => {
    updateEngineeringRequestStatus(id, newStatus);
    setBacklog(getEngineeringRequests());
  };

  const handleDeleteRequest = async (id: string) => {
    if (await confirmDialog('Deseja realmente remover esta solicitação do backlog?')) {
      deleteEngineeringRequest(id);
      setBacklog(getEngineeringRequests());
      if (viewingRequest?.id === id) {
        setViewingRequest(null);
      }
    }
  };

  const handleCloudSync = async () => {
    setIsSyncingCloud(true);
    setCloudSyncResult(null);
    try {
      const res = await sendArchitectureDiagramToCloud('suportetecnicoads@gmail.com');
      setCloudSyncResult({
        success: res.success,
        message: res.message || 'Diagrama sincronizado com sucesso na pasta oficial do Google Drive!',
      });
    } catch (err: any) {
      setCloudSyncResult({
        success: false,
        message: err?.message || 'Falha ao sincronizar com o Google Drive.',
      });
    } finally {
      setIsSyncingCloud(false);
    }
  };

  // Group modules by architectural Tier
  const tierGroups = [
    { tier: 1, name: 'Apresentação & Portais', desc: 'Interfaces executivas, portal do docente e sala de provas discente' },
    { tier: 2, name: 'Gestão Acadêmica & Sala de Aula', desc: 'Secretaria, matrículas, turmas, chamada diária e notas' },
    { tier: 3, name: 'Regulação Legal, BNCC & Censo', desc: 'Educacenso/INEP, 200 dias letivos, habilidades BNCC e certificados' },
    { tier: 4, name: 'Finanças, Rede Municipal & Comunicação', desc: 'PIX, mensalidades, polos remotos (.edusync) e WhatsApp SME' },
    { tier: 5, name: 'Infraestrutura, DevOps & Deploy', desc: 'Controle RBAC, NexusCore, pasta raiz C:\\SucessoEdu e nuvem' },
  ];

  return (
    <div className={`flex flex-col bg-slate-50 text-slate-900 ${isModalMode ? 'h-full' : 'min-h-[85vh]'}`}>
      {/* Top Header & Overview Bar */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 shrink-0 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
                <GitBranch className="h-5 w-5" />
              </span>
              <div>
                <h1 className="text-lg md:text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  Diagrama de Arquitetura de Módulos & Central de Solicitações
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                    v5.4.1-ENTERPRISE
                  </span>
                </h1>
                <p className="text-xs text-slate-500">
                  Estrutura canônica completa de todos os {SYSTEM_MODULES_CATALOG.length} módulos, dependências e gerador cirúrgico de solicitações para IA.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Metrics & Actions */}
          <div className="flex items-center flex-wrap gap-2">
            <div className="hidden lg:flex items-center gap-3 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-slate-700">
                <Layers className="h-3.5 w-3.5 text-indigo-600" />
                <span>{SYSTEM_MODULES_CATALOG.length} Módulos</span>
              </div>
              <span className="text-slate-300">|</span>
              <div className="flex items-center gap-1.5 font-bold text-slate-700">
                <Server className="h-3.5 w-3.5 text-emerald-600" />
                <span>5 Camadas</span>
              </div>
              <span className="text-slate-300">|</span>
              <div className="flex items-center gap-1.5 font-bold text-slate-700">
                <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                <span>{backlog.length} Demandas</span>
              </div>
            </div>

            {/* Cloud Sync Button */}
            <button
              id="btn-diagram-cloud-sync"
              onClick={handleCloudSync}
              disabled={isSyncingCloud}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold border border-indigo-200 transition-all cursor-pointer disabled:opacity-50"
              title="Sincronizar com o Google Drive (suportetecnicoads@gmail.com)"
            >
              {isSyncingCloud ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <UploadCloud className="h-3.5 w-3.5" />}
              <span className="hidden sm:inline">Nuvem Oficial</span>
            </button>

            {/* Salvar no Word (.doc) Button */}
            <button
              id="btn-diagram-download-word"
              onClick={() => downloadArchitectureDiagramWord()}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
              title="Salvar documento oficial formatado para o Microsoft Word (.doc) com tabelas, roadmap e checklist"
            >
              <FileText className="h-3.5 w-3.5" />
              <span>Salvar no Word (.doc)</span>
            </button>

            {/* Copiar para o Word */}
            <button
              id="btn-diagram-copy-word"
              onClick={handleCopyForWord}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                copiedForWord
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200'
              }`}
              title="Copiar com tabelas e estilos para colar direto no Word (Ctrl+V)"
            >
              {copiedForWord ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copiedForWord ? 'Copiado para o Word!' : 'Copiar p/ Word'}</span>
            </button>

            {/* Export HTML Button */}
            <button
              id="btn-diagram-download-html"
              onClick={() => downloadArchitectureDiagramHtml()}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold border border-slate-200 transition-all cursor-pointer"
              title="Salvar visualizador interativo em HTML autônomo offline"
            >
              <Download className="h-3.5 w-3.5 text-slate-600" />
              <span>Baixar HTML</span>
            </button>

            {/* Export Markdown */}
            <button
              id="btn-diagram-download-md"
              onClick={() => downloadArchitectureDiagramMarkdown()}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold border border-slate-200 transition-all cursor-pointer"
              title="Salvar especificação técnica completa em Markdown (.md)"
            >
              <FileCode className="h-3.5 w-3.5 text-slate-600" />
              <span>Baixar MD</span>
            </button>

            {onClose && (
              <button
                onClick={onClose}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold cursor-pointer transition-all"
              >
                Fechar
              </button>
            )}
          </div>
        </div>

        {/* Feedback alert for cloud sync */}
        {cloudSyncResult && (
          <div
            className={`mt-3 p-2.5 rounded-xl text-xs flex items-center justify-between border ${
              cloudSyncResult.success
                ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                : 'bg-amber-50 text-amber-900 border-amber-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {cloudSyncResult.success ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <AlertCircle className="h-4 w-4 text-amber-600" />}
              <span>{cloudSyncResult.message}</span>
            </div>
            <button onClick={() => setCloudSyncResult(null)} className="text-xs font-bold hover:underline">
              Dispensar
            </button>
          </div>
        )}

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-2 mt-4 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveView('WORD_ROADMAP')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
              activeView === 'WORD_ROADMAP'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-200'
            }`}
          >
            <FileText className="h-4 w-4" />
            <span>📄 Análise para Word, Melhorias & Correções</span>
          </button>

          <button
            onClick={() => setActiveView('GRAPH')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
              activeView === 'GRAPH'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <GitBranch className="h-4 w-4" />
            <span>1. Diagrama de Camadas & Fluxo</span>
          </button>

          <button
            onClick={() => setActiveView('CATALOG')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
              activeView === 'CATALOG'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Layers className="h-4 w-4" />
            <span>2. Catálogo Geral ({SYSTEM_MODULES_CATALOG.length} Módulos)</span>
          </button>

          <button
            onClick={() => setActiveView('NEW_REQUEST')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
              activeView === 'NEW_REQUEST'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Sparkles className="h-4 w-4 text-amber-300" />
            <span>3. Solicitar Implementação / Correção para IA</span>
          </button>

          <button
            onClick={() => setActiveView('BACKLOG')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
              activeView === 'BACKLOG'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>4. Backlog de Demandas ({backlog.length})</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-4 md:p-6 overflow-y-auto">
        {/* VIEW 1: INTERACTIVE ARCHITECTURAL TIERS & FLOW GRAPH */}
        {activeView === 'GRAPH' && (
          <div className="space-y-6 max-w-7xl mx-auto">
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-xs text-blue-900 flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-black block text-sm">Arquitetura Desacoplada e Resiliente em 5 Camadas (Tiers)</span>
                Os 17 módulos operam de forma orquestrada com suporte tanto ao modo Web Nuvem quanto ao micro-servidor local autônomo na pasta <code className="bg-blue-100 px-1.5 py-0.5 rounded font-mono font-bold">C:\SucessoEdu</code>. Clique em qualquer módulo para inspecionar seus arquivos, banco de dados ou solicitar modificações imediatas para a IA.
              </div>
            </div>

            {/* Render each of the 5 architectural Tiers */}
            <div className="space-y-6">
              {tierGroups.map((group) => {
                const modulesInTier = SYSTEM_MODULES_CATALOG.filter((m) => m.tier === group.tier);
                return (
                  <div key={group.tier} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-4 border-b border-slate-100 gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className="h-7 w-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs font-black shrink-0">
                          T{group.tier}
                        </span>
                        <div>
                          <h2 className="text-sm md:text-base font-black text-slate-900">{group.name}</h2>
                          <p className="text-xs text-slate-500">{group.desc}</p>
                        </div>
                      </div>
                      <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                        {modulesInTier.length} {modulesInTier.length === 1 ? 'Módulo' : 'Módulos'}
                      </span>
                    </div>

                    {/* Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {modulesInTier.map((mod) => (
                        <div
                          key={mod.id}
                          className="bg-slate-50 hover:bg-white border border-slate-200 hover:border-indigo-400 rounded-xl p-4 transition-all duration-200 hover:shadow-md flex flex-col justify-between group"
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <span className="text-[11px] font-black px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 font-mono">
                                #{mod.number}
                              </span>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                                {mod.status}
                              </span>
                            </div>

                            <h3 className="text-sm font-black text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                              {mod.name}
                            </h3>
                            <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                              {mod.tagline}
                            </p>

                            {/* Dependencies preview */}
                            <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center gap-1.5 flex-wrap text-[10px] text-slate-500">
                              <span className="font-bold text-slate-400">Entidades:</span>
                              <span className="truncate max-w-[170px] text-slate-600">
                                {mod.databaseEntities.slice(0, 2).join(', ')}
                                {mod.databaseEntities.length > 2 && ` +${mod.databaseEntities.length - 2}`}
                              </span>
                            </div>
                          </div>

                          {/* Card Actions */}
                          <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between gap-2">
                            <button
                              onClick={() => setInspectedModule(mod)}
                              className="px-2.5 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold transition-all cursor-pointer"
                            >
                              Detalhes
                            </button>

                            <button
                              onClick={() => handleOpenRequestForModule(mod)}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
                              title="Criar solicitação de engenharia para este módulo"
                            >
                              <Sparkles className="h-3 w-3 text-amber-300" />
                              <span>Solicitar</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* VIEW 2: COMPLETE MODULES CATALOG */}
        {activeView === 'CATALOG' && (
          <div className="space-y-6 max-w-7xl mx-auto">
            {/* Search and Filters Bar */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Pesquisar por nome, funcionalidade, arquivo .tsx ou tabela do banco..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Filter Category */}
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="TODAS">Todas as Categorias</option>
                  <option value="GESTÃO_CORE">Gestão Core</option>
                  <option value="ENSINO_PEDAGÓGICO">Ensino & Pedagógico</option>
                  <option value="CONTROLE_LEGAL">Controle Legal & Censo</option>
                  <option value="INFRAESTRUTURA">Infraestrutura & TI</option>
                  <option value="DEVOPS_NUVEM">DevOps & Nuvem</option>
                </select>

                {/* Filter Tier */}
                <select
                  value={selectedTier}
                  onChange={(e) => setSelectedTier(e.target.value === 'TODOS' ? 'TODOS' : Number(e.target.value))}
                  className="px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="TODOS">Todas as Camadas (Tiers)</option>
                  <option value={1}>Tier 1: Apresentação & Portais</option>
                  <option value={2}>Tier 2: Gestão Acadêmica</option>
                  <option value={3}>Tier 3: Regulação Legal & Censo</option>
                  <option value={4}>Tier 4: Finanças & Rede</option>
                  <option value={5}>Tier 5: Infraestrutura & DevOps</option>
                </select>
              </div>
            </div>

            {/* Modules List Accordion / Full Cards */}
            <div className="space-y-4">
              {filteredModules.map((mod) => (
                <div
                  key={mod.id}
                  className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:border-indigo-300 transition-all"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-mono font-black text-sm shrink-0">
                        {mod.number}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-black text-slate-900">{mod.name}</h3>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                            {mod.id}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{mod.tagline}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                        Tier {mod.tier} - {mod.tierName}
                      </span>
                      <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                        {mod.category}
                      </span>
                      {onNavigateToTab && (
                        <button
                          onClick={() => onNavigateToTab(mod.tabId)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all cursor-pointer"
                        >
                          <span>Abrir Módulo</span>
                          <ExternalLink className="h-3 w-3" />
                        </button>
                      )}
                      <button
                        onClick={() => handleOpenRequestForModule(mod)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
                      >
                        <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                        <span>Solicitar para IA</span>
                      </button>
                    </div>
                  </div>

                  {/* Module Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4 text-xs">
                    {/* Source Files */}
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="font-bold text-slate-900 block mb-2 flex items-center gap-1.5">
                        <FileCode className="h-3.5 w-3.5 text-indigo-600" />
                        Arquivos-Fonte ({mod.sourceFiles.length})
                      </span>
                      <div className="space-y-1 font-mono text-[11px] text-slate-600 max-h-32 overflow-y-auto">
                        {mod.sourceFiles.map((f, i) => (
                          <div key={i} className="truncate" title={f}>
                            • {f}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Key Functions */}
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="font-bold text-slate-900 block mb-2 flex items-center gap-1.5">
                        <Terminal className="h-3.5 w-3.5 text-emerald-600" />
                        Funções Críticas ({mod.keyFunctions.length})
                      </span>
                      <div className="space-y-1 text-[11px] text-slate-600 max-h-32 overflow-y-auto">
                        {mod.keyFunctions.map((fn, i) => (
                          <div key={i} className="line-clamp-2" title={fn}>
                            • {fn}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Database Entities */}
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="font-bold text-slate-900 block mb-2 flex items-center gap-1.5">
                        <Database className="h-3.5 w-3.5 text-blue-600" />
                        Entidades do Banco ({mod.databaseEntities.length})
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {mod.databaseEntities.map((ent, i) => (
                          <span key={i} className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-[10px] font-mono text-slate-700">
                            {ent}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Recent Improvements */}
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="font-bold text-slate-900 block mb-2 flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                        Melhorias Recentes ({mod.recentImprovements.length})
                      </span>
                      <div className="space-y-1 text-[11px] text-slate-600 max-h-32 overflow-y-auto">
                        {mod.recentImprovements.map((imp, i) => (
                          <div key={i} className="line-clamp-2" title={imp}>
                            ✓ {imp}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Maintenance quick guide quote */}
                  <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500 italic">
                    <span className="font-bold text-slate-700 not-italic">Guia de Manutenção: </span>
                    {mod.maintenanceQuickGuide}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VIEW 3: AI ENGINEERING PROMPT GENERATOR */}
        {activeView === 'NEW_REQUEST' && (
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Form Controls */}
            <div className="lg:col-span-6 space-y-4">
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-indigo-600" />
                      Gerador de Solicitações para IA
                    </h2>
                    <p className="text-xs text-slate-500">
                      Configure sua demanda e copie o prompt estruturado cirúrgico para enviar ao Gemini / AI Studio.
                    </p>
                  </div>
                </div>

                {/* Module Selector */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Módulo Alvo da Solicitação:
                  </label>
                  <select
                    value={requestModuleId}
                    onChange={(e) => setRequestModuleId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    {SYSTEM_MODULES_CATALOG.map((m) => (
                      <option key={m.id} value={m.id}>
                        [{m.number}] {m.name} ({m.tagline})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Target Module Preview Badge */}
                <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-100 text-xs flex items-center justify-between">
                  <div>
                    <span className="font-bold text-indigo-950 block">{currentTargetModule.name}</span>
                    <span className="text-[11px] text-indigo-700">
                      Tier {currentTargetModule.tier} ({currentTargetModule.tierName}) • Aba: {currentTargetModule.tabId}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white text-indigo-900 border border-indigo-200">
                    {currentTargetModule.category}
                  </span>
                </div>

                {/* Type and Priority in 2 Columns */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Tipo de Demanda:
                    </label>
                    <select
                      value={requestType}
                      onChange={(e) => setRequestType(e.target.value as EngineeringRequestType)}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                    >
                      <option value="IMPLEMENTATION">🚀 Nova Implementação / Recurso</option>
                      <option value="BUGFIX">🐛 Correção de Bug (Bugfix)</option>
                      <option value="UPDATE">⚡ Atualização / Melhoria Técnica</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nível de Prioridade:
                    </label>
                    <select
                      value={requestPriority}
                      onChange={(e) => setRequestPriority(e.target.value as EngineeringRequestPriority)}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                    >
                      <option value="BAIXA">🟢 Baixa (Ajuste secundário)</option>
                      <option value="MEDIA">🟡 Média (Operação comum)</option>
                      <option value="ALTA">🟠 Alta (Prioritária)</option>
                      <option value="CRITICA">🔴 Crítica / Bloqueante</option>
                    </select>
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Título Claro e Objetivo da Demanda:
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Adicionar exportação em PDF timbrado para o Diário de Classe..."
                    value={requestTitle}
                    onChange={(e) => setRequestTitle(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Descrição Detalhada do que Deve Ser Feito:
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Explique o fluxo desejado, novos botões, filtros, cálculos ou regras de validação necessárias..."
                    value={requestDescription}
                    onChange={(e) => setRequestDescription(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  />
                </div>

                {/* Expected Behavior */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Comportamento Esperado & Critérios de Aceite:
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Ex: Ao clicar no botão 'Imprimir', o modal gera um PDF com todas as 30 linhas da turma, totaliza faltas e exibe o percentual LDB..."
                    value={requestExpectedBehavior}
                    onChange={(e) => setRequestExpectedBehavior(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  />
                </div>

                {/* Action Buttons */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                  <button
                    id="btn-copy-engineering-prompt"
                    onClick={() => handleCopyPrompt(livePrompt)}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black transition-all cursor-pointer shadow-sm"
                  >
                    {copiedPrompt ? <CheckCircle2 className="h-4 w-4 text-emerald-300" /> : <Copy className="h-4 w-4" />}
                    <span>{copiedPrompt ? 'Copiado para a Área de Transferência!' : '📋 Copiar Prompt Pronto para a IA'}</span>
                  </button>

                  <button
                    id="btn-save-engineering-request"
                    onClick={handleSaveRequest}
                    className="flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition-all cursor-pointer"
                    title="Salvar no Backlog de Demandas"
                  >
                    <Plus className="h-4 w-4" />
                    <span>{saveSuccess ? 'Salvo!' : 'Salvar no Backlog'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column: Live Generated Prompt Preview */}
            <div className="lg:col-span-6 space-y-4">
              <div className="bg-slate-900 text-slate-100 rounded-2xl p-5 shadow-md flex flex-col h-full">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
                  <div className="flex items-center gap-2">
                    <Terminal className="h-4 w-4 text-indigo-400" />
                    <span className="text-xs font-black uppercase tracking-wider text-slate-300">
                      Prompt Estruturado em Tempo Real
                    </span>
                  </div>

                  <button
                    onClick={() => handleCopyPrompt(livePrompt)}
                    className="text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-slate-700 transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Copy className="h-3 w-3" />
                    <span>Copiar</span>
                  </button>
                </div>

                <div className="flex-1 bg-slate-950 rounded-xl p-4 overflow-y-auto font-mono text-[11px] text-slate-300 whitespace-pre-wrap leading-relaxed border border-slate-800/80 max-h-[560px]">
                  {livePrompt}
                </div>

                <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                  <span>Envie este prompt no chat com o assistente para execução imediata.</span>
                  <span className="text-emerald-400 font-bold">100% Compatível com AI Studio</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 4: BACKLOG OF ENGINEERING REQUESTS */}
        {activeView === 'BACKLOG' && (
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-indigo-600" />
                  Backlog Oficial de Solicitações de Engenharia
                </h2>
                <p className="text-xs text-slate-500">
                  Acompanhe, altere status, copie prompts e exporte o plano de trabalho da equipe.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => exportEngineeringRequestsMarkdown()}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold border border-slate-200 transition-all cursor-pointer"
                  title="Exportar backlog completo em Markdown"
                >
                  <FileText className="h-3.5 w-3.5 text-slate-600" />
                  <span>Exportar MD</span>
                </button>

                <button
                  onClick={() => exportEngineeringRequestsJson()}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold border border-slate-200 transition-all cursor-pointer"
                  title="Exportar backlog em JSON"
                >
                  <FileCode className="h-3.5 w-3.5 text-slate-600" />
                  <span>Exportar JSON</span>
                </button>

                <button
                  onClick={() => setActiveView('NEW_REQUEST')}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Nova Demanda</span>
                </button>
              </div>
            </div>

            {/* Backlog List */}
            {backlog.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500 space-y-3">
                <Sparkles className="h-10 w-10 text-slate-300 mx-auto" />
                <h3 className="text-sm font-bold text-slate-700">Nenhuma solicitação no backlog ainda</h3>
                <p className="text-xs max-w-md mx-auto">
                  Utilize o Diagrama de Módulos para registrar novas implementações, correções de bugs ou melhorias de arquitetura.
                </p>
                <button
                  onClick={() => setActiveView('NEW_REQUEST')}
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold cursor-pointer hover:bg-indigo-700"
                >
                  Criar Primeira Solicitação
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {backlog.map((req) => (
                  <div
                    key={req.id}
                    className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:border-indigo-300 transition-all"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded font-mono ${
                            req.type === 'IMPLEMENTATION'
                              ? 'bg-blue-100 text-blue-800'
                              : req.type === 'BUGFIX'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {req.type}
                        </span>

                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            req.priority === 'CRITICA'
                              ? 'bg-red-500 text-white'
                              : req.priority === 'ALTA'
                              ? 'bg-amber-100 text-amber-900 border border-amber-200'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {req.priority}
                        </span>

                        <h3 className="text-sm font-black text-slate-900">{req.title}</h3>
                      </div>

                      {/* Status and Controls */}
                      <div className="flex items-center gap-2">
                        <select
                          value={req.status}
                          onChange={(e) => handleStatusChange(req.id, e.target.value as EngineeringRequestStatus)}
                          className={`text-xs font-bold px-2.5 py-1 rounded-lg border cursor-pointer focus:outline-none ${
                            req.status === 'CONCLUIDO'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : req.status === 'EM_ANALISE'
                              ? 'bg-blue-50 text-blue-800 border-blue-300'
                              : 'bg-slate-50 text-slate-700 border-slate-300'
                          }`}
                        >
                          <option value="PENDENTE">🟡 Pendente</option>
                          <option value="EM_ANALISE">🔵 Em Análise / Dev</option>
                          <option value="CONCLUIDO">🟢 Concluído</option>
                        </select>

                        <button
                          onClick={() => handleCopyPrompt(req.generatedPrompt || generateAiEngineeringPrompt(req))}
                          className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold border border-indigo-200 cursor-pointer transition-all flex items-center gap-1"
                          title="Copiar prompt desta demanda"
                        >
                          <Copy className="h-3 w-3" />
                          <span>Copiar Prompt</span>
                        </button>

                        <button
                          onClick={() => handleDeleteRequest(req.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all cursor-pointer"
                          title="Excluir solicitação"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 mt-3">{req.description}</p>

                    {req.expectedBehavior && (
                      <div className="mt-2 text-xs text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <span className="font-bold text-slate-700">Comportamento Esperado: </span>
                        {req.expectedBehavior}
                      </div>
                    )}

                    <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                      <span>Módulo: <strong>{req.moduleName}</strong> ({req.moduleId})</span>
                      <span>Criado em: {new Date(req.createdAt).toLocaleString('pt-BR')}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* VIEW 5: WORD ROADMAP, FUTURE IMPROVEMENTS & FIXES CHECKLIST */}
        {activeView === 'WORD_ROADMAP' && (
          <div className="space-y-6 max-w-7xl mx-auto">
            {/* Executive Hero Banner */}
            <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-blue-800/50 relative overflow-hidden">
              <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="max-w-3xl">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-xs font-black tracking-wider uppercase">
                      Exportação Word & Governança de TI
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold">
                      18 Módulos Mapeados
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight">
                    Diagrama de Módulos & Roteiro de Melhorias e Correções
                  </h2>
                  <p className="text-sm text-blue-100/80 mt-2 leading-relaxed">
                    Documentação canônica completa dos 18 módulos do <strong>SucessoEdu</strong> estruturada com tabelas nativas, fichas técnicas, dependências, melhorias futuras de alta alavancagem e checklist de testes preventivos para análise e edição direta no <strong>Microsoft Word</strong>.
                  </p>
                </div>

                {/* Primary Export Actions */}
                <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
                  <button
                    id="btn-hero-download-word"
                    onClick={() => downloadArchitectureDiagramWord()}
                    className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-blue-500 hover:bg-blue-400 text-white font-black text-sm shadow-lg shadow-blue-500/30 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <FileText className="h-4 w-4" />
                    <span>Salvar no Word (.doc)</span>
                  </button>

                  <button
                    id="btn-hero-copy-word"
                    onClick={handleCopyForWord}
                    className={`flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-sm font-black border transition-all cursor-pointer ${
                      copiedForWord
                        ? 'bg-emerald-500 text-white border-emerald-400 shadow-lg shadow-emerald-500/30'
                        : 'bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-xs'
                    }`}
                  >
                    {copiedForWord ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    <span>{copiedForWord ? 'Copiado para o Word!' : 'Copiar p/ Word (Ctrl+V)'}</span>
                  </button>
                </div>
              </div>

              {/* Quick Metrics Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-white/10">
                <div className="bg-white/5 rounded-2xl p-3 border border-white/5">
                  <span className="text-xs text-blue-200 block font-medium">Módulos Auditados</span>
                  <span className="text-xl font-black text-white">{SYSTEM_MODULES_CATALOG.length}</span>
                </div>
                <div className="bg-white/5 rounded-2xl p-3 border border-white/5">
                  <span className="text-xs text-blue-200 block font-medium">Melhorias Mapeadas</span>
                  <span className="text-xl font-black text-emerald-400">36 Propostas</span>
                </div>
                <div className="bg-white/5 rounded-2xl p-3 border border-white/5">
                  <span className="text-xs text-blue-200 block font-medium">Checklist Preventivo</span>
                  <span className="text-xl font-black text-amber-300">36 Verificações</span>
                </div>
                <div className="bg-white/5 rounded-2xl p-3 border border-white/5">
                  <span className="text-xs text-blue-200 block font-medium">Status Homologado</span>
                  <span className="text-xl font-black text-blue-300">Produção 100%</span>
                </div>
              </div>
            </div>

            {/* Filter and Search Controls */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div className="relative w-full sm:w-80">
                <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filtrar módulos, melhorias ou correções..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="TODAS">Todas as Categorias</option>
                  <option value="GESTÃO_CORE">Gestão Core</option>
                  <option value="ENSINO_PEDAGÓGICO">Ensino Pedagógico</option>
                  <option value="CONTROLE_LEGAL">Controle Legal / LDB</option>
                  <option value="INFRAESTRUTURA">Infraestrutura & TI</option>
                  <option value="DEVOPS_NUVEM">DevOps & Nuvem</option>
                </select>

                <button
                  onClick={() => downloadArchitectureDiagramMarkdown()}
                  className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-200 cursor-pointer flex items-center gap-1.5 shrink-0"
                  title="Baixar versão Markdown (.md)"
                >
                  <FileCode className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Baixar .MD</span>
                </button>
              </div>
            </div>

            {/* Modules Roadmap & Fixes Cards List */}
            <div className="space-y-6">
              {SYSTEM_MODULES_CATALOG.filter((m) => {
                if (!m) return false;
                const term = (searchTerm || '').toLowerCase().trim();
                const matchSearch =
                  !term ||
                  (m.name && m.name.toLowerCase().includes(term)) ||
                  (m.tagline && m.tagline.toLowerCase().includes(term)) ||
                  (m.id && m.id.toLowerCase().includes(term)) ||
                  (m.sourceFiles && m.sourceFiles.some((f) => f && f.toLowerCase().includes(term)));
                const matchCategory = selectedCategory === 'TODAS' || m.category === selectedCategory;
                return matchSearch && matchCategory;
              }).map((mod) => {
                const roadmap = MODULES_ROADMAP_AND_FIXES[mod.id]?.futureImprovements || [];
                const fixes = MODULES_ROADMAP_AND_FIXES[mod.id]?.fixesChecklist || [];

                return (
                  <div
                    key={mod.id}
                    className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs hover:shadow-md transition-all duration-200"
                  >
                    {/* Header Row */}
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-4 mb-4 border-b border-slate-100 gap-4">
                      <div className="flex items-start gap-3">
                        <span className="h-10 w-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-mono font-black text-sm shrink-0 shadow-xs">
                          {mod.number}
                        </span>
                        <div>
                          <div className="flex items-center flex-wrap gap-2">
                            <h3 className="text-base sm:text-lg font-black text-slate-900">{mod.name}</h3>
                            <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-bold border border-slate-200">
                              {mod.id}
                            </span>
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-100">
                              {mod.tierName}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1">{mod.tagline}</p>
                        </div>
                      </div>

                      {/* Top Action Buttons for this Module */}
                      <div className="flex items-center flex-wrap gap-2 shrink-0">
                        {onNavigateToTab && (
                          <button
                            onClick={() => onNavigateToTab(mod.tabId)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
                            title={`Abrir módulo na aba ${mod.tabId}`}
                          >
                            <ExternalLink className="h-3.5 w-3.5 text-slate-500" />
                            <span>Abrir Módulo</span>
                          </button>
                        )}

                        <button
                          onClick={() => handleOpenRequestForModule(mod)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold border border-indigo-200 transition-all cursor-pointer"
                          title="Gerar solicitação de engenharia para a IA"
                        >
                          <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                          <span>Solicitar para IA</span>
                        </button>
                      </div>
                    </div>

                    {/* Quick Metadata: Files & Database */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5 text-xs">
                      <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                        <span className="font-bold text-slate-700 flex items-center gap-1.5 mb-1.5">
                          <FileCode className="h-3.5 w-3.5 text-blue-600" />
                          Arquivos-Fonte Principais:
                        </span>
                        <div className="space-y-1 font-mono text-[11px] text-slate-600">
                          {mod.sourceFiles.slice(0, 3).map((f, i) => (
                            <div key={i} className="truncate">• {f}</div>
                          ))}
                          {mod.sourceFiles.length > 3 && (
                            <span className="text-[10px] text-slate-400 font-sans font-bold">
                              + {mod.sourceFiles.length - 3} outros arquivos
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                        <span className="font-bold text-slate-700 flex items-center gap-1.5 mb-1.5">
                          <Database className="h-3.5 w-3.5 text-indigo-600" />
                          Entidades de Banco de Dados:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {mod.databaseEntities.map((ent, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 rounded-lg bg-white border border-slate-200 text-[11px] font-mono font-bold text-slate-700 shadow-2xs"
                            >
                              {ent}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Section 1: Future Improvements (Roadmap) */}
                    <div className="mb-5">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-black text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                          <Sparkles className="h-4 w-4 text-emerald-600" />
                          Roteiro de Melhorias Futuras Planejadas ({roadmap.length})
                        </span>
                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                          Roadmap de Evolução
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {roadmap.map((item) => (
                          <div
                            key={item.id}
                            className="bg-emerald-50/50 hover:bg-emerald-50 border border-emerald-200/80 rounded-2xl p-4 transition-all"
                          >
                            <div className="flex items-start justify-between gap-2 mb-1.5">
                              <span className="text-xs font-black text-slate-900">{item.title}</span>
                              <span
                                className={`text-[10px] font-black px-2 py-0.5 rounded-md shrink-0 ${
                                  item.priority === 'ALTA'
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                    : item.priority === 'ESTRATEGICA'
                                    ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                    : 'bg-blue-100 text-blue-800 border border-blue-200'
                                }`}
                              >
                                {item.priority}
                              </span>
                            </div>

                            <p className="text-xs text-emerald-950/80 font-medium mb-2">{item.impact}</p>
                            <p className="text-[11px] text-slate-600 leading-relaxed">{item.description}</p>

                            <div className="mt-3 pt-2 border-t border-emerald-200/50 flex items-center justify-between text-[11px]">
                              <span className="text-slate-500 font-medium">Esforço: <strong>{item.technicalEffort}</strong></span>
                              <button
                                onClick={() => {
                                  setRequestModuleId(mod.id);
                                  setRequestType('IMPLEMENTATION');
                                  setRequestPriority(item.priority === 'ALTA' ? 'ALTA' : 'MEDIA');
                                  setRequestTitle(item.title);
                                  setRequestDescription(`${item.impact}\n\nDetalhes: ${item.description}`);
                                  setRequestExpectedBehavior(`A melhoria "${item.title}" deve estar integrada e homologada no módulo ${mod.name}.`);
                                  setActiveView('NEW_REQUEST');
                                }}
                                className="text-xs font-bold text-emerald-700 hover:text-emerald-900 hover:underline cursor-pointer flex items-center gap-1"
                              >
                                <span>Criar Solicitação</span>
                                <ChevronRight className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Section 2: Preventative Fixes Checklist */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-black text-red-800 uppercase tracking-wider flex items-center gap-1.5">
                          <AlertCircle className="h-4 w-4 text-red-600" />
                          Checklist de Pontos de Atenção & Correções Preventivas ({fixes.length})
                        </span>
                        <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                          Auditoria de Qualidade (QA)
                        </span>
                      </div>

                      <div className="space-y-2">
                        {fixes.map((fix) => {
                          const isChecked = !!wordCheckedFixes[fix.id];
                          return (
                            <div
                              key={fix.id}
                              onClick={() => toggleFixCheck(fix.id)}
                              className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                                isChecked
                                  ? 'bg-slate-50 border-slate-200 opacity-60'
                                  : 'bg-red-50/40 hover:bg-red-50 border-red-200/80'
                              }`}
                            >
                              <div className="mt-0.5 shrink-0">
                                <div
                                  className={`h-4 w-4 rounded border flex items-center justify-center transition-all ${
                                    isChecked
                                      ? 'bg-emerald-600 border-emerald-600 text-white'
                                      : 'border-slate-300 bg-white'
                                  }`}
                                >
                                  {isChecked && <CheckCircle2 className="h-3 w-3" />}
                                </div>
                              </div>

                              <div className="flex-1 text-xs">
                                <div className="flex items-center justify-between gap-2 mb-1">
                                  <span
                                    className={`font-black ${
                                      isChecked ? 'line-through text-slate-500' : 'text-slate-900'
                                    }`}
                                  >
                                    {fix.item}
                                  </span>
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-100 text-red-800 border border-red-200 shrink-0">
                                    {fix.category}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-600">{fix.description}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* MODULE DETAIL DRAWER / MODAL */}
      {inspectedModule && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-mono font-black text-sm">
                  {inspectedModule.number}
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">{inspectedModule.name}</h3>
                  <span className="text-xs text-slate-500 font-mono">{inspectedModule.id}</span>
                </div>
              </div>

              <button
                onClick={() => setInspectedModule(null)}
                className="h-8 w-8 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-700 flex items-center justify-center text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto text-xs">
              <div>
                <span className="font-bold text-slate-900 block mb-1">Descrição:</span>
                <p className="text-slate-600">{inspectedModule.tagline}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div>
                  <span className="font-bold text-slate-500 block">Camada Arquitetural:</span>
                  <span className="font-bold text-slate-800">Tier {inspectedModule.tier} - {inspectedModule.tierName}</span>
                </div>
                <div>
                  <span className="font-bold text-slate-500 block">Aba de Navegação:</span>
                  <span className="font-mono font-bold text-indigo-700">{inspectedModule.tabId}</span>
                </div>
              </div>

              <div>
                <span className="font-bold text-slate-900 block mb-1.5 flex items-center gap-1.5">
                  <FileCode className="h-4 w-4 text-indigo-600" />
                  Arquivos-Fonte:
                </span>
                <div className="bg-slate-900 text-slate-200 p-3 rounded-xl font-mono text-[11px] space-y-1">
                  {inspectedModule.sourceFiles.map((f, i) => (
                    <div key={i}>• {f}</div>
                  ))}
                </div>
              </div>

              <div>
                <span className="font-bold text-slate-900 block mb-1.5 flex items-center gap-1.5">
                  <Database className="h-4 w-4 text-blue-600" />
                  Entidades de Banco de Dados:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {inspectedModule.databaseEntities.map((e, i) => (
                    <span key={i} className="px-2 py-1 rounded bg-slate-100 border border-slate-200 font-mono font-bold text-slate-700">
                      {e}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <span className="font-bold text-slate-900 block mb-1.5 flex items-center gap-1.5">
                  <Terminal className="h-4 w-4 text-emerald-600" />
                  Funções Críticas:
                </span>
                <div className="space-y-1.5 text-slate-700">
                  {inspectedModule.keyFunctions.map((fn, i) => (
                    <div key={i} className="p-2 rounded bg-slate-50 border border-slate-100">
                      • {fn}
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-amber-50 border border-amber-100 text-amber-900">
                <span className="font-bold block mb-1">Guia de Manutenção Rápida:</span>
                <p>{inspectedModule.maintenanceQuickGuide}</p>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <button
                onClick={() => setInspectedModule(null)}
                className="px-4 py-2 rounded-xl bg-slate-200 text-slate-800 text-xs font-bold cursor-pointer"
              >
                Voltar
              </button>

              <button
                onClick={() => {
                  const target = inspectedModule;
                  setInspectedModule(null);
                  handleOpenRequestForModule(target);
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black cursor-pointer shadow-xs"
              >
                <Sparkles className="h-4 w-4 text-amber-300" />
                <span>Solicitar Modificação para IA</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
