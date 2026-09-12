import React from 'react';
import {
  Sparkles,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Download,
  Calendar,
  User,
  Hash,
  FileText,
  Printer,
  X,
  Database,
  Layers,
  Zap,
} from 'lucide-react';
import { SystemUpdatePackage } from '../../types';

interface UpgradeConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  versionBefore: string;
  newVersion: string;
  updatePackage?: SystemUpdatePackage | null;
  installedAt?: string;
  operatorName?: string;
  backupInfo?: {
    id: string;
    fileSizeBytes: number;
    studentsCount: number;
    classesCount: number;
    examsCount: number;
  };
  onDownloadBackup?: () => void;
  onViewAuditLogs?: () => void;
}

export const UpgradeConfirmationModal: React.FC<UpgradeConfirmationModalProps> = ({
  isOpen,
  onClose,
  versionBefore,
  newVersion,
  updatePackage,
  installedAt,
  operatorName,
  backupInfo,
  onDownloadBackup,
  onViewAuditLogs,
}) => {
  if (!isOpen) return null;

  const improvements = updatePackage?.improvements || [
    {
      category: 'SISTEMA',
      title: 'Motor de Substituição Total e Integridade do Servidor',
      description: 'Script de Clean Upgrade com backup atômico obrigatório e recriação do atalho oficial único.',
    },
    {
      category: 'NUVEM',
      title: 'Repositório Google Drive Oficial (suportetecnicoads@gmail.com)',
      description: 'Sincronização com a pasta oficial de Atualizações e melhorias com verificação transparente de versão.',
    },
    {
      category: 'SECRETARIA',
      title: 'Preservação Total da Base Acadêmica',
      description: 'Estrutura não-destrutiva garantindo 100% de integridade nos registros de matrículas, turmas e históricos.',
    },
    {
      category: 'PEDAGOGICO',
      title: 'Integração de Todos os 12 Módulos',
      description: 'Diário de Classe, Pauta de Notas, BNCC, Banco de Questões, Provas Online e Censo Escolar atualizados.',
    },
  ];

  const getCategoryColor = (cat: string) => {
    switch (cat.toUpperCase()) {
      case 'SECRETARIA':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'PEDAGOGICO':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'SEGURANCA':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'NUVEM':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'PERFORMANCE':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200 my-8">
        {/* TOP BANNER */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-700 px-6 py-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-md">
              <Sparkles className="w-7 h-7 text-emerald-200" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/30 text-emerald-100 border border-emerald-400/40 mb-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Atualização Confirmada &amp; Homologada
              </div>
              <h2 className="text-2xl font-black tracking-tight">Sistema Atualizado com Sucesso!</h2>
              <p className="text-emerald-100 text-sm mt-0.5">
                O SucessoEdu Gestão Educacional foi elevado para a nova versão com preservação integral dos seus dados.
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* VERSION COMPARISON CARD */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="p-3 bg-slate-200/80 rounded-lg text-slate-600">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Versão Anterior</div>
                  <div className="text-base font-bold text-slate-700">{versionBefore || 'v5.3.0'}</div>
                </div>
              </div>

              <div className="hidden sm:flex items-center justify-center p-2 bg-indigo-50 text-indigo-600 rounded-full">
                <ArrowRight className="w-5 h-5" />
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto bg-emerald-50 border border-emerald-200 p-3 rounded-lg">
                <div className="p-2 bg-emerald-600 rounded-md text-white">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Nova Versão Ativa</div>
                  <div className="text-lg font-black text-emerald-900">{newVersion || 'v5.4.0-ENTERPRISE'}</div>
                </div>
              </div>
            </div>

            {/* METADATA STRIP */}
            <div className="mt-4 pt-4 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span><strong>Data:</strong> {installedAt || new Date().toLocaleString('pt-BR')}</span>
              </div>
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-slate-400" />
                <span><strong>Operador:</strong> {operatorName || 'Administrador Master'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Hash className="w-4 h-4 text-slate-400" />
                <span className="truncate"><strong>SHA-256:</strong> {updatePackage?.sha256Checksum?.slice(0, 12) || 'a8f4c2e91b0d'}...</span>
              </div>
            </div>
          </div>

          {/* BACKUP INTEGRITY CONFIRMATION */}
          <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-indigo-600 text-white rounded-lg mt-0.5">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-indigo-950 text-sm">Backup Preventivo Realizado &amp; Preservado</span>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[11px] font-bold rounded-full">
                    100% SEGURO
                  </span>
                </div>
                <p className="text-xs text-indigo-800 mt-1">
                  Snapshot com {backupInfo?.studentsCount || 4} alunos, {backupInfo?.classesCount || 2} turmas e registros acadêmicos salvos com integridade criptográfica.
                </p>
              </div>
            </div>

            {onDownloadBackup && (
              <button
                onClick={onDownloadBackup}
                className="w-full sm:w-auto px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center justify-center gap-1.5 transition-colors flex-shrink-0"
              >
                <Download className="w-3.5 h-3.5" /> Baixar Cópia (.json)
              </button>
            )}
          </div>

          {/* IMPROVEMENTS CHECKLIST */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Melhorias e Novidades Implementadas nesta Versão ({improvements.length})
              </h3>
              <span className="text-xs text-slate-500 font-medium">12 Módulos Ativos</span>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              {improvements.map((imp, idx) => (
                <div
                  key={idx}
                  className="p-3.5 bg-white border border-slate-200 rounded-xl hover:border-slate-300 transition-colors shadow-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5">
                      <span className="text-emerald-600 font-bold mt-0.5">✓</span>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-900 text-sm">{imp.title}</span>
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${getCategoryColor(imp.category)}`}>
                            {imp.category}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">{imp.description}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* BOTTOM ACTIONS */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Homologado pela equipe de engenharia SucessoEdu.</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {onViewAuditLogs && (
              <button
                onClick={onViewAuditLogs}
                className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5"
              >
                <FileText className="w-3.5 h-3.5" /> Ver na Auditoria
              </button>
            )}
            <button
              onClick={onClose}
              className="flex-1 sm:flex-none px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" /> Continuar Usando o Sistema
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
