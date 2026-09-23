import { defineConfig } from 'vitest/config';

// Configuração separada do vite.config.ts para os testes não carregarem plugins do app.
export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
});
