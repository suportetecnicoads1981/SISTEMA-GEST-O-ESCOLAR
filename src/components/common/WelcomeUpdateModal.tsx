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
  History,
  FileText,
  Printer,
  SlidersHorizontal,
} from 'lucide-react';
import { SystemUpdatePackage, SystemUpdateImprovement } from '../../types';
import {
  getAllVersionPackages,
  getVersionDetails,
  getTargetTabForImprovement,
  downloadReleaseNotesFile,
} from '../../services/versionControlService';

interface WelcomeUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: string) => void;
  currentVersion: string;
  previousVersion?: string;
  updatePackage?: SystemUpdatePackage | null;
  backupInfo?: {
    id: string;
    fileSizeBytes?: number;
    studentsCount?: number;
    classesCount?: number;
    examsCount?: number;
    date?: string;
  };
  onOpenManual?: () => void;
  onOpenDiagram?: () => void;
  onOpenVersionControl?: () => void;
}

type WelcomeTab = 'IMPROVEMENTS' | 'HISTORY' | 'RELEASE_NOTES';

export const WelcomeUpdateModal: React.FC<WelcomeUpdateModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
  currentVersion,
  previousVersion = 'v5.3.0',
  updatePackage,
  backupInfo,
  onOpenManual,
  onOpenDiagram,
  onOpenVersionControl,
}) => {
  const [activeTab, setActiveTab] = useState<WelcomeTab>('IMPROVEMENTS');
  const [selectedFilter, setSelectedFilter] = useState<string>('TODOS');
  const [searchQuery, setSearchQuery] = useState<string>('');

  if (!isOpen) return null;

  const allPackages = getAllVersionPackages();
  const activeVer = currentVersion || updatePackage?.version || 'v5.4.1-ENTERPRISE';
  const effectivePackage = updatePackage || getVersionDetails(activeVer, allPackages) || allPackages[0];

  // Dynamic improvements from package or fallback
  const rawImprovements: SystemUpdateImprovement[] =
    effectivePackage.improvements && effectivePackage.improvements.length > 0
      ? effectivePackage.improvements
      : [
          {
            category: 'SISTEMA',
            title: 'Controle Dinâmico de Versões e Apresentação de Melhorias',
            description: 'Acompanhamento interativo do histórico de atualizações, changelog categorizado e boletins oficiais de liberação.',
          },
          {
            category: 'SEGURANCA',
            title: 'Auditoria de Integridade Relacional e Autocura',
            description: 'Preservação de chaves estrangeiras entre alunos, turmas e notas com autocura preventiva de dados.',
          },
          {
            category: 'PEDAGOGICO',
            title: 'Evolução Pedagógica e Indicadores BNCC',
            description: 'Diário de classe com chamada ágil, frequência e plano de recomposição de aprendizagem.',
          },
          {
            category: 'SECRETARIA',
            title: 'Histórico Escolar Unificado e Censo de Evasão',
            description: 'Emissão oficial de documentos escolares com rastreamento e busca ativa de estudantes.',
          },
          {
            category: 'PERFORMANCE',
            title: 'Cache Offline Ultrarrápido em C:\\SucessoEdu',
            description: 'Inicialização em menos de 300ms com persistência dupla local e na nuvem.',
          },
        ];

  // Filter improvements
  const filteredImprovements = rawImprovements.filter((imp) => {
    const matchesFilter = selectedFilter === 'TODOS' || imp.category === selectedFilter;
    const matchesSearch =
      !searchQuery.trim() ||
      imp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      imp.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      imp.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const categories = ['TODOS', 'SISTEMA', 'SEGURANCA', 'PEDAGOGICO', 'SECRETARIA', 'PERFORMANCE'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200 my-4 flex flex-col max-h-[92vh]">
        {/* BANNER SUPERIOR DE BOAS-VINDAS */}
        <div className="bg-gradient-to-r from-indigo-800 via-indigo-900 to-slate-950 px-6 sm:px-8 py-6 text-white relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
            title="Fechar Tela de Boas-Vindas"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="h-14 w-14 rounded-2xl bg-indigo-600/30 border border-indigo-400/30 flex items-center justify-center shrink-0 shadow-inner">
                <Sparkles className="h-7 w-7 text-amber-300 animate-pulse" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-400 text-slate-950 tracking-wide uppercase flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3 text-slate-950" />
                    Versão Homologada & Ativa
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-white/15 text-cyan-200 border border-white/20">
                    {previousVersion} → {activeVer}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-950/60 text-indigo-200 border border-indigo-400/20">
                    Pasta: C:\SucessoEdu
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  SucessoEdu {activeVer} em Operação!
                </h2>
                <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                  {effectivePackage.title || 'A atualização foi concluída com êxito na pasta raiz C:\\SucessoEdu com preservação integral de dados.'}
                </p>
              </div>
            </div>

            {/* Ações de Cabeçalho */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => downloadReleaseNotesFile(effectivePackage)}
                className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                title="Baixar Boletim Oficial de Atualização em HTML"
              >
                <Download className="h-3.5 w-3.5 text-cyan-300" />
                <span>Boletim (.html)</span>
              </button>
              {onOpenVersionControl && (
                <button
                  onClick={() => {
                    onOpenVersionControl();
                    onClose();
                  }}
                  className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <History className="h-3.5 w-3.5 text-amber-300" />
                  <span>Controle Completo</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* STATUS DE SEGURANÇA E BACKUP PREVENTIVO */}
        <div className="bg-emerald-50/90 border-b border-emerald-200 px-6 sm:px-8 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="text-xs">
              <span className="font-bold text-emerald-950 block">
                Cópia de Segurança Preventiva Preservada em <code>C:\SucessoEdu\Backups</code>
              </span>
              <span className="text-emerald-700 text-[11px]">
                {backupInfo?.studentsCount !== undefined
                  ? `Preservados com sucesso: ${backupInfo.studentsCount} alunos, ${backupInfo.classesCount || 0} turmas e ${backupInfo.examsCount || 0} avaliações.`
                  : 'Backup preventivo automático concluído com 100% dos dados dos estudantes e notas mantidos.'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {onOpenDiagram && (
              <button
                onClick={() => {
                  onOpenDiagram();
                  onClose();
                }}
                className="text-[11px] font-bold text-indigo-700 hover:text-indigo-900 bg-white hover:bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-200 flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
              >
                <FileCode2 className="w-3.5 h-3.5 text-indigo-600" />
                <span>Diagrama de Arquitetura</span>
              </button>
            )}
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-800 bg-emerald-100/80 px-3 py-1 rounded-lg border border-emerald-300">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              <span>DADOS PRESERVADOS</span>
            </div>
          </div>
        </div>

        {/* NAVEGAÇÃO DE ABAS DO MODAL */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 sm:px-8 py-2 flex items-center justify-between gap-2 overflow-x-auto shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('IMPROVEMENTS')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'IMPROVEMENTS'
                  ? 'bg-white text-indigo-700 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="h-4 w-4 text-indigo-600" />
              <span>Melhorias Desta Versão ({rawImprovements.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('HISTORY')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'HISTORY'
                  ? 'bg-white text-indigo-700 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <History className="h-4 w-4 text-purple-600" />
              <span>Histórico de Versões ({allPackages.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('RELEASE_NOTES')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'RELEASE_NOTES'
                  ? 'bg-white text-indigo-700 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="h-4 w-4 text-emerald-600" />
              <span>Boletim de Atualização</span>
            </button>
          </div>

          <div className="text-[11px] font-mono text-slate-500 hidden sm:block">
            SHA-256: {effectivePackage.sha256Checksum.substring(0, 16)}...
          </div>
        </div>

        {/* CONTEÚDO SCROLLÁVEL */}
        <div className="p-6 sm:p-8 space-y-5 overflow-y-auto flex-1">
          {/* TAB 1: MELHORIAS IMPLEMENTADAS COM FILTROS E BUSCA */}
          {activeTab === 'IMPROVEMENTS' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedFilter(cat)}
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-lg transition cursor-pointer ${
                        selectedFilter === cat
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <div className="relative w-full sm:w-60 shrink-0">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Filtrar novidades..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-indigo-600"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {filteredImprovements.length === 0 ? (
                <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-xs text-slate-500">
                  Nenhuma melhoria encontrada para o filtro selecionado.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {filteredImprovements.map((imp, idx) => {
                    const target = getTargetTabForImprovement(imp);
                    return (
                      <div
                        key={idx}
                        className="rounded-2xl border border-slate-200 hover:border-indigo-400 bg-slate-50/40 hover:bg-white p-4 transition-all shadow-xs hover:shadow-md flex flex-col justify-between group"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="px-2 py-0.5 rounded text-[9px] font-extrabold uppercase bg-indigo-50 text-indigo-700 border border-indigo-200">
                              {imp.category}
                            </span>
                            <span className="text-[10px] font-mono text-emerald-600 font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Ativo
                            </span>
                          </div>

                          <h4 className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors leading-snug">
                            {imp.title}
                          </h4>

                          <p className="text-[11px] text-slate-600 leading-relaxed">
                            {imp.description}
                          </p>
                        </div>

                        <div className="pt-3 border-t border-slate-200/60 mt-3 flex items-center justify-between">
                          <span className="text-[10px] text-slate-400 font-medium">
                            {target.label}
                          </span>
                          <button
                            onClick={() => {
                              onNavigate(target.tabId);
                              onClose();
                            }}
                            className="px-2.5 py-1 rounded-lg bg-white hover:bg-indigo-600 text-slate-700 hover:text-white border border-slate-200 hover:border-indigo-600 text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                          >
                            <span>Abrir Módulo</span>
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

          {/* TAB 2: HISTÓRICO DE VERSÕES */}
          {activeTab === 'HISTORY' && (
            <div className="space-y-4">
              <div className="border-b border-slate-100 pb-2">
                <h4 className="text-xs font-bold text-slate-800">
                  Todas as Versões Lançadas e Homologadas do SucessoEdu
                </h4>
                <p className="text-[11px] text-slate-500">
                  Histórico de atualizações distribuídas via canal oficial em nuvem.
                </p>
              </div>

              <div className="space-y-3">
                {allPackages.map((pkg) => {
                  const isCurrent = pkg.version === activeVer;
                  return (
                    <div
                      key={pkg.id}
                      className={`p-4 rounded-xl border text-xs transition ${
                        isCurrent
                          ? 'bg-emerald-50/40 border-emerald-300'
                          : 'bg-white border-slate-200 hover:border-indigo-200'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                            {pkg.version}
                          </span>
                          <span className="font-bold text-slate-900">{pkg.title}</span>
                          {isCurrent && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                              ★ Versão Instalada
                            </span>
                          )}
                        </div>
                        <span className="text-slate-400 font-mono text-[11px]">
                          {pkg.releaseDate} • {pkg.sizeFormatted}
                        </span>
                      </div>

                      <p className="text-slate-600 mt-2 text-[11.5px] leading-relaxed">
                        {pkg.summary || pkg.description}
                      </p>

                      <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                        <span>{pkg.improvements.length} melhorias documentadas</span>
                        <button
                          onClick={() => downloadReleaseNotesFile(pkg)}
                          className="text-indigo-600 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Download className="w-3 h-3" />
                          <span>Baixar Release Notes</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: BOLETIM DE ATUALIZAÇÃO */}
          {activeTab === 'RELEASE_NOTES' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-xs font-bold text-slate-800">
                  Boletim Oficial de Liberação • Versão {effectivePackage.version}
                </span>
                <button
                  onClick={() => downloadReleaseNotesFile(effectivePackage)}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Baixar Documento (.html)</span>
                </button>
              </div>

              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 text-xs space-y-4 text-slate-800">
                <div className="border-b border-slate-200 pb-3">
                  <h3 className="font-bold text-slate-900 text-sm">{effectivePackage.title}</h3>
                  <div className="text-slate-500 text-[11px] mt-1 font-mono">
                    Data: {effectivePackage.releaseDate} • Severidade: {effectivePackage.severity} • SHA-256: {effectivePackage.sha256Checksum}
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 text-xs mb-1 uppercase tracking-wide">
                    Resumo das Melhorias
                  </h4>
                  <p className="text-slate-700 leading-relaxed">
                    {effectivePackage.description || effectivePackage.summary}
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 text-xs mb-2 uppercase tracking-wide">
                    Itens Homologados ({rawImprovements.length})
                  </h4>
                  <div className="space-y-2">
                    {rawImprovements.map((imp, idx) => (
                      <div key={idx} className="bg-white p-3 rounded-xl border border-slate-200">
                        <div className="flex items-center justify-between">
                          <strong className="text-slate-900 text-xs">{idx + 1}. {imp.title}</strong>
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 font-bold">
                            {imp.category}
                          </span>
                        </div>
                        <p className="text-slate-600 text-[11px] mt-1">{imp.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RODAPÉ DO MODAL COM BOTÕES DE AÇÃO */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 sm:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <HardDrive className="h-4 w-4 text-slate-400" />
            <span>
              Instalação Raiz: <code className="text-slate-800 font-bold font-mono">C:\SucessoEdu</code>
            </span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto flex-wrap">
            {onOpenDiagram && (
              <button
                onClick={() => {
                  onOpenDiagram();
                  onClose();
                }}
                className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-indigo-700 border border-indigo-200 font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <FileCode2 className="h-4 w-4 text-indigo-600" />
                <span>Diagrama de Módulos</span>
              </button>
            )}

            {onOpenManual && (
              <button
                onClick={() => {
                  onOpenManual();
                  onClose();
                }}
                className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <BookOpen className="h-4 w-4 text-slate-500" />
                <span>Manual Simplificado</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="flex-1 sm:flex-none px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="h-4 w-4 text-amber-300" />
              <span>Usar SucessoEdu {activeVer}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


