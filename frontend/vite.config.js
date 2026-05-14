import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/chat': {
        target: 'http://localhost:5002',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/chat/, '/chat'),
      },
      // Other REST endpoints on the chatbot service
      '/api/recent-incidents': {
        target: 'http://localhost:5002',
        changeOrigin: true,
      },
      '/api/stats': {
        target: 'http://localhost:5002',
        changeOrigin: true,
      },
      '/api/evidence': {
        target: 'http://localhost:5002',
        changeOrigin: true,
      },
      '/api/camera-status': {
        target: 'http://localhost:5002',
        changeOrigin: true,
      },
      '/health': {
        target: 'http://localhost:5002',
        changeOrigin: true,
      },
    },
  },
})
