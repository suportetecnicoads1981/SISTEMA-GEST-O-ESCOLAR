/**
 * Impressão isolada dos documentos do SucessoEdu.
 *
 * Por que existe: o window.print() imprime a tela inteira do sistema, e a área
 * de conteúdo tem barra de rolagem. O resultado saía com a barra de rolagem
 * desenhada no PDF, o topo cortado (quando a tela estava rolada) e sempre com o
 * mesmo nome de arquivo ("SucessoEdu Gestão Educacional").
 *
 * Aqui o documento é copiado para um quadro invisível (iframe) com os mesmos
 * estilos da tela, sem barra de rolagem, e o nome sugerido ao salvar o PDF
 * passa a ser único: tipo do documento + aluno/turma + data e hora.
 */

const APP_TITLE = 'SucessoEdu Gestão Educacional';

/** Deixa um texto seguro para nome de arquivo: sem acento, sem símbolo, com "_". */
export function safeFilePart(value: unknown): string {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Za-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 60);
}

/** Data e hora no formato 28-09-2026_0647 (evita nomes repetidos ao salvar). */
export function fileStamp(date = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(date.getDate())}-${p(date.getMonth() + 1)}-${date.getFullYear()}_${p(date.getHours())}${p(date.getMinutes())}${p(date.getSeconds())}`;
}

/**
 * Monta o nome do arquivo: partes informadas + data/hora.
 * Ex.: printFileName('Historico Escolar', 'Bekôro Kayapo') → Historico_Escolar_Bekoro_Kayapo_28-09-2026_064712
 */
export function printFileName(...parts: unknown[]): string {
  const body = parts.map(safeFilePart).filter(Boolean).join('_');
  return `${body || 'Documento_SucessoEdu'}_${fileStamp()}`;
}

/**
 * Troca o título da aba durante a impressão (o navegador usa o título como nome do PDF)
 * e devolve uma função que restaura o título original.
 */
export function setPrintTitle(fileName: string): () => void {
  const previous = document.title;
  document.title = fileName;
  let restored = false;
  const restore = () => {
    if (restored) return;
    restored = true;
    document.title = previous;
  };
  window.addEventListener('afterprint', restore, { once: true });
  setTimeout(restore, 120_000);
  return restore;
}

export interface IsolatedPrintOptions {
  /** Nome sugerido ao salvar o PDF (sem extensão). Use printFileName(). */
  fileName: string;
  orientation?: 'portrait' | 'landscape';
  /** CSS adicional aplicado só na impressão. */
  extraCss?: string;
  /**
   * Documento oficial no padrão ABNT (NBR 14724): margens 3 cm (superior e esquerda) e
   * 2 cm (inferior e direita), Arial 12 pt, entrelinha 1,5, texto justificado e número
   * da página no canto superior direito.
   */
  abnt?: boolean;
  /**
   * Documento de uma página só (boletim, declarações, certificado): se o conteúdo
   * passar da folha A4, ele é reduzido proporcionalmente para caber em uma página,
   * mantendo o layout. Abaixo de minScale o documento segue para a página seguinte.
   */
  fitToPage?: boolean;
  /** Menor redução aceita no fitToPage (padrão 0,62). */
  minScale?: number;
}

/** Área útil da folha A4 em milímetros, conforme as margens usadas. */
function printableAreaMm(orientation: 'portrait' | 'landscape', abnt?: boolean) {
  const [w, h] = orientation === 'landscape' ? [297, 210] : [210, 297];
  // ABNT: 3 cm sup./esq. e 2 cm inf./dir.; padrão: 10/12/12/12 mm.
  return abnt ? { width: w - 50, height: h - 50 } : { width: w - 24, height: h - 22 };
}
const MM_TO_PX = 96 / 25.4;

export const ABNT_PRINT_CSS = `
@page{size:A4 portrait;margin:3cm 2cm 2cm 3cm;@top-right{content:counter(page);font:10pt Arial,Helvetica,sans-serif}}
.print-isolated-root, .print-isolated-root *{font-family:Arial,Helvetica,sans-serif!important}
.print-isolated-root>*{padding:0!important}
.print-isolated-root p{font-size:12pt!important;line-height:1.5!important;text-align:justify}
.print-isolated-root h1,.print-isolated-root h2{font-size:13pt!important;line-height:1.3!important}
.print-isolated-root table{font-size:10pt!important;border-collapse:collapse}
.print-isolated-root th,.print-isolated-root td{line-height:1.25!important}
.print-isolated-root .text-center p,.print-isolated-root p.text-center{text-align:center}
`;

/** Copia as folhas de estilo da tela (Tailwind e demais) para o quadro de impressão. */
function collectStyles(): string {
  const out: string[] = [];
  document.querySelectorAll('style, link[rel="stylesheet"]').forEach((node) => {
    out.push((node as HTMLElement).outerHTML);
  });
  return out.join('\n');
}

const escapeHtml = (s: string) =>
  s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string));

/**
 * Imprime somente o elemento informado, sem a tela do sistema em volta.
 * Retorna false quando não foi possível (o chamador pode cair no window.print()).
 */
export function printElementIsolated(element: HTMLElement | null, options: IsolatedPrintOptions): boolean {
  if (!element) return false;
  const orientation = options.orientation || 'portrait';
  const frame = document.createElement('iframe');
  frame.setAttribute('aria-hidden', 'true');
  const area = printableAreaMm(orientation, options.abnt);
  // O quadro fica invisível, mas com a largura útil da folha: assim dá para medir
  // a altura real do documento antes de imprimir (fitToPage).
  frame.style.cssText = `position:fixed;left:-10000px;top:0;width:${Math.round(area.width * MM_TO_PX)}px;height:10px;border:0;visibility:hidden`;
  document.body.appendChild(frame);
  const win = frame.contentWindow;
  const doc = win?.document;
  if (!win || !doc) {
    frame.remove();
    return false;
  }

  const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"><title>${escapeHtml(options.fileName)}</title>
${collectStyles()}
<style>
@page{size:A4 ${orientation};margin:10mm 12mm 12mm 12mm}
html,body{margin:0!important;padding:0!important;background:#fff!important;height:auto!important;overflow:visible!important}
*{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;scrollbar-width:none!important}
*::-webkit-scrollbar{display:none!important;width:0!important;height:0!important}
.no-print{display:none!important}
.print-watermark{position:fixed!important;inset:0!important;overflow:hidden!important}
.print-isolated-root>*{width:100%!important;max-width:100%!important;min-height:0!important;margin:0!important;box-shadow:none!important;border:0!important;border-radius:0!important;overflow:visible!important}
${options.abnt ? ABNT_PRINT_CSS : ''}
${options.extraCss || ''}
</style></head><body><div class="print-isolated-root">${element.outerHTML}</div></body></html>`;

  doc.open();
  doc.write(html);
  doc.close();

  const restoreTitle = setPrintTitle(options.fileName);
  let fired = false;
  const go = () => {
    if (fired) return;
    fired = true;
    if (options.fitToPage) fitRootToOnePage(doc, area.height, options.minScale ?? 0.62);
    try {
      win.addEventListener('afterprint', restoreTitle, { once: true });
      win.focus();
      win.print();
    } finally {
      setTimeout(() => frame.remove(), 60_000);
    }
  };

  // Espera estilos e logos do timbre carregarem (no máximo 3 s).
  const waitables: Array<HTMLImageElement | HTMLLinkElement> = [
    ...Array.from(doc.images).filter((im) => !im.complete),
    ...Array.from(doc.querySelectorAll('link[rel="stylesheet"]')) as HTMLLinkElement[],
  ];
  if (!waitables.length) {
    setTimeout(go, 200);
  } else {
    let left = waitables.length;
    const done = () => {
      left -= 1;
      if (left <= 0) setTimeout(go, 100);
    };
    waitables.forEach((el) => {
      el.addEventListener('load', done, { once: true });
      el.addEventListener('error', done, { once: true });
    });
    setTimeout(go, 3000);
  }
  return true;
}

/**
 * Reduz o documento para caber em uma folha, sem mudar o layout.
 * Usa zoom (o navegador refaz a quebra de linhas na escala nova, e a impressão respeita).
 */
function fitRootToOnePage(doc: Document, areaHeightMm: number, minScale: number): void {
  const page = doc.querySelector('.print-isolated-root > *') as HTMLElement | null;
  if (!page) return;
  const available = areaHeightMm * MM_TO_PX - 6; // folga para arredondamentos
  const height = page.scrollHeight;
  if (!height || height <= available) return;
  const scale = available / height;
  if (scale < minScale) return; // grande demais: deixa seguir para a próxima página
  (page.style as any).zoom = String(Math.floor(scale * 1000) / 1000);
  page.style.setProperty('overflow', 'hidden', 'important');
  page.style.setProperty('max-height', `${Math.floor(available / scale)}px`, 'important');
}

/**
 * Rede de segurança para qualquer impressão que ainda use window.print():
 * se o título da aba for o padrão do sistema, troca por um nome único
 * (título da tela + data/hora) enquanto o diálogo de impressão está aberto.
 */
export function installPrintTitleGuard(): void {
  if ((window as any).__sucessoPrintGuard) return;
  (window as any).__sucessoPrintGuard = true;
  let previous: string | null = null;
  window.addEventListener('beforeprint', () => {
    if (document.title !== APP_TITLE && !document.title.startsWith(APP_TITLE)) return;
    const heading =
      document.querySelector('main h1, main h2')?.textContent?.trim() ||
      document.querySelector('.fixed.inset-0 h2, .fixed.inset-0 h3')?.textContent?.trim() ||
      'Documento';
    previous = document.title;
    document.title = printFileName('SucessoEdu', heading);
  });
  window.addEventListener('afterprint', () => {
    if (previous !== null) {
      document.title = previous;
      previous = null;
    }
  });
}
