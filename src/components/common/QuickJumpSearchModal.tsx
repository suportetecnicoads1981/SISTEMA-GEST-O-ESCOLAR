import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  X,
  ArrowRight,
  LayoutDashboard,
  Users,
  Layers,
  Award,
  HelpCircle,
  ClipboardList,
  GraduationCap,
  BookOpen,
  TrendingUp,
  Building2,
  MessageSquare,
  ShieldCheck,
  Server,
  Cpu,
  Box,
  Wrench,
  Database,
  Key,
  RefreshCw,
  Network,
  Info,
  Bell,
  CornerDownLeft,
} from 'lucide-react';

interface QuickJumpSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tabId: string) => void;
}

interface NavDestination {
  id: string;
  title: string;
  category: string;
  categoryColor: string;
  keywords: string[];
  icon: React.ComponentType<{ className?: string }>;
  shortcut?: string;
  description: string;
}

export const NAV_DESTINATIONS: NavDestination[] = [
  // Visão Geral
  {
    id: 'MAIN_DASHBOARD',
    title: 'Visão Geral & Dashbox Executivo',
    category: 'Início',
    categoryColor: 'bg-indigo-50 text-indigo-700',
    keywords: ['dashboard', 'resumo', 'painel', 'métricas', 'inicio', 'home', 'graficos'],
    icon: LayoutDashboard,
    shortcut: 'Alt + D',
    description: 'Indicadores executivos da escola, alertas ativos e atalhos rápidos.',
  },
  {
    id: 'NOTIFICATIONS',
    title: 'Central de Notificações & Auditoria',
    category: 'Início',
    categoryColor: 'bg-indigo-50 text-indigo-700',
    keywords: ['avisos', 'notificacoes', 'alertas', 'mensagens', 'sino'],
    icon: Bell,
    shortcut: 'Alt + N',
    description: 'Histórico de eventos, aprovações, comunicados e auditoria preventiva.',
  },

  // Espaço Docente
  {
    id: 'TEACHER_PORTAL',
    title: 'Portal do Professor',
    category: 'Docente',
    categoryColor: 'bg-emerald-50 text-emerald-700',
    keywords: ['professor', 'turmas', 'aulas', 'docente', 'notas', 'frequencia'],
    icon: GraduationCap,
    description: 'Lançamento de notas bimestrais, faltas e diário de conteúdo.',
  },
  {
    id: 'CLASS_DIARY',
    title: 'Diário de Classe, Chamada & BNCC',
    category: 'Docente',
    categoryColor: 'bg-emerald-50 text-emerald-700',
    keywords: ['diario', 'chamada', 'presenca', 'frequencia', 'normativas', 'seduc'],
    icon: BookOpen,
    shortcut: 'Alt + E',
    description: 'Frequência diária, normativas estaduais e registro de ocorrências.',
  },

  // Secretaria
  {
    id: 'STUDENTS',
    title: 'Secretaria & Cadastro de Alunos',
    category: 'Secretaria',
    categoryColor: 'bg-blue-50 text-blue-700',
    keywords: ['alunos', 'matriculas', 'secretaria', 'cadastro', 'ra', 'estudantes', 'ficha'],
    icon: Users,
    shortcut: 'Alt + S',
    description: 'Ficha cadastral completa, laudo PCD, transferência e histórico do aluno.',
  },
  {
    id: 'CLASSES',
    title: 'Turmas, Turnos & Matrizes Curriculares',
    category: 'Secretaria',
    categoryColor: 'bg-blue-50 text-blue-700',
    keywords: ['turmas', 'series', 'grades', 'turnos', 'disciplinas', 'matriz'],
    icon: Layers,
    shortcut: 'Alt + T',
    description: 'Capacidade de salas, grade horária, enturmação e disciplinas.',
  },
  {
    id: 'DROPOUT_CENSUS',
    title: 'Censo de Evasão & Busca Ativa',
    category: 'Secretaria',
    categoryColor: 'bg-blue-50 text-blue-700',
    keywords: ['evasao', 'censo', 'busca ativa', 'desistencias', 'inep', 'abandono'],
    icon: Users,
    shortcut: 'Alt + C',
    description: 'Identificação precoce de risco de evasão e acompanhamento sociofamiliar.',
  },
  {
    id: 'DOCUMENTS',
    title: 'Certificados & Documentos Oficiais',
    category: 'Secretaria',
    categoryColor: 'bg-blue-50 text-blue-700',
    keywords: ['documentos', 'historico', 'declaracao', 'certificado', 'boletim', 'autenticacao'],
    icon: Award,
    shortcut: 'Alt + O',
    description: 'Emissão oficial de históricos, declarações e certificados com QR Code.',
  },

  // Pedagógico
  {
    id: 'PEDAGOGICAL_DASHBOARD',
    title: 'Evolução Pedagógica & Desempenho',
    category: 'Pedagógico',
    categoryColor: 'bg-purple-50 text-purple-700',
    keywords: ['evolucao', 'graficos', 'desempenho', 'pedagogico', 'bncc', 'habilidades'],
    icon: TrendingUp,
    shortcut: 'Alt + R',
    description: 'Métricas de proficiência por disciplina, turma e evolução individual.',
  },
  {
    id: 'QUESTION_BANK',
    title: 'Banco de Questões & Habilidades BNCC',
    category: 'Pedagógico',
    categoryColor: 'bg-purple-50 text-purple-700',
    keywords: ['questoes', 'bncc', 'itens', 'gabarito', 'provas', 'avaliacoes'],
    icon: HelpCircle,
    shortcut: 'Alt + Q',
    description: 'Repositório de questões alinhadas às competências e códigos da BNCC.',
  },
  {
    id: 'EXAMS',
    title: 'Gerador de Provas & Avaliações',
    category: 'Pedagógico',
    categoryColor: 'bg-purple-50 text-purple-700',
    keywords: ['provas', 'exames', 'testes', 'caderno', 'gabarito', 'correcao'],
    icon: ClipboardList,
    shortcut: 'Alt + P',
    description: 'Diagramação de cadernos de prova, gabarito e correção instantânea.',
  },

  // Comunicação & Municipal
  {
    id: 'MUNICIPAL_SYNC',
    title: 'Polos Remotos & Gestão Municipal (.edusync)',
    category: 'Municipal',
    categoryColor: 'bg-cyan-50 text-cyan-700',
    keywords: ['polos', 'remotos', 'rural', 'sincronizacao', 'edusync', 'secretaria municipal', 'pendrive'],
    icon: Building2,
    shortcut: 'Alt + M',
    description: 'Integração de escolas rurais sem internet via pacote seguro .edusync.',
  },
  {
    id: 'WHATSAPP',
    title: 'WhatsApp Notificações & Avisos aos Pais',
    category: 'Comunicação',
    categoryColor: 'bg-emerald-50 text-emerald-700',
    keywords: ['whatsapp', 'mensagens', 'pais', 'comunicados', 'disparo', 'faltas'],
    icon: MessageSquare,
    shortcut: 'Alt + W',
    description: 'Envio automático de notas, alertas de faltas e comunicados oficiais.',
  },

  // ADMINISTRAÇÃO & TI (Central unificada e sub-módulos)
  {
    id: 'ADMIN_TI',
    title: 'Hub de Administração & TI (Painel Central)',
    category: 'Administração & TI',
    categoryColor: 'bg-rose-50 text-rose-700',
    keywords: ['ti', 'administracao', 'painel ti', 'hub', 'infraestrutura', 'servidores', 'engenharia'],
    icon: ShieldCheck,
    shortcut: 'Alt + A',
    description: 'Visão unificada de todas as ferramentas de engenharia, deploy e banco de dados.',
  },
  {
    id: 'USER_CONTROL',
    title: 'Controle de Usuários & Níveis de Acesso',
    category: 'Administração & TI',
    categoryColor: 'bg-rose-50 text-rose-700',
    keywords: ['usuarios', 'senhas', 'permissoes', 'perfis', 'acessos', 'setores', 'master', 'admin'],
    icon: Key,
    shortcut: 'Alt + U',
    description: 'Gestão de contas e permissões (Diretoria, Secretaria, Professores e Master).',
  },
  {
    id: 'NEXUS_BUILD',
    title: 'NexusBuild Total .EXE Suite',
    category: 'Administração & TI',
    categoryColor: 'bg-amber-50 text-amber-700',
    keywords: ['nexusbuild', 'exe', 'instalador', 'inno setup', 'postgresql', '800mb', 'netstat', 'windows'],
    icon: Wrench,
    shortcut: 'Alt + B',
    description: 'Compilação de executáveis autônomos com checagem de 800MB livres e PostgreSQL 16.1.',
  },
  {
    id: 'DATASYNC_PRO',
    title: 'DataSync Pro (Supabase / PostgreSQL)',
    category: 'Administração & TI',
    categoryColor: 'bg-emerald-50 text-emerald-700',
    keywords: ['datasync', 'supabase', 'ddl', 'schema', 'backup', 'recuperacao', 'banco de dados'],
    icon: Database,
    shortcut: 'Alt + Y',
    description: 'Sincronização de schema DDL, auditoria e recuperação com chave mestra.',
  },
  {
    id: 'CLEANSLATE_HUB',
    title: 'CleanSlate Enterprise Hub (Zero-Data)',
    category: 'Administração & TI',
    categoryColor: 'bg-rose-50 text-rose-700',
    keywords: ['cleanslate', 'zero-data', 'seguranca', 'chunks 64mb', 'cli', 'sha256'],
    icon: ShieldCheck,
    shortcut: 'Alt + Z',
    description: 'Segurança desktop, updates em blocos de 64MB e verificação estrita de integridade.',
  },
  {
    id: 'NETWORK_INSTALLER',
    title: 'Instaladores de Rede Local & Backup ZIP',
    category: 'Administração & TI',
    categoryColor: 'bg-indigo-50 text-indigo-700',
    keywords: ['instalador', 'rede', 'backup', 'zip', 'powershell', 'servidor local', 'atalho'],
    icon: Network,
    shortcut: 'Alt + I',
    description: 'Geração de pacotes ZIP com servidor local, atalho único de desktop e rotinas de backup.',
  },
  {
    id: 'ABOUT',
    title: 'Sobre o Sistema & Contato do Desenvolvedor',
    category: 'Administração & TI',
    categoryColor: 'bg-slate-100 text-slate-700',
    keywords: ['sobre', 'versao', 'desenvolvedor', 'suporte', 'licenca', 'engenharia'],
    icon: Info,
    description: 'Detalhes da versão SucessoEdu, contatos de suporte de TI e termos técnicos.',
  },
];

export const QuickJumpSearchModal: React.FC<QuickJumpSearchModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setSearchTerm('');
      setSelectedIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  const filtered = NAV_DESTINATIONS.filter((item) => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return true;
    return (
      item.title.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q) ||
      item.keywords.some((k) => k.toLowerCase().includes(q))
    );
  });

  // Navegação por teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < filtered.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filtered.length - 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filtered[selectedIndex]) {
          onNavigate(filtered[selectedIndex].id);
          onClose();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filtered, selectedIndex, onNavigate, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Barra Superior de Busca */}
        <div className="p-4 border-b border-slate-100 flex items-center gap-3 bg-slate-50/70">
          <Search className="h-5 w-5 text-indigo-600 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Digite o nome da tela, módulo ou função (ex: Alunos, Provas, TI, Backup)..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setSelectedIndex(0);
            }}
            className="w-full text-sm sm:text-base bg-transparent border-none outline-hidden text-slate-800 placeholder:text-slate-400 font-medium"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block text-[10px] font-mono px-1.5 py-0.5 rounded bg-white text-slate-400 border border-slate-200">
            ESC
          </kbd>
        </div>

        {/* Lista de Resultados Filtrados */}
        <div className="p-2 overflow-y-auto max-h-[60vh] space-y-1">
          {filtered.map((item, index) => {
            const Icon = item.icon;
            const isSelected = index === selectedIndex;

            return (
              <div
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  onClose();
                }}
                onMouseEnter={() => setSelectedIndex(index)}
                className={`p-3 rounded-2xl flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                  isSelected
                    ? 'bg-indigo-50/80 border border-indigo-200'
                    : 'hover:bg-slate-50 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`p-2.5 rounded-xl shrink-0 transition-colors ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-900 text-sm">{item.title}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.categoryColor}`}
                      >
                        {item.category}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 truncate mt-0.5">{item.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {item.shortcut && (
                    <kbd className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                      {item.shortcut}
                    </kbd>
                  )}
                  {isSelected && (
                    <div className="flex items-center gap-1 text-xs font-bold text-indigo-600">
                      <CornerDownLeft className="h-3.5 w-3.5" />
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="p-8 text-center text-slate-400 space-y-2">
              <p className="text-sm font-semibold">Nenhum módulo ou tela encontrado.</p>
              <p className="text-xs">Tente buscar por termos como "Alunos", "Boletim", "Notas", "PostgreSQL", ou "Usuários".</p>
            </div>
          )}
        </div>

        {/* Rodapé com Dicas de Atalho */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-3">
            <span>
              Use <kbd className="font-mono bg-white px-1 py-0.5 rounded border">↑</kbd>{' '}
              <kbd className="font-mono bg-white px-1 py-0.5 rounded border">↓</kbd> para navegar
            </span>
            <span>
              <kbd className="font-mono bg-white px-1.5 py-0.5 rounded border">Enter</kbd> para abrir
            </span>
          </div>
          <span className="font-semibold text-indigo-600">Navegação Rápida Global</span>
        </div>
      </div>
    </div>
  );
};
