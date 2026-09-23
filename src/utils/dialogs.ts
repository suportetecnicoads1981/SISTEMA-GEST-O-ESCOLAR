/**
 * Diálogos do próprio sistema (confirmação, aviso e pergunta).
 *
 * Substituem window.confirm / alert / prompt. Dentro da pré-visualização do
 * AI Studio (iframe com sandbox) e de alguns navegadores embutidos, os diálogos
 * nativos são bloqueados: confirm() devolve false na hora e o usuário nem vê a
 * pergunta. Resultado: botões como "Remover matrícula" não faziam nada.
 *
 * Implementação em DOM puro para funcionar em qualquer lugar (componentes,
 * serviços, telas fora do React).
 */

type Tone = 'danger' | 'default';

interface ConfirmOptions {
  title?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: Tone;
}

const Z = '2147483000';

function el<K extends keyof HTMLElementTagNameMap>(tag: K, style: Partial<CSSStyleDeclaration>, text?: string) {
  const node = document.createElement(tag);
  Object.assign(node.style, style);
  if (text !== undefined) node.textContent = text;
  return node;
}

function buildShell(title: string) {
  const overlay = el('div', {
    position: 'fixed',
    inset: '0',
    background: 'rgba(15,23,42,0.55)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '16px',
    zIndex: Z,
    fontFamily: 'Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
  });
  overlay.setAttribute('data-sucessoedu-dialog', 'true');
  const box = el('div', {
    background: '#ffffff',
    color: '#0f172a',
    borderRadius: '16px',
    maxWidth: '460px',
    width: '100%',
    boxShadow: '0 20px 50px rgba(0,0,0,0.25)',
    padding: '20px',
  });
  box.setAttribute('role', 'dialog');
  box.setAttribute('aria-modal', 'true');
  const heading = el('h2', { margin: '0 0 8px', fontSize: '15px', fontWeight: '700' }, title);
  heading.id = `dlg-title-${Date.now()}`;
  box.setAttribute('aria-labelledby', heading.id);
  box.appendChild(heading);
  overlay.appendChild(box);
  return { overlay, box };
}

function messageNode(message: string) {
  return el('p', { margin: '0 0 16px', fontSize: '13px', lineHeight: '1.5', whiteSpace: 'pre-line', color: '#334155' }, message);
}

function button(label: string, variant: 'primary' | 'danger' | 'ghost') {
  const colors = {
    primary: { background: '#4f46e5', color: '#fff', border: '1px solid #4f46e5' },
    danger: { background: '#e11d48', color: '#fff', border: '1px solid #e11d48' },
    ghost: { background: '#fff', color: '#334155', border: '1px solid #cbd5e1' },
  }[variant];
  const b = el('button', {
    ...colors,
    padding: '8px 14px',
    borderRadius: '10px',
    fontSize: '13px',
    fontWeight: '700',
    cursor: 'pointer',
  }, label);
  b.type = 'button';
  return b;
}

function mount(overlay: HTMLElement, focusTarget: HTMLElement, onEscape: () => void) {
  const previous = document.activeElement as HTMLElement | null;
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      onEscape();
    }
  };
  document.addEventListener('keydown', onKey, true);
  document.body.appendChild(overlay);
  setTimeout(() => focusTarget.focus(), 0);
  return () => {
    document.removeEventListener('keydown', onKey, true);
    overlay.remove();
    try {
      previous?.focus();
    } catch {
      /* elemento anterior já não existe */
    }
  };
}

/** Pergunta de confirmação. Resolve true só se a pessoa clicar em confirmar. */
export function confirmDialog(message: string, options: ConfirmOptions = {}): Promise<boolean> {
  if (typeof document === 'undefined') return Promise.resolve(false);
  const tone: Tone = options.tone || (/exclu|remov|apag|limpar|zerar|restaur/i.test(message) ? 'danger' : 'default');
  return new Promise((resolve) => {
    const { overlay, box } = buildShell(options.title || 'Confirmar ação');
    box.appendChild(messageNode(message));
    const row = el('div', { display: 'flex', justifyContent: 'flex-end', gap: '8px' });
    const cancel = button(options.cancelLabel || 'Cancelar', 'ghost');
    const ok = button(options.confirmLabel || (tone === 'danger' ? 'Sim, confirmar' : 'Confirmar'), tone === 'danger' ? 'danger' : 'primary');
    row.append(cancel, ok);
    box.appendChild(row);
    let unmount = () => {};
    const finish = (value: boolean) => {
      unmount();
      resolve(value);
    };
    cancel.onclick = () => finish(false);
    ok.onclick = () => finish(true);
    overlay.addEventListener('mousedown', (e) => {
      if (e.target === overlay) finish(false);
    });
    unmount = mount(overlay, cancel, () => finish(false));
  });
}

/** Aviso simples (substitui alert). Não bloqueia a execução. */
export function notify(message: unknown, title = 'Aviso'): Promise<void> {
  const text = String(message ?? '');
  if (typeof document === 'undefined') {
    console.info(text);
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    const { overlay, box } = buildShell(title);
    box.appendChild(messageNode(text));
    const row = el('div', { display: 'flex', justifyContent: 'flex-end' });
    const ok = button('OK', 'primary');
    row.appendChild(ok);
    box.appendChild(row);
    let unmount = () => {};
    const finish = () => {
      unmount();
      resolve();
    };
    ok.onclick = finish;
    unmount = mount(overlay, ok, finish);
  });
}

/** Pergunta com resposta em texto (substitui prompt). Resolve null se cancelar. */
export function promptDialog(message: string, defaultValue = '', title = 'Informação necessária'): Promise<string | null> {
  if (typeof document === 'undefined') return Promise.resolve(null);
  return new Promise((resolve) => {
    const { overlay, box } = buildShell(title);
    box.appendChild(messageNode(message));
    const input = el('input', {
      width: '100%',
      boxSizing: 'border-box',
      padding: '8px 10px',
      border: '1px solid #cbd5e1',
      borderRadius: '10px',
      fontSize: '13px',
      marginBottom: '14px',
    });
    input.value = defaultValue;
    input.setAttribute('aria-label', message);
    box.appendChild(input);
    const row = el('div', { display: 'flex', justifyContent: 'flex-end', gap: '8px' });
    const cancel = button('Cancelar', 'ghost');
    const ok = button('Confirmar', 'primary');
    row.append(cancel, ok);
    box.appendChild(row);
    let unmount = () => {};
    const finish = (value: string | null) => {
      unmount();
      resolve(value);
    };
    cancel.onclick = () => finish(null);
    ok.onclick = () => finish(input.value);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') finish(input.value);
    });
    unmount = mount(overlay, input, () => finish(null));
  });
}
