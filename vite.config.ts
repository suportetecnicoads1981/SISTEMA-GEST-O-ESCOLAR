import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import { defineConfig, type Plugin } from 'vite';

/**
 * Gera dist/offline-manifest.json com a lista de arquivos do sistema compilado.
 * O módulo "Instaladores" usa essa lista para montar o pacote do Servidor Remoto /
 * Sede com o sistema real (o mesmo publicado na nuvem), para uso sem internet.
 */
function offlineManifest(): Plugin {
  let outDir = 'dist';
  return {
    name: 'sucessoedu-offline-manifest',
    apply: 'build',
    configResolved(config) {
      outDir = path.resolve(config.root, config.build.outDir);
    },
    closeBundle() {
      const files: string[] = [];
      const walk = (dir: string) => {
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
          const full = path.join(dir, entry.name);
          if (entry.isDirectory()) walk(full);
          else files.push(path.relative(outDir, full).split(path.sep).join('/'));
        }
      };
      walk(outDir);
      const appFiles = files.filter((f) => !f.startsWith('offline/') && f !== 'offline-manifest.json').sort();
      const scripts = files.filter((f) => f.startsWith('offline/')).map((f) => f.slice('offline/'.length)).sort();
      fs.writeFileSync(
        path.join(outDir, 'offline-manifest.json'),
        JSON.stringify({ builtAt: new Date().toISOString(), files: appFiles, scripts }, null, 2)
      );
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), offlineManifest()],
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
