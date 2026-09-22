import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Download,
  Calendar,
  Layers,
  Zap,
  LayoutDashboard,
  Bell,
  GraduationCap,
  BookOpen,
  Users,
  TrendingUp,
  Award,
  Building2,
  RefreshCw,
  Key,
  X,
  ExternalLink,
  HelpCircle,
  HardDrive,
  FileCode2,
  ChevronRight,
  Database,
  Check,
  Search,
  Filter,
  Printer,
  FileText,
  Clock,
  History,
  GitCompare,
  Terminal,
  Cpu,
} from 'lucide-react';
import { SystemUpdatePackage, SystemUpdateImprovement } from '../../types';
import {
  getAllVersionPackages,
  getCurrentSystemVersion,
  getVersionDetails,
  compareVersions,
  getTargetTabForImprovement,
  downloadReleaseNotesFile,
} from '../../services/versionControlService';

interface VersionControlModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (tabId: string, payload?: any) => void;
  onNavigateToModule?: (tabId: string, payload?: any) => void;
  currentVersion?: string;
  updatePackages?: SystemUpdatePackage[];
  packages?: SystemUpdatePackage[];
  schoolName?: string;
}

type ModalTab = 'IMPROVEMENTS' | 'TIMELINE' | 'COMPARE' | 'RELEASE_NOTES';

export const VersionControlModal: React.FC<VersionControlModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onNavigateToModule,
  currentVersion,
  updatePackages,
  packages,
  schoolName,
}) => {
  const navigateFn = onNavigate || onNavigateToModule || (() => {});
  const effectivePackages = packages || updatePackages;
  const [activeTab, setActiveTab] = useState<ModalTab>('IMPROVEMENTS');
  const [selectedCategory, setSelectedCategory] = useState<string>('TODOS');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedVersionId, setSelectedVersionId] = useState<string>('');
  const [compareFromVersion, setCompareFromVersion] = useState<string>('v5.0.0-ENTERPRISE');
  const [compareToVersion, setCompareToVersion] = useState<string>('');

  const allPackages = useMemo(() => {
    return getAllVersionPackages(effectivePackages);
  }, [effectivePackages]);

  const activeVer = useMemo(() => {
    return getCurrentSystemVersion(currentVersion);
  }, [currentVersion]);

  const activePkg = useMemo(() => {
    if (selectedVersionId) {
      const found = allPackages.find((p) => p.id === selectedVersionId || p.version === selectedVersionId);
      if (found) return found;
    }
    return getVersionDetails(activeVer, allPackages) || allPackages[0];
  }, [selectedVersionId, activeVer, allPackages]);

  // Set default compare version
  const comparison = useMemo(() => {
    const targetVer = compareToVersion || activePkg.version;
    return compareVersions(compareFromVersion, targetVer, allPackages);
  }, [compareFromVersion, compareToVersion, activePkg.version, allPackages]);

  if (!isOpen) return null;

  // Filter improvements of the selected version package
  const filteredImprovements = activePkg.improvements.filter((imp) => {
    if (!imp) return false;
    const matchesCategory =
      selectedCategory === 'TODOS' || imp.category === selectedCategory;
    const q = (searchQuery || '').toLowerCase().trim();
    const matchesSearch =
      !q ||
      (imp.title && imp.title.toLowerCase().includes(q)) ||
      (imp.description && imp.description.toLowerCase().includes(q)) ||
      (imp.category && imp.category.toLowerCase().includes(q));
    return matchesCategory && matchesSearch;
  });

  const categoriesCount = {
    TODOS: activePkg.improvements.length,
    SISTEMA: activePkg.improvements.filter((i) => i.category === 'SISTEMA').length,
    SEGURANCA: activePkg.improvements.filter((i) => i.category === 'SEGURANCA').length,
    PEDAGOGICO: activePkg.improvements.filter((i) => i.category === 'PEDAGOGICO').length,
    SECRETARIA: activePkg.improvements.filter((i) => i.category === 'SECRETARIA').length,
    PERFORMANCE: activePkg.improvements.filter((i) => i.category === 'PERFORMANCE').length,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200 my-4 flex flex-col max-h-[90vh]">
        {/* BANNER SUPERIOR DE CONTROLE DE VERSÕES */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 px-6 sm:px-8 py-6 text-white relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
            title="Fechar Modal de Controle de Versões"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-2xl bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center shrink-0 shadow-inner">
                <Sparkles className="h-6 w-6 text-cyan-300 animate-pulse" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-400 text-slate-950 tracking-wide uppercase flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5 text-slate-950" />
                    Versão Homologada & Ativa
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-indigo-500/30 text-cyan-200 border border-indigo-400/30">
                    {activeVer}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                    Root: C:\SucessoEdu
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  Controle de Versões & Apresentação de Melhorias
                </h2>
                <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                  Histórico oficial de atualizações, novas funcionalidades entregues, auditoria de integridade e registro de melhorias do ecossistema educacional.
                </p>
              </div>
            </div>

            {/* Ações Rápidas de Topo */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => downloadReleaseNotesFile(activePkg, schoolName)}
                className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                title="Baixar Boletim Oficial de Atualização em HTML"
              >
                <Download className="h-3.5 w-3.5 text-cyan-300" />
                <span>Boletim (.html)</span>
              </button>
              <button
                onClick={() => {
                  onNavigate('SYSTEM_UPDATES');
                  onClose();
                }}
                className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition-all flex items-center gap-1.5 cursor-pointer"
                title="Abrir Central de Atualizações na Nuvem"
              >
                <RefreshCw className="h-3.5 w-3.5 text-amber-300" />
                <span>Central Nuvem (OTA)</span>
              </button>
            </div>
          </div>
        </div>

        {/* NAVEGAÇÃO ENTRE ABAS DO MODAL */}
        <div className="bg-slate-100/90 border-b border-slate-200 px-6 sm:px-8 py-2.5 flex items-center justify-between gap-3 overflow-x-auto shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('IMPROVEMENTS')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'IMPROVEMENTS'
                  ? 'bg-white text-indigo-700 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Layers className="h-4 w-4 text-indigo-600" />
              <span>Melhorias Desta Versão ({activePkg.improvements.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('TIMELINE')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'TIMELINE'
                  ? 'bg-white text-indigo-700 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <History className="h-4 w-4 text-purple-600" />
              <span>Histórico de Todas as Versões ({allPackages.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('COMPARE')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'COMPARE'
                  ? 'bg-white text-indigo-700 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <GitCompare className="h-4 w-4 text-blue-600" />
              <span>Comparador de Versões (Diff)</span>
            </button>

            <button
              onClick={() => setActiveTab('RELEASE_NOTES')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'RELEASE_NOTES'
                  ? 'bg-white text-indigo-700 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <FileText className="h-4 w-4 text-emerald-600" />
              <span>Boletim de Atualização</span>
            </button>
          </div>

          {/* Seletor de Versão Ativa / Inspecionada */}
          <div className="flex items-center gap-2 text-xs shrink-0">
            <span className="text-slate-500 font-medium hidden md:inline">Inspecionando:</span>
            <select
              value={activePkg.id}
              onChange={(e) => setSelectedVersionId(e.target.value)}
              className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-800 focus:outline-indigo-600"
            >
              {allPackages.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.version} - {p.releaseDate} {p.version === activeVer ? '★ (Instalada)' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* CONTEÚDO SCROLLÁVEL */}
        <div className="p-6 sm:p-8 space-y-6 overflow-y-auto flex-1">
          {/* ========================================================================= */}
          {/* ABA 1: MELHORIAS DESTA VERSÃO COM FILTROS E BUSCA                         */}
          {/* ========================================================================= */}
          {activeTab === 'IMPROVEMENTS' && (
            <div className="space-y-5">
              {/* Card Resumo do Pacote Selecionado */}
              <div className="bg-gradient-to-r from-indigo-50 via-slate-50 to-blue-50/50 rounded-2xl border border-indigo-200/80 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-black text-indigo-800 bg-white px-2 py-0.5 rounded border border-indigo-300">
                      {activePkg.version}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      Lançado em {activePkg.releaseDate} • {activePkg.sizeFormatted}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                      Severidade: {activePkg.severity}
                    </span>
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900">
                    {activePkg.title}
                  </h3>
                  <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
                    {activePkg.summary || activePkg.description}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-right">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block">
                      Integridade SHA-256
                    </span>
                    <code className="text-[10px] font-mono text-slate-700 bg-white px-2 py-1 rounded border border-slate-200 block truncate max-w-[200px]">
                      {activePkg.sha256Checksum.substring(0, 20)}...
                    </code>
                  </div>
                </div>
              </div>

              {/* Barra de Busca e Filtros por Categoria */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                {/* Categorias com Pílulas e Contadores */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[
                    { id: 'TODOS', label: 'Todas as Áreas', count: categoriesCount.TODOS },
                    { id: 'SISTEMA', label: 'Sistema & Infra', count: categoriesCount.SISTEMA },
                    { id: 'SEGURANCA', label: 'Segurança & Auditoria', count: categoriesCount.SEGURANCA },
                    { id: 'PEDAGOGICO', label: 'Pedagógico & BNCC', count: categoriesCount.PEDAGOGICO },
                    { id: 'SECRETARIA', label: 'Secretaria & Alunos', count: categoriesCount.SECRETARIA },
                    { id: 'PERFORMANCE', label: 'Performance & Cache', count: categoriesCount.PERFORMANCE },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`text-[11px] font-bold px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer ${
                        selectedCategory === cat.id
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      <span>{cat.label}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                          selectedCategory === cat.id
                            ? 'bg-indigo-800 text-white'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {cat.count}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Input de Busca */}
                <div className="relative w-full md:w-64 shrink-0">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Buscar melhoria..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-indigo-600 transition-colors"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Grid de Cards de Melhorias */}
              {filteredImprovements.length === 0 ? (
                <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <HelpCircle className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-600">
                    Nenhuma melhoria encontrada para o filtro selecionado.
                  </p>
                  <button
                    onClick={() => {
                      setSelectedCategory('TODOS');
                      setSearchQuery('');
                    }}
                    className="mt-2 text-xs text-indigo-600 font-bold hover:underline cursor-pointer"
                  >
                    Limpar filtros
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredImprovements.map((imp, idx) => {
                    const target = getTargetTabForImprovement(imp);
                    return (
                      <div
                        key={idx}
                        className="rounded-2xl border border-slate-200 hover:border-indigo-400 bg-white hover:bg-indigo-50/20 p-4.5 transition-all shadow-xs hover:shadow-md flex flex-col justify-between group"
                      >
                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase bg-indigo-50 text-indigo-800 border border-indigo-200">
                              {imp.category}
                            </span>
                            <span className="text-[10px] font-mono text-emerald-600 font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Ativo
                            </span>
                          </div>

                          <h4 className="text-xs font-bold text-slate-900 group-hover:text-indigo-700 transition-colors leading-snug">
                            {imp.title}
                          </h4>

                          <p className="text-[11.5px] text-slate-600 leading-relaxed">
                            {imp.description}
                          </p>
                        </div>

                        <div className="pt-3 border-t border-slate-100 mt-3 flex items-center justify-between gap-2">
                          <span className="text-[10px] font-semibold text-slate-400">
                            Módulo: {target.label}
                          </span>
                          <button
                            onClick={() => {
                              onNavigate(target.tabId);
                              onClose();
                            }}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-indigo-600 text-slate-700 hover:text-white text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                          >
                            <span>Acessar</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* ABA 2: LINHA DO TEMPO & HISTÓRICO DE TODAS AS VERSÕES                     */}
          {/* ========================================================================= */}
          {activeTab === 'TIMELINE' && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <History className="h-4 w-4 text-purple-600" />
                  <span>Registro Cronológico de Todas as Versões Homologadas</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Consulte a evolução contínua da arquitetura do SucessoEdu desde o lançamento inicial.
                </p>
              </div>

              <div className="relative border-l-2 border-indigo-200 ml-4 pl-6 space-y-6">
                {allPackages.map((pkg) => {
                  const isCurrent = pkg.version === activeVer;
                  return (
                    <div key={pkg.id} className="relative group">
                      {/* Ponto da Timeline */}
                      <div
                        className={`absolute -left-[31px] top-1.5 w-4 h-4 rounded-full border-2 ${
                          isCurrent
                            ? 'bg-emerald-500 border-white ring-4 ring-emerald-100'
                            : 'bg-white border-indigo-500'
                        }`}
                      />

                      <div
                        className={`p-5 rounded-2xl border transition-all ${
                          isCurrent
                            ? 'bg-gradient-to-r from-emerald-50/50 to-white border-emerald-300 shadow-xs'
                            : 'bg-white border-slate-200 hover:border-indigo-300'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-xs font-black px-2.5 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200">
                              {pkg.version}
                            </span>
                            <h4 className="text-xs sm:text-sm font-bold text-slate-900">{pkg.title}</h4>
                            {isCurrent && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> Instalada
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-slate-500 font-mono">
                            <span>{pkg.releaseDate}</span>
                            <span>•</span>
                            <span>{pkg.sizeFormatted}</span>
                          </div>
                        </div>

                        <p className="text-xs text-slate-600 mt-2.5 leading-relaxed">
                          {pkg.summary || pkg.description}
                        </p>

                        {/* Lista de Highlights / Principais itens da versão */}
                        <div className="mt-3.5 space-y-1.5">
                          <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 block">
                            Melhorias Homologadas ({pkg.improvements.length}):
                          </span>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {pkg.improvements.slice(0, 4).map((imp, idx) => (
                              <div
                                key={idx}
                                className="text-[11px] text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-100 flex items-start gap-2"
                              >
                                <Check className="w-3 h-3 text-indigo-600 shrink-0 mt-0.5" />
                                <div>
                                  <strong className="text-slate-900 font-bold block">{imp.title}</strong>
                                  <span className="text-slate-500 line-clamp-1">{imp.description}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Ações da versão na Timeline */}
                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono text-slate-400">
                              SHA-256: {pkg.sha256Checksum.substring(0, 16)}...
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setSelectedVersionId(pkg.id);
                                setActiveTab('IMPROVEMENTS');
                              }}
                              className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                            >
                              <span>Ver Todas as {pkg.improvements.length} Melhorias</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => downloadReleaseNotesFile(pkg, schoolName)}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
                              title="Baixar Boletim HTML"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* ABA 3: COMPARADOR DE VERSÕES (DIFF)                                       */}
          {/* ========================================================================= */}
          {activeTab === 'COMPARE' && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <GitCompare className="h-4 w-4 text-blue-600" />
                  <span>Comparador Inteligente de Versões (Diff)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Veja exatamente quais recursos e melhorias foram implementados entre a versão de partida e a versão de destino.
                </p>
              </div>

              {/* Seletores de Versão de Comparação */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Versão de Partida (Anterior):
                  </label>
                  <select
                    value={compareFromVersion}
                    onChange={(e) => setCompareFromVersion(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-indigo-600"
                  >
                    {allPackages.map((p) => (
                      <option key={p.id} value={p.version}>
                        {p.version} ({p.releaseDate})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Versão de Destino (Atual / Mais Recente):
                  </label>
                  <select
                    value={compareToVersion || activeVer}
                    onChange={(e) => setCompareToVersion(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-indigo-600"
                  >
                    {allPackages.map((p) => (
                      <option key={p.id} value={p.version}>
                        {p.version} ({p.releaseDate}) {p.version === activeVer ? '★ (Ativa)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Resultado do Comparador */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <div className="text-xs font-bold text-slate-800">
                    Novas Melhorias e Recursos Identificados:
                  </div>
                  <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                    {comparison.totalNewImprovements} melhorias encontradas
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {comparison.newImprovements.map((imp, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-white border border-slate-200 text-xs space-y-1.5 shadow-2xs hover:border-indigo-300 transition"
                    >
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-indigo-100 text-indigo-800">
                          {imp.category}
                        </span>
                        <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Novo Recurso
                        </span>
                      </div>
                      <strong className="text-slate-900 font-bold block pt-1">{imp.title}</strong>
                      <p className="text-slate-600 text-[11.5px] leading-relaxed">{imp.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* ABA 4: BOLETIM OFICIAL DE ATUALIZAÇÃO (PREVIEW & IMPRESSÃO)               */}
          {/* ========================================================================= */}
          {activeTab === 'RELEASE_NOTES' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-emerald-600" />
                    <span>Boletim Oficial de Atualização e Mudanças</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Documento formal emitido para auditoria de software, órgãos reguladores e equipe de TI.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => downloadReleaseNotesFile(activePkg, schoolName)}
                    className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Baixar Relatório (.html)</span>
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Imprimir</span>
                  </button>
                </div>
              </div>

              {/* Visualização de Documento Formatado */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6 text-xs text-slate-800">
                <div className="border-b-2 border-indigo-600 pb-4 flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 block">
                      SucessoEdu Gestão Educacional
                    </span>
                    <h2 className="text-lg font-black text-slate-900 mt-1">
                      Boletim de Atualização Oficial • Versão {activePkg.version}
                    </h2>
                    <p className="text-xs text-slate-600 mt-0.5">{activePkg.title}</p>
                  </div>
                  <div className="text-right font-mono text-[11px] text-slate-500">
                    <div>Data: {activePkg.releaseDate}</div>
                    <div>Tamanho: {activePkg.sizeFormatted}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-white p-3.5 rounded-xl border border-slate-200 text-[11px]">
                  <div>
                    <span className="text-slate-400 font-bold block text-[10px] uppercase">Severidade</span>
                    <span className="font-bold text-indigo-700">{activePkg.severity}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold block text-[10px] uppercase">Plataforma</span>
                    <span className="font-bold text-slate-800">Windows / Linux / Offline</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold block text-[10px] uppercase">Diretório</span>
                    <span className="font-bold text-slate-800 font-mono">C:\SucessoEdu</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold block text-[10px] uppercase">Assinatura</span>
                    <span className="font-mono text-slate-700">{activePkg.sha256Checksum.substring(0, 12)}...</span>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 text-xs mb-2 uppercase tracking-wide">
                    Descrição do Pacote
                  </h4>
                  <p className="text-slate-700 leading-relaxed bg-white p-3.5 rounded-xl border border-slate-200">
                    {activePkg.description || activePkg.summary}
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 text-xs mb-2 uppercase tracking-wide">
                    Quadro de Melhorias e Mudanças Homologadas ({activePkg.improvements.length})
                  </h4>
                  <div className="space-y-2">
                    {activePkg.improvements.map((imp, idx) => (
                      <div
                        key={idx}
                        className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase text-indigo-600">
                            {idx + 1}. {imp.category}
                          </span>
                          <span className="text-[10px] text-emerald-600 font-bold">✔ Homologado</span>
                        </div>
                        <div className="font-bold text-slate-900">{imp.title}</div>
                        <p className="text-slate-600 text-[11px] leading-relaxed">{imp.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RODAPÉ DO MODAL */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 sm:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <HardDrive className="h-4 w-4 text-slate-400" />
            <span>
              Instalação Raiz: <code className="text-slate-800 font-bold font-mono">C:\SucessoEdu</code>
            </span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto flex-wrap">
            <button
              onClick={() => {
                onNavigate('SYSTEM_UPDATES');
                onClose();
              }}
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5 text-indigo-600" />
              <span>Ver Pacotes na Nuvem</span>
            </button>

            <button
              onClick={onClose}
              className="flex-1 sm:flex-none px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-300" />
              <span>Concluir e Continuar</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
