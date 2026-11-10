import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const backend = `http://localhost:${process.env.PORT ?? '3000'}`;

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: { outDir: 'dist/web', emptyOutDir: true },
  server: {
    host: true, // reachable from phones on the local network
    port: 5173,
    proxy: { '/api': backend, '/media': backend },
  },
});
