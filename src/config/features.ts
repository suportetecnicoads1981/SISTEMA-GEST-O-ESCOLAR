/**
 * Painéis de demonstração DESATIVADOS (01/10/2026).
 *
 * Estes painéis só exibiam resultados simulados (ex.: "atualização aplicada com
 * sucesso" sem nada ser instalado, "SQL executado" sem tocar no banco) e
 * pesavam no carregamento do sistema. Foram retirados do pacote: não aparecem
 * no menu, na busca, nos atalhos nem nas abas, e não são mais baixados pelo
 * navegador.
 *
 * Continuam ativos os recursos reais: Central de Instalação (NETWORK_INSTALLER),
 * Sincronização Municipal .edusync (Rede Municipal), Controle de Acesso,
 * Atualizações do Sistema, Backlog e Sobre.
 */
export const DISABLED_TAB_IDS: ReadonlySet<string> = new Set([
  'OMNI_DEPLOY',
  'NEXUS_DEPLOYER',
  'NEXUS_INSTALL',
  'NEXUS_BUILD',
  'CLEANSLATE_HUB',
  'INSTALAFLOW',
  'DEBUG_FLOW',
  'DATASYNC_PRO',
  'ARCHITECTURE_DIAGRAM',
]);

/** Nome antigo mantido para os componentes que já o usam. */
export const EXPERIMENTAL_TAB_IDS = DISABLED_TAB_IDS;

export function isTabAvailable(tabId: string): boolean {
  return !DISABLED_TAB_IDS.has(tabId);
}
