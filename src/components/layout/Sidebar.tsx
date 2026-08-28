import React from 'react';
import {
  Users,
  Layers,
  Award,
  HelpCircle,
  ClipboardList,
  BarChart3,
  Network,
  ShieldCheck,
  Info,
  CheckCircle2,
  GraduationCap,
  Sparkles,
} from 'lucide-react';

interface SidebarProps {
  activeTab?: string;
  currentTab?: string;
  onSelectTab: (tab: string) => void;
  counts?: {
    students?: number;
    exams?: number;
    questions?: number;
    submissions?: number;
    unreadNotifications?: number;
    unreadMessages?: number;
  };
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  currentTab,
  onSelectTab,
  counts,
}) => {
  const current = activeTab || currentTab || 'PEDAGOGICAL_DASHBOARD';

  const menuSections = [
    {
      title: 'Menu Principal',
      items: [
        { id: 'STUDENTS', label: 'Secretariado & Alunos', icon: Users, count: counts?.students },
        { id: 'CLASSES', label: 'Turmas & Matrizes', icon: Layers },
        { id: 'DOCUMENTS', label: 'Documentos & Certificados', icon: Award, badge: 'Oficial' },
      ],
    },
    {
      title: 'Comunicação & Avisos',
      items: [
        {
          id: 'COMMUNICATION',
          label: 'Mural de Comunicados',
          icon: ClipboardList,
          badge: counts?.unreadMessages ? `${counts.unreadMessages} novos` : undefined,
        },
        {
          id: 'NOTIFICATIONS',
          label: 'Central de Notificações',
          icon: Sparkles,
          count: counts?.unreadNotifications,
        },
      ],
    },
    {
      title: 'Avaliações & Provas',
      items: [
        { id: 'QUESTION_BANK', label: 'Banco de Questões', icon: HelpCircle, count: counts?.questions },
        { id: 'EXAMS', label: 'Exames & Provas', icon: ClipboardList, count: counts?.exams },
        { id: 'STUDENT_ROOM', label: 'Sala de Prova (Aluno)', icon: CheckCircle2, badge: 'Ao Vivo' },
      ],
    },
    {
      title: 'Desempenho & Inteligência',
      items: [
        { id: 'PEDAGOGICAL_DASHBOARD', label: 'Relatórios Pedagógicos', icon: BarChart3, badge: 'Bento' },
      ],
    },
    {
      title: 'Sistema & Infraestrutura',
      items: [
        { id: 'NETWORK_INSTALLER', label: 'Configuração Rede / Server', icon: Network },
        { id: 'ABOUT', label: 'Sobre o Sistema & Dev', icon: Info },
      ],
    },
  ];

  return (
    <aside
      id="app-sidebar"
      className="no-print w-64 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 shrink-0 min-h-[calc(100vh-4rem)] h-full"
    >
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-md shadow-indigo-500/30">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div>
            <span className="text-white font-semibold tracking-tight text-sm block">EduGestão Pro</span>
            <span className="text-[10px] text-slate-400 font-mono block">v4.2 Enterprise</span>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-3 space-y-4 text-xs overflow-y-auto">
        {menuSections.map((section) => (
          <div key={section.title} className="space-y-1">
            <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              {section.title}
            </div>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = current === item.id;
                return (
                  <button
                    key={item.id}
                    id={`sidebar-link-${item.id.toLowerCase()}`}
                    onClick={() => onSelectTab(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg font-medium transition-all cursor-pointer ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon
                        className={`h-4 w-4 shrink-0 ${
                          isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                        }`}
                      />
                      <span className="truncate">{item.label}</span>
                    </div>

                    {item.count !== undefined ? (
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                          isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {item.count}
                      </span>
                    ) : item.badge ? (
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : item.badge === 'Ao Vivo'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-indigo-500/20 text-indigo-300'
                        }`}
                      >
                        {item.badge}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer System Status Banner in Bento style */}
      <div className="p-3 border-t border-slate-800 text-xs flex items-center justify-between bg-slate-950/40">
        <span className="flex items-center gap-1.5 text-[11px] text-slate-300">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          Servidor Ativo
        </span>
        <span className="text-[10px] font-mono text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded">
          Porta 3000
        </span>
      </div>
    </aside>
  );
};
