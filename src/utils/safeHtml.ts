/**
 * Proteção contra XSS nos documentos de impressão.
 *
 * Os relatórios de impressão são montados com template strings que recebem
 * nomes de alunos, turmas, observações etc. Se algum desses textos contiver
 * HTML malicioso (ex.: <img src=x onerror=...>), ele executaria na janela de
 * impressão, com acesso à sessão do usuário. Estas funções removem tudo que
 * pode executar código antes de escrever o HTML na janela.
 */

import { withLetterheadInDocument, type LetterheadTarget } from '../services/documentBranding';

/** Escapa texto para inserção segura dentro de HTML. */
export function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const FORBIDDEN_TAGS = ['script', 'iframe', 'frame', 'frameset', 'object', 'embed', 'base', 'form', 'noscript'];
const URL_ATTRS = ['href', 'src', 'xlink:href', 'action', 'formaction', 'background', 'poster'];

function isDangerousUrl(value: string): boolean {
  const v = value.replace(/[\s\u0000-\u001f]+/g, '').toLowerCase();
  return (
    v.startsWith('javascript:') ||
    v.startsWith('vbscript:') ||
    (v.startsWith('data:') && !v.startsWith('data:image/'))
  );
}

function cleanTree(root: ParentNode): void {
  root.querySelectorAll(FORBIDDEN_TAGS.join(',')).forEach((el) => el.remove());
  root.querySelectorAll('meta[http-equiv]').forEach((el) => el.remove());

  root.querySelectorAll('*').forEach((el) => {
    for (const attr of Array.from(el.attributes)) {
      const name = attr.name.toLowerCase();
      if (name.startsWith('on') || name === 'srcdoc') {
        el.removeAttribute(attr.name);
        continue;
      }
      if (URL_ATTRS.includes(name) && isDangerousUrl(attr.value)) {
        el.removeAttribute(attr.name);
      }
    }
  });

  // Conteúdo de <template> não aparece em querySelectorAll do documento.
  root.querySelectorAll('template').forEach((tpl) => cleanTree((tpl as HTMLTemplateElement).content));
}

/**
 * Remove scripts, handlers on*, URLs javascript: e elementos perigosos de um
 * documento HTML completo, preservando <style> e o layout.
 */
export function sanitizeHtmlDocument(html: string): string {
  if (typeof DOMParser === 'undefined') return escapeHtml(html);
  const doc = new DOMParser().parseFromString(html, 'text/html');
  cleanTree(doc);
  return '<!DOCTYPE html>\n' + doc.documentElement.outerHTML;
}

/** Mesma limpeza para um trecho de HTML (conteúdo parcial). */
export function sanitizeHtmlFragment(html: string): string {
  if (typeof document === 'undefined') return escapeHtml(html);
  const template = document.createElement('template');
  template.innerHTML = html;
  cleanTree(template.content);
  return template.innerHTML;
}

/**
 * Escreve um documento de impressão já sanitizado na janela e dispara a
 * impressão (os <script> originais, como window.onload = print, são removidos).
 */
export function writeSafePrintDocument(
  printWindow: Window,
  html: string,
  autoPrint = true,
  letterhead?: LetterheadTarget | false
): void {
  printWindow.document.open();
  // Timbre padrão (logos da Gestão, SEMED e escola) no topo do documento.
  const withHead = letterhead === false ? html : withLetterheadInDocument(html, letterhead || undefined);
  printWindow.document.write(sanitizeHtmlDocument(withHead));
  printWindow.document.close();
  if (autoPrint) {
    setTimeout(() => {
      try {
        printWindow.focus();
        printWindow.print();
      } catch {
        /* janela fechada pelo usuário */
      }
    }, 400);
  }
}
