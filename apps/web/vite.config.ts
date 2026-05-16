import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://localhost:3001', changeOrigin: true },
      '/uploads': { target: 'http://localhost:3001', changeOrigin: true },
      '/care-guides/images': { target: 'http://localhost:3001', changeOrigin: true },
      '/care-guides/photos': { target: 'http://localhost:3001', changeOrigin: true },
    },
  },
});
