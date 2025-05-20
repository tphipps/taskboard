import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => ({
  base: mode === 'production' ? '/tb/' : '/',
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'https://tb-dev.redhill.atsui.com/taskboard-dev',
        changeOrigin: true,
        secure: false,
      },
    },
    host: '0.0.0.0',     // allows access from your LAN (e.g. 172.16.5.x)
    allowedHosts: true,
    port: 3000,
  },
}));

