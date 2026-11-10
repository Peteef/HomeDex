import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const { PORT = '3000' } = loadEnv(mode, process.cwd(), '');
  const backend = `http://localhost:${PORT}`;
  return {
    plugins: [react(), tailwindcss()],
    build: { outDir: 'dist/web', emptyOutDir: true },
    server: {
      host: true, // reachable from phones on the local network
      port: 5173,
      proxy: { '/api': backend, '/media': backend },
    },
  };
});
