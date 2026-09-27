import { isLocalServerMode } from './localServerSync';

/**
 * "Manter este computador conectado à nuvem".
 *
 * Marcado: "Sair do Sistema" encerra só o usuário do sistema; a conexão com a nuvem
 * continua e a sincronização segue sem pedir a senha de novo. A senha nunca é guardada:
 * fica só a sessão da nuvem, que o Supabase renova sozinho.
 *
 * Padrão (enquanto ninguém escolheu neste computador): marcado quando aberto pelo
 * Servidor da Sede ou Remoto; desmarcado pelo link (pode ser um computador compartilhado).
 */
const KEY = 'sucessoedu_cloud_keep_session';

export function shouldKeepCloudSession(): boolean {
  try {
    const v = localStorage.getItem(KEY);
    if (v === '1') return true;
    if (v === '0') return false;
  } catch {
    /* sem armazenamento */
  }
  return isLocalServerMode();
}

export function setKeepCloudSession(keep: boolean): void {
  try {
    localStorage.setItem(KEY, keep ? '1' : '0');
  } catch {
    /* sem armazenamento */
  }
}
