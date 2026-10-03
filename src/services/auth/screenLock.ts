/**
 * Bloqueio de tela (Usuários & Permissões).
 *
 * - Por inatividade: sem mexer no mouse/teclado pelo tempo escolhido, a tela é bloqueada.
 * - Pelo botão "Bloquear tela" (ou Ctrl+Shift+L).
 *
 * A tela bloqueada pede login e senha de novo. Entrando o mesmo usuário, o trabalho continua de
 * onde parou (abas e formulários abertos ficam como estavam). Entrando outro usuário, é a troca de
 * usuário: o sistema passa a ser dele e as telas do anterior são fechadas.
 *
 * O tempo de inatividade vale para este computador. O estado "bloqueado" também fica guardado:
 * recarregar a página com a tela bloqueada não libera o sistema.
 */

export const LOCK_IDLE_KEY = 'sucessoedu_bloqueio_inatividade_min';
export const LOCK_STATE_KEY = 'sucessoedu_tela_bloqueada';

/** Opções de tempo oferecidas (minutos). 0 = não bloquear por inatividade. */
export const LOCK_IDLE_OPTIONS = [5, 10, 15, 30, 60, 0] as const;
export const DEFAULT_LOCK_IDLE_MINUTES = 15;

export function readLockIdleMinutes(): number {
  try {
    const raw = localStorage.getItem(LOCK_IDLE_KEY);
    if (raw == null || raw === '') return DEFAULT_LOCK_IDLE_MINUTES;
    const n = Number(raw);
    return Number.isFinite(n) && n >= 0 && n <= 24 * 60 ? Math.round(n) : DEFAULT_LOCK_IDLE_MINUTES;
  } catch {
    return DEFAULT_LOCK_IDLE_MINUTES;
  }
}

export function storeLockIdleMinutes(minutes: number): void {
  try {
    localStorage.setItem(LOCK_IDLE_KEY, String(Math.max(0, Math.round(minutes))));
  } catch {
    /* armazenamento indisponível: vale só nesta sessão */
  }
}

export interface LockState {
  /** Usuário que estava usando o sistema quando a tela foi bloqueada. */
  userId: string;
  /** Data e hora do bloqueio (ISO). */
  at: string;
  /** Motivo do bloqueio. */
  reason: 'inatividade' | 'botao' | 'troca';
  /** Troca para um usuário escolhido na lista: login dele já preenchido (a senha é sempre pedida). */
  targetLogin?: string;
  targetName?: string;
}

export function readLockState(): LockState | null {
  try {
    const raw = localStorage.getItem(LOCK_STATE_KEY);
    if (!raw) return null;
    const v = JSON.parse(raw);
    return v && typeof v.userId === 'string' ? (v as LockState) : null;
  } catch {
    return null;
  }
}

export function storeLockState(state: LockState | null): void {
  try {
    if (state) localStorage.setItem(LOCK_STATE_KEY, JSON.stringify(state));
    else localStorage.removeItem(LOCK_STATE_KEY);
  } catch {
    /* armazenamento indisponível */
  }
}

export function lockIdleLabel(minutes: number): string {
  if (!minutes) return 'Nunca';
  if (minutes >= 60 && minutes % 60 === 0) return minutes === 60 ? '1 hora' : `${minutes / 60} horas`;
  return `${minutes} minutos`;
}

/** Atividade do usuário que reinicia a contagem de inatividade. */
export const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'wheel', 'touchstart', 'scroll', 'pointerdown'] as const;
