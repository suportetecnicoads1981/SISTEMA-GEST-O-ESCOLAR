import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types';
import { normalizeRole } from '../../utils/roleNormalizer';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

interface RoleRedirectProps {
  allowedRoles?: UserRole[];
  targetTabMap?: Partial<Record<UserRole, string>>;
  onNavigateTab?: (tabId: string) => void;
  children: React.ReactNode;
}

/**
 * RoleRedirect: Gerencia o fluxo de navegação e redirecionamento baseado na role normalizada,
 * com fallback gracioso para tela de "Acesso Restrito" caso o perfil não seja autorizado.
 */
export const RoleRedirect: React.FC<RoleRedirectProps> = ({
  allowedRoles,
  targetTabMap,
  onNavigateTab,
  children,
}) => {
  const { role, profile } = useAuth();
  const currentRole = normalizeRole(profile?.role || role);

  // Se houver restrição de roles
  if (allowedRoles && allowedRoles.length > 0) {
    const isAuthorized = allowedRoles.includes(currentRole);

    if (!isAuthorized) {
      return (
        <div className="min-h-[420px] w-full bg-slate-50 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-2xl p-8 border border-slate-200 shadow-lg text-center space-y-6">
            <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl border border-rose-100 flex items-center justify-center mx-auto shadow-sm">
              <ShieldAlert className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-lg font-bold text-slate-900">Acesso Restrito</h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                Seu perfil de acesso atual (<strong className="text-indigo-600 uppercase">{currentRole}</strong>) não possui permissão para visualizar este módulo.
              </p>
            </div>

            {onNavigateTab && targetTabMap?.[currentRole] && (
              <button
                onClick={() => onNavigateTab(targetTabMap[currentRole]!)}
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-200 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Ir para Painel Recomendado</span>
              </button>
            )}
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
};
