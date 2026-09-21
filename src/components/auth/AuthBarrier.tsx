import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Shield, Loader2, Sparkles } from 'lucide-react';

interface AuthBarrierProps {
  children: React.ReactNode;
  fallbackLoadingText?: string;
}

/**
 * Componente AuthBarrier: Garante que a UI só renderize após a resolução
 * total do status de autenticação (isInitializing/loading) e carregamento do perfil.
 * Evita erros de "TypeError: Cannot read properties of undefined" na montagem inicial do DOM.
 */
export const AuthBarrier: React.FC<AuthBarrierProps> = ({
  children,
  fallbackLoadingText = 'Carregando credenciais e perfil de usuário...',
}) => {
  const { isInitializing, loading } = useAuth();

  if (isInitializing || loading) {
    return (
      <div className="min-h-screen w-full bg-slate-50 flex flex-col items-center justify-center p-6 select-none">
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xl p-8 max-w-sm w-full text-center space-y-5 animate-in fade-in duration-300">
          <div className="relative mx-auto w-16 h-16 flex items-center justify-center">
            <div className="absolute inset-0 rounded-2xl bg-indigo-600/10 animate-ping"></div>
            <div className="relative w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-200">
              <Shield className="w-7 h-7" />
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center justify-center gap-1.5">
              <span>SucessoEdu</span>
              <Sparkles className="w-4 h-4 text-amber-500 fill-amber-500" />
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              {fallbackLoadingText}
            </p>
          </div>

          <div className="flex items-center justify-center gap-2 pt-2 text-indigo-600">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-xs font-semibold text-slate-600">Inicializando sessão...</span>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
