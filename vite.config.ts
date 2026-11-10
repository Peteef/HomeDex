import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import { DEFAULT_PORT } from './src/platform/backend/infrastructure/config.ts';
import { API_PATH, MEDIA_PATH } from './src/platform/backend/infrastructure/constants.ts';

const DEV_SERVER_PORT = 5173;
const WEB_BUILD_DIR = 'dist/web';

export default defineConfig(({ mode }) => {
  const { PORT = String(DEFAULT_PORT) } = loadEnv(mode, process.cwd(), '');
  const backend = `http://localhost:${PORT}`;
  return {
    plugins: [react(), tailwindcss()],
    build: { outDir: WEB_BUILD_DIR, emptyOutDir: true },
    server: {
      host: true, // reachable from phones on the local network
      port: DEV_SERVER_PORT,
      proxy: { [API_PATH]: backend, [MEDIA_PATH]: backend },
    },
  };
});
