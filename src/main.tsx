import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { AuthProvider } from './contexts/AuthContext';
import { AuthBarrier } from './components/auth/AuthBarrier';
import { sanitizeLegacyLocalStorage, applyProductionStartOnce, PRODUCTION_START_FLAG } from './data/storage';
import { bootstrapLocalServer } from './services/offline/localServerSync';
import { startCloudAutoSync } from './services/offline/cloudAutoSync';
import { LocalNetworkStatusBadge } from './components/offline/LocalNetworkStatusBadge';
import './index.css';
import { installApiAuthFetch } from './utils/apiAuthFetch';

// Envia o token da sessão da nuvem nas chamadas à API do servidor (/api/...).
installApiAuthFetch();

function prepareLocalState() {
// Saneamento preventivo síncrono antes do primeiro ciclo de renderização
try {
  // Se o storage tiver formato legado com rolePreferences inconsistente, higieniza imediatamente
  sanitizeLegacyLocalStorage();
  // Uma única vez por computador: remove os dados de demonstração locais (com backup antes).
  applyProductionStartOnce();
} catch (err) {
  console.warn('[SucessoEdu] Erro não impeditivo no saneamento inicial:', err);
}
}

// Silencia rejeições não tratadas esperadas decorrentes da desativação do WebSocket HMR no ambiente sandbox
window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason;
  const msg = reason?.message || (typeof reason === 'string' ? reason : '');
  if (
    msg.includes('WebSocket closed without opened') ||
    msg.includes('failed to connect to websocket') ||
    msg.includes('WebSocket')
  ) {
    event.preventDefault();
  }
});

function renderApp() {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <ErrorBoundary>
        <AuthProvider>
          <AuthBarrier>
            <App />
          </AuthBarrier>
        </AuthProvider>
        <LocalNetworkStatusBadge />
      </ErrorBoundary>
    </StrictMode>,
  );
}

// Aberto a partir do Servidor Remoto (escola) ou do Servidor da Sede na rede local:
// carrega o banco central do servidor antes de desenhar a tela.
bootstrapLocalServer({
  dataKey: 'sucessoedu_master_store_v5',
  markInitialized: () => {
    try {
      // Os dados passam a vir do servidor: as rotinas de limpeza deste navegador não se aplicam.
      localStorage.setItem('sucessoedu_clean_cumaru_do_norte_prod_v544', 'true');
      localStorage.setItem(PRODUCTION_START_FLAG, 'true');
    } catch {
      /* armazenamento indisponível */
    }
  },
})
  .catch(() => false)
  .then(() => {
    prepareLocalState();
    renderApp();
    startCloudAutoSync();
  });

// No ambiente de desenvolvimento (ou iframe do AI Studio), limpa caches antigos de SW para evitar servir scripts desatualizados
if ('serviceWorker' in navigator) {
  const isDevEnv = Boolean((import.meta as any)?.env?.DEV);
  if (isDevEnv) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) {
        registration.unregister();
      }
    });
    if ('caches' in window) {
      caches.keys().then((names) => {
        for (const name of names) {
          caches.delete(name);
        }
      });
    }
  } else {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('[SucessoEdu] Service Worker registrado com sucesso:', registration.scope);
        })
        .catch((error) => {
          console.warn('[SucessoEdu] Falha ao registrar Service Worker:', error);
        });
    });
  }
}


