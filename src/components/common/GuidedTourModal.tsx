import React, { useState } from 'react';
import {
  GraduationCap,
  LayoutDashboard,
  Users,
  Layers,
  BookOpen,
  Server,
  Keyboard,
  ArrowRight,
  ArrowLeft,
  X,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';

interface GuidedTourModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (tabId: string) => void;
}

interface TourStep {
  title: string;
  subtitle: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
  targetTab?: string;
  badge: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    title: 'Bem-vindo ao SucessoEdu',
    subtitle: 'Ecossistema Educacional Inteligente',
    description:
      'Este tour guiado apresenta os principais recursos e módulos da plataforma para otimizar a gestão da Secretaria de Educação e das unidades escolares.',
    icon: GraduationCap,
    accentColor: 'from-indigo-600 to-indigo-500',
    badge: 'Início',
  },
  {
    title: 'Visão Geral / Dashbox',
    subtitle: 'Indicadores e Métricas em Tempo Real',
    description:
      'O painel principal consolida o total de matrículas, frequência média, fluxo de caixa e alertas gerenciais para tomada rápida de decisões.',
    icon: LayoutDashboard,
    accentColor: 'from-blue-600 to-indigo-600',
    targetTab: 'MAIN_DASHBOARD',
    badge: 'Dashboard',
  },
  {
    title: 'Secretaria & Alunos',
    subtitle: 'Gestão Completa de Matrizes e Estudantes',
    description:
      'Cadastre alunos, gerencie histórico escolar, transferências, status cadastral e emita certificados e históricos oficiais com validação.',
    icon: Users,
    accentColor: 'from-emerald-600 to-teal-600',
    targetTab: 'STUDENTS',
    badge: 'Secretaria',
  },
  {
    title: 'Turmas & Enturmação',
    subtitle: 'Organização da Grade Curricular e Vagas',
    description:
      'Configure turmas por modalidade (Infantil, Fundamental, Médio), turnos, atribuição de professores e lotação de salas de aula.',
    icon: Layers,
    accentColor: 'from-purple-600 to-indigo-600',
    targetTab: 'CLASSES',
    badge: 'Turmas',
  },
  {
    title: 'Portal do Docente & Diário',
    subtitle: 'Registro de Aulas e Chamada Digital',
    description:
      'Espaço dedicado aos professores registrarem frequências diárias, conteúdos ministrados, notas e planos de aula pedagógicos.',
    icon: BookOpen,
    accentColor: 'from-amber-600 to-orange-600',
    targetTab: 'TEACHER_PORTAL',
    badge: 'Docentes',
  },
  {
    title: 'Hub de Engenharia & TI',
    subtitle: 'Instalação, Backup e Sincronização',
    description:
      'Painéis avançados para gerenciamento de banco de dados local/nuvem, exportação de instaladores offline e atualizações OTA.',
    icon: Server,
    accentColor: 'from-slate-700 to-slate-900',
    targetTab: 'ADMIN_TI',
    badge: 'TI & Infra',
  },
  {
    title: 'Navegação por Atalhos (Alt+K)',
    subtitle: 'Produtividade Máxima',
    description:
      'Você pode navegar por todo o sistema instantaneamente utilizando atalhos de teclado (como Alt+D para Dashboard, Alt+S para Alunos, Alt+K para atalhos). Pronto para começar!',
    icon: Keyboard,
    accentColor: 'from-rose-600 to-pink-600',
    badge: 'Pronto!',
  },
];

export const GuidedTourModal: React.FC<GuidedTourModalProps> = ({ isOpen, onClose, onNavigate }) => {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const step = TOUR_STEPS[currentStep];
  const Icon = step.icon;
  const isLast = currentStep === TOUR_STEPS.length - 1;

  const handleNext = () => {
    if (step.targetTab && onNavigate) {
      onNavigate(step.targetTab);
    }
    if (isLast) {
      onClose();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-lg bg-slate-900 text-slate-100 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Top bar with progress indicator */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Tour Guiado ({currentStep + 1} de {TOUR_STEPS.length})
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Fechar Tour"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">
          <div className="flex items-start gap-4">
            <div
              className={`w-14 h-14 rounded-2xl bg-gradient-to-tr ${step.accentColor} flex items-center justify-center text-white shrink-0 shadow-lg shadow-indigo-500/20`}
            >
              <Icon className="w-7 h-7" />
            </div>
            <div className="space-y-1.5 min-w-0">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-indigo-950 text-indigo-300 border border-indigo-800/60">
                <Sparkles className="w-3 h-3 text-amber-400" />
                {step.badge}
              </span>
              <h2 className="text-lg font-bold text-white tracking-tight">{step.title}</h2>
              <p className="text-xs text-indigo-300 font-medium">{step.subtitle}</p>
            </div>
          </div>

          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 text-slate-300 text-xs leading-relaxed">
            {step.description}
          </div>

          {/* Dots Indicator */}
          <div className="flex items-center justify-center gap-1.5 pt-2">
            {TOUR_STEPS.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentStep(idx)}
                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                  idx === currentStep ? 'w-6 bg-indigo-500' : 'w-1.5 bg-slate-700 hover:bg-slate-600'
                }`}
                title={`Ir para o passo ${idx + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={handlePrev}
            disabled={currentStep === 0}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Anterior
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Pular Tour
            </button>
            <button
              onClick={handleNext}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span>{isLast ? 'Concluir' : 'Próximo'}</span>
              {isLast ? <CheckCircle2 className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
