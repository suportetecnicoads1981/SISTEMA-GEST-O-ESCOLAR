import React, { useState } from 'react';
import {
  CheckCircle2,
  Circle,
  Play,
  ArrowRight,
  HardDrive,
  ShieldAlert,
  FolderTree,
  Database,
  Shield,
  Archive,
  Download,
  Terminal,
  AlertTriangle,
  Info
} from 'lucide-react';
import { NexusBuildWizardStep } from '../../types/nexusbuild';

interface NexusBuildWizardProps {
  currentStep: NexusBuildWizardStep;
  progressPercent: number;
  currentStepLabel: string;
  isExecuting: boolean;
  onStartFullBuild: () => void;
  onSelectStep: (step: NexusBuildWizardStep) => void;
}

export const NexusBuildWizard: React.FC<NexusBuildWizardProps> = ({
  currentStep,
  progressPercent,
  currentStepLabel,
  isExecuting,
  onStartFullBuild,
  onSelectStep,
}) => {
  const steps: { id: NexusBuildWizardStep; label: string; icon: any }[] = [
    { id: 'PREREQUISITES', label: '1. Hardware & 2GB', icon: HardDrive },
    { id: 'SAST_AUDIT', label: '2. Auditoria SAST', icon: ShieldAlert },
    { id: 'ROOT_PROVISIONING', label: '3. Raiz C:\\SucessoEduSistema', icon: FolderTree },
    { id: 'DATABASE_DEPLOY', label: '4. PostgreSQL Auto-Deploy', icon: Database },
    { id: 'FIREWALL_CONFIG', label: '5. Regras de Firewall', icon: Shield },
    { id: 'BACKUP_ENGINE', label: '6. Backup 03:00 AM', icon: Archive },
    { id: 'PACKAGE_INNO', label: '7. Gerar .EXE Inno Setup', icon: Download },
  ];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 shadow-lg">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            SucessoEduSistema Wizard de Instalação & Empacotamento
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-indigo-950 text-indigo-400 border border-indigo-800/40">
              Pipeline 7/7 Fases
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Execução orquestrada ponta-a-ponta para provisionamento de <code className="text-cyan-400 font-mono">C:\SucessoEduSistema</code> e compilação do executável.
          </p>
        </div>

        <button
          onClick={onStartFullBuild}
          disabled={isExecuting}
          className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs flex items-center gap-2 transition-colors cursor-pointer shadow-md disabled:opacity-50"
        >
          <Play className={`h-4 w-4 ${isExecuting ? 'animate-spin' : ''}`} />
          <span>{isExecuting ? 'Executando Pipeline...' : 'Iniciar Pipeline Completo'}</span>
        </button>
      </div>

      {/* Barra de Progresso Real */}
      <div className="mt-5">
        <div className="flex items-center justify-between text-xs font-mono mb-1.5">
          <span className="text-cyan-400 font-bold flex items-center gap-1.5">
            <Terminal className="h-3.5 w-3.5" />
            Etapa Atual: {currentStepLabel}
          </span>
          <span className="text-slate-300 font-bold">{progressPercent}%</span>
        </div>

        <div className="w-full bg-slate-950 rounded-full h-3 p-0.5 border border-slate-800 overflow-hidden">
          <div
            className="bg-indigo-600 h-full rounded-full transition-all duration-500 relative"
            style={{ width: `${progressPercent}%` }}
          >
            <div className="absolute inset-0 bg-white/20 animate-pulse rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Grid de Passos do Wizard */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 mt-5">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isActive = currentStep === step.id;
          const isCompleted = steps.findIndex(s => s.id === currentStep) > index || progressPercent === 100;

          return (
            <button
              key={step.id}
              onClick={() => onSelectStep(step.id)}
              className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between min-h-20 ${
                isActive
                  ? 'bg-indigo-950/60 border-indigo-500 text-white shadow-xs'
                  : isCompleted
                  ? 'bg-slate-950 border-cyan-500/40 text-cyan-300'
                  : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <Icon className={`h-4 w-4 ${isActive ? 'text-indigo-400' : isCompleted ? 'text-cyan-400' : 'text-slate-500'}`} />
                {isCompleted ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-cyan-400" />
                ) : (
                  <Circle className="h-3 w-3 text-slate-600" />
                )}
              </div>
              <div className="text-2xs font-mono font-medium mt-2 leading-tight">
                {step.label}
              </div>
            </button>
          );
        })}
      </div>

      {/* Esclarecimento de Pré-requisito para Criação do Instalador */}
      <div className="mt-3 p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-slate-300">
          <Info className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>
            <strong className="text-emerald-400">Pré-requisito da Etapa 7:</strong> Para compilar o executável (<code className="text-cyan-300 font-mono">.exe</code>), a única ferramenta necessária no seu computador é o <strong className="text-slate-100">Inno Setup 6</strong>. Nenhuma outra instalação (PostgreSQL, Node.js ou compiladores adicionais) é necessária para gerar o pacote!
          </span>
        </div>
        <span className="hidden sm:inline-block px-2 py-0.5 rounded text-3xs font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 shrink-0">
          SOMENTE INNO SETUP 6
        </span>
      </div>
    </div>
  );
};
