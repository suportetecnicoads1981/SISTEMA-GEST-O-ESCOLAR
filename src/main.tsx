import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import './index.css';

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
      <App />
    </ErrorBoundary>
  </StrictMode>,
);

// Registrar Service Worker com Workbox para suporte offline
if ('serviceWorker' in navigator) {
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


