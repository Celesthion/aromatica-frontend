import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    open: true,
    // туннель (localhost.run, cloudflared) приходит с внешним хостом
    allowedHosts: true,
    // с пустым VITE_API_URL запросы идут через этот прокси: для туннеля достаточно пробросить 5173
    proxy: {
      '/api': { target: 'http://localhost:8080', changeOrigin: true },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
          tanstack: ['@tanstack/react-router', '@tanstack/react-query'],
          icons: ['lucide-react'],
        },
      },
    },
  },
})
