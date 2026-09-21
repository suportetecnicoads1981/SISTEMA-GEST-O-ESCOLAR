import React, { Suspense, lazy } from 'react';
import { ModuleLoadingFallback } from '../common/ModuleLoadingFallback';

const SystemArchitectureHub = lazy(() =>
  import('../architecture/SystemArchitectureHub').then((m) => ({
    default: m.SystemArchitectureHub,
  }))
);

interface ModulesArchitectureDiagramModalProps {
  isOpen: boolean;
  onClose: () => void;
  schoolName?: string;
  version?: string;
  currentVersion?: string;
  onNavigateToTab?: (tabId: string) => void;
  onNavigate?: (tabId: string) => void;
  initialModuleId?: string;
}

export const ModulesArchitectureDiagramModal: React.FC<ModulesArchitectureDiagramModalProps> = ({
  isOpen,
  onClose,
  schoolName,
  version,
  currentVersion,
  onNavigateToTab,
  onNavigate,
  initialModuleId,
}) => {
  if (!isOpen) return null;

  const navigateFn = onNavigateToTab || onNavigate;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-2 sm:p-4 md:p-6 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-7xl h-[94vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <Suspense fallback={<ModuleLoadingFallback moduleName="Diagrama de Arquitetura & Módulos" />}>
          <SystemArchitectureHub
            onNavigateToTab={(tab) => {
              navigateFn?.(tab);
              onClose();
            }}
            initialModuleId={initialModuleId}
            isModalMode={true}
            onClose={onClose}
          />
        </Suspense>
      </div>
    </div>
  );
};
