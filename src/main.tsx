import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { AuthProvider } from './contexts/AuthContext';
import { AuthBarrier } from './components/auth/AuthBarrier';
import { sanitizeLegacyLocalStorage, applyProductionStartOnce } from './data/storage';
import './index.css';
import { installApiAuthFetch } from './utils/apiAuthFetch';

// Envia o token da sessão da nuvem nas chamadas à API do servidor (/api/...).
installApiAuthFetch();

// Saneamento preventivo síncrono antes do primeiro ciclo de renderização
try {
  // Se o storage tiver formato legado com rolePreferences inconsistente, higieniza imediatamente
  sanitizeLegacyLocalStorage();
  // Uma única vez por computador: remove os dados de demonstração locais (com backup antes).
  applyProductionStartOnce();
} catch (err) {
  console.warn('[SucessoEdu] Erro não impeditivo no saneamento inicial:', err);
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

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <AuthBarrier>
          <App />
        </AuthBarrier>
      </AuthProvider>
    </ErrorBoundary>
  </StrictMode>,
);

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


