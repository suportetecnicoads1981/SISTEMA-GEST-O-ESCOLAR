// Se o CDN do Workbox estiver inacessível (sem internet, firewall da escola),
// importScripts lança exceção e o Service Worker inteiro falhava ao registrar.
// Com o try/catch o SW continua funcionando, apenas sem as rotas de cache.
try {
  importScripts('https://storage.googleapis.com/workbox-cdn/releases/7.0.0/workbox-sw.js');
} catch (err) {
  console.warn('[SucessoEdu SW] Não foi possível carregar o Workbox:', err);
}

const workbox = self.workbox;

if (workbox) {
  console.log('[SucessoEdu SW] Workbox carregado com sucesso.');

  // Otimização de pré-cache e roteamento automático
  workbox.precaching.precacheAndRoute([]);

  // Cache para assets estáticos (JS, CSS, Imagens, Fontes) - CacheFirst
  workbox.routing.registerRoute(
    ({ request }) => 
      request.destination === 'style' ||
      request.destination === 'script' ||
      request.destination === 'image' ||
      request.destination === 'font',
    new workbox.strategies.CacheFirst({
      cacheName: 'sucessoedu-static-assets-v542',
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 100,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Dias
        }),
      ],
    })
  );

  // Cache para páginas HTML e navegação - NetworkFirst com fallback offline
  workbox.routing.registerRoute(
    ({ request }) => request.mode === 'navigate',
    new workbox.strategies.NetworkFirst({
      cacheName: 'sucessoedu-pages-v542',
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 20,
          maxAgeSeconds: 7 * 24 * 60 * 60, // 7 Dias
        }),
      ],
    })
  );

  // Cache para requisições de API / Supabase - NetworkFirst
  // (StaleWhileRevalidate exibia dados de alunos/notas desatualizados logo após
  // uma edição; agora a rede tem prioridade e o cache só é usado offline)
  workbox.routing.registerRoute(
    ({ url }) => url.pathname.includes('/rest/v1/') || url.origin.includes('supabase.co'),
    new workbox.strategies.NetworkFirst({
      networkTimeoutSeconds: 5,
      cacheName: 'sucessoedu-api-cache-v542',
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 50,
          maxAgeSeconds: 24 * 60 * 60, // 24 Horas
        }),
      ],
    })
  );

} else {
  console.warn('[SucessoEdu SW] Falha ao carregar Workbox via CDN.');
}

// Eventos de Instalação e Ativação
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});
