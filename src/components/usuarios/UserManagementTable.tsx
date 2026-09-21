import React, { useState } from 'react';
import {
  Users,
  Shield,
  Search,
  Filter,
  UserCheck,
  Building2,
  RefreshCw,
  Sparkles,
  Key,
  ShieldCheck,
  AlertCircle,
  Database,
  ExternalLink,
  Trash2,
} from 'lucide-react';
import { UserAccount, UserRole, SchoolUnit, ROLES } from '../../types';
import { RoleSelect } from './RoleSelect';
import { SUPABASE_RBAC_SCHEMA_SQL } from '../../services/rbac/supabaseRbacSchema';

interface UserManagementTableProps {
  users: UserAccount[];
  currentUser: UserAccount;
  schoolUnits?: SchoolUnit[];
  onUpdateUsers: (updatedUsers: UserAccount[]) => void;
  onSwitchUser?: (user: UserAccount) => void;
}

export const UserManagementTable: React.FC<UserManagementTableProps> = ({
  users,
  currentUser,
  schoolUnits = [],
  onUpdateUsers,
  onSwitchUser,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [showSqlModal, setShowSqlModal] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  // Manipulação de troca de role via RoleSelect
  const handleRoleChanged = (userId: string, newRole: UserRole) => {
    const updatedUsers = users.map((u) => {
      if (u.id === userId) {
        return {
          ...u,
          role: newRole,
        };
      }
      return u;
    });

    onUpdateUsers(updatedUsers);
  };

  const handleDeleteSingleUser = (targetUser: UserAccount) => {
    if (targetUser.isMaster) {
      alert('A conta de Administrador Mestre não pode ser excluída.');
      return;
    }
    if (targetUser.id === currentUser?.id) {
      alert('Você não pode excluir a sua própria conta ativa no momento.');
      return;
    }
    if (confirm(`Excluir permanentemente o usuário "${targetUser.name}" (@${targetUser.login})?`)) {
      onUpdateUsers(users.filter((u) => u.id !== targetUser.id));
    }
  };

  const handleDeleteAllUsers = () => {
    if (confirm('Tem certeza de que deseja excluir TODOS os usuários cadastrados no sistema? Esta ação manterá apenas a conta do Administrador Mestre.')) {
      const masterUser = users.find((u) => u.isMaster || u.id === currentUser?.id) || currentUser;
      onUpdateUsers([masterUser]);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.login.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  const copySqlToClipboard = () => {
    navigator.clipboard.writeText(SUPABASE_RBAC_SCHEMA_SQL);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold">
              <ShieldCheck className="h-3.5 w-3.5" />
              Gestão de RBAC & Invalidação de Sessão
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Gestão de Permissões e Perfis (Supabase RBAC)
            </h2>
            <p className="text-xs text-slate-600 max-w-2xl">
              Altere os privilégios dos usuários entre <strong>ADMIN</strong>, <strong>TEACHER</strong> e <strong>STUDENT</strong>. A alteração invoca a Edge Function que atualiza o <code className="bg-slate-200 px-1 rounded text-slate-800 font-mono">app_metadata.role</code> e força o encerramento das sessões ativas do usuário para renovação de tokens JWT.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDeleteAllUsers}
              className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold flex items-center gap-2 shadow-2xs transition-colors cursor-pointer"
              title="Excluir todos os usuários cadastrados (mantendo o Mestre)"
            >
              <Trash2 className="h-3.5 w-3.5 text-rose-600" />
              <span>Excluir Todos os Usuários</span>
            </button>

            <button
              onClick={() => setShowSqlModal(true)}
              className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-bold flex items-center gap-2 shadow-2xs transition-colors cursor-pointer"
            >
              <Database className="h-3.5 w-3.5 text-indigo-600" />
              <span>Ver Schema & Triggers SQL</span>
            </button>
          </div>
        </div>
      </div>

      {/* Controles de Busca e Filtro */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div className="relative flex-1 w-full">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nome, login ou e-mail..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="h-4 w-4 text-slate-400 shrink-0" />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium cursor-pointer"
          >
            <option value="ALL">Todas as Roles ({users.length})</option>
            <option value="ADMIN">ADMIN</option>
            <option value="TEACHER">TEACHER</option>
            <option value="STUDENT">STUDENT</option>
            <option value="PARENT">PARENT</option>
          </select>
        </div>
      </div>

      {/* Tabela de Usuários */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[11px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Usuário / Identificação</th>
                <th className="py-3.5 px-4">Role Ativa (app_metadata)</th>
                <th className="py-3.5 px-4">Setor Institucional</th>
                <th className="py-3.5 px-4">Unidade Escolar</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Users className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-600">Nenhum usuário localizado</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Ajuste os filtros de busca para encontrar registros.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const isCurrent = currentUser?.id === user.id;

                  return (
                    <tr key={user.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Usuário info */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0">
                            {user.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 flex items-center gap-2">
                              <span>{user.name}</span>
                              {isCurrent && (
                                <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                                  VOCÊ
                                </span>
                              )}
                            </div>
                            <div className="text-slate-400 text-xs flex items-center gap-2 mt-0.5">
                              <span className="font-mono text-slate-600">@{user.login}</span>
                              <span>•</span>
                              <span>{user.email || 'Sem e-mail'}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Seletor de Role Dinâmico com Invalidação de Sessão */}
                      <td className="py-3.5 px-4">
                        <RoleSelect
                          userId={user.id}
                          userName={user.name}
                          currentRole={user.role || (ROLES?.STUDENT || 'STUDENT')}
                          onRoleChanged={handleRoleChanged}
                        />
                      </td>

                      {/* Setor */}
                      <td className="py-3.5 px-4">
                        <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md">
                          {user.sectorTitle || user.sector}
                        </span>
                      </td>

                      {/* Unidade */}
                      <td className="py-3.5 px-4 text-xs text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span>{user.schoolUnitName || 'Rede Geral'}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                            user.active
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              user.active ? 'bg-emerald-500' : 'bg-slate-400'
                            }`}
                          />
                          {user.active ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>

                      {/* Ações */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {onSwitchUser && (
                            <button
                              onClick={() => onSwitchUser(user)}
                              className="px-2.5 py-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 text-xs font-bold transition-colors cursor-pointer inline-flex items-center gap-1"
                              title="Alternar contexto de visualização para este usuário"
                            >
                              <RefreshCw className="h-3 w-3" />
                              <span>Simular</span>
                            </button>
                          )}

                          {!user.isMaster && (
                            <button
                              onClick={() => handleDeleteSingleUser(user)}
                              className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-colors cursor-pointer inline-flex items-center gap-1"
                              title="Excluir usuário permanentemente"
                            >
                              <Trash2 className="h-3 w-3 text-rose-600" />
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

      {/* Modal com Schema SQL e Database Triggers */}
      {showSqlModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Estrutura Supabase SQL (Triggers & RLS)
                </h3>
              </div>
              <button
                onClick={() => setShowSqlModal(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Copie e execute o script abaixo no <strong>SQL Editor</strong> do painel Supabase para configurar a tabela <code className="bg-slate-100 px-1 rounded font-mono">users</code>, as políticas de segurança RLS e o trigger de sincronização automática com <code className="bg-slate-100 px-1 rounded font-mono">auth.users</code>.
            </p>

            <div className="flex-1 overflow-y-auto bg-slate-950 text-slate-200 p-4 rounded-xl font-mono text-xs border border-slate-800">
              <pre>{SUPABASE_RBAC_SCHEMA_SQL}</pre>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-500">
                {copiedSql ? '✅ Copiado para a área de transferência!' : ''}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={copySqlToClipboard}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                  {copiedSql ? 'Copiado!' : 'Copiar Script SQL'}
                </button>
                <button
                  onClick={() => setShowSqlModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
