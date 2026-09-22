import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      chunkSizeWarningLimit: 3000,
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom'],
            'vendor-ui': ['lucide-react', 'motion'],
            'vendor-charts': ['recharts'],
            'vendor-data': ['xlsx', 'jszip'],
            'standalone-generator': ['./src/utils/standaloneAppHtml', './src/utils/standaloneAppHtmlViews'],
            'installer-scripts': ['./src/utils/installerGenerator', './src/utils/omniDeployGenerator'],
          },
        },
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    // Força o Vite a descartar e reconstruir do zero o cache de dependências
    // pré-empacotadas (node_modules/.vite) sempre que o servidor de
    // desenvolvimento reiniciar. Sem isso, alterações recentes no projeto
    // podem deixar chunks antigos e novos do react-dom coexistindo na mesma
    // sessão do navegador (hashes ?v= diferentes), causando o erro
    // "Cannot read properties of null (reading 'useState')" em vários
    // módulos carregados via lazy(). Listar as dependências explicitamente
    // em "include" evita que o otimizador precise re-escanear em pleno uso,
    // o que é o gatilho mais comum desse tipo de inconsistência.
    optimizeDeps: {
      force: true,
      include: ['react', 'react-dom', 'react-dom/client', 'react/jsx-runtime', 'lucide-react', 'recharts', 'motion', 'xlsx', 'jszip'],
    },
  };
});
