import React from 'react';
import { Lock, UserRound } from 'lucide-react';
import { LoginScreen } from './LoginScreen';
import type { UserAccount, SchoolUnit } from '../../types';
import type { LockState } from '../../services/auth/screenLock';
import { formatPersonName } from '../../services/documentBranding';

interface ScreenLockOverlayProps {
  lock: LockState;
  lockedUser?: UserAccount | null;
  userAccounts: UserAccount[];
  schoolUnits: SchoolUnit[];
  systemVersion?: string;
  companyLogoUrl?: string;
  onPasswordUpdate?: (user: UserAccount, passwordHash: string) => void;
  /** Login conferido (mesmo usuário = desbloqueia; outro usuário = troca de usuário). */
  onUnlock: (user: UserAccount) => void;
  /** Encerrar a sessão pela tela bloqueada. */
  onLogout: () => void;
}

const REASON: Record<LockState['reason'], string> = {
  inatividade: 'por falta de uso',
  botao: 'pelo botão Bloquear tela',
  troca: 'para troca de usuário',
};

/**
 * Tela bloqueada: cobre todo o sistema (nada fica visível por trás) e pede login de novo.
 * O sistema continua aberto embaixo: o mesmo usuário volta exatamente de onde parou.
 */
export const ScreenLockOverlay: React.FC<ScreenLockOverlayProps> = ({
  lock,
  lockedUser,
  userAccounts,
  schoolUnits,
  systemVersion,
  companyLogoUrl,
  onPasswordUpdate,
  onUnlock,
  onLogout,
}) => {
  const at = (() => {
    try {
      return new Date(lock.at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  })();
  const isSwitch = lock.reason === 'troca';
  const name = formatPersonName(lockedUser?.name) || lockedUser?.name || '';

  const notice = (
    <div
      data-testid="screen-lock-notice"
      className="mb-5 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-100 text-xs space-y-1"
    >
      <div className="flex items-center gap-2 font-bold text-amber-200">
        {isSwitch ? <UserRound className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
        <span>{isSwitch ? 'Troca de usuário' : 'Tela bloqueada'}</span>
        {at && <span className="ml-auto font-mono text-[10px] text-amber-300/80">{at}</span>}
      </div>
      {isSwitch ? (
        <p className="text-amber-100/90 leading-relaxed">
          Entre com o login e a senha do usuário que vai usar o sistema agora.
          {name ? <> As telas abertas por <strong>{name}</strong> serão fechadas.</> : null}
        </p>
      ) : (
        <p className="text-amber-100/90 leading-relaxed">
          {name ? (
            <>
              Sistema de <strong>{name}</strong> bloqueado {REASON[lock.reason]}.
            </>
          ) : (
            <>Sistema bloqueado {REASON[lock.reason]}.</>
          )}{' '}
          Digite a senha para continuar de onde parou, ou entre com outro usuário para trocar.
        </p>
      )}
    </div>
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Tela bloqueada"
      data-testid="screen-lock-overlay"
      className="fixed inset-0 overflow-y-auto"
      style={{ zIndex: 2147483000 }}
    >
      <LoginScreen
        key={`${lock.at}|${lock.reason}`}
        userAccounts={userAccounts}
        schoolUnits={schoolUnits}
        systemVersion={systemVersion}
        companyLogoUrl={companyLogoUrl}
        onPasswordUpdate={onPasswordUpdate}
        onLoginSuccess={onUnlock}
        initialUsername={isSwitch ? '' : lockedUser?.login || lockedUser?.email || ''}
        topNotice={notice}
        onExit={onLogout}
        exitLabel="Sair do Sistema"
      />
    </div>
  );
};
