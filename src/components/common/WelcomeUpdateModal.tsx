import React, { useState } from 'react';
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
} from 'lucide-react';
import { SystemUpdatePackage } from '../../types';

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
}

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
}) => {
  const [selectedFilter, setSelectedFilter] = useState<'TODOS' | 'GESTÃO' | 'PEDAGÓGICO' | 'INFRAESTRUTURA'>('TODOS');

  if (!isOpen) return null;

  const activeVer = currentVersion || updatePackage?.version || 'v5.4.0-ENTERPRISE';

  // 6 Structured Module Improvements matching layout
  const moduleCards = [
    {
      tabId: 'MAIN_DASHBOARD',
      number: '01',
      title: 'Visão Geral & Notificações',
      subtitle: 'Menu Elevado para o Topo da Tela',
      category: 'GESTÃO',
      icon: LayoutDashboard,
      color: 'from-blue-600 to-indigo-700',
      badge: 'Topo do Menu',
      highlights: [
        'Indicadores executivos com atualização em tempo real de matrículas e turmas.',
        'Central de Notificações atômica com alertas sonoros e avisos de evasão.',
        'Barra de Acesso Rápido com monitoramento de conectividade e status do servidor.',
      ],
    },
    {
      tabId: 'TEACHER_PORTAL',
      number: '02',
      title: 'Espaço do Docente & Gestão de Turmas',
      subtitle: 'Portal do Professor & Diário de Classe',
      category: 'PEDAGÓGICO',
      icon: GraduationCap,
      color: 'from-emerald-600 to-teal-700',
      badge: 'LDB & BNCC',
      highlights: [
        'Diário de classe com chamada rápida e cálculo de 75% de frequência mínima.',
        'Pauta de notas bimestrais com pesos ponderados e conselho de classe.',
        'Planejamento de aulas quinzenal com vinculação direta a habilidades BNCC.',
      ],
    },
    {
      tabId: 'STUDENTS',
      number: '03',
      title: 'Secretaria & Ensino',
      subtitle: 'Matrículas, Documentos & Censo de Evasão',
      category: 'GESTÃO',
      icon: Users,
      color: 'from-sky-600 to-blue-700',
      badge: 'Acadêmico',
      highlights: [
        'Cadastro completo com foto, dados de saúde e histórico escolar consolidado.',
        'Censo de Evasão Escolar com protocolos de Busca Ativa Municipal.',
        'Emissão vetorial de históricos escolares, declarações e certificados com QR Code.',
      ],
    },
    {
      tabId: 'PEDAGOGICAL_DASHBOARD',
      number: '04',
      title: 'Pedagógico & Avaliações',
      subtitle: 'Evolução Discente, Banco de Questões & Provas',
      category: 'PEDAGÓGICO',
      icon: TrendingUp,
      color: 'from-violet-600 to-purple-800',
      badge: 'Avaliações',
      highlights: [
        'Painel longitudinal de evolução da aprendizagem por habilidade e descritor.',
        'Banco com mais de 2.000 questões categorizadas por ano e área do conhecimento.',
        'Sala de Provas do Aluno ao vivo com correção instantânea e gabaritos automáticos.',
      ],
    },
    {
      tabId: 'MUNICIPAL_SYNC',
      number: '05',
      title: 'Gestão Municipal & Comunicação',
      subtitle: 'Polos Remotos (.edusync) & WhatsApp Notificações',
      category: 'GESTÃO',
      icon: Building2,
      color: 'from-amber-600 to-orange-700',
      badge: 'Rede Municipal',
      highlights: [
        'Sincronização offline-first via pendrive (.edusync) para escolas da zona rural.',
        'Unificação central na Secretaria Municipal de Educação (SME) em 1 clique.',
        'Disparo de avisos aos pais e responsáveis via WhatsApp com modelos prontos.',
      ],
    },
    {
      tabId: 'SYSTEM_UPDATES',
      number: '06',
      title: 'Administração, Nuvem & Instaladores',
      subtitle: 'Pasta Raiz C:\\SucessoEdu & Backup Preventivo',
      category: 'INFRAESTRUTURA',
      icon: RefreshCw,
      color: 'from-slate-700 to-slate-900',
      badge: 'Nuvem & Auditoria',
      highlights: [
        'Instalador automatizado com criação obrigatória da pasta raiz C:\\SucessoEdu.',
        'Backup preventivo atômico com preservação de 100% dos dados prévios.',
        'Diagrama oficial dos 12 módulos para manutenção ágil e envio para a nuvem.',
      ],
    },
  ];

  const filteredCards = moduleCards.filter((card) => {
    if (selectedFilter === 'TODOS') return true;
    return card.category === selectedFilter;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-md p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200 my-4">
        {/* BANNER SUPERIOR DE BOAS-VINDAS */}
        <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-emerald-600 px-6 sm:px-8 py-7 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
            title="Fechar Tela de Boas-Vindas"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="flex items-start gap-4">
            <div className="h-14 w-14 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/25 flex items-center justify-center shrink-0 shadow-inner">
              <Sparkles className="h-8 w-8 text-amber-300 animate-pulse" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-400 text-slate-900 tracking-wide uppercase">
                  Sistema Fielmente Atualizado
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-white/20 text-white border border-white/30">
                  {previousVersion} → {activeVer}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-900/40 text-indigo-100 border border-indigo-300/30">
                  Pasta: C:\SucessoEdu
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                SucessoEdu {activeVer} Ativo com Todas as Melhorias!
              </h2>
              <p className="text-xs sm:text-sm text-indigo-100 max-w-3xl leading-relaxed">
                A nova versão foi aplicada com fidelidade total na pasta raiz <code>C:\SucessoEdu</code>. Todos os arquivos foram atualizados, seu atalho na Área de Trabalho foi renovado e seus dados (alunos, turmas, notas e finanças) foram 100% preservados com backup preventivo certificado.
              </p>
            </div>
          </div>
        </div>

        {/* STATUS DE SEGURANÇA E BACKUP PREVENTIVO */}
        <div className="bg-emerald-50/90 border-b border-emerald-200 px-6 sm:px-8 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="text-xs">
              <span className="font-bold text-emerald-950 block">
                Cópia de Segurança Preventiva Gerada em <code>C:\SucessoEdu\Backups</code>
              </span>
              <span className="text-emerald-700 text-[11px]">
                {backupInfo?.studentsCount !== undefined
                  ? `Preservados com sucesso: ${backupInfo.studentsCount} alunos, ${backupInfo.classesCount || 0} turmas e ${backupInfo.examsCount || 0} avaliações.`
                  : 'Backup preventivo automático realizado antes da substituição dos arquivos.'}
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
                className="text-[11px] font-bold text-indigo-700 hover:text-indigo-900 bg-white hover:bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-200 flex items-center gap-1.5 transition shadow-2xs"
              >
                <FileCode2 className="w-3.5 h-3.5 text-indigo-600" />
                <span>Ver Diagrama dos 12 Módulos</span>
              </button>
            )}
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-800 bg-emerald-100/80 px-3 py-1 rounded-lg border border-emerald-300">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              <span>DADOS PRESERVADOS</span>
            </div>
          </div>
        </div>

        {/* CONTEÚDO PRINCIPAL COM FILTROS DE MELHORIAS */}
        <div className="p-6 sm:p-8 space-y-5 max-h-[58vh] overflow-y-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                <Layers className="h-4 w-4 text-indigo-600" />
                <span>Melhorias e Inovações Implementadas na Versão {activeVer}:</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Clique nos cartões abaixo para navegar diretamente ao módulo correspondente.
              </p>
            </div>

            {/* Filtros de Categoria */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              {(['TODOS', 'GESTÃO', 'PEDAGÓGICO', 'INFRAESTRUTURA'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedFilter(cat)}
                  className={`text-[11px] font-bold px-3 py-1 rounded-lg transition ${
                    selectedFilter === cat
                      ? 'bg-white text-indigo-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCards.map((card) => {
              const IconComp = card.icon;
              return (
                <div
                  key={card.number}
                  className="rounded-2xl border border-slate-200 hover:border-indigo-400 bg-slate-50/50 hover:bg-white p-4.5 transition-all shadow-xs hover:shadow-md flex flex-col justify-between group"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`h-9 w-9 rounded-xl bg-gradient-to-br ${card.color} text-white flex items-center justify-center shadow-xs`}
                        >
                          <IconComp className="h-4.5 w-4.5" />
                        </div>
                        <div>
                          <span className="text-[10px] font-black text-indigo-600 tracking-wider">
                            MÓDULO {card.number}
                          </span>
                          <h4 className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                            {card.title}
                          </h4>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 shrink-0">
                        {card.badge}
                      </span>
                    </div>

                    <p className="text-[11.5px] font-semibold text-slate-700">
                      {card.subtitle}
                    </p>

                    <ul className="space-y-1.5 text-[11px] text-slate-600 border-t border-slate-200/60 pt-2.5">
                      {card.highlights.map((h, i) => (
                        <li key={i} className="flex items-start gap-1.5 leading-relaxed">
                          <CheckCircle2 className="h-3 w-3 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{h}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    onClick={() => {
                      onNavigate(card.tabId);
                      onClose();
                    }}
                    className="mt-4 w-full py-2 px-3 rounded-xl bg-white hover:bg-indigo-600 text-slate-700 hover:text-white border border-slate-200 hover:border-indigo-600 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs group-hover:shadow-xs"
                  >
                    <span>Abrir Módulo</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* RODAPÉ DO MODAL COM BOTÕES DE AÇÃO */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 sm:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
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
                className="flex-1 sm:flex-none px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-indigo-700 border border-indigo-200 font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
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
                className="flex-1 sm:flex-none px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <BookOpen className="h-4 w-4 text-slate-500" />
                <span>Manual Simplificado</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
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

