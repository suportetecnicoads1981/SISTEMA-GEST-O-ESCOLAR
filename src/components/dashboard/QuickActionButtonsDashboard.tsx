import React from 'react';
import {
  GraduationCap,
  Users,
  FileText,
  BookOpen,
  HelpCircle,
  TrendingUp,
  Building2,
  Bell,
  HardDrive,
  Download,
  Upload,
  BarChart3,
  Sparkles,
  Layers,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Zap,
} from 'lucide-react';
import {
  Student,
  SchoolClass,
  Exam,
  ExamSubmission,
  SchoolSettings,
} from '../../types';

interface QuickActionButtonsDashboardProps {
  students: Student[];
  classes: SchoolClass[];
  exams: Exam[];
  submissions: ExamSubmission[];
  settings: SchoolSettings;
  onNavigate: (tab: string) => void;
  onOpenNewStudentModal?: () => void;
  onOpenNewExamModal?: () => void;
}

export const QuickActionButtonsDashboard: React.FC<QuickActionButtonsDashboardProps> = ({
  students,
  classes,
  exams,
  submissions,
  settings,
  onNavigate,
  onOpenNewStudentModal,
  onOpenNewExamModal,
}) => {
  return (
    <div className="space-y-8">
      {/* Top Welcome Card */}
      <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-indigo-800/40 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-bold">
              <Zap className="h-3.5 w-3.5 text-amber-400" />
              Painel de Operações Rápidas & Gestão Educacional
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              {settings.name || 'EduGestão Pro'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Ambiente unificado para controle acadêmico, banco de provas BNCC, acompanhamento de evolução pedagógica e sincronização de polos municipais.
            </p>
          </div>

          {/* Key Metric Badges */}
          <div className="grid grid-cols-2 gap-3 shrink-0">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/10 text-center">
              <span className="text-[11px] font-semibold text-slate-300 block uppercase">Alunos Ativos</span>
              <span className="text-2xl font-black text-white">{students.length}</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/10 text-center">
              <span className="text-[11px] font-semibold text-slate-300 block uppercase">Provas Geradas</span>
              <span className="text-2xl font-black text-emerald-400">{exams.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* SEÇÃO 1: EVOLUÇÃO PEDAGÓGICA & INTELIGÊNCIA */}
      {/* ========================================================= */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
          <TrendingUp className="h-4 w-4 text-indigo-600" />
          <span>Evolução Pedagógica & Matriz de Aprendizagem</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Card 1: Evolução do Aluno */}
          <button
            onClick={() => onNavigate('PEDAGOGICAL_EVOLUTION')}
            className="group p-5 bg-white rounded-2xl border border-slate-200 hover:border-indigo-500 shadow-xs hover:shadow-md transition-all text-left flex flex-col justify-between space-y-3 cursor-pointer"
          >
            <div className="flex items-start justify-between">
              <div className="h-12 w-12 rounded-2xl bg-indigo-50 group-hover:bg-indigo-600 text-indigo-600 group-hover:text-white flex items-center justify-center transition-colors">
                <TrendingUp className="h-6 w-6" />
              </div>
              <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors">
                Evolução do Estudante
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Gráficos bimestrais (B1, B2, B3, B4), médias vs turma e parecer descritivo.
              </p>
            </div>
            <span className="text-[11px] font-bold text-indigo-600 flex items-center gap-1 pt-2 border-t border-slate-100">
              Ver Gráficos do Aluno →
            </span>
          </button>

          {/* Card 2: Evolução da Turma */}
          <button
            onClick={() => onNavigate('PEDAGOGICAL_EVOLUTION')}
            className="group p-5 bg-white rounded-2xl border border-slate-200 hover:border-indigo-500 shadow-xs hover:shadow-md transition-all text-left flex flex-col justify-between space-y-3 cursor-pointer"
          >
            <div className="flex items-start justify-between">
              <div className="h-12 w-12 rounded-2xl bg-purple-50 group-hover:bg-purple-600 text-purple-600 group-hover:text-white flex items-center justify-center transition-colors">
                <BarChart3 className="h-6 w-6" />
              </div>
              <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm group-hover:text-purple-600 transition-colors">
                Evolução Coletiva da Turma
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Taxas de aprovação, médias por componente curricular e matriz comparativa.
              </p>
            </div>
            <span className="text-[11px] font-bold text-purple-600 flex items-center gap-1 pt-2 border-t border-slate-100">
              Ver Curva de Turmas →
            </span>
          </button>

          {/* Card 3: Diagnóstico de Erros BNCC */}
          <button
            onClick={() => onNavigate('REPORTS')}
            className="group p-5 bg-white rounded-2xl border border-slate-200 hover:border-indigo-500 shadow-xs hover:shadow-md transition-all text-left flex flex-col justify-between space-y-3 cursor-pointer"
          >
            <div className="flex items-start justify-between">
              <div className="h-12 w-12 rounded-2xl bg-amber-50 group-hover:bg-amber-600 text-amber-600 group-hover:text-white flex items-center justify-center transition-colors">
                <Sparkles className="h-6 w-6" />
              </div>
              <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-amber-600 group-hover:translate-x-1 transition-all" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm group-hover:text-amber-600 transition-colors">
                Diagnóstico de Erros & BNCC
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Identificação de distratores mais assinalados e sugestão de intervenções.
              </p>
            </div>
            <span className="text-[11px] font-bold text-amber-600 flex items-center gap-1 pt-2 border-t border-slate-100">
              Ver Relatório Pedagógico →
            </span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* SEÇÃO 2: REDE MUNICIPAL & SINCRONIZAÇÃO FORA DA REDE */}
      {/* ========================================================= */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
          <Building2 className="h-4 w-4 text-emerald-600" />
          <span>Gestão Municipal, Polos Satélites & Censo</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Card 1: Exportar Polo Satélite */}
          <button
            onClick={() => onNavigate('MUNICIPAL_SYNC')}
            className="group p-5 bg-white rounded-2xl border border-slate-200 hover:border-emerald-500 shadow-xs hover:shadow-md transition-all text-left flex flex-col justify-between space-y-3 cursor-pointer"
          >
            <div className="flex items-start justify-between">
              <div className="h-12 w-12 rounded-2xl bg-emerald-50 group-hover:bg-emerald-600 text-emerald-600 group-hover:text-white flex items-center justify-center transition-colors">
                <Download className="h-6 w-6" />
              </div>
              <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm group-hover:text-emerald-600 transition-colors">
                Gerar Pacote Polo Remoto (.edusync)
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Para escolas fora da rede gerarem o arquivo de pendrive para a Secretaria.
              </p>
            </div>
            <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1 pt-2 border-t border-slate-100">
              Exportar para Pendrive →
            </span>
          </button>

          {/* Card 2: Central de Unificação */}
          <button
            onClick={() => onNavigate('MUNICIPAL_SYNC')}
            className="group p-5 bg-white rounded-2xl border border-slate-200 hover:border-emerald-500 shadow-xs hover:shadow-md transition-all text-left flex flex-col justify-between space-y-3 cursor-pointer"
          >
            <div className="flex items-start justify-between">
              <div className="h-12 w-12 rounded-2xl bg-teal-50 group-hover:bg-teal-600 text-teal-600 group-hover:text-white flex items-center justify-center transition-colors">
                <Upload className="h-6 w-6" />
              </div>
              <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-teal-600 group-hover:translate-x-1 transition-all" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm group-hover:text-teal-600 transition-colors">
                Central de Unificação SME
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Receba arquivos das escolas e unifique toda a base na sede central.
              </p>
            </div>
            <span className="text-[11px] font-bold text-teal-600 flex items-center gap-1 pt-2 border-t border-slate-100">
              Importar Pacotes →
            </span>
          </button>

          {/* Card 3: Censo Educacional */}
          <button
            onClick={() => onNavigate('MUNICIPAL_SYNC')}
            className="group p-5 bg-white rounded-2xl border border-slate-200 hover:border-emerald-500 shadow-xs hover:shadow-md transition-all text-left flex flex-col justify-between space-y-3 cursor-pointer"
          >
            <div className="flex items-start justify-between">
              <div className="h-12 w-12 rounded-2xl bg-blue-50 group-hover:bg-blue-600 text-blue-600 group-hover:text-white flex items-center justify-center transition-colors">
                <FileText className="h-6 w-6" />
              </div>
              <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm group-hover:text-blue-600 transition-colors">
                Censo Escolar & Indicadores
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Contagem oficial de matrículas, educação especial e transporte escolar.
              </p>
            </div>
            <span className="text-[11px] font-bold text-blue-600 flex items-center gap-1 pt-2 border-t border-slate-100">
              Ver Censo Municipal →
            </span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* SEÇÃO 3: SECRETARIA, PROVAS & COMUNICAÇÃO */}
      {/* ========================================================= */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
          <GraduationCap className="h-4 w-4 text-indigo-600" />
          <span>Secretaria Escolar & Provas</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card: Alunos */}
          <button
            onClick={() => onNavigate('STUDENTS')}
            className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-indigo-500 shadow-xs hover:shadow-md transition-all text-left flex items-center gap-3 cursor-pointer"
          >
            <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-xs">Gestão de Alunos</h4>
              <p className="text-[11px] text-slate-500">{students.length} cadastrados</p>
            </div>
          </button>

          {/* Card: Banco de Questões */}
          <button
            onClick={() => onNavigate('QUESTIONS')}
            className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-indigo-500 shadow-xs hover:shadow-md transition-all text-left flex items-center gap-3 cursor-pointer"
          >
            <div className="h-10 w-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <HelpCircle className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-xs">Banco de Questões</h4>
              <p className="text-[11px] text-slate-500">Alinhado à BNCC</p>
            </div>
          </button>

          {/* Card: Gerenciador de Provas */}
          <button
            onClick={() => onNavigate('EXAMS')}
            className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-indigo-500 shadow-xs hover:shadow-md transition-all text-left flex items-center gap-3 cursor-pointer"
          >
            <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-xs">Gerador de Provas</h4>
              <p className="text-[11px] text-slate-500">{exams.length} avaliações</p>
            </div>
          </button>

          {/* Card: Mural de Comunicação */}
          <button
            onClick={() => onNavigate('COMMUNICATIONS')}
            className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-indigo-500 shadow-xs hover:shadow-md transition-all text-left flex items-center gap-3 cursor-pointer"
          >
            <div className="h-10 w-10 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center shrink-0">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-xs">Mural de Avisos</h4>
              <p className="text-[11px] text-slate-500">Recados e comunicados</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
