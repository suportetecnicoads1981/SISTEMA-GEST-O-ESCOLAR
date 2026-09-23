// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { confirmDialog, notify, promptDialog } from '../src/utils/dialogs';

const dlg = () => document.querySelector('[data-sucessoedu-dialog]') as HTMLElement | null;
const btn = (label: RegExp) => [...(dlg()?.querySelectorAll('button') || [])].find((b) => label.test(b.textContent || '')) as HTMLButtonElement;

afterEach(() => document.querySelectorAll('[data-sucessoedu-dialog]').forEach((n) => n.remove()));

describe('diálogos do sistema', () => {
  it('confirmar resolve true e remove o diálogo', async () => {
    const p = confirmDialog('Excluir a turma 1A?');
    expect(dlg()?.textContent).toContain('Excluir a turma 1A?');
    btn(/Sim, confirmar/).click();
    await expect(p).resolves.toBe(true);
    expect(dlg()).toBeNull();
  });
  it('cancelar e Esc resolvem false', async () => {
    const p1 = confirmDialog('Remover?');
    btn(/Cancelar/).click();
    await expect(p1).resolves.toBe(false);
    const p2 = confirmDialog('Remover?');
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await expect(p2).resolves.toBe(false);
  });
  it('prompt devolve o texto digitado ou null', async () => {
    const p = promptDialog('Justificativa:', 'Atestado');
    const input = dlg()!.querySelector('input')!;
    expect(input.value).toBe('Atestado');
    input.value = 'Consulta médica';
    btn(/Confirmar/).click();
    await expect(p).resolves.toBe('Consulta médica');
    const p2 = promptDialog('Justificativa:');
    btn(/Cancelar/).click();
    await expect(p2).resolves.toBeNull();
  });
  it('aviso fecha no OK', async () => {
    const p = notify('Salvo!');
    btn(/OK/).click();
    await expect(p).resolves.toBeUndefined();
  });
});
