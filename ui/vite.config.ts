import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: path.resolve(__dirname, '../public'),
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    strictPort: false,
    cors: true,
    // HMR configuration for hot module replacement
    hmr: {
      host: 'localhost',
      port: 5173,
      protocol: 'ws',
    },
    // Proxy API calls to the backend server
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/login': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/logout': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/health': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    }
  }
})
