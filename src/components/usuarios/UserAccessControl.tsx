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
  EyeOff,
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
  Layers,
  Check,
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
import { UserManagementTable } from './UserManagementTable';
import { hashPassword, PASSWORD_MASK } from '../../utils/passwordHasher';
import { getSupabaseClient } from '../../services/datasync/supabaseClient';
import { confirmDialog, notify } from '../../utils/dialogs';

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

export const SECTOR_LABELS: Record<
  UserSector,
  { label: string; shortLabel: string; color: string; desc: string; defaultRole: UserRole }
> = {
  MASTER: {
    label: 'Cadastro Mestre (Super Admin TI)',
    shortLabel: 'Master TI',
    color: 'bg-rose-100 text-rose-800 border-rose-300',
    desc: 'Controle irrestrito total de banco, deploy, infraestrutura, usuários e permissões.',
    defaultRole: 'ADMIN',
  },
  DIRETORIA: {
    label: 'Diretoria & Gestão Executiva',
    shortLabel: 'Diretoria',
    color: 'bg-indigo-100 text-indigo-800 border-indigo-300',
    desc: 'Homologação institucional, atas, auditoria geral, atas de conselho e relatórios executivos.',
    defaultRole: 'ADMIN',
  },
  COORDENACAO: {
    label: 'Coordenação Pedagógica',
    shortLabel: 'Coordenação',
    color: 'bg-purple-100 text-purple-800 border-purple-300',
    desc: 'Supervisão pedagógica, validação de pautas, banco de itens BNCC, recuperação e pareceres.',
    defaultRole: 'ADMIN',
  },
  SECRETARIA: {
    label: 'Secretaria Acadêmica',
    shortLabel: 'Secretaria',
    color: 'bg-blue-100 text-blue-800 border-blue-300',
    desc: 'Matrículas, emissão oficial de históricos e certificados, censo escolar e turmas.',
    defaultRole: 'ADMIN',
  },
  PROFESSOR: {
    label: 'Corpo Docente / Professor',
    shortLabel: 'Professor',
    color: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    desc: 'Diário de classe, registro de presenças/chamada, notas, provas e planos de aula.',
    defaultRole: 'TEACHER',
  },
  GESTOR_MUNICIPAL: {
    label: 'Secretaria Municipal de Educação (SME)',
    shortLabel: 'Gestor SME',
    color: 'bg-amber-100 text-amber-800 border-amber-300',
    desc: 'Visão da rede municipal, censo unificado e sincronização de polos remotos .edusync.',
    defaultRole: 'ADMIN',
  },
  ALUNO: {
    label: 'Aluno / Estudante Matriculado',
    shortLabel: 'Aluno',
    color: 'bg-cyan-100 text-cyan-800 border-cyan-300',
    desc: 'Acesso à sala de provas online, consulta de boletim, notas e comunicados escolares.',
    defaultRole: 'STUDENT',
  },
  RESPONSAVEL: {
    label: 'Pais & Responsáveis Legais',
    shortLabel: 'Responsável',
    color: 'bg-slate-100 text-slate-800 border-slate-300',
    desc: 'Acompanhamento do rendimento pedagógico do aluno, frequência e avisos da escola.',
    defaultRole: 'PARENT',
  },
};

export const MODULE_DEFINITIONS: { key: SystemModuleKey; label: string; description: string }[] = [
  { key: 'dashboard', label: 'Dashbox & Indicadores Gerais', description: 'Painel principal, alertas de anomalias e gráficos de saúde da rede' },
  { key: 'portalProfessor', label: 'Portal do Professor & Gestão Docente', description: 'Diário, chamada rápida, pauta de notas, provas e planos de aula' },
  { key: 'diarioClasse', label: 'Diário de Classe & Frequência', description: 'Registro de conteúdos diários, normativas e controle de faltas' },
  { key: 'secretaria', label: 'Secretaria & Matrículas', description: 'Cadastro de alunos, RA, dados cadastrais, turmas e transferências' },
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

export const getDefaultSectorPermissions = (
  sector: UserSector
): Record<SystemModuleKey, ModulePermission> => {
  const res: any = {};
  MODULE_DEFINITIONS.forEach((mod) => {
    if (sector === 'MASTER') {
      res[mod.key] = { canRead: true, canCreate: true, canEdit: true, canDelete: true, canApprove: true };
    } else if (sector === 'DIRETORIA') {
      res[mod.key] = { canRead: true, canCreate: true, canEdit: true, canDelete: false, canApprove: true };
    } else if (sector === 'COORDENACAO') {
      const isPedagogical = ['dashboard', 'portalProfessor', 'diarioClasse', 'questoes', 'provas', 'relatorios', 'comunicacao'].includes(mod.key);
      res[mod.key] = {
        canRead: true,
        canCreate: isPedagogical,
        canEdit: isPedagogical,
        canDelete: false,
        canApprove: isPedagogical,
      };
    } else if (sector === 'SECRETARIA') {
      const isSec = ['dashboard', 'secretaria', 'turmas', 'documentos', 'comunicacao'].includes(mod.key);
      res[mod.key] = {
        canRead: isSec || ['relatorios'].includes(mod.key),
        canCreate: isSec,
        canEdit: isSec,
        canDelete: false,
        canApprove: isSec,
      };
    } else if (sector === 'PROFESSOR') {
      const isTeacher = ['portalProfessor', 'diarioClasse', 'questoes', 'provas'].includes(mod.key);
      res[mod.key] = {
        canRead: isTeacher || ['dashboard', 'comunicacao', 'relatorios'].includes(mod.key),
        canCreate: isTeacher,
        canEdit: isTeacher,
        canDelete: false,
        canApprove: false,
      };
    } else if (sector === 'GESTOR_MUNICIPAL') {
      const isGov = ['dashboard', 'gestaoMunicipal', 'relatorios', 'documentos', 'comunicacao'].includes(mod.key);
      res[mod.key] = {
        canRead: isGov,
        canCreate: isGov,
        canEdit: isGov,
        canDelete: false,
        canApprove: isGov,
      };
    } else if (sector === 'ALUNO') {
      res[mod.key] = {
        canRead: ['provas', 'relatorios', 'comunicacao', 'documentos'].includes(mod.key),
        canCreate: false,
        canEdit: false,
        canDelete: false,
        canApprove: false,
      };
    } else {
      // RESPONSAVEL
      res[mod.key] = {
        canRead: ['relatorios', 'comunicacao', 'documentos'].includes(mod.key),
        canCreate: false,
        canEdit: false,
        canDelete: false,
        canApprove: false,
      };
    }
  });
  return res;
};

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
  const [activeMainTab, setActiveMainTab] = useState<'USERS' | 'RBAC' | 'MATRIX' | 'AUDIT'>('USERS');
  const [isEditingModalOpen, setIsEditingModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);
  const [deleteCandidateUser, setDeleteCandidateUser] = useState<UserAccount | null>(null);
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [cloudMessage, setCloudMessage] = useState<{ ok: boolean; text: string } | null>(null);

  // Form State for Create/Edit Modal
  const [formData, setFormData] = useState<{
    id: string;
    name: string;
    login: string;
    password?: string;
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
    password: '',
    email: '',
    phone: '',
    sector: 'SECRETARIA',
    sectorTitle: 'Secretário(a) Escolar',
    schoolUnitId: schoolUnits[0]?.id || '',
    isMaster: false,
    active: true,
    avatarUrl: '',
    permissions: getDefaultSectorPermissions('SECRETARIA'),
  });

  const photoInputRef = useRef<HTMLInputElement>(null);

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

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$';
    let pwd = 'Edu';
    for (let i = 0; i < 6; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData((prev) => ({ ...prev, password: pwd }));
    setShowPassword(true);
  };

  const handleOpenCreateModal = () => {
    setEditingUser(null);
    setShowPassword(false);
    setFormData({
      id: `usr-${Date.now()}`,
      name: '',
      login: '',
      password: 'Edu' + Math.floor(1000 + Math.random() * 9000),
      email: '',
      phone: '',
      sector: 'SECRETARIA',
      sectorTitle: 'Secretário(a) Escolar',
      schoolUnitId: schoolUnits[0]?.id || '',
      isMaster: false,
      active: true,
      avatarUrl: '',
      permissions: getDefaultSectorPermissions('SECRETARIA'),
    });
    setIsEditingModalOpen(true);
  };

  const handleOpenEditModal = (user: UserAccount) => {
    setEditingUser(user);
    setShowPassword(false);
    setFormData({
      id: user.id,
      name: user.name,
      login: user.login,
      // A senha armazenada é um hash e nunca é exibida; campo vazio mantém a senha atual.
      password: '',
      email: user.email,
      phone: user.phone || '',
      sector: user.sector,
      sectorTitle: user.sectorTitle,
      schoolUnitId: user.schoolUnitId || '',
      isMaster: user.isMaster,
      active: user.active,
      avatarUrl: user.avatarUrl || '',
      permissions: user.permissions
        ? JSON.parse(JSON.stringify(user.permissions))
        : getDefaultSectorPermissions(user.sector),
    });
    setIsEditingModalOpen(true);
  };

  const handleSectorChangeInForm = (newSector: UserSector) => {
    const secInfo = SECTOR_LABELS[newSector];
    setFormData((prev) => ({
      ...prev,
      sector: newSector,
      sectorTitle: secInfo.label,
      isMaster: newSector === 'MASTER',
      permissions: getDefaultSectorPermissions(newSector),
    }));
  };

  const handleQuickChangeUserSector = async (user: UserAccount, newSector: UserSector) => {
    if (user.isMaster && newSector !== 'MASTER') {
      if (!await confirmDialog('Deseja realmente remover o privilégio de Cadastro Mestre deste usuário?')) {
        return;
      }
    }

    const secInfo = SECTOR_LABELS[newSector];
    const isMaster = newSector === 'MASTER';
    const updatedUsers = users.map((u) => {
      if (u.id === user.id) {
        return {
          ...u,
          sector: newSector,
          sectorTitle: secInfo.label,
          role: secInfo.defaultRole,
          isMaster: isMaster,
          permissions: isMaster ? getDefaultSectorPermissions('MASTER') : getDefaultSectorPermissions(newSector),
        };
      }
      return u;
    });

    onUpdateUsers(updatedUsers);
    setSuccessMessage(`Nível de acesso de "${user.name}" alterado para "${secInfo.shortLabel}".`);
    setTimeout(() => setSuccessMessage(null), 3500);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.login.trim()) {
      notify('Preencha o Nome e o Login do usuário.');
      return;
    }

    const unit = schoolUnits.find((u) => u.id === formData.schoolUnitId);
    const secInfo = SECTOR_LABELS[formData.sector];

    const updatedUserObj: UserAccount = {
      id: formData.id,
      name: formData.name.trim(),
      login: formData.login.trim(),
      password: formData.password && formData.password !== PASSWORD_MASK
        ? hashPassword(formData.password)
        : editingUser?.password,
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      role: secInfo.defaultRole,
      sector: formData.sector,
      sectorTitle: formData.sectorTitle.trim() || secInfo.label,
      schoolUnitId: formData.schoolUnitId || undefined,
      schoolUnitName: unit?.name || undefined,
      isMaster: formData.isMaster,
      active: formData.active,
      avatarUrl: formData.avatarUrl || undefined,
      permissions: formData.isMaster ? getDefaultSectorPermissions('MASTER') : formData.permissions,
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
    setSuccessMessage(`Usuário "${updatedUserObj.name}" salvo com sucesso com perfil de "${secInfo.shortLabel}"!`);
    setTimeout(() => setSuccessMessage(null), 4000);

    // Senha nova ou alterada: cria/atualiza também o acesso na nuvem (Supabase Auth),
    // para que o usuário possa entrar em qualquer computador.
    const typedPassword = formData.password && formData.password !== PASSWORD_MASK ? formData.password : '';
    if (typedPassword && updatedUserObj.email) {
      syncCloudAccess(updatedUserObj, typedPassword);
    }
  };

  const syncCloudAccess = async (user: UserAccount, plainPassword: string) => {
    try {
      const { data: sessionData } = await getSupabaseClient().auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      if (!accessToken) {
        setCloudMessage({
          ok: false,
          text: `"${user.name}" foi salvo apenas neste computador. Para criar o acesso na nuvem, entre com uma conta de administrador cadastrada no Supabase e salve a senha novamente.`,
        });
        return;
      }
      const response = await fetch('/api/admin/cloud-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ email: user.email, password: plainPassword, role: user.role, name: user.name }),
      });
      const result = await response.json().catch(() => ({}));
      setCloudMessage(
        response.ok && result.success
          ? { ok: true, text: `Acesso na nuvem de "${user.name}" (${user.email}): ${result.message}` }
          : { ok: false, text: `Acesso na nuvem de "${user.name}" não foi criado: ${result.error || 'erro desconhecido.'}` }
      );
    } catch {
      setCloudMessage({ ok: false, text: `Sem conexão com o servidor: o acesso na nuvem de "${user.name}" não foi criado.` });
    }
  };

  const handleToggleUserActive = (user: UserAccount) => {
    if (user.isMaster) {
      notify('O Cadastro Mestre não pode ser desativado por motivos de segurança.');
      return;
    }
    const updated = users.map((u) => (u.id === user.id ? { ...u, active: !u.active } : u));
    onUpdateUsers(updated);
    setSuccessMessage(`Status do usuário "${user.name}" alterado para ${!user.active ? 'Ativo' : 'Inativo'}.`);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleConfirmDeleteUser = () => {
    if (!deleteCandidateUser) return;
    if (deleteCandidateUser.isMaster) {
      notify('O Cadastro Mestre não pode ser excluído.');
      setDeleteCandidateUser(null);
      return;
    }
    if (deleteCandidateUser.id === currentUser.id) {
      notify('Você não pode excluir o próprio usuário com o qual está autenticado no momento.');
      setDeleteCandidateUser(null);
      return;
    }

    const updated = users.filter((u) => u.id !== deleteCandidateUser.id);
    onUpdateUsers(updated);
    setSuccessMessage(`Usuário "${deleteCandidateUser.name}" excluído com sucesso.`);
    setDeleteCandidateUser(null);
    setTimeout(() => setSuccessMessage(null), 3500);
  };

  const handleConfirmDeleteAllUsers = () => {
    // Mantém a conta do Administrador Mestre ou a conta atualmente autenticada para garantir o acesso do operador
    const masterAccount = users.find((u) => u.isMaster || u.id === currentUser.id) || currentUser;
    const updated = [masterAccount];
    onUpdateUsers(updated);
    setShowDeleteAllModal(false);
    setSuccessMessage(`Todos os usuários cadastrados foram excluídos com sucesso. Mantida apenas a conta Administrador Mestre (${masterAccount.name}).`);
    setTimeout(() => setSuccessMessage(null), 5000);
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
          ...(prev?.permissions?.[moduleKey] || {}),
          [action]: value,
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
      {/* Module Universal Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => (onBack ? onBack() : onNavigate?.('MAIN_DASHBOARD'))}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 text-xs font-bold transition-all border border-slate-200 cursor-pointer shadow-2xs group"
            title="Voltar para tela anterior"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
            <span>Voltar</span>
          </button>

          <button
            onClick={() => onNavigate?.('MAIN_DASHBOARD')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-700 text-xs font-bold transition-all border border-slate-200 cursor-pointer shadow-2xs"
            title="Fechar Módulo e voltar ao Início"
          >
            <X className="h-4 w-4" />
            <span>Fechar Módulo</span>
          </button>

          <div className="hidden md:flex items-center gap-1 text-xs text-slate-400 ml-2">
            <span>Início</span>
            <ChevronRight className="h-3 w-3 text-slate-300" />
            <span>Administração</span>
            <ChevronRight className="h-3 w-3 text-slate-300" />
            <span className="font-bold text-slate-800">Controle de Usuários & Níveis de Acesso</span>
          </div>
        </div>

        {/* Abas Internas de Navegação do Módulo */}
        <div className="flex items-center gap-1.5 flex-wrap">
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
            onClick={() => setActiveMainTab('RBAC')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeMainTab === 'RBAC'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
            title="Gestão de Roles e RBAC com Invalidação de Sessão"
          >
            <Key className="h-3.5 w-3.5" />
            <span>Gestão de Permissões (RBAC)</span>
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="px-3 py-1.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
            title="Cadastrar um novo usuário no sistema"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Novo Usuário</span>
          </button>

          <button
            onClick={() => setShowDeleteAllModal(true)}
            className="px-3 py-1.5 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
            title="Excluir todos os usuários cadastrados (preservando o Mestre)"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Excluir Todos os Usuários</span>
          </button>

          <button
            onClick={() => setActiveMainTab('MATRIX')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeMainTab === 'MATRIX'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <Shield className="h-3.5 w-3.5" />
            <span>Matriz de Níveis de Acesso</span>
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
            <span>Auditoria & Logs ({auditLogs?.length || 0})</span>
          </button>
        </div>
      </div>

      {/* Top Banner with Master Badge */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-7 text-white shadow-xl border border-indigo-900/50 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold">
              <ShieldCheck className="h-4 w-4" />
              Gestão de Contas, Níveis de Acesso & Matriz de Permissões
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Controle de Usuários & Níveis de Acesso
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Adicione novos operadores, edite credenciais, selecione o nível de acesso em tempo real
              e audite os privilégios da Diretoria, Coordenação, Secretaria, Professores e Super Admin Mestre.
            </p>
          </div>

          {/* Current Active User Status Widget */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 shrink-0 min-w-[280px]">
            <div className="flex items-center justify-between gap-3 mb-2">
              <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                Sessão Conectada:
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
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3 text-emerald-800 text-sm font-semibold shadow-xs animate-in fade-in-50 duration-200">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {cloudMessage && (
        <div
          className={`rounded-2xl p-4 flex items-start gap-3 text-sm font-semibold shadow-xs border ${
            cloudMessage.ok ? 'bg-sky-50 border-sky-200 text-sky-800' : 'bg-amber-50 border-amber-200 text-amber-800'
          }`}
        >
          <span className="flex-1">{cloudMessage.text}</span>
          <button
            type="button"
            onClick={() => setCloudMessage(null)}
            className="text-xs underline cursor-pointer shrink-0"
          >
            Fechar
          </button>
        </div>
      )}

      {/* VIEW 1: USUÁRIOS (LISTAGEM, BUSCA, ADICIONAR, EDITAR, EXCLUIR, SELECIONAR NÍVEL) */}
      {activeMainTab === 'USERS' && (
        <>
          {/* Quick Metrics by Sector */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
            {(Object.keys(SECTOR_LABELS) as UserSector[]).map((sec) => {
              const count = users.filter((u) => u.sector === sec).length;
              const isSelected = selectedSectorFilter === sec;
              const info = SECTOR_LABELS[sec];
              return (
                <button
                  key={sec}
                  onClick={() => setSelectedSectorFilter(isSelected ? 'ALL' : sec)}
                  className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-md ring-2 ring-indigo-300'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
                  }`}
                  title={`Filtrar por ${info.label}`}
                >
                  <span
                    className={`text-[10px] font-bold block uppercase truncate ${
                      isSelected ? 'text-indigo-100' : 'text-slate-500'
                    }`}
                  >
                    {sec === 'MASTER' ? '👑 Master' : info.shortLabel}
                  </span>
                  <div className="text-lg font-black mt-0.5">{count}</div>
                  <span
                    className={`text-[9px] truncate block ${
                      isSelected ? 'text-indigo-200' : 'text-slate-400'
                    }`}
                  >
                    {count === 1 ? '1 conta' : `${count} contas`}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search, Filter & Quick Add Bar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
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
                className="px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-semibold"
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
                <span>Adicionar Novo Usuário</span>
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
                    <th className="py-3.5 px-4">Nível de Acesso (Setor)</th>
                    <th className="py-3.5 px-4">Unidade de Lotação</th>
                    <th className="py-3.5 px-4">Permissões Ativas</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Controles & Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        <Users className="h-10 w-10 mx-auto text-slate-300 mb-2" />
                        <p className="font-semibold text-slate-600">Nenhum usuário localizado</p>
                        <p className="text-xs text-slate-400 mt-1">
                          Tente ajustar a busca ou o filtro de setor.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => {
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
                                  className="h-10 w-10 rounded-xl object-cover border border-indigo-200 shrink-0 shadow-xs"
                                />
                              ) : (
                                <div
                                  className={`h-10 w-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
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
                                  <span className="font-mono text-slate-600">@{user.login}</span>
                                  <span>•</span>
                                  <span>{user.email || 'Sem e-mail cadastrado'}</span>
                                  {user.phone && (
                                    <>
                                      <span>•</span>
                                      <span>{user.phone}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Seletor Rápido de Nível de Acesso */}
                          <td className="py-3.5 px-4">
                            <div className="space-y-1.5">
                              <select
                                value={user.sector}
                                onChange={(e) =>
                                  handleQuickChangeUserSector(user, e.target.value as UserSector)
                                }
                                className={`text-xs font-bold px-2.5 py-1.5 rounded-xl border cursor-pointer transition-all shadow-2xs focus:ring-2 focus:ring-indigo-500/20 focus:outline-none ${sectorInfo.color}`}
                                title="Selecione para alterar o nível de acesso deste usuário"
                              >
                                {(Object.keys(SECTOR_LABELS) as UserSector[]).map((sec) => (
                                  <option key={sec} value={sec}>
                                    {SECTOR_LABELS[sec].label}
                                  </option>
                                ))}
                              </select>
                              <div className="text-[11px] text-slate-500 max-w-xs line-clamp-1">
                                {user.sectorTitle || sectorInfo.label}
                              </div>
                            </div>
                          </td>

                          {/* School Unit */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                              <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                              <span>{user.schoolUnitName || 'Rede Municipal Global'}</span>
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
                                  {user.permissions?.provas?.canApprove ? 'Homologa Provas • ' : ''}
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
                              title={user.active ? 'Clique para desativar conta' : 'Clique para ativar conta'}
                            >
                              <span
                                className={`h-2 w-2 rounded-full ${
                                  user.active ? 'bg-emerald-500' : 'bg-slate-400'
                                }`}
                              />
                              {user.active ? 'Ativo' : 'Inativo'}
                            </button>
                          </td>

                          {/* Actions: Editar, Excluir, Simular */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => onSwitchCurrentUser(user)}
                                title="Alternar sessão para este usuário"
                                className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 transition-colors cursor-pointer text-xs font-bold inline-flex items-center gap-1 shadow-2xs"
                              >
                                <RefreshCw className="h-3.5 w-3.5" />
                                <span className="hidden xl:inline">Simular</span>
                              </button>

                              <button
                                onClick={() => handleOpenEditModal(user)}
                                title="Editar dados e permissões do usuário"
                                className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 border border-slate-200 font-semibold text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                              >
                                <Edit2 className="h-3.5 w-3.5 text-indigo-600" />
                                <span>Editar</span>
                              </button>

                              {!user.isMaster && (
                                <button
                                  onClick={() => setDeleteCandidateUser(user)}
                                  title="Excluir usuário permanentemente"
                                  className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                                >
                                  <Trash2 className="h-3.5 w-3.5 text-rose-600" />
                                  <span>Excluir</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* VIEW RBAC: GESTÃO DE PERMISSÕES RBAC (SUPABASE EDGE FUNCTION & SESSION REVOCATION) */}
      {activeMainTab === 'RBAC' && (
        <UserManagementTable
          users={users}
          currentUser={currentUser}
          schoolUnits={schoolUnits}
          onUpdateUsers={onUpdateUsers}
          onSwitchUser={onSwitchCurrentUser}
        />
      )}

      {/* VIEW 2: MATRIZ DE NÍVEIS DE ACESSO */}
      {activeMainTab === 'MATRIX' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Shield className="h-5 w-5 text-indigo-600" />
                Matriz Comparativa de Níveis de Acesso por Setor
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Consulte o escopo institucional de cada perfil na plataforma educacional.
              </p>
            </div>
            <button
              onClick={handleOpenCreateModal}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-2 shadow-xs cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Adicionar Usuário com Perfil</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {(Object.keys(SECTOR_LABELS) as UserSector[]).map((sec) => {
              const info = SECTOR_LABELS[sec];
              const sectorUsers = users.filter((u) => u.sector === sec);
              return (
                <div
                  key={sec}
                  className="rounded-2xl border border-slate-200 p-4 space-y-3 bg-slate-50/50 hover:bg-white hover:border-indigo-300 transition-all shadow-2xs"
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-bold border ${info.color}`}
                    >
                      {info.shortLabel}
                    </span>
                    <span className="text-xs font-bold text-slate-400">
                      {sectorUsers.length} cadastrado(s)
                    </span>
                  </div>

                  <h4 className="font-bold text-slate-900 text-sm">{info.label}</h4>
                  <p className="text-xs text-slate-600 leading-relaxed min-h-[48px]">
                    {info.desc}
                  </p>

                  <div className="pt-2 border-t border-slate-200 text-xs text-slate-500">
                    <span className="font-semibold text-slate-700">Papel do Sistema: </span>
                    <span className="font-mono text-indigo-600 font-bold">{info.defaultRole}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 3: AUDITORIA & LOGS */}
      {activeMainTab === 'AUDIT' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Activity className="h-4 w-4 text-emerald-600" />
                Trilha de Auditoria & Registro de Ações dos Operadores
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Auditoria em tempo real de autenticações, alterações cadastrais, emissão de documentos e comandos administrativos.
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
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px] text-slate-700">
                {auditLogs && auditLogs.length > 0 ? (
                  auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 text-slate-500 font-sans">
                        {new Date(log.timestamp).toLocaleString('pt-BR')}
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
                    <td colSpan={6} className="py-8 text-center text-slate-400 font-sans">
                      Nenhum registro de auditoria arquivado no momento.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: EXCLUIR USUÁRIO COM CONFIRMAÇÃO */}
      {deleteCandidateUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in-50 duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md p-6 space-y-4">
            <div className="h-12 w-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="h-6 w-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="font-bold text-slate-900 text-base">Excluir Conta de Usuário?</h3>
              <p className="text-xs text-slate-500">
                Tem certeza que deseja remover permanentemente o acesso de{' '}
                <strong className="text-slate-800">{deleteCandidateUser.name}</strong> (@
                {deleteCandidateUser.login})?
              </p>
            </div>

            <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200 text-xs text-slate-600 space-y-1">
              <div>
                <strong>Setor:</strong> {deleteCandidateUser.sectorTitle}
              </div>
              <div>
                <strong>E-mail:</strong> {deleteCandidateUser.email || 'Não informado'}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteCandidateUser(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteUser}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition-colors cursor-pointer shadow-xs"
              >
                Sim, Excluir Usuário
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EXCLUIR TODOS OS USUÁRIOS COM CONFIRMAÇÃO */}
      {showDeleteAllModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in-50 duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-rose-200 w-full max-w-lg p-6 space-y-4">
            <div className="h-14 w-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-inner">
              <AlertTriangle className="h-7 w-7" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="font-black text-slate-900 text-lg">Excluir Todos os Usuários Cadastrados?</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Atenção: Esta ação removerá <strong>todos os {users.length} usuários cadastrados</strong> no sistema de uma só vez.
              </p>
            </div>

            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-xs text-rose-900 space-y-1.5">
              <div className="font-bold flex items-center gap-1.5 text-rose-700">
                <Shield className="h-4 w-4 shrink-0 text-rose-600" />
                Medida de Proteção contra Lockout:
              </div>
              <p className="text-[11px] text-rose-800 leading-normal">
                Para impedir o bloqueio total do acesso ao ERP, a conta do <strong>Administrador Mestre ({currentUser.name})</strong> será mantida intacta como único perfil ativo.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowDeleteAllModal(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteAllUsers}
                className="px-5 py-2.5 rounded-xl text-xs font-black text-white bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 transition-all cursor-pointer shadow-lg shadow-rose-600/30 flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                <span>Sim, Excluir Todos os Usuários</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADICIONAR / EDITAR USUÁRIO */}
      {isEditingModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center font-bold">
                  {formData.isMaster ? '👑' : <Shield className="h-5 w-5" />}
                </div>
                <div>
                  <h3 className="font-black text-base sm:text-lg">
                    {editingUser ? 'Editar Usuário & Nível de Acesso' : 'Adicionar Novo Usuário'}
                  </h3>
                  <p className="text-xs text-slate-300">
                    Preencha os dados cadastrais, credenciais e selecione o nível de acesso do operador
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
                    Foto de Perfil / Crachá Digital
                  </h4>
                  <p className="text-xs text-slate-500">
                    Adicione uma fotografia de identificação institucional para crachá digital e registro de auditoria.
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
                    placeholder="Ex: Dra. Mariana Vasconcelos"
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
                    placeholder="Ex: mariana.direcao"
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Senha de Acesso
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password || ''}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder={editingUser ? 'Deixe em branco para manter a senha atual' : 'Senha do usuário...'}
                      className="w-full pl-3 pr-16 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono"
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
                        title={showPassword ? 'Ocultar Senha' : 'Ver Senha'}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                      <button
                        type="button"
                        onClick={generateRandomPassword}
                        className="px-1.5 py-0.5 text-[10px] font-bold bg-indigo-50 text-indigo-700 rounded border border-indigo-200 hover:bg-indigo-100"
                        title="Gerar Senha Segura"
                      >
                        Gerar
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    E-mail Institucional
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Ex: mariana@escola.gov.br"
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Telefone / WhatsApp
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="Ex: (11) 98765-4321"
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

              {/* Seletor de Nível de Acesso (Setor/Perfil) */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 uppercase">
                  Selecione o Nível de Acesso Institucional *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                  {(Object.keys(SECTOR_LABELS) as UserSector[]).map((sec) => {
                    const info = SECTOR_LABELS[sec];
                    const isSelected = formData.sector === sec;
                    return (
                      <div
                        key={sec}
                        onClick={() => handleSectorChangeInForm(sec)}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'bg-indigo-50/70 border-indigo-600 ring-2 ring-indigo-500/30 shadow-xs'
                            : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold border ${info.color}`}>
                            {info.shortLabel}
                          </span>
                          {isSelected && <Check className="h-4 w-4 text-indigo-600" />}
                        </div>
                        <div className="text-[11px] text-slate-600 mt-2 line-clamp-2">
                          {info.desc}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Título Personalizado & Ativo/Inativo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Título / Cargo Personalizado
                  </label>
                  <input
                    type="text"
                    value={formData.sectorTitle}
                    onChange={(e) => setFormData({ ...formData, sectorTitle: e.target.value })}
                    placeholder="Ex: Diretor Geral de Ensino"
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200 mt-auto">
                  <div>
                    <div className="text-xs font-bold text-slate-800">Status da Conta</div>
                    <div className="text-[11px] text-slate-500">
                      {formData.active ? 'Conta habilitada para login' : 'Acesso suspenso / inativo'}
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.active}
                      onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>
              </div>

              {/* Matriz de Permissões Granulares */}
              {!formData.isMaster && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                        <Key className="h-4 w-4 text-indigo-600" />
                        Permissões Granulares por Módulo
                      </h4>
                      <p className="text-xs text-slate-500">
                        Você pode refinar o que este usuário pode Ler, Criar, Editar, Excluir ou Homologar
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            permissions: getDefaultSectorPermissions(formData.sector),
                          })
                        }
                        className="px-2.5 py-1 text-xs font-bold rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors"
                      >
                        Padrão do Perfil
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            permissions: getDefaultSectorPermissions('MASTER'),
                          })
                        }
                        className="px-2.5 py-1 text-xs font-bold rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                      >
                        Marcar Tudo
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
                          const perm = formData?.permissions?.[mod.key] || {
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
                  Salvar Conta & Nível de Acesso
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
