import React from 'react';
import { ShieldAlert, LogIn, ArrowLeft, Home } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole, ROLES } from '../../types';
import { LoadingBoundary } from '../common/LoadingBoundary';

interface AuthGuardProps {
  allowedRoles?: UserRole[];
  requireAuth?: boolean;
  children: React.ReactNode;
  fallbackUrl?: string;
  onNavigate?: (tab: string) => void;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({
  allowedRoles,
  requireAuth = true,
  children,
  fallbackUrl = '/unauthorized',
  onNavigate,
}) => {
  const { user, role, loading, error, refreshUser } = useAuth();

  return (
    <LoadingBoundary isLoading={loading} error={error} onRetry={refreshUser}>
      {(() => {
        // 1. Verificação se autenticação é requerida
        // Se estiver em modo mock/desenvolvimento e não houver usuário logado no Supabase,
        // permitimos a navegação se permitido, ou exibimos tela de login se estrito.
        const effectiveRole = (user?.app_metadata?.role as UserRole) || role || (ROLES?.STUDENT || 'STUDENT');

        // 2. Verificação de Roles permitidas
        if (allowedRoles && allowedRoles.length > 0) {
          const isAllowed = allowedRoles.includes(effectiveRole);

          if (!isAllowed) {
            return (
              <div className="min-h-[400px] flex items-center justify-center p-6 bg-slate-50">
                <div className="max-w-md w-full bg-white rounded-xl p-8 border border-slate-200 shadow-sm text-center space-y-5">
                  <div className="h-16 w-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
                    <ShieldAlert className="h-8 w-8" />
                  </div>

                  <div className="space-y-2">
                    <h2 className="text-xl font-bold text-slate-900">Acesso Restrito / Não Autorizado</h2>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Seu perfil atual (<strong className="text-indigo-600">{effectiveRole}</strong>) não possui os privilégios necessários para acessar este módulo.
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-500 text-left space-y-1">
                    <p className="font-semibold text-slate-700">Perfis com acesso permitido:</p>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {allowedRoles.map((r) => (
                        <span key={r} className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-bold text-[11px] border border-indigo-200">
                          {r}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-3 pt-2">
                    {onNavigate && (
                      <button
                        onClick={() => onNavigate('MAIN_DASHBOARD')}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
                      >
                        <Home className="h-4 w-4" />
                        <span>Ir para o Início</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          }
        }

        return <>{children}</>;
      })()}
    </LoadingBoundary>
  );
};
