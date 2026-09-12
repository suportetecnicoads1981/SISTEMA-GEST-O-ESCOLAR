import React, { useState } from 'react';
import {
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  Zap,
  ArrowRight,
  ArrowLeft,
  X,
  FileText,
  Printer,
  ChevronRight,
  Layers,
  Database,
  Lock,
} from 'lucide-react';
import { CANONICAL_OMNIDEPLOY_MANIFEST, markUpdatePresentationAsSeen } from '../../services/firebaseDeployService';

interface UpdateImprovementPresentationModalProps {
  isOpen: boolean;
  onClose: () => void;
  systemVersion?: string;
  onOpenManual?: () => void;
}

export const UpdateImprovementPresentationModal: React.FC<UpdateImprovementPresentationModalProps> = ({
  isOpen,
  onClose,
  systemVersion = CANONICAL_OMNIDEPLOY_MANIFEST.version,
  onOpenManual,
}) => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  if (!isOpen) return null;

  const slides = [
    {
      badge: 'NOVIDADE CENTRAL',
      title: 'Bem-vindo ao OmniDeploy v5.5.0!',
      description: 'O novo sistema de gestão e instalação híbrida do SucessoEdu traz maior robustez com tolerância a falhas e sincronização nativa com o Google Cloud / Firebase.',
      icon: Sparkles,
      color: 'bg-[#1a73e8]',
      bullets: [
        'Proteção ativa de dados: Diretório /data preservado integralmente em qualquer atualização.',
        'Novo componente de navegação universal com histórico de rotas e botão voltar.',
        'Módulo PrintCanvas com pré-visualização real de documentos e seletor de impressoras do sistema.',
      ],
    },
    {
      badge: 'SEGURANÇA & INTEGRIDADE',
      title: 'Validação Criptográfica SHA-256 e Auto-Correção',
      description: 'Garantia matemática de integridade dos arquivos e inicialização resiliente sem risco de perda de configurações da escola.',
      icon: ShieldCheck,
      color: 'bg-emerald-600',
      bullets: [
        'Auto-correção de path: Detecta restrições UAC do Windows e remapeia automaticamente sem falhar.',
        'Auditoria instantânea de somas de verificação após qualquer escrita de binários.',
        'Bloqueio de fechamento de janela durante gravação de arquivos para evitar corrupção.',
      ],
    },
    {
      badge: 'DADOS & GRÁFICOS',
      title: 'SmartDataTable e Recharts Parametrizáveis',
      description: 'Importação inteligente de planilhas com memória de filtros e criação de gráficos sob medida para relatórios executivos.',
      icon: Database,
      color: 'bg-indigo-600',
      bullets: [
        'Persistência de filtros de importação no perfil do operador.',
        'Seletor livre de eixos X e Y para visualizações em Barra, Linha, Pizza ou Área.',
        'Exportação direta para o PrintCanvas em alta resolução (300/600 DPI).',
      ],
    },
  ];

  const currentSlide = slides[currentSlideIndex];
  const isLast = currentSlideIndex === slides.length - 1;

  const handleFinish = () => {
    markUpdatePresentationAsSeen(systemVersion);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col animate-in fade-in-50 zoom-in-95">
        {/* Top Accent Bar */}
        <div className={`p-6 text-white ${currentSlide.color} transition-colors duration-300 relative`}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 bg-white/20 rounded-full">
              {currentSlide.badge}
            </span>
            <span className="text-xs font-mono font-bold bg-black/20 px-2.5 py-0.5 rounded-md">
              {systemVersion}
            </span>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <div className="p-3 bg-white/20 rounded-xl shrink-0">
              <currentSlide.icon className="h-7 w-7 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold tracking-tight">{currentSlide.title}</h3>
              <p className="text-xs text-white/80 mt-1 leading-relaxed">{currentSlide.description}</p>
            </div>
          </div>
        </div>

        {/* Slide Content */}
        <div className="p-6 space-y-4 flex-1">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Destaques desta Versão
          </h4>
          <div className="space-y-2.5">
            {currentSlide.bullets.map((b, idx) => (
              <div key={idx} className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span className="text-xs font-medium text-slate-700 leading-relaxed">{b}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Pagination & Navigation */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {slides.map((_, i) => (
              <div
                key={i}
                className={`h-2 rounded-full transition-all duration-300 ${
                  currentSlideIndex === i ? 'w-6 bg-[#1a73e8]' : 'w-2 bg-slate-300'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            {currentSlideIndex > 0 && (
              <button
                onClick={() => setCurrentSlideIndex((i) => i - 1)}
                className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer flex items-center gap-1"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Anterior</span>
              </button>
            )}

            {!isLast ? (
              <button
                onClick={() => setCurrentSlideIndex((i) => i + 1)}
                className="px-4 py-2 rounded-xl bg-[#1a73e8] hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <span>Próximo</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            ) : (
              <button
                onClick={handleFinish}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Concluir e Acessar o Sistema</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
