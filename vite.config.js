import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The backend developer's API can be proxied during development:
// set VITE_API_BASE_URL=/api in .env and point the proxy target at their server.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': { target: process.env.API_PROXY_TARGET || 'http://localhost:8000', changeOrigin: true },
      '/uploads': { target: process.env.API_PROXY_TARGET || 'http://localhost:8000', changeOrigin: true }
    }
  }
});
