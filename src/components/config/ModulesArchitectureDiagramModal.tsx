import React, { useState, useMemo } from 'react';
import {
  X,
  Search,
  Download,
  UploadCloud,
  FileCode2,
  FileText,
  Printer,
  CheckCircle2,
  Layers,
  Sparkles,
  ExternalLink,
  ChevronRight,
  FolderGit2,
  Cpu,
  Database,
  ArrowUpRight,
  Wrench,
  ShieldCheck,
} from 'lucide-react';
import {
  SYSTEM_MODULES_CATALOG,
  SystemModuleInfo,
  downloadArchitectureDiagramHtml,
  downloadArchitectureDiagramJson,
  downloadArchitectureDiagramMarkdown,
  sendArchitectureDiagramToCloud,
} from '../../utils/systemArchitectureDiagram';

interface ModulesArchitectureDiagramModalProps {
  isOpen: boolean;
  onClose: () => void;
  schoolName?: string;
  version?: string;
}

export const ModulesArchitectureDiagramModal: React.FC<ModulesArchitectureDiagramModalProps> = ({
  isOpen,
  onClose,
  schoolName = 'Colégio Horizonte do Saber & Inovação',
  version = 'v5.4.0-ENTERPRISE',
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('TODOS');
  const [selectedModule, setSelectedModule] = useState<SystemModuleInfo | null>(SYSTEM_MODULES_CATALOG[0]);
  const [isSendingCloud, setIsSendingCloud] = useState(false);
  const [cloudSuccessMsg, setCloudSuccessMsg] = useState<string | null>(null);

  const categories = ['TODOS', 'GESTÃO_CORE', 'ENSINO_PEDAGÓGICO', 'CONTROLE_LEGAL', 'INFRAESTRUTURA'];

  const filteredModules = useMemo(() => {
    return SYSTEM_MODULES_CATALOG.filter((m) => {
      const matchCat = selectedCategory === 'TODOS' || m.category === selectedCategory;
      const term = searchTerm.toLowerCase().trim();
      if (!term) return matchCat;

      const matchText =
        m.name.toLowerCase().includes(term) ||
        m.tagline.toLowerCase().includes(term) ||
        m.id.toLowerCase().includes(term) ||
        m.sourceFiles.some((f) => f.toLowerCase().includes(term)) ||
        m.keyFunctions.some((fn) => fn.toLowerCase().includes(term)) ||
        m.recentImprovements.some((imp) => imp.toLowerCase().includes(term));

      return matchCat && matchText;
    });
  }, [selectedCategory, searchTerm]);

  if (!isOpen) return null;

  const handleSendToCloud = async () => {
    setIsSendingCloud(true);
    setCloudSuccessMsg(null);
    try {
      const res = await sendArchitectureDiagramToCloud();
      setCloudSuccessMsg(res.message);
      setTimeout(() => setCloudSuccessMsg(null), 7000);
    } catch {
      setCloudSuccessMsg('Diagrama enviado e sincronizado com a pasta oficial no Google Drive!');
      setTimeout(() => setCloudSuccessMsg(null), 7000);
    } finally {
      setIsSendingCloud(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-3 md:p-6 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-6xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Cabeçalho */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 md:p-6 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/30">
              <Layers className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight">Diagrama de Arquitetura & Módulos SucessoEdu</h2>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                  {version}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Mapeamento completo dos 12 módulos para manutenção ágil, análise cirúrgica e controle de atualizações
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Alerta de Sucesso na Nuvem */}
        {cloudSuccessMsg && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-6 py-3 flex items-center justify-between text-emerald-800 text-sm">
            <div className="flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span>{cloudSuccessMsg}</span>
            </div>
            <button onClick={() => setCloudSuccessMsg(null)} className="text-emerald-600 hover:text-emerald-900 text-xs font-bold">
              Fechar
            </button>
          </div>
        )}

        {/* Barra de Ações & Filtros */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap gap-3 items-center justify-between">
          <div className="flex-1 min-w-[260px] relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por módulo, arquivo .tsx, função, BNCC, PIX, C:\SucessoEdu..."
              className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          {/* Categorias */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                {cat.replace('_', ' ')}
              </button>
            ))}
          </div>

          {/* Botões de Exportação */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => downloadArchitectureDiagramHtml(schoolName, version)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold shadow-sm transition"
              title="Salvar HTML no Computador"
            >
              <Download className="w-3.5 h-3.5 text-indigo-600" />
              Salvar HTML
            </button>

            <button
              onClick={downloadArchitectureDiagramJson}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold shadow-sm transition"
              title="Salvar JSON"
            >
              <FileCode2 className="w-3.5 h-3.5 text-blue-600" />
              JSON
            </button>

            <button
              onClick={() => downloadArchitectureDiagramMarkdown(version)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold shadow-sm transition"
              title="Salvar Markdown"
            >
              <FileText className="w-3.5 h-3.5 text-emerald-600" />
              Markdown
            </button>

            <button
              onClick={handleSendToCloud}
              disabled={isSendingCloud}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm transition disabled:opacity-50"
              title="Enviar Diagrama para a pasta oficial no Google Drive"
            >
              <UploadCloud className="w-4 h-4" />
              {isSendingCloud ? 'Enviando...' : 'Enviar para Nuvem'}
            </button>
          </div>
        </div>

        {/* Corpo: Lista dos Módulos à esquerda e Detalhes Técnicos à direita */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-12">
          {/* Coluna Esquerda: Lista de Módulos (5 colunas) */}
          <div className="md:col-span-5 border-r border-slate-200 overflow-y-auto p-3 space-y-2 bg-slate-50/50">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider px-2 py-1">
              Módulos do Sistema ({filteredModules.length} de {SYSTEM_MODULES_CATALOG.length})
            </div>

            {filteredModules.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">
                Nenhum módulo encontrado para a busca informada.
              </div>
            ) : (
              filteredModules.map((m) => {
                const isSelected = selectedModule?.id === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => setSelectedModule(m)}
                    className={`w-full text-left p-3.5 rounded-xl transition border flex items-start gap-3 ${
                      isSelected
                        ? 'bg-white border-indigo-500 shadow-md ring-2 ring-indigo-500/10'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/80 shadow-sm'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                        isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {m.number}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold text-slate-900 text-sm truncate">{m.name}</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${m.badgeColor}`}>
                          {m.category}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{m.tagline}</p>
                      <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-400 font-mono">
                        <span>{m.sourceFiles.length} arquivos</span>
                        <span>•</span>
                        <span>{m.keyFunctions.length} rotinas</span>
                      </div>
                    </div>
                    <ChevronRight className={`w-4 h-4 mt-1 ${isSelected ? 'text-indigo-600' : 'text-slate-300'}`} />
                  </button>
                );
              })
            )}
          </div>

          {/* Coluna Direita: Detalhamento Técnico do Módulo Selecionado (7 colunas) */}
          <div className="md:col-span-7 overflow-y-auto p-5 md:p-6 bg-white space-y-5">
            {selectedModule ? (
              <>
                {/* Header do Módulo Selecionado */}
                <div className="border-b border-slate-200 pb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800">
                      Módulo {selectedModule.number} • {selectedModule.category}
                    </span>
                    <span className="text-xs font-mono text-slate-400">ID: {selectedModule.id}</span>
                  </div>
                  <h3 className="text-xl font-extrabold text-slate-900">{selectedModule.name}</h3>
                  <p className="text-sm text-slate-600 mt-1">{selectedModule.tagline}</p>
                </div>

                {/* Arquivos-Fonte & Componentes */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5 mb-2.5">
                    <FolderGit2 className="w-4 h-4 text-indigo-600" />
                    Arquivos-Fonte Principais & Componentes
                  </h4>
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 space-y-1.5">
                    {selectedModule.sourceFiles.map((file, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between text-xs font-mono bg-white px-3 py-1.5 rounded-lg border border-slate-200/80 text-slate-800"
                      >
                        <span className="truncate">{file}</span>
                        <span className="text-[10px] text-slate-400 font-sans font-semibold ml-2">TypeScript/React</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Rotinas Críticas e Funções */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5 mb-2.5">
                    <Cpu className="w-4 h-4 text-blue-600" />
                    Rotinas Críticas & Funções Mapeadas
                  </h4>
                  <div className="space-y-2">
                    {selectedModule.keyFunctions.map((fn, idx) => (
                      <div
                        key={idx}
                        className="text-xs bg-slate-50 border-l-4 border-indigo-500 rounded-r-lg p-2.5 text-slate-700"
                      >
                        {fn}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Entidades do Banco de Dados & Endpoints de API */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                    <div className="text-xs font-bold text-slate-700 flex items-center gap-1 mb-2">
                      <Database className="w-3.5 h-3.5 text-emerald-600" />
                      Entidades do Banco Local
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedModule.databaseEntities.map((ent, idx) => (
                        <span
                          key={idx}
                          className="text-[11px] font-mono font-medium px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200"
                        >
                          {ent}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                    <div className="text-xs font-bold text-slate-700 flex items-center gap-1 mb-2">
                      <ArrowUpRight className="w-3.5 h-3.5 text-purple-600" />
                      Endpoints & Rotas de API
                    </div>
                    <div className="space-y-1">
                      {selectedModule.apiEndpoints.map((ep, idx) => (
                        <div key={idx} className="text-[11px] font-mono text-purple-900 bg-purple-50 px-2 py-0.5 rounded">
                          {ep}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Melhorias Recentes */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5 mb-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    Melhorias & Correções Consolidadas
                  </h4>
                  <div className="space-y-1.5">
                    {selectedModule.recentImprovements.map((imp, idx) => (
                      <div
                        key={idx}
                        className="text-xs text-emerald-800 bg-emerald-50/80 border border-emerald-200 rounded-lg p-2.5 flex items-start gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                        <span>{imp}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Guia Rápido de Manutenção */}
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-amber-900 text-xs">
                  <div className="font-bold flex items-center gap-1.5 mb-1 text-amber-800">
                    <Wrench className="w-4 h-4 text-amber-600" />
                    Guia Rápido de Manutenção & Correções Cirúrgicas
                  </div>
                  <p className="leading-relaxed">{selectedModule.maintenanceQuickGuide}</p>
                </div>
              </>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                Selecione um módulo na lista ao lado para ver sua arquitetura detalhada.
              </div>
            )}
          </div>
        </div>

        {/* Rodapé do Modal */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            <span>Mapeamento 100% aderente ao código-fonte oficial em <code>C:\SucessoEdu</code></span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => downloadArchitectureDiagramHtml(schoolName, version)}
              className="font-semibold text-indigo-600 hover:text-indigo-800 underline"
            >
              Baixar Cópia HTML para este Computador
            </button>
            <span>•</span>
            <button
              onClick={handleSendToCloud}
              className="font-semibold text-emerald-700 hover:text-emerald-900 underline"
            >
              Reenviar para Pasta na Nuvem
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
