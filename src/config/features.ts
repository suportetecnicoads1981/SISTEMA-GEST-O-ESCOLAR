/**
 * Módulos experimentais/demonstrativos.
 *
 * Estes painéis exibem resultados simulados (ex.: "atualização aplicada com
 * sucesso" sem nada ser instalado) e podem confundir quem usa o sistema na
 * escola. Ficam fora do menu por padrão. Para mostrá-los (desenvolvimento ou
 * demonstração), defina VITE_SHOW_EXPERIMENTAL_MODULES="true" no .env.
 *
 * Os instaladores reais (NETWORK_INSTALLER) e a sincronização .edusync
 * (DATASYNC_PRO) continuam sempre visíveis.
 */
export const EXPERIMENTAL_MODULES_ENABLED: boolean =
  (typeof import.meta !== 'undefined' &&
    (import.meta as any)?.env?.VITE_SHOW_EXPERIMENTAL_MODULES === 'true') ||
  false;

export const EXPERIMENTAL_TAB_IDS: ReadonlySet<string> = new Set([
  'OMNI_DEPLOY',
  'NEXUS_DEPLOYER',
  'NEXUS_INSTALL',
  'NEXUS_BUILD',
  'CLEANSLATE_HUB',
  'INSTALAFLOW',
  'DEBUG_FLOW',
]);

export function isTabAvailable(tabId: string, experimentalEnabled = EXPERIMENTAL_MODULES_ENABLED): boolean {
  return experimentalEnabled || !EXPERIMENTAL_TAB_IDS.has(tabId);
}
