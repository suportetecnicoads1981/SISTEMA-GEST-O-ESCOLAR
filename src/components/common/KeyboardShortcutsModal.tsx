import React, { useState } from 'react';
import {
  Keyboard,
  X,
  Search,
  Zap,
  LayoutDashboard,
  Users,
  ClipboardList,
  Layers,
  BookOpen,
  HelpCircle,
  TrendingUp,
  Award,
  CheckCircle2,
  UserX,
  Building2,
  Key,
  Network,
  MessageSquare,
  Info,
  Bell,
  ArrowRight,
  Sliders,
  Box,
  Wrench,
  ShieldCheck,
  Database,
} from 'lucide-react';
import { SYSTEM_SHORTCUTS, ShortcutDefinition } from '../../hooks/useGlobalKeyboardShortcuts';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tabId: string) => void;
  currentActiveTab?: string;
}

const CATEGORY_METADATA: Record<
  string,
  { label: string; badge: string; color: string; bg: string; border: string }
> = {
  ESSENCIAL: {
    label: 'Navegação Essencial',
    badge: 'Mais Utilizados',
    color: 'text-indigo-700',
    bg: 'bg-indigo-50',
    border: 'border-indigo-200',
  },
  PEDAGOGICO: {
    label: 'Espaço Pedagógico & Avaliações',
    badge: 'Ensino & Provas',
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
  },
  GESTAO_TI: {
    label: 'Gestão Municipal & Infraestrutura',
    badge: 'Administração',
    color: 'text-purple-700',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
  },
  UTILIDADES: {
    label: 'Ações Globais & Produtividade',
    badge: 'Sistema',
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
  },
};

const TAB_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  MAIN_DASHBOARD: LayoutDashboard,
  ADMIN_TI: Sliders,
  STUDENTS: Users,
  EXAMS: ClipboardList,
  CLASSES: Layers,
  CLASS_DIARY: BookOpen,
  QUESTION_BANK: HelpCircle,
  PEDAGOGICAL_DASHBOARD: TrendingUp,
  DOCUMENTS: Award,
  STUDENT_ROOM: CheckCircle2,
  DROPOUT_CENSUS: UserX,
  MUNICIPAL_SYNC: Building2,
  USER_CONTROL: Key,
  NEXUS_INSTALL: Box,
  NEXUS_BUILD: Wrench,
  CLEANSLATE_HUB: ShieldCheck,
  DATASYNC_PRO: Database,
  NETWORK_INSTALLER: Network,
  WHATSAPP: MessageSquare,
  ABOUT: Info,
  NOTIFICATIONS: Bell,
};

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
  currentActiveTab,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const filteredShortcuts = SYSTEM_SHORTCUTS.filter((item) => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return true;
    return (
      item.label.toLowerCase().includes(q) ||
      item.displayKey.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q) ||
      item.key.toLowerCase().includes(q)
    );
  });

  const categories = ['ESSENCIAL', 'PEDAGOGICO', 'GESTAO_TI', 'UTILIDADES'] as const;

  const handleSelectShortcut = (item: ShortcutDefinition) => {
    if (item.tabId) {
      onNavigate(item.tabId);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 flex flex-col max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-900 to-slate-800 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/30">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">
                  Atalhos de Teclado Globais
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Alta Produtividade
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Pressione <kbd className="px-1.5 py-0.5 rounded bg-slate-700 font-mono text-[10px] text-white">Alt + Tecla</kbd> em qualquer tela para navegar instantaneamente
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-700/60 transition-colors cursor-pointer"
            title="Fechar (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Instructions Bar */}
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por atalho, módulo ou descrição (ex: 'Alt+P', 'provas', 'secretaria')..."
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-hidden font-medium text-slate-700 placeholder-slate-400"
              autoFocus
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                Limpar
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] font-semibold text-slate-500 hidden sm:inline">
              Dica rápida:
            </span>
            <div className="flex items-center gap-1 bg-white px-2.5 py-1.5 rounded-xl border border-slate-200 text-[11px] text-slate-600 shadow-2xs">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>Pressione <kbd className="font-mono font-bold text-slate-800">?</kbd> a qualquer hora</span>
            </div>
          </div>
        </div>

        {/* Shortcuts Content List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {filteredShortcuts.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <Keyboard className="w-12 h-12 text-slate-300 mx-auto" />
              <p className="text-sm font-semibold text-slate-600">
                Nenhum atalho encontrado para "{searchTerm}"
              </p>
              <button
                onClick={() => setSearchTerm('')}
                className="px-3 py-1.5 rounded-lg text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100"
              >
                Ver todos os atalhos
              </button>
            </div>
          ) : (
            categories.map((category) => {
              const items = filteredShortcuts.filter((s) => s.category === category);
              if (items.length === 0) return null;
              const meta = CATEGORY_METADATA[category];

              return (
                <div key={category} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold uppercase tracking-wider ${meta.color}`}>
                        {meta.label}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${meta.bg} ${meta.color} border ${meta.border}`}
                      >
                        {meta.badge}
                      </span>
                    </div>
                    <span className="text-[11px] font-medium text-slate-400">
                      {items.length} {items.length === 1 ? 'atalho' : 'atalhos'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {items.map((item) => {
                      const Icon = item.tabId ? TAB_ICONS[item.tabId] || Zap : Zap;
                      const isCurrent = item.tabId === currentActiveTab;

                      return (
                        <div
                          key={item.id}
                          onClick={() => handleSelectShortcut(item)}
                          className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between group ${
                            isCurrent
                              ? 'bg-indigo-50/80 border-indigo-200 ring-1 ring-indigo-300'
                              : 'bg-white border-slate-200 hover:border-indigo-300 hover:bg-slate-50/80 hover:shadow-xs'
                          }`}
                        >
                          <div className="flex items-start gap-3 min-w-0">
                            <div
                              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                                isCurrent
                                  ? 'bg-indigo-600 text-white'
                                  : 'bg-slate-100 text-slate-600 group-hover:bg-indigo-100 group-hover:text-indigo-700'
                              }`}
                            >
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-bold text-slate-800 truncate group-hover:text-indigo-600">
                                  {item.label}
                                </span>
                                {isCurrent && (
                                  <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-indigo-600 text-white">
                                    Ativo
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-500 line-clamp-1">
                                {item.description}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 pl-3 shrink-0">
                            <kbd className="px-2.5 py-1 bg-slate-900 text-white font-mono text-[11px] font-bold rounded-lg shadow-2xs border border-slate-700 group-hover:bg-indigo-700 transition-colors">
                              {item.displayKey}
                            </kbd>
                            {item.tabId && (
                              <ArrowRight className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-200 font-mono text-[10px] font-bold text-slate-700">
                Alt
              </kbd>
              <span>+ Tecla para ir direto</span>
            </span>
            <span className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-200 font-mono text-[10px] font-bold text-slate-700">
                Esc
              </kbd>
              <span>para fechar</span>
            </span>
          </div>

          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            Entendido, Continuar
          </button>
        </div>
      </div>
    </div>
  );
};
