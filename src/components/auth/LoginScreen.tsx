import { isCloudReachable } from '../../services/offline/connectivity';
import React, { useState, useMemo, useEffect } from 'react';
import {
  Lock,
  User,
  Eye,
  EyeOff,
  ShieldCheck,
  Building2,
  Sparkles,
  ArrowRight,
  School,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  Users,
  ShieldAlert,
  Key,
  LogOut,
  X,
  Laptop,
  Check,
  Briefcase,
  BookOpen,
  FileText,
  DollarSign,
  ChevronRight,
  Activity,
  Wifi,
  Globe,
  Copy,
  ExternalLink,
} from 'lucide-react';
import { UserAccount, SchoolUnit, UserRole, UserSector } from '../../types';
import { getLatestAutoBackup } from '../../data/storage';
import { getDocumentBranding } from '../../services/documentBranding';
import { getSupabaseClient } from '../../services/datasync/supabaseClient';
import { getDefaultSectorPermissions } from '../usuarios/UserAccessControl';
import {
  hashPassword,
  verifyPassword,
  hasPasswordDefined,
  isPasswordHash,
  MIN_PASSWORD_LENGTH,
} from '../../utils/passwordHasher';

interface LoginScreenProps {
  userAccounts: UserAccount[];
  schoolUnits: SchoolUnit[];
  onLoginSuccess: (user: UserAccount) => void;
  /** Grava o hash da senha da conta (primeiro acesso ou conversão de senha legada). */
  onPasswordUpdate?: (user: UserAccount, passwordHash: string) => void;
  systemVersion?: string;
  companyLogoUrl?: string;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  userAccounts,
  schoolUnits,
  onLoginSuccess,
  onPasswordUpdate,
  systemVersion = 'v5.4.0-ENTERPRISE',
  companyLogoUrl,
}) => {
  const [username, setUsername] = useState('');
  // Tela simples (login e senha) para todos. A tela completa — lista de usuários, IP da rede,
  // backup — só abre para o Master, depois de confirmar login e senha em "Acesso do administrador".
  // Base sem nenhuma conta (primeira instalação) abre direto a completa.
  const [adminPanel, setAdminPanel] = useState(() => userAccounts.length === 0);
  const [adminGateOpen, setAdminGateOpen] = useState(false);
  const [adminLogin, setAdminLogin] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminError, setAdminError] = useState('');
  const [adminBusy, setAdminBusy] = useState(false);
  const [password, setPassword] = useState('');
  // Conta sem senha definida: exige cadastrar uma senha antes do primeiro acesso.
  const [firstAccessUser, setFirstAccessUser] = useState<UserAccount | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [exitBlocked, setExitBlocked] = useState(false);
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedUnitId, setSelectedUnitId] = useState('unit-sede');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Informações de IP e Rede Local do Servidor
  const [networkInfo, setNetworkInfo] = useState<{
    primaryIp: string;
    port: number;
    allIps: string[];
    isLocalhost: boolean;
  } | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    const isCurrentLocalhost =
      typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

    fetch('/api/network-ip')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && (data.ip || data.primaryIp)) {
          const resolvedIp = data.ip || data.primaryIp;
          setNetworkInfo({
            primaryIp: resolvedIp,
            port: data.port || 3000,
            allIps: data.allIps || [resolvedIp],
            isLocalhost: isCurrentLocalhost,
          });
        }
      })
      .catch(() => {
        // Modo offline ou standalone
      });
  }, []);

  const handleSwitchToNetworkIp = () => {
    if (networkInfo && networkInfo.primaryIp && typeof window !== 'undefined') {
      const port = window.location.port ? `:${window.location.port}` : (networkInfo.port ? `:${networkInfo.port}` : '');
      const path = window.location.pathname || '/';
      const hash = window.location.hash || '';
      window.location.href = `http://${networkInfo.primaryIp}${port}${path}${hash}`;
    }
  };

  const handleCopyNetworkLink = () => {
    if (networkInfo && networkInfo.primaryIp && typeof window !== 'undefined') {
      const port = window.location.port ? `:${window.location.port}` : (networkInfo.port ? `:${networkInfo.port}` : '');
      const url = `http://${networkInfo.primaryIp}${port}`;
      navigator.clipboard?.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  // Search & Filter for Registered Users & Access Levels
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [selectedSectorFilter, setSelectedSectorFilter] = useState<string>('ALL');
  const [selectedUserForLogin, setSelectedUserForLogin] = useState<UserAccount | null>(null);
  const [activeTabMode, setActiveTabMode] = useState<'FORM' | 'SEARCH_USERS'>('SEARCH_USERS');

  const latestBackup = getLatestAutoBackup();

  // Sector Level Helpers
  const sectorLabels: Record<string, { label: string; bg: string; text: string; border: string }> = {
    MASTER: { label: 'Administrador Master TI', bg: 'bg-rose-500/15', text: 'text-rose-300', border: 'border-rose-500/30' },
    DIRETORIA: { label: 'Diretoria Escolar', bg: 'bg-indigo-500/15', text: 'text-indigo-300', border: 'border-indigo-500/30' },
    COORDENACAO: { label: 'Coordenação Pedagógica', bg: 'bg-purple-500/15', text: 'text-purple-300', border: 'border-purple-500/30' },
    SECRETARIA: { label: 'Secretaria Acadêmica', bg: 'bg-sky-500/15', text: 'text-sky-300', border: 'border-sky-500/30' },
    PROFESSOR: { label: 'Corpo Docente / Professor', bg: 'bg-emerald-500/15', text: 'text-emerald-300', border: 'border-emerald-500/30' },
    GESTOR_MUNICIPAL: { label: 'Gestor Municipal / SME', bg: 'bg-amber-500/15', text: 'text-amber-300', border: 'border-amber-500/30' },
    ALUNO: { label: 'Aluno Matriculado', bg: 'bg-teal-500/15', text: 'text-teal-300', border: 'border-teal-500/30' },
    RESPONSAVEL: { label: 'Pais / Responsáveis', bg: 'bg-cyan-500/15', text: 'text-cyan-300', border: 'border-cyan-500/30' },
  };

  // Filtered Users List
  const filteredUsers = useMemo(() => {
    const q = (userSearchTerm || '').toLowerCase().trim();
    return userAccounts.filter((u) => {
      if (!u) return false;
      const matchSearch =
        !q ||
        (u.name && u.name.toLowerCase().includes(q)) ||
        (u.login && u.login.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q)) ||
        (u.sectorTitle && u.sectorTitle.toLowerCase().includes(q)) ||
        (u.sector && u.sector.toLowerCase().includes(q));

      const matchSector =
        selectedSectorFilter === 'ALL' ||
        u.sector === selectedSectorFilter ||
        (selectedSectorFilter === 'GESTAO' && ['MASTER', 'DIRETORIA', 'COORDENACAO'].includes(u.sector));

      return matchSearch && matchSector;
    });
  }, [userAccounts, userSearchTerm, selectedSectorFilter]);

  const handleQuickSelectUser = (user: UserAccount) => {
    setSelectedUserForLogin(user);
    setUsername(user.login);
    setPassword('');
    setFirstAccessUser(null);
    if (user.schoolUnitId) {
      setSelectedUnitId(user.schoolUnitId);
    }
    setErrorMsg('');
  };

  /** Sair/Fechar: cancela o primeiro acesso e limpa a tela; no aplicativo instalado também fecha a janela. */
  const handleExitLogin = () => {
    setFirstAccessUser(null);
    setSelectedUserForLogin(null);
    setUsername('');
    setPassword('');
    setNewPassword('');
    setConfirmNewPassword('');
    setErrorMsg('');
    setActiveTabMode('SEARCH_USERS');
    try {
      // O navegador só deixa o script fechar a janela em alguns casos (ex.: atalho recém-aberto).
      window.close();
    } catch {
      /* janela não pode ser fechada por script */
    }
    // Se o navegador bloqueou o fechamento, mostra a tela de "sessão encerrada".
    window.setTimeout(() => {
      if (!window.closed) setExitBlocked(true);
    }, 300);
  };

  // "Acessar" na lista de usuários apenas seleciona o perfil: a senha é sempre exigida.
  const handleDirectAccessWithUser = (user: UserAccount) => {
    handleQuickSelectUser(user);
    setActiveTabMode('FORM');
  };

  /**
   * Tenta autenticar no Supabase (necessário para acessar os dados da nuvem).
   * Retorna a sessão, ou null se as credenciais não existirem lá ou se estiver offline.
   */
  const trySupabaseSignIn = async (email: string, pwd: string) => {
    if (!email || !pwd || (typeof navigator !== 'undefined' && navigator.onLine === false)) return null;
    // Rede local sem internet (escola rural): não espera o tempo máximo a cada tentativa.
    if (!(await isCloudReachable(2500))) return null;
    try {
      const attempt = getSupabaseClient().auth.signInWithPassword({ email, password: pwd });
      const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 8000));
      const result = await Promise.race([attempt, timeout]);
      if (!result || result.error || !result.data?.user) return null;
      return result.data;
    } catch {
      return null;
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    {
      const cleanUser = (username || '').trim().toLowerCase();
      let match = userAccounts.find(
        (u) =>
          u &&
          ((u.login && u.login.toLowerCase() === cleanUser) ||
            (u.email && u.email.toLowerCase() === cleanUser)) &&
          u.active !== false
      );

      const isMasterAlias = cleanUser === 'master' || cleanUser === 'admin' || cleanUser === 'suportetecnicoads@gmail.com';

      // Atalhos "master"/"admin" apontam para a conta Master cadastrada (senha continua obrigatória).
      if (!match && isMasterAlias) {
        match = userAccounts.find((u) => u && u.isMaster && u.active !== false);
      }

      // Base sem nenhuma conta cadastrada: permite criar o administrador master
      // (a senha será definida no primeiro acesso logo abaixo).
      if (!match && userAccounts.length === 0 && isMasterAlias) {
        match = {
          id: 'usr-master-001',
          name: 'Administrador Master ADS',
          login: 'master',
          email: 'suportetecnicoads@gmail.com',
          role: 'ADMIN' as UserRole,
          sector: 'MASTER' as UserSector,
          sectorTitle: 'Administrador de Infraestrutura & Engenheiro de Software',
          isMaster: true,
          active: true,
          createdAt: new Date().toISOString(),
          permissions: {} as any,
        };
      }

      // 1) Login na nuvem (Supabase Auth): libera a sincronização protegida por RLS e
      //    funciona em qualquer computador. O papel vem do app_metadata definido pelo ADMIN.
      const email = cleanUser.includes('@') ? cleanUser : (match?.email || '').toLowerCase();
      const cloud = email ? await trySupabaseSignIn(email, password) : null;
      if (cloud?.user) {
        const cloudRole = String(cloud.user.app_metadata?.role || '').toUpperCase();
        const role: UserRole = (['ADMIN', 'TEACHER', 'STUDENT', 'PARENT'].includes(cloudRole) ? cloudRole : 'STUDENT') as UserRole;
        const existing =
          (match && match.email?.toLowerCase() === email ? match : undefined) ||
          userAccounts.find((u) => u?.email?.toLowerCase() === email);
        const sector: UserSector = existing?.sector || (role === 'ADMIN' ? 'MASTER' : role === 'TEACHER' ? 'PROFESSOR' : 'ALUNO');

        if (existing && existing.active === false) {
          await getSupabaseClient().auth.signOut({ scope: 'local' }).catch(() => {});
          setIsLoading(false);
          setErrorMsg('Credenciais inválidas ou usuário inativo no banco de dados.');
          return;
        }

        const account: UserAccount = existing
          ? { ...existing, role }
          : {
              id: `usr-${cloud.user.id}`,
              name: String(cloud.user.user_metadata?.name || email.split('@')[0]),
              login: email.split('@')[0],
              email,
              role,
              sector,
              sectorTitle: role === 'ADMIN' ? 'Administrador (Supabase)' : role === 'TEACHER' ? 'Corpo Docente' : 'Usuário',
              isMaster: role === 'ADMIN',
              active: true,
              createdAt: new Date().toISOString(),
              permissions: getDefaultSectorPermissions(sector),
            };

        // Guarda a senha (em hash) para permitir o login também sem internet neste computador.
        const passwordHash = hashPassword(password);
        onPasswordUpdate?.({ ...account, password: passwordHash }, passwordHash);
        setIsLoading(false);
        setPassword('');
        onLoginSuccess({ ...account, password: passwordHash });
        return;
      }

      // 2) Sem conta na nuvem ou sem internet: autenticação local deste computador.
      if (!match) {
        setIsLoading(false);
        setErrorMsg('Credenciais inválidas ou usuário inativo no banco de dados.');
        return;
      }

      if (!hasPasswordDefined(match.password)) {
        setIsLoading(false);
        if (match.cloudSynced) {
          // Conta gerenciada na nuvem: a senha é a cadastrada no Supabase pelo administrador.
          // Permitir "primeiro acesso" aqui deixaria qualquer pessoa definir a senha dela.
          setErrorMsg(
            navigator.onLine === false
              ? 'Sem internet: o primeiro acesso desta conta neste computador precisa de conexão para validar a senha na nuvem.'
              : 'Credenciais inválidas. Use a senha cadastrada pelo administrador para esta conta.'
          );
          return;
        }
        setFirstAccessUser(match);
        setNewPassword('');
        setConfirmNewPassword('');
        return;
      }

      if (!verifyPassword(match.password, password)) {
        setIsLoading(false);
        setErrorMsg('Credenciais inválidas ou usuário inativo no banco de dados.');
        return;
      }

      // Senha antiga gravada em texto puro: converte para hash no login.
      if (!isPasswordHash(match.password) && onPasswordUpdate) {
        onPasswordUpdate(match, hashPassword(password));
      }

      setIsLoading(false);
      setPassword('');
      onLoginSuccess(match);
    }
  };

  /** "Acesso do administrador": confere login e senha do Master e abre a tela completa. */
  const handleAdminGateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError('');
    setAdminBusy(true);
    try {
      const clean = adminLogin.trim().toLowerCase();
      const isAlias = clean === 'master' || clean === 'admin';
      const master =
        userAccounts.find(
          (u) =>
            u &&
            u.active !== false &&
            (u.isMaster || u.sector === 'MASTER') &&
            ((u.login && u.login.toLowerCase() === clean) || (u.email && u.email.toLowerCase() === clean))
        ) || (isAlias ? userAccounts.find((u) => u && u.isMaster && u.active !== false) : undefined);
      if (!master) {
        setAdminError('Este acesso é exclusivo do administrador Master.');
        return;
      }
      let ok = hasPasswordDefined(master.password) && verifyPassword(master.password, adminPassword);
      if (!ok && master.email) {
        const cloud = await trySupabaseSignIn(master.email.toLowerCase(), adminPassword);
        ok = String(cloud?.user?.app_metadata?.role || '').toUpperCase() === 'ADMIN';
      }
      if (!ok) {
        setAdminError('Login ou senha do administrador incorretos.');
        return;
      }
      setUsername(master.login || 'master');
      setPassword('');
      setAdminPassword('');
      setAdminGateOpen(false);
      setAdminPanel(true);
    } finally {
      setAdminBusy(false);
    }
  };

  const handleFirstAccessSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstAccessUser) return;
    setErrorMsg('');

    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setErrorMsg(`A senha deve ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`);
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setErrorMsg('As senhas digitadas não conferem.');
      return;
    }

    const passwordHash = hashPassword(newPassword);
    const userWithPassword: UserAccount = { ...firstAccessUser, password: passwordHash };
    if (onPasswordUpdate) {
      onPasswordUpdate(userWithPassword, passwordHash);
    }
    setFirstAccessUser(null);
    setNewPassword('');
    setConfirmNewPassword('');
    setPassword('');
    onLoginSuccess(userWithPassword);
  };

  if (exitBlocked) {
    return (
      <div className="min-h-screen w-full bg-slate-950 flex items-center justify-center p-6 font-sans text-slate-100">
        <div className="max-w-md w-full text-center rounded-3xl bg-slate-900 border border-slate-800 p-8 shadow-2xl">
          <div className="mx-auto mb-4 h-14 w-14 rounded-2xl bg-emerald-600/20 flex items-center justify-center">
            <CheckCircle2 className="h-8 w-8 text-emerald-400" />
          </div>
          <h1 className="text-xl font-bold mb-2">Sessão encerrada</h1>
          <p className="text-sm text-slate-400 mb-6">
            O navegador não permite que o sistema feche esta janela sozinho.
            Para fechar, clique no <strong className="text-slate-200">X</strong> da janela ou aperte{' '}
            <strong className="text-slate-200">Alt+F4</strong> (aba do navegador: <strong className="text-slate-200">Ctrl+W</strong>).
          </p>
          <button
            type="button"
            onClick={() => setExitBlocked(false)}
            className="w-full px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-all cursor-pointer"
          >
            Voltar para o login
          </button>
        </div>
      </div>
    );
  }

  if (!adminPanel) {
    const brand = getDocumentBranding();
    const leftLogo = brand.managementLogoUrl || companyLogoUrl || '';
    const rightLogo = brand.semedLogoUrl || '';
    const semedLine = brand.semedName || 'Secretaria Municipal de Educação';
    const cityLine = brand.cityName ? `${brand.cityName}${brand.stateCode ? ` – ${brand.stateCode}` : ''}` : '';
    const inputCls =
      'w-full px-4 py-3 rounded-xl bg-slate-800/90 border border-slate-700 text-slate-100 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-hidden';
    return (
      <div className="min-h-screen w-full bg-linear-to-br from-slate-950 via-slate-900 to-indigo-950 flex items-center justify-center p-4 relative overflow-hidden font-sans text-slate-100">
        <div className="absolute top-[-15%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-[-15%] right-[-10%] w-[500px] h-[500px] bg-sky-600/15 rounded-full blur-[140px] pointer-events-none" />
        <button
          type="button"
          onClick={handleExitLogin}
          className="absolute top-3 right-3 sm:top-5 sm:right-5 z-20 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/90 hover:bg-rose-600 border border-slate-700 hover:border-rose-500 text-slate-300 hover:text-white text-xs font-semibold transition-all cursor-pointer"
          title="Sair / Fechar"
        >
          <X className="h-4 w-4" />
          <span className="hidden sm:inline">Fechar</span>
        </button>

        <div className="w-full max-w-md rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl backdrop-blur-2xl p-6 sm:p-8 z-10">
          {/* Cabeçalho com as logos da Gestão e da SEMED */}
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="h-14 w-14 shrink-0 flex items-center justify-center">
              {leftLogo ? <img src={leftLogo} alt="Gestão Municipal" className="max-h-14 max-w-14 object-contain" /> : null}
            </div>
            <div className="flex flex-col items-center text-center min-w-0">
              <img src="/favicon.svg" alt="SucessoEdu" className="h-10 w-10 rounded-xl shadow-lg shadow-indigo-500/25 mb-1" />
              <h1 className="text-lg font-bold text-white tracking-tight">SucessoEdu</h1>
            </div>
            <div className="h-14 w-14 shrink-0 flex items-center justify-center">
              {rightLogo ? <img src={rightLogo} alt="SEMED" className="max-h-14 max-w-14 object-contain" /> : null}
            </div>
          </div>
          <p className="text-center text-xs text-slate-300 font-semibold">{semedLine}</p>
          <p className="text-center text-xs text-slate-400 mb-6">{cityLine}</p>

          {errorMsg && !adminGateOpen && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {adminGateOpen ? (
            <form onSubmit={handleAdminGateSubmit} className="space-y-4" data-testid="admin-gate">
              <div className="p-3 rounded-xl bg-indigo-950/60 border border-indigo-500/30 text-xs text-indigo-200 flex items-start gap-2">
                <ShieldCheck className="h-4 w-4 text-indigo-300 shrink-0 mt-0.5" />
                <span>Acesso exclusivo do administrador Master: abre a tela completa, com a lista de usuários e os dados da rede.</span>
              </div>
              {adminError && (
                <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">{adminError}</div>
              )}
              <input
                type="text"
                required
                autoFocus
                autoComplete="username"
                placeholder="Login do administrador"
                value={adminLogin}
                onChange={(e) => setAdminLogin(e.target.value)}
                className={inputCls}
              />
              <input
                type="password"
                required
                autoComplete="current-password"
                placeholder="Senha"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                className={inputCls}
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setAdminGateOpen(false);
                    setAdminError('');
                    setAdminPassword('');
                  }}
                  className="px-4 py-3 rounded-xl bg-slate-700/80 hover:bg-slate-700 text-slate-300 text-sm font-semibold cursor-pointer"
                >
                  Voltar
                </button>
                <button
                  type="submit"
                  disabled={adminBusy}
                  className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white font-bold text-sm cursor-pointer"
                >
                  {adminBusy ? 'Conferindo...' : 'Abrir tela do administrador'}
                </button>
              </div>
            </form>
          ) : firstAccessUser ? (
            <form onSubmit={handleFirstAccessSubmit} className="space-y-4">
              <div className="p-3 rounded-xl bg-amber-950/50 border border-amber-500/40 text-xs text-amber-200 flex items-start gap-2">
                <Key className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  Primeiro acesso de <strong>{firstAccessUser.name}</strong>. Cadastre a sua senha pessoal (mínimo de{' '}
                  {MIN_PASSWORD_LENGTH} caracteres) para continuar.
                </span>
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoFocus
                autoComplete="new-password"
                placeholder="Nova senha"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={inputCls}
              />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="new-password"
                placeholder="Confirmar nova senha"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                className={inputCls}
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setFirstAccessUser(null);
                    setErrorMsg('');
                  }}
                  className="px-4 py-3 rounded-xl bg-slate-700/80 hover:bg-slate-700 text-slate-300 text-sm font-semibold cursor-pointer"
                >
                  Voltar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm cursor-pointer flex items-center justify-center gap-2"
                >
                  Definir senha e entrar <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleLoginSubmit} className="space-y-4" data-testid="simple-login">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Login ou e-mail</label>
                <div className="relative">
                  <User className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    required
                    autoFocus
                    autoComplete="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className={`${inputCls} pl-10`}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Senha</label>
                <div className="relative">
                  <Lock className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`${inputCls} pl-10 pr-10`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                    title={showPassword ? 'Esconder senha' : 'Mostrar senha'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-xl bg-linear-to-r from-indigo-600 via-indigo-500 to-sky-600 hover:from-indigo-500 hover:to-sky-500 disabled:opacity-60 text-white font-bold text-sm shadow-lg cursor-pointer flex items-center justify-center gap-2"
              >
                {isLoading ? 'Entrando...' : 'Entrar'}
                {!isLoading && <ArrowRight className="h-4 w-4" />}
              </button>
              <p className="text-[11px] text-slate-400 text-center leading-relaxed">
                Primeiro acesso? Digite o seu login e clique em Entrar para cadastrar a sua senha.
                <br />
                Esqueceu a senha? Procure a secretaria ou o administrador do sistema.
              </p>
            </form>
          )}

          <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
            <span>{systemVersion}</span>
            {!adminGateOpen && (
              <button
                type="button"
                onClick={() => {
                  setAdminGateOpen(true);
                  setAdminError('');
                  setErrorMsg('');
                }}
                className="text-slate-400 hover:text-indigo-300 underline-offset-2 hover:underline cursor-pointer"
              >
                Acesso do administrador
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-linear-to-br from-slate-950 via-slate-900 to-indigo-950 flex items-center justify-center p-3 sm:p-6 lg:p-8 relative overflow-hidden font-sans text-slate-100">
      {/* Decorative Ambient Background Lights */}
      <div className="absolute top-[-15%] left-[-10%] w-[550px] h-[550px] bg-indigo-600/20 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[550px] h-[550px] bg-sky-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-[30%] right-[15%] w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[130px] pointer-events-none" />

      <button
        type="button"
        onClick={handleExitLogin}
        className="absolute top-3 right-3 sm:top-5 sm:right-5 z-20 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/90 hover:bg-rose-600 border border-slate-700 hover:border-rose-500 text-slate-300 hover:text-white text-xs font-semibold transition-all cursor-pointer"
        title="Sair / Fechar"
      >
        <X className="h-4 w-4" />
        <span className="hidden sm:inline">Fechar</span>
      </button>

      {userAccounts.length > 0 && (
        <button
          type="button"
          onClick={() => {
            setAdminPanel(false);
            setUsername('');
            setPassword('');
            setErrorMsg('');
            setSelectedUserForLogin(null);
          }}
          className="absolute top-3 left-3 sm:top-5 sm:left-5 z-20 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-all cursor-pointer"
          title="Voltar para a tela de login simples"
        >
          <ArrowRight className="h-4 w-4 rotate-180" />
          <span className="hidden sm:inline">Login simples</span>
        </button>
      )}

      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 rounded-3xl bg-slate-900/85 border border-slate-800/80 shadow-2xl backdrop-blur-2xl overflow-hidden z-10">
        
        {/* Left Side: Brand Identity & Highlights */}
        <div className="lg:col-span-4 bg-linear-to-b from-indigo-950/70 via-slate-900/50 to-slate-950/90 p-6 sm:p-8 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-800/70 relative">
          <div>
            {/* Logo and Brand */}
            <div className="flex items-center gap-3.5 mb-6">
              {companyLogoUrl ? (
                <img
                  src={companyLogoUrl}
                  alt="Logo Institucional"
                  className="h-12 w-12 rounded-2xl object-contain bg-white/10 p-1 border border-white/15 shadow-md"
                />
              ) : (
                <img src="/favicon.svg" alt="SucessoEdu" className="h-12 w-12 rounded-2xl shadow-lg shadow-indigo-500/25" />
              )}
              <div>
                <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                  SucessoEdu
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {systemVersion}
                  </span>
                </h1>
                <p className="text-xs text-slate-400 font-medium">Gestão Educacional & Inteligência Escolar</p>
              </div>
            </div>

            <div className="space-y-4 my-6">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
                <div className="flex items-center gap-2 text-indigo-300 text-xs font-bold uppercase tracking-wider mb-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                  Controle Integrado de Níveis & Acessos
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Autenticação unificada com busca instantânea de colaboradores cadastrados, perfis por setor e permissões de segurança.
                </p>
              </div>

              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs text-slate-300 p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/40">
                  <span className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-sky-400 shrink-0" />
                    <span>Usuários Cadastrados</span>
                  </span>
                  <span className="font-bold text-white px-2 py-0.5 rounded-md bg-slate-700/60 font-mono">
                    {userAccounts.length} perfis
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-300 p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/40">
                  <span className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-indigo-400 shrink-0" />
                    <span>Polos & Unidades Escolares</span>
                  </span>
                  <span className="font-bold text-white px-2 py-0.5 rounded-md bg-slate-700/60 font-mono">
                    {schoolUnits.length} unidades
                  </span>
                </div>

                <div className="flex items-center gap-2.5 text-xs text-slate-300 px-1">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Segurança criptográfica e auditoria de logins</span>
                </div>
              </div>

              {latestBackup && (
                <div className="mt-4 p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-[11px] space-y-1.5">
                  <div className="flex items-center justify-between font-semibold">
                    <span className="flex items-center gap-1.5 text-emerald-400">
                      <ShieldCheck className="h-4 w-4" />
                      Cópia de Segurança Salva
                    </span>
                    <span className="text-[10px] text-emerald-300 font-mono bg-emerald-900/60 px-2 py-0.5 rounded-md">
                      {latestBackup.stats?.studentsCount || 0} alunos
                    </span>
                  </div>
                  <p className="text-[10px] text-emerald-300/80 leading-relaxed">
                    Último backup: {new Date(latestBackup.createdAt).toLocaleDateString('pt-BR')} às {new Date(latestBackup.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              )}

              {/* Informações de Rede Local e IP do Servidor */}
              {networkInfo && (
                <div className="mt-3 p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60 text-slate-300 text-[11px] space-y-2">
                  <div className="flex items-center justify-between font-semibold">
                    <span className="flex items-center gap-1.5 text-sky-400">
                      <Wifi className="h-4 w-4" />
                      IP da Rede Local
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-sky-950/80 text-sky-300 border border-sky-800/60">
                      Porta {networkInfo.port}
                    </span>
                  </div>
                  <div className="flex items-center justify-between bg-slate-900/80 px-2.5 py-1.5 rounded-lg border border-slate-700/50 font-mono text-xs text-white">
                    <span className="truncate">http://{networkInfo.primaryIp}:{networkInfo.port}</span>
                    <button
                      type="button"
                      onClick={handleCopyNetworkLink}
                      title="Copiar endereço de rede"
                      className="ml-2 text-slate-400 hover:text-white transition-colors cursor-pointer shrink-0"
                    >
                      {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-tight">
                    Utilize este endereço IP nas estações de professores e alunos para acesso centralizado.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span>Versão: <strong className="text-emerald-400">{systemVersion}</strong></span>
            <span className="flex items-center gap-1.5 text-emerald-400">
              <ShieldCheck className="h-3.5 w-3.5" />
              Ambiente Seguro
            </span>
          </div>
        </div>

        {/* Right Side: Interactive User Browser & Form */}
        <div className="lg:col-span-8 p-6 sm:p-8 flex flex-col justify-between">
          <div>
            {/* Header with Navigation Switcher */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
                  Acesso ao Sistema
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Pesquise colaboradores cadastrados ou insira login e senha institucional.
                </p>
              </div>

              <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700/80 text-xs">
                <button
                  type="button"
                  onClick={() => setActiveTabMode('SEARCH_USERS')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTabMode === 'SEARCH_USERS'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Users className="h-3.5 w-3.5" />
                  <span>Buscar Usuários ({userAccounts.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTabMode('FORM')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTabMode === 'FORM'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Lock className="h-3.5 w-3.5" />
                  <span>Formulário de Login</span>
                </button>
              </div>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Banner: Alternância Inteligente de Localhost para IP Local da Rede */}
            {networkInfo && networkInfo.isLocalhost && networkInfo.primaryIp && networkInfo.primaryIp !== '127.0.0.1' && (
              <div className="mb-4 p-3 rounded-xl bg-linear-to-r from-indigo-950/70 to-slate-900/80 border border-indigo-500/30 text-xs text-indigo-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <Wifi className="h-4 w-4 text-indigo-400 shrink-0" />
                  <div>
                    <span className="font-semibold text-white">Servidor disponível na rede local: </span>
                    <code className="bg-slate-950/80 px-1.5 py-0.5 rounded text-indigo-300 font-mono">
                      http://{networkInfo.primaryIp}:{networkInfo.port}
                    </code>
                  </div>
                </div>
                <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                  <button
                    type="button"
                    onClick={handleCopyNetworkLink}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer text-[11px]"
                  >
                    {copiedLink ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                    <span>{copiedLink ? 'Copiado!' : 'Copiar IP'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleSwitchToNetworkIp}
                    className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-colors flex items-center gap-1.5 cursor-pointer text-[11px] shadow-sm"
                  >
                    <ExternalLink className="h-3 w-3" />
                    <span>Acessar via IP Local</span>
                  </button>
                </div>
              </div>
            )}

            {/* MODE 1: SEARCH & BROWSE USERS & LEVELS */}
            {activeTabMode === 'SEARCH_USERS' && !firstAccessUser && (
              <div className="space-y-4">
                {/* Search & Sector Filters */}
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={userSearchTerm}
                      onChange={(e) => setUserSearchTerm(e.target.value)}
                      placeholder="Pesquisar por nome, login, cargo, setor ou e-mail..."
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-slate-200 placeholder-slate-400 text-xs focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-hidden transition-all"
                    />
                    {userSearchTerm && (
                      <button
                        onClick={() => setUserSearchTerm('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
                      >
                        Limpar
                      </button>
                    )}
                  </div>

                  {/* Level / Sector Filter Chips */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] scrollbar-thin">
                    {[
                      { id: 'ALL', label: 'Todos os Níveis' },
                      { id: 'MASTER', label: 'Master TI' },
                      { id: 'DIRETORIA', label: 'Diretoria' },
                      { id: 'COORDENACAO', label: 'Coordenação' },
                      { id: 'SECRETARIA', label: 'Secretaria' },
                      { id: 'PROFESSOR', label: 'Professores' },
                      { id: 'GESTOR_MUNICIPAL', label: 'Gestão SME' },
                      { id: 'ALUNO', label: 'Alunos' },
                    ].map((sec) => (
                      <button
                        key={sec.id}
                        type="button"
                        onClick={() => setSelectedSectorFilter(sec.id)}
                        className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer border ${
                          selectedSectorFilter === sec.id
                            ? 'bg-indigo-600 text-white border-indigo-500 shadow-xs'
                            : 'bg-slate-800/60 text-slate-400 border-slate-700/60 hover:text-slate-200 hover:bg-slate-800'
                        }`}
                      >
                        {sec.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* User Cards Grid */}
                <div className="max-h-[360px] overflow-y-auto space-y-2.5 pr-1.5 scrollbar-thin">
                  {filteredUsers.length === 0 ? (
                    <div className="p-8 text-center bg-slate-800/40 rounded-2xl border border-slate-800 text-slate-400 text-xs">
                      <Users className="h-8 w-8 mx-auto text-slate-600 mb-2" />
                      <p>Nenhum usuário encontrado com os termos pesquisados.</p>
                      <button
                        onClick={() => {
                          setUserSearchTerm('');
                          setSelectedSectorFilter('ALL');
                        }}
                        className="mt-2 text-indigo-400 hover:underline cursor-pointer font-semibold"
                      >
                        Redefinir filtros de busca
                      </button>
                    </div>
                  ) : (
                    filteredUsers.map((user) => {
                      const secMeta = sectorLabels[user.sector] || {
                        label: user.sectorTitle || user.sector,
                        bg: 'bg-slate-500/20',
                        text: 'text-slate-300',
                        border: 'border-slate-500/30',
                      };
                      const isSelected = selectedUserForLogin?.id === user.id || username === user.login;

                      return (
                        <div
                          key={user.id}
                          className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                            isSelected
                              ? 'bg-indigo-950/40 border-indigo-500 shadow-md ring-1 ring-indigo-500/50'
                              : 'bg-slate-800/50 border-slate-700/60 hover:bg-slate-800 hover:border-slate-600'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {user.avatarUrl ? (
                              <img
                                src={user.avatarUrl}
                                alt={user.name}
                                className="h-10 w-10 rounded-2xl object-cover shrink-0 border border-slate-600"
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-2xl bg-linear-to-br from-indigo-600 to-sky-600 flex items-center justify-center text-sm font-bold shrink-0 text-white shadow-sm">
                                {user.name.charAt(0)}
                              </div>
                            )}

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-bold text-white truncate">{user.name}</span>
                                {user.isMaster && (
                                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/30">
                                    MASTER TI
                                  </span>
                                )}
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${secMeta.bg} ${secMeta.text} ${secMeta.border}`}>
                                  {secMeta.label}
                                </span>
                              </div>

                              <div className="text-[11px] text-slate-400 flex items-center gap-3 mt-1 flex-wrap">
                                <span>Login: <strong className="text-slate-300 font-mono">{user.login}</strong></span>
                                {user.email && <span>• {user.email}</span>}
                                {user.schoolUnitName && <span>• {user.schoolUnitName}</span>}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                            <button
                              type="button"
                              onClick={() => {
                                handleQuickSelectUser(user);
                                setActiveTabMode('FORM');
                              }}
                              className="px-3 py-1.5 rounded-xl bg-slate-700/80 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
                              title="Preencher no formulário"
                            >
                              Preencher
                            </button>

                            <button
                              type="button"
                              disabled={isLoading}
                              onClick={() => handleDirectAccessWithUser(user)}
                              className="px-4 py-1.5 rounded-xl bg-linear-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 active:scale-95 text-white font-bold text-xs shadow-md shadow-indigo-600/20 flex items-center gap-1.5 cursor-pointer transition-all disabled:opacity-50"
                              title={`Entrar diretamente como ${user.name}`}
                            >
                              <span>Acessar</span>
                              <ArrowRight className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* PRIMEIRO ACESSO: cadastro obrigatório de senha */}
            {firstAccessUser && (
              <form onSubmit={handleFirstAccessSubmit} className="space-y-4">
                <div className="p-3 rounded-xl bg-amber-950/50 border border-amber-500/40 text-xs text-amber-200 flex items-start gap-2">
                  <Key className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>
                    Primeiro acesso de <strong>{firstAccessUser.name}</strong>. Esta conta ainda não possui senha:
                    cadastre uma senha pessoal (mínimo de {MIN_PASSWORD_LENGTH} caracteres) para continuar.
                  </span>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Nova senha</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoFocus
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-hidden transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Confirmar nova senha</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-hidden transition-all"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setFirstAccessUser(null);
                      setErrorMsg('');
                    }}
                    className="px-4 py-3 rounded-xl bg-slate-700/80 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                  >
                    Voltar
                  </button>
                  <button
                    type="button"
                    onClick={handleExitLogin}
                    className="px-4 py-3 rounded-xl bg-rose-600/20 hover:bg-rose-600 border border-rose-500/40 text-rose-200 hover:text-white text-xs font-semibold cursor-pointer flex items-center gap-1.5"
                    title="Cancelar o primeiro acesso e sair"
                  >
                    <LogOut className="h-4 w-4" />
                    Sair
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 px-4 rounded-xl bg-linear-to-r from-indigo-600 via-indigo-500 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Definir senha e entrar</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </form>
            )}

            {/* MODE 2: TRADITIONAL LOGIN FORM */}
            {activeTabMode === 'FORM' && !firstAccessUser && (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                {selectedUserForLogin && (
                  <div className="p-3 rounded-xl bg-indigo-950/60 border border-indigo-500/40 text-xs text-indigo-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      <span>Perfil selecionado: <strong>{selectedUserForLogin.name}</strong> ({selectedUserForLogin.sectorTitle || selectedUserForLogin.sector})</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedUserForLogin(null)}
                      className="text-[11px] text-indigo-300 hover:underline cursor-pointer"
                    >
                      Alterar
                    </button>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Unidade Escolar / Polo de Atendimento
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Building2 className="h-4 w-4" />
                    </div>
                    <select
                      value={selectedUnitId}
                      onChange={(e) => setSelectedUnitId(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-hidden transition-all"
                    >
                      {schoolUnits.map((u) => (
                        <option key={u.id} value={u.id} className="bg-slate-900 text-slate-200">
                          {u.name} - INEP {u.inepCode} ({u.city}/{u.state})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Login, Usuário ou E-mail Institucional
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <User className="h-4 w-4" />
                    </div>
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Ex: master, prof.rodrigo ou coordenacao@escola.gov.br"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-slate-200 placeholder-slate-500 text-xs focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-hidden transition-all"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-300">
                      Senha de Acesso
                    </label>
                    <span className="text-[11px] text-indigo-400 hover:text-indigo-300 cursor-pointer">
                      Esqueceu a senha?
                    </span>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="h-4 w-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Digite sua senha de segurança"
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-slate-200 placeholder-slate-500 text-xs focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-hidden transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 cursor-pointer"
                      title={showPassword ? 'Ocultar senha' : 'Exibir senha'}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 px-4 rounded-xl bg-linear-to-r from-indigo-600 via-indigo-500 to-sky-600 hover:from-indigo-500 hover:to-sky-500 active:scale-[0.99] text-white font-bold text-xs tracking-wide shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                  >
                    {isLoading ? (
                      <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Acessar Painel Principal</span>
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Footer */}
          <div className="mt-8 pt-4 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-500">
            <span>© 2026 SucessoEdu Gestão Educacional • SEDUC / ADS</span>
            <div className="flex items-center gap-3">
              <span className="hover:text-slate-400 cursor-pointer">Termos de Uso</span>
              <span>•</span>
              <span className="hover:text-slate-400 cursor-pointer">Privacidade LGPD</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
