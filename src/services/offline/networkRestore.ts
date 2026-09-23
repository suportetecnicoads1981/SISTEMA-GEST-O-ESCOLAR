/**
 * Restaurar backup quando o sistema usa o banco do servidor da rede local.
 * Só substitui o banco do servidor (todas as estações) com confirmação explícita.
 */
import { confirmDialog } from '../../utils/dialogs';
import { isLocalServerMode } from './localServerSync';

export async function confirmNetworkRestore(): Promise<{ network: boolean } | null> {
  if (!isLocalServerMode()) return { network: false };
  const ok = await confirmDialog(
    'Este computador usa o banco do servidor da rede local. A restauração vai substituir os dados do SERVIDOR e vale para todas as estações da escola. Deseja continuar?',
    { title: 'Restaurar no servidor da escola', confirmLabel: 'Restaurar no servidor', tone: 'danger' }
  );
  return ok ? { network: true } : null;
}
