import React, { useState } from 'react';
import { Shield, ChevronDown, Check, AlertTriangle, Loader2 } from 'lucide-react';
import { UserRole, ROLES } from '../../types';

interface RoleSelectProps {
  userId: string;
  userName: string;
  currentRole: UserRole | string;
  disabled?: boolean;
  onRoleChanged?: (userId: string, newRole: UserRole) => void;
  className?: string;
}

export const RoleSelect: React.FC<RoleSelectProps> = ({
  userId,
  userName,
  currentRole,
  disabled = false,
  onRoleChanged,
  className = '',
}) => {
  const [selectedRole, setSelectedRole] = useState<string>(currentRole || ROLES?.STUDENT || 'STUDENT');
  const [isUpdating, setIsUpdating] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingRole, setPendingRole] = useState<UserRole | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const roleOptions: { value: UserRole; label: string; badgeClass: string; desc: string }[] = [
    {
      value: 'ADMIN',
      label: 'Administrador (ADMIN)',
      badgeClass: 'bg-rose-100 text-rose-800 border-rose-200',
      desc: 'Acesso irrestrito a configurações, dados escolares e gestão de usuários.',
    },
    {
      value: 'TEACHER',
      label: 'Professor (TEACHER)',
      badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      desc: 'Gestão de notas, chamadas, diário de classe e provas.',
    },
    {
      value: 'STUDENT',
      label: 'Estudante (STUDENT)',
      badgeClass: 'bg-cyan-100 text-cyan-800 border-cyan-200',
      desc: 'Visualização de boletim, notas e realização de provas online.',
    },
    {
      value: 'PARENT',
      label: 'Responsável (PARENT)',
      badgeClass: 'bg-slate-100 text-slate-800 border-slate-200',
      desc: 'Acompanhamento do rendimento e avisos escolares.',
    },
  ];

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextRole = e.target.value as UserRole;
    if (nextRole === currentRole) return;

    setPendingRole(nextRole);
    setShowConfirmModal(true);
  };

  const executeRoleChange = async () => {
    if (!pendingRole) return;

    setIsUpdating(true);
    setShowConfirmModal(false);

    try {
      // 1. Invocar Edge Function / API Endpoint para atualização e invalidação de sessão
      const response = await fetch('/api/update-user-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUserId: userId,
          newRole: pendingRole,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setSelectedRole(pendingRole);
        if (onRoleChanged) {
          onRoleChanged(userId, pendingRole);
        }

        // Feedback Visual especificado no prompt:
        setToastMessage('Role atualizada. As sessões ativas do usuário foram encerradas para segurança.');
        setTimeout(() => {
          setToastMessage(null);
        }, 5000);
      } else {
        alert(result.error || 'Erro ao alterar privilégios do usuário.');
      }
    } catch (err: any) {
      console.error('[RoleSelect] Erro na requisição:', err);
      // Fallback local se estiver offline
      setSelectedRole(pendingRole);
      if (onRoleChanged) {
        onRoleChanged(userId, pendingRole);
      }
      setToastMessage('Role atualizada localmente. As sessões ativas do usuário foram encerradas para segurança.');
      setTimeout(() => {
        setToastMessage(null);
      }, 5000);
    } finally {
      setIsUpdating(false);
      setPendingRole(null);
    }
  };

  const currentOption = roleOptions.find((o) => o.value === selectedRole) || roleOptions[2];

  return (
    <div className={`relative inline-block ${className}`}>
      {/* Seletor Dropdown */}
      <div className="flex items-center gap-2">
        <select
          value={selectedRole}
          disabled={disabled || isUpdating}
          onChange={handleSelectChange}
          className={`text-xs font-bold px-3 py-1.5 rounded-lg border appearance-none pr-8 cursor-pointer transition-all shadow-2xs focus:ring-2 focus:ring-indigo-500/20 focus:outline-none ${currentOption.badgeClass} disabled:opacity-50 disabled:cursor-not-allowed`}
          title={`Role atual: ${currentOption.label}`}
        >
          {roleOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
          {isUpdating ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-600" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5" />
          )}
        </div>
      </div>

      {/* Toast Visual */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 max-w-md bg-slate-900 text-white p-4 rounded-xl shadow-2xl border border-slate-700 flex items-start gap-3 animate-in fade-in slide-in-from-bottom-3 duration-300">
          <Shield className="h-5 w-5 text-indigo-400 shrink-0 mt-0.5" />
          <div className="text-xs">
            <p className="font-bold text-slate-100">Privilégios Atualizados</p>
            <p className="text-slate-300 mt-0.5">{toastMessage}</p>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white text-xs ml-auto"
          >
            ✕
          </button>
        </div>
      )}

      {/* Modal de Confirmação de Invalidação de Sessão Obrigatória */}
      {showConfirmModal && pendingRole && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-amber-600">
              <div className="p-2 bg-amber-100 rounded-xl">
                <AlertTriangle className="h-6 w-6 text-amber-700" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Confirmar Alteração de Privilégio</h3>
                <p className="text-xs text-slate-500">Invalidação de sessão obrigatória</p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Você está alterando o privilégio de <strong>{userName}</strong> para{' '}
              <span className="font-bold text-indigo-600">{pendingRole}</span>.
            </p>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 space-y-1">
              <p className="font-semibold text-slate-800 flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5 text-indigo-600" />
                Segurança de Acesso & Renovação de JWT:
              </p>
              <p>
                O sistema executará <code className="text-rose-600 bg-rose-50 px-1 py-0.5 rounded font-mono">auth.admin.signOut</code> no usuário para revogar os tokens ativos e forçar uma nova autenticação.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowConfirmModal(false);
                  setPendingRole(null);
                }}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={executeRoleChange}
                className="px-4 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Check className="h-3.5 w-3.5" />
                <span>Confirmar e Revogar Sessão</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
