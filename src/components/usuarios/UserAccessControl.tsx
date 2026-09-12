import React, { useState, useRef } from 'react';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  UserX,
  Plus,
  Search,
  Filter,
  Key,
  Lock,
  Unlock,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Mail,
  Phone,
  Clock,
  Sparkles,
  Edit2,
  Trash2,
  Save,
  X,
  Users,
  Eye,
  CheckSquare,
  Square,
  RefreshCw,
  HelpCircle,
  Award,
  ArrowLeft,
  Home,
  ChevronRight,
  Camera,
  Upload,
  Activity,
} from 'lucide-react';
import {
  UserAccount,
  UserSector,
  UserRole,
  ModulePermission,
  SystemModuleKey,
  SchoolUnit,
  SecurityAuditLog,
} from '../../types';

interface UserAccessControlProps {
  users: UserAccount[];
  currentUser: UserAccount;
  schoolUnits: SchoolUnit[];
  auditLogs?: SecurityAuditLog[];
  onUpdateUsers: (users: UserAccount[]) => void;
  onSwitchCurrentUser: (user: UserAccount) => void;
  onBack?: () => void;
  onNavigate?: (tab: string, payload?: any) => void;
}


const SECTOR_LABELS: Record<UserSector, { label: string; color: string; desc: string }> = {
  MASTER: {
    label: 'Cadastro Mestre (Super Admin)',
    color: 'bg-rose-100 text-rose-800 border-rose-300',
    desc: 'Controle total irrestrito do sistema, infraestrutura e permissões globais.',
  },
  DIRETORIA: {
    label: 'Diretoria & Gestão Escolar',
    color: 'bg-indigo-100 text-indigo-800 border-indigo-300',
    desc: 'Homologação institucional, atas, auditoria e relatórios executivos.',
  },
  COORDENACAO: {
    label: 'Coordenação Pedagógica',
    color: 'bg-purple-100 text-purple-800 border-purple-300',
    desc: 'Gestão pedagógica, aprovação de provas BNCC, recuperação e pareceres.',
  },
  SECRETARIA: {
    label: 'Secretaria Acadêmica',
    color: 'bg-blue-100 text-blue-800 border-blue-300',
    desc: 'Matrículas, emissão de documentos oficiais, históricos e censo escolar.',
  },
  PROFESSOR: {
    label: 'Corpo Docente / Professores',
    color: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    desc: 'Diário de classe, notas, frequências, elaboração e correção de avaliações.',
  },
  GESTOR_MUNICIPAL: {
    label: 'Secretaria Municipal de Educação (SME)',
    color: 'bg-amber-100 text-amber-800 border-amber-300',
    desc: 'Visão da rede municipal, unificação de dados de polos e censo integrado.',
  },
  ALUNO: {
    label: 'Aluno / Estudante',
    color: 'bg-cyan-100 text-cyan-800 border-cyan-300',
    desc: 'Acesso à sala de provas, consulta de notas, boletim e comunicados.',
  },
  RESPONSAVEL: {
    label: 'Pais & Responsáveis',
    color: 'bg-slate-100 text-slate-800 border-slate-300',
    desc: 'Acompanhamento do rendimento escolar, frequência e comunicados.',
  },
};

const MODULE_DEFINITIONS: { key: SystemModuleKey; label: string; description: string }[] = [
  { key: 'dashboard', label: 'Dashbox & Indicadores Gerais', description: 'Painel principal, alertas de anomalias e gráficos de saúde da rede' },
  { key: 'portalProfessor', label: 'Portal do Professor & Gestão Docente', description: 'Painel completo do professor: diário, chamada, pauta de notas, provas e gabaritos' },
  { key: 'diarioClasse', label: 'Diário de Classe & Frequência', description: 'Registro de conteúdos diários, normativas estaduais e controle de frequência' },
  { key: 'secretaria', label: 'Secretaria & Matrículas', description: 'Cadastro de alunos, RA, dados cadastrais e transferências' },
  { key: 'turmas', label: 'Turmas & Matrizes Curriculares', description: 'Alocação de salas, capacidades, turnos e docentes' },
  { key: 'documentos', label: 'Documentos Oficiais & Certificados', description: 'Históricos escolares, declarações, boletins com autenticação' },
  { key: 'comunicacao', label: 'Mural de Avisos & Notificações', description: 'Envio de comunicados em massa, canais e avisos segmentados' },
  { key: 'questoes', label: 'Banco de Questões BNCC', description: 'Cadastro de itens, habilidades, gabaritos e distratores' },
  { key: 'provas', label: 'Gerador & Gestão de Provas', description: 'Elaboração de exames, regras de pontuação e cronômetro' },
  { key: 'relatorios', label: 'Evolução Pedagógica & Relatórios', description: 'Gráficos de notas bimensais, recuperação e diagnóstico BNCC' },
  { key: 'gestaoMunicipal', label: 'Gestão Municipal & Polos Remotos', description: 'Sincronização .edusync de escolas fora da rede e censo unificado' },
  { key: 'usuarios', label: 'Controle de Usuários & Perfis', description: 'Gerenciamento de contas, setores e matriz de permissões' },
  { key: 'configuracoes', label: 'Configurações do Sistema & Backup', description: 'Dados institucionais, instaladores de rede e snapshots de segurança' },
];

export const UserAccessControl: React.FC<UserAccessControlProps> = ({
  users,
  currentUser,
  schoolUnits,
  auditLogs = [],
  onUpdateUsers,
  onSwitchCurrentUser,
  onBack,
  onNavigate,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSectorFilter, setSelectedSectorFilter] = useState<string>('ALL');
  const [isEditingModalOpen, setIsEditingModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form State for Modal
  const [formData, setFormData] = useState<{
    id: string;
    name: string;
    login: string;
    email: string;
    phone: string;
    sector: UserSector;
    sectorTitle: string;
    schoolUnitId: string;
    isMaster: boolean;
    active: boolean;
    avatarUrl?: string;
    permissions: Record<SystemModuleKey, ModulePermission>;
  }>({
    id: '',
    name: '',
    login: '',
    email: '',
    phone: '',
    sector: 'SECRETARIA',
    sectorTitle: 'Secretário Escolar',
    schoolUnitId: schoolUnits[0]?.id || '',
    isMaster: false,
    active: true,
    avatarUrl: '',
    permissions: {} as any,
  });

  const photoInputRef = useRef<HTMLInputElement>(null);
  const [activeMainTab, setActiveMainTab] = useState<'USERS' | 'AUDIT'>('USERS');

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        setFormData((prev) => ({
          ...prev,
          avatarUrl: evt.target?.result as string,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const getEmptyPermissions = (): Record<SystemModuleKey, ModulePermission> => {
    const res: any = {};
    MODULE_DEFINITIONS.forEach((mod) => {
      res[mod.key] = {
        canRead: true,
        canCreate: false,
        canEdit: false,
        canDelete: false,
        canApprove: false,
      };
    });
    return res;
  };

  const getMasterPermissions = (): Record<SystemModuleKey, ModulePermission> => {
    const res: any = {};
    MODULE_DEFINITIONS.forEach((mod) => {
      res[mod.key] = {
        canRead: true,
        canCreate: true,
        canEdit: true,
        canDelete: true,
        canApprove: true,
      };
    });
    return res;
  };

  const handleOpenCreateModal = () => {
    setEditingUser(null);
    setFormData({
      id: `user-${Date.now()}`,
      name: '',
      login: '',
      email: '',
      phone: '',
      sector: 'SECRETARIA',
      sectorTitle: 'Secretário(a) Escolar',
      schoolUnitId: schoolUnits[0]?.id || '',
      isMaster: false,
      active: true,
      avatarUrl: '',
      permissions: getEmptyPermissions(),
    });
    setIsEditingModalOpen(true);
  };

  const handleOpenEditModal = (user: UserAccount) => {
    setEditingUser(user);
    setFormData({
      id: user.id,
      name: user.name,
      login: user.login,
      email: user.email,
      phone: user.phone || '',
      sector: user.sector,
      sectorTitle: user.sectorTitle,
      schoolUnitId: user.schoolUnitId || '',
      isMaster: user.isMaster,
      active: user.active,
      avatarUrl: user.avatarUrl || '',
      permissions: JSON.parse(JSON.stringify(user.permissions)),
    });
    setIsEditingModalOpen(true);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.login.trim()) {
      alert('Preencha o Nome e o Login do usuário.');
      return;
    }

    const unit = schoolUnits.find((u) => u.id === formData.schoolUnitId);
    let mappedRole: UserRole = 'ADMIN';
    if (formData.sector === 'PROFESSOR') mappedRole = 'TEACHER';
    else if (formData.sector === 'ALUNO') mappedRole = 'STUDENT';
    else if (formData.sector === 'RESPONSAVEL') mappedRole = 'PARENT';

    const updatedUserObj: UserAccount = {
      id: formData.id,
      name: formData.name.trim(),
      login: formData.login.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      role: mappedRole,
      sector: formData.sector,
      sectorTitle: formData.sectorTitle.trim() || SECTOR_LABELS[formData.sector].label,
      schoolUnitId: formData.schoolUnitId || undefined,
      schoolUnitName: unit?.name || undefined,
      isMaster: formData.isMaster,
      active: formData.active,
      avatarUrl: formData.avatarUrl || undefined,
      permissions: formData.isMaster ? getMasterPermissions() : formData.permissions,
      createdAt: editingUser ? editingUser.createdAt : new Date().toISOString(),
      lastLogin: editingUser ? editingUser.lastLogin : undefined,
    };

    let updatedList: UserAccount[];
    if (editingUser) {
      updatedList = users.map((u) => (u.id === editingUser.id ? updatedUserObj : u));
    } else {
      updatedList = [updatedUserObj, ...users];
    }

    onUpdateUsers(updatedList);
    setIsEditingModalOpen(false);
    setSuccessMessage(`Usuário "${updatedUserObj.name}" salvo com sucesso!`);
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  const handleToggleUserActive = (user: UserAccount) => {
    if (user.isMaster) {
      alert('O Cadastro Mestre não pode ser desativado por motivos de segurança.');
      return;
    }
    const updated = users.map((u) => (u.id === user.id ? { ...u, active: !u.active } : u));
    onUpdateUsers(updated);
  };

  const handleDeleteUser = (user: UserAccount) => {
    if (user.isMaster) {
      alert('O Cadastro Mestre não pode ser excluído.');
      return;
    }
    if (window.confirm(`Tem certeza que deseja remover o usuário "${user.name}"?`)) {
      const updated = users.filter((u) => u.id !== user.id);
      onUpdateUsers(updated);
      setSuccessMessage(`Usuário removido.`);
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  };

  const handlePermissionChange = (
    moduleKey: SystemModuleKey,
    action: keyof ModulePermission,
    value: boolean
  ) => {
    setFormData((prev) => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [moduleKey]: {
          ...prev.permissions[moduleKey],
          [action]: value,
        },
      },
    }));
  };

  const handleSetFullModulePermission = (moduleKey: SystemModuleKey, grantAll: boolean) => {
    setFormData((prev) => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [moduleKey]: {
          canRead: grantAll,
          canCreate: grantAll,
          canEdit: grantAll,
          canDelete: grantAll,
          canApprove: grantAll,
        },
      },
    }));
  };

  const filteredUsers = users.filter((u) => {
    const matchSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.login.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.sectorTitle.toLowerCase().includes(searchTerm.toLowerCase());
    const matchSector = selectedSectorFilter === 'ALL' || u.sector === selectedSectorFilter;
    return matchSearch && matchSector;
  });

  return (
    <div className="space-y-4">
      {/* Module Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onBack ? onBack() : onNavigate?.('MAIN_DASHBOARD')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 text-xs font-bold transition-all border border-slate-200 cursor-pointer shadow-2xs group"
            title="Voltar ao Dashbox Principal"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
            <span>Voltar ao Início</span>
          </button>
          <div className="hidden sm:flex items-center gap-1 text-xs text-slate-400 ml-1">
            <span>Início</span>
            <ChevronRight className="h-3 w-3 text-slate-300" />
            <span className="font-bold text-slate-800">Controle de Usuários & Níveis de Acesso</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveMainTab('USERS')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeMainTab === 'USERS'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            <span>Usuários ({users.length})</span>
          </button>

          <button
            onClick={() => setActiveMainTab('AUDIT')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeMainTab === 'AUDIT'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <Activity className="h-3.5 w-3.5 text-emerald-400" />
            <span>Trilha de Auditoria & Logs ({auditLogs?.length || 0})</span>
          </button>
        </div>
      </div>

      {/* Top Banner with Master Badge */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-indigo-900/50 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold">
              <ShieldCheck className="h-4 w-4" />
              Segurança & Perfis de Acesso Multi-Setores
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Controle de Usuários & Cadastro Mestre
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Defina com precisão cirúrgica os níveis de acesso para Diretoria, Coordenação, Secretaria, Professores, Gestores SME e Cadastro Mestre Irrestrito.
            </p>
          </div>

          {/* Current Active User Status Widget */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 shrink-0 min-w-[280px]">
            <div className="flex items-center justify-between gap-3 mb-2">
              <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                Perfil em Uso no Momento:
              </span>
              {currentUser.isMaster && (
                <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-black tracking-wider uppercase">
                  MASTER ATIVO
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-indigo-500/30 border border-indigo-400/40 flex items-center justify-center text-white font-black text-sm">
                {currentUser.name.charAt(0)}
              </div>
              <div className="overflow-hidden">
                <div className="font-bold text-white text-sm truncate">{currentUser.name}</div>
                <div className="text-xs text-indigo-200 truncate">{currentUser.sectorTitle}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Success Notification Alert */}
      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3 text-emerald-800 text-sm font-semibold shadow-xs animate-fade-in">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Sector Quick Metric Counters & Users List OR Audit Logs View */}
      {activeMainTab === 'USERS' ? (
        <>
          {/* Sector Quick Metric Counters */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {(Object.keys(SECTOR_LABELS) as UserSector[]).map((sec) => {
              const count = users.filter((u) => u.sector === sec).length;
              const isSelected = selectedSectorFilter === sec;
              return (
                <button
                  key={sec}
                  onClick={() => setSelectedSectorFilter(isSelected ? 'ALL' : sec)}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-md ring-2 ring-indigo-300'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
                  }`}
                >
                  <span className={`text-[10px] font-bold block uppercase truncate ${isSelected ? 'text-indigo-100' : 'text-slate-500'}`}>
                    {sec === 'MASTER' ? '👑 Master' : sec}
                  </span>
                  <div className="text-xl font-black mt-1">{count}</div>
                  <span className={`text-[10px] truncate block ${isSelected ? 'text-indigo-200' : 'text-slate-400'}`}>
                    {count === 1 ? '1 usuário' : `${count} usuários`}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search & Actions Bar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full sm:w-auto flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar por nome, login, setor ou e-mail..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
              </div>

              <select
                value={selectedSectorFilter}
                onChange={(e) => setSelectedSectorFilter(e.target.value)}
                className="px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value="ALL">Todos os Setores ({users.length})</option>
                {(Object.keys(SECTOR_LABELS) as UserSector[]).map((sec) => (
                  <option key={sec} value={sec}>
                    {SECTOR_LABELS[sec].label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                onClick={handleOpenCreateModal}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                Novo Usuário / Operador
              </button>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[11px] tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">Operador / Login</th>
                    <th className="py-3.5 px-4">Setor & Cargo</th>
                    <th className="py-3.5 px-4">Unidade de Lotação</th>
                    <th className="py-3.5 px-4">Permissões</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredUsers.map((user) => {
                    const sectorInfo = SECTOR_LABELS[user.sector] || SECTOR_LABELS.SECRETARIA;
                    const isCurrentlyLogged = currentUser.id === user.id;

                    return (
                      <tr
                        key={user.id}
                        className={`hover:bg-slate-50/80 transition-colors ${
                          user.isMaster ? 'bg-rose-50/30' : ''
                        }`}
                      >
                        {/* User info */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            {user.avatarUrl ? (
                              <img
                                src={user.avatarUrl}
                                alt={user.name}
                                className="h-9 w-9 rounded-xl object-cover border border-indigo-200 shrink-0 shadow-xs"
                              />
                            ) : (
                              <div
                                className={`h-9 w-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                                  user.isMaster
                                    ? 'bg-rose-600 text-white shadow-sm'
                                    : 'bg-indigo-100 text-indigo-700'
                                }`}
                              >
                                {user.isMaster ? '👑' : user.name.charAt(0)}
                              </div>
                            )}
                            <div>
                              <div className="font-bold text-slate-900 flex items-center gap-2">
                                <span>{user.name}</span>
                                {user.isMaster && (
                                  <span className="px-1.5 py-0.5 rounded-md bg-rose-100 border border-rose-300 text-rose-800 text-[10px] font-black">
                                    MESTRE
                                  </span>
                                )}
                                {isCurrentlyLogged && (
                                  <span className="px-1.5 py-0.5 rounded-md bg-emerald-100 border border-emerald-300 text-emerald-800 text-[10px] font-black">
                                    VOCÊ
                                  </span>
                                )}
                              </div>
                              <div className="text-slate-400 text-xs flex items-center gap-2 mt-0.5">
                                <span>@{user.login}</span>
                                <span>•</span>
                                <span>{user.email}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Sector */}
                        <td className="py-3.5 px-4">
                          <div className="space-y-1">
                            <span
                              className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold border ${sectorInfo.color}`}
                            >
                              {user.sectorTitle || sectorInfo.label}
                            </span>
                            <div className="text-[11px] text-slate-500 max-w-xs line-clamp-1">
                              {sectorInfo.desc}
                            </div>
                          </div>
                        </td>

                        {/* School Unit */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                            <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            <span>{user.schoolUnitName || 'Rede Municipal Global (Todas)'}</span>
                          </div>
                        </td>

                        {/* Permissions summary */}
                        <td className="py-3.5 px-4">
                          {user.isMaster ? (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-50 px-2 py-1 rounded-lg border border-rose-200">
                              <Sparkles className="h-3.5 w-3.5 text-rose-500" />
                              Acesso Total Irrestrito
                            </span>
                          ) : (
                            <div className="text-xs space-y-0.5">
                              <span className="font-semibold text-slate-800">
                                {
                                  Object.values(user.permissions || {}).filter(
                                    (p: any) => p.canCreate || p.canEdit || p.canApprove
                                  ).length
                                }{' '}
                                módulos ativos
                              </span>
                              <div className="text-[11px] text-slate-400">
                                {user.permissions?.provas?.canApprove
                                  ? 'Homologa Provas • '
                                  : ''}
                                {user.permissions?.secretaria?.canEdit ? 'Secretaria • ' : ''}
                                {user.permissions?.gestaoMunicipal?.canRead ? 'Censo SME' : ''}
                              </div>
                            </div>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4">
                          <button
                            onClick={() => handleToggleUserActive(user)}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold cursor-pointer transition-colors ${
                              user.active
                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            <span
                              className={`h-2 w-2 rounded-full ${
                                user.active ? 'bg-emerald-500' : 'bg-slate-400'
                              }`}
                            />
                            {user.active ? 'Ativo' : 'Inativo'}
                          </button>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => onSwitchCurrentUser(user)}
                              title="Alternar para este usuário e testar visão"
                              className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 border border-transparent hover:border-indigo-200 transition-colors cursor-pointer text-xs font-bold inline-flex items-center gap-1"
                            >
                              <RefreshCw className="h-3.5 w-3.5" />
                              <span className="hidden xl:inline">Simular</span>
                            </button>

                            <button
                              onClick={() => handleOpenEditModal(user)}
                              title="Editar cadastro e permissões"
                              className="p-1.5 rounded-lg text-slate-600 hover:text-indigo-600 hover:bg-slate-100 transition-colors cursor-pointer"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>

                            {!user.isMaster && (
                              <button
                                onClick={() => handleDeleteUser(user)}
                                title="Remover usuário"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* AUDIT LOGS VIEW */
        <div className="space-y-4">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Activity className="h-4 w-4 text-emerald-600" />
                  Trilha de Auditoria & Registro de Ações dos Operadores
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Auditoria em tempo real de autenticações, alterações de notas, emissão de documentos e comandos administrativos.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Data / Hora</th>
                    <th className="py-3 px-4">Operador</th>
                    <th className="py-3 px-4">Ação Executada</th>
                    <th className="py-3 px-4">Módulo</th>
                    <th className="py-3 px-4">Endereço IP</th>
                    <th className="py-3 px-4">Gravidade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px] text-slate-700">
                  {auditLogs && auditLogs.length > 0 ? (
                    auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4 text-slate-500 font-sans">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900 font-sans">
                          {log.userName} ({log.userRole})
                        </td>
                        <td className="py-3 px-4 font-sans text-slate-800">
                          {log.details || log.actionType}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 uppercase font-bold text-[9px]">
                            {log.module}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-500">{log.ipAddress || '192.168.1.100'}</td>
                        <td className="py-3 px-4 font-sans">
                          <span
                            className={`px-2 py-0.5 rounded-full font-bold text-[9px] ${
                              log.status === 'BLOQUEADO'
                                ? 'bg-rose-100 text-rose-800'
                                : log.status === 'ALERTA'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {log.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-slate-400 font-sans">
                        Nenhum registro de auditoria arquivado no momento.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Criar / Editar Usuário com Matriz de Permissões */}
      {isEditingModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-scale-up">
            {/* Modal Header */}
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center font-bold">
                  {formData.isMaster ? '👑' : <Shield className="h-5 w-5" />}
                </div>
                <div>
                  <h3 className="font-black text-lg">
                    {editingUser ? 'Editar Conta de Usuário & Permissões' : 'Cadastrar Novo Operador'}
                  </h3>
                  <p className="text-xs text-slate-300">
                    Defina o setor, unidade de lotação e matriz de permissões por módulo
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsEditingModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveUser} className="p-6 overflow-y-auto flex-1 space-y-6">
              {/* Photo Upload Profile Area */}
              <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="relative group shrink-0">
                  <div className="h-20 w-20 rounded-2xl bg-indigo-100 border-2 border-dashed border-indigo-300 flex items-center justify-center overflow-hidden shadow-inner">
                    {formData.avatarUrl ? (
                      <img
                        src={formData.avatarUrl}
                        alt="Foto de Perfil"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="text-center text-indigo-400">
                        <Camera className="h-7 w-7 mx-auto opacity-70" />
                        <span className="text-[9px] font-bold">Sem Foto</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5 flex-1 text-center sm:text-left">
                  <h4 className="text-xs font-bold text-slate-800">
                    Fotografia do Profissional / Usuário
                  </h4>
                  <p className="text-xs text-slate-500">
                    Adicione uma foto de identificação para crachá digital, pauta e registro de auditoria.
                  </p>
                  <div className="flex items-center gap-2 pt-1 justify-center sm:justify-start">
                    <label className="py-1.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 cursor-pointer transition-all">
                      <Upload className="h-3.5 w-3.5" />
                      <span>{formData.avatarUrl ? 'Alterar Foto' : 'Carregar Foto'}</span>
                      <input
                        ref={photoInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                    </label>
                    {formData.avatarUrl && (
                      <button
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, avatarUrl: '' }))}
                        className="py-1.5 px-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs border border-rose-200 cursor-pointer transition-colors"
                      >
                        Remover
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Basic Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Profa. Renata Vasconcelos"
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Login de Acesso *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.login}
                    onChange={(e) => setFormData({ ...formData, login: e.target.value })}
                    placeholder="Ex: renata.coord"
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    E-mail Institucional
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Ex: renata@escola.gov.br"
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Setor Institucional *
                  </label>
                  <select
                    value={formData.sector}
                    onChange={(e) => {
                      const newSector = e.target.value as UserSector;
                      setFormData({
                        ...formData,
                        sector: newSector,
                        sectorTitle: SECTOR_LABELS[newSector].label,
                        isMaster: newSector === 'MASTER',
                      });
                    }}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-semibold"
                  >
                    {(Object.keys(SECTOR_LABELS) as UserSector[]).map((sec) => (
                      <option key={sec} value={sec}>
                        {SECTOR_LABELS[sec].label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Título / Cargo Personalizado
                  </label>
                  <input
                    type="text"
                    value={formData.sectorTitle}
                    onChange={(e) => setFormData({ ...formData, sectorTitle: e.target.value })}
                    placeholder="Ex: Secretário Escolar Adjunto"
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Unidade Escolar de Lotação
                  </label>
                  <select
                    value={formData.schoolUnitId}
                    onChange={(e) => setFormData({ ...formData, schoolUnitId: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    <option value="">Rede Municipal Global (Todas as Unidades)</option>
                    {schoolUnits.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.type})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Master Account Special Banner */}
              <div
                className={`p-4 rounded-2xl border transition-all ${
                  formData.isMaster
                    ? 'bg-rose-50 border-rose-300 text-rose-900'
                    : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-9 w-9 rounded-xl flex items-center justify-center font-black ${
                        formData.isMaster ? 'bg-rose-600 text-white' : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      👑
                    </div>
                    <div>
                      <div className="font-bold text-sm">Privilégio de Cadastro Mestre</div>
                      <div className="text-xs opacity-80">
                        O usuário Mestre tem autorização irrestrita para modificar qualquer registro, criar outros administradores e desbloquear funções críticas.
                      </div>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isMaster}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          isMaster: e.target.checked,
                          sector: e.target.checked ? 'MASTER' : formData.sector,
                        })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-600"></div>
                  </label>
                </div>
              </div>

              {/* Granular Permissions Matrix */}
              {!formData.isMaster && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                        <Key className="h-4 w-4 text-indigo-600" />
                        Matriz de Permissões Granulares por Módulo
                      </h4>
                      <p className="text-xs text-slate-500">
                        Defina o que este usuário pode Ler, Criar, Editar, Excluir ou Homologar em cada módulo do sistema
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, permissions: getMasterPermissions() })}
                        className="px-2.5 py-1 text-xs font-bold rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors"
                      >
                        Marcar Tudo
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, permissions: getEmptyPermissions() })}
                        className="px-2.5 py-1 text-xs font-bold rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                      >
                        Limpar Tudo
                      </button>
                    </div>
                  </div>

                  <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                        <tr>
                          <th className="py-2.5 px-3">Módulo do Sistema</th>
                          <th className="py-2.5 px-2 text-center">Visualizar (Ler)</th>
                          <th className="py-2.5 px-2 text-center">Cadastrar (Criar)</th>
                          <th className="py-2.5 px-2 text-center">Modificar (Editar)</th>
                          <th className="py-2.5 px-2 text-center">Remover (Excluir)</th>
                          <th className="py-2.5 px-2 text-center">Homologar (Aprovar)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {MODULE_DEFINITIONS.map((mod) => {
                          const perm = formData.permissions[mod.key] || {
                            canRead: false,
                            canCreate: false,
                            canEdit: false,
                            canDelete: false,
                            canApprove: false,
                          };

                          return (
                            <tr key={mod.key} className="hover:bg-slate-50/70 transition-colors">
                              <td className="py-2.5 px-3">
                                <div className="font-bold text-slate-900">{mod.label}</div>
                                <div className="text-[10px] text-slate-400">{mod.description}</div>
                              </td>

                              <td className="py-2.5 px-2 text-center">
                                <input
                                  type="checkbox"
                                  checked={perm.canRead}
                                  onChange={(e) =>
                                    handlePermissionChange(mod.key, 'canRead', e.target.checked)
                                  }
                                  className="h-4 w-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                                />
                              </td>

                              <td className="py-2.5 px-2 text-center">
                                <input
                                  type="checkbox"
                                  checked={perm.canCreate}
                                  onChange={(e) =>
                                    handlePermissionChange(mod.key, 'canCreate', e.target.checked)
                                  }
                                  className="h-4 w-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                                />
                              </td>

                              <td className="py-2.5 px-2 text-center">
                                <input
                                  type="checkbox"
                                  checked={perm.canEdit}
                                  onChange={(e) =>
                                    handlePermissionChange(mod.key, 'canEdit', e.target.checked)
                                  }
                                  className="h-4 w-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                                />
                              </td>

                              <td className="py-2.5 px-2 text-center">
                                <input
                                  type="checkbox"
                                  checked={perm.canDelete}
                                  onChange={(e) =>
                                    handlePermissionChange(mod.key, 'canDelete', e.target.checked)
                                  }
                                  className="h-4 w-4 text-rose-600 rounded border-slate-300 focus:ring-rose-500"
                                />
                              </td>

                              <td className="py-2.5 px-2 text-center">
                                <input
                                  type="checkbox"
                                  checked={perm.canApprove}
                                  onChange={(e) =>
                                    handlePermissionChange(mod.key, 'canApprove', e.target.checked)
                                  }
                                  className="h-4 w-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Modal Footer Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsEditingModalOpen(false)}
                  className="px-4 py-2.5 text-xs sm:text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 text-xs sm:text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Save className="h-4 w-4" />
                  Salvar Usuário & Permissões
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
