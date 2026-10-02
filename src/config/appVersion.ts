/**
 * Versão do sistema = data e hora em que esta versão foi publicada (compilada).
 * É a única "versão" real: muda a cada publicação. Os antigos números v5.x eram fictícios.
 */
declare const __APP_BUILT_AT__: string;

export const APP_BUILT_AT: string = typeof __APP_BUILT_AT__ === 'string' ? __APP_BUILT_AT__ : '';

/** Ex.: "01/10/2026 22:05" (ou "" se desconhecida). */
export function appVersionLabel(): string {
  if (!APP_BUILT_AT) return '';
  const d = new Date(APP_BUILT_AT);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

/** Ex.: "Versão de 01/10/2026 22:05". */
export function appVersionText(): string {
  const l = appVersionLabel();
  return l ? `Versão de ${l}` : 'Versão não identificada';
}
