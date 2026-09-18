import React from 'react';
import { SystemArchitectureHub } from '../architecture/SystemArchitectureHub';

interface ModulesArchitectureDiagramModalProps {
  isOpen: boolean;
  onClose: () => void;
  schoolName?: string;
  version?: string;
  onNavigateToTab?: (tabId: string) => void;
  initialModuleId?: string;
}

export const ModulesArchitectureDiagramModal: React.FC<ModulesArchitectureDiagramModalProps> = ({
  isOpen,
  onClose,
  schoolName,
  version,
  onNavigateToTab,
  initialModuleId,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-2 sm:p-4 md:p-6 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-7xl h-[94vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <SystemArchitectureHub
          onNavigateToTab={(tab) => {
            onNavigateToTab?.(tab);
            onClose();
          }}
          initialModuleId={initialModuleId}
          isModalMode={true}
          onClose={onClose}
        />
      </div>
    </div>
  );
};
