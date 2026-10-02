import { lazy, type ComponentType } from 'react';

/**
 * Carrega um módulo só quando ele é aberto (deixa a abertura do sistema mais leve).
 *
 * Se o arquivo do módulo não for encontrado — o caso típico é uma janela aberta antes de
 * uma nova versão ser publicada, que procura um arquivo antigo — recarrega a página uma
 * vez para buscar a versão nova, em vez de deixar a tela em branco.
 */
const RELOAD_FLAG = 'sucessoedu_chunk_reload';

export function lazyModule<T extends ComponentType<any>>(load: () => Promise<{ default: T }>) {
  return lazy(async () => {
    try {
      const mod = await load();
      try {
        sessionStorage.removeItem(RELOAD_FLAG);
      } catch {
        /* sem sessionStorage */
      }
      return mod;
    } catch (err) {
      let alreadyTried = false;
      try {
        alreadyTried = sessionStorage.getItem(RELOAD_FLAG) === '1';
        if (!alreadyTried) sessionStorage.setItem(RELOAD_FLAG, '1');
      } catch {
        alreadyTried = true;
      }
      if (!alreadyTried && typeof window !== 'undefined') {
        window.location.reload();
        return new Promise<{ default: T }>(() => {});
      }
      throw err;
    }
  });
}
