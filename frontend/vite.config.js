import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/chat': {
        target: 'http://34.21.241.79:5002',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/chat/, '/chat'),
      },
      // Other REST endpoints on the chatbot service
      '/api/recent-incidents': {
        target: 'http://34.21.241.79:5002',
        changeOrigin: true,
      },
      '/api/stats': {
        target: 'http://34.21.241.79:5002',
        changeOrigin: true,
      },
      '/api/evidence': {
        target: 'http://34.21.241.79:5002',
        changeOrigin: true,
      },
      '/api/camera-status': {
        target: 'http://34.21.241.79:5002',
        changeOrigin: true,
      },
      '/api/layer-counts': {
        target: 'http://34.21.241.79:5002',
        changeOrigin: true,
      },
      '/api/latency': {
        target: 'http://34.21.241.79:5002',
        changeOrigin: true,
      },
      '/health': {
        target: 'http://34.21.241.79:5002',
        changeOrigin: true,
      },
      '/api/union-read': {
        target: 'http://34.21.241.79:5002',
        changeOrigin: true,
      },
      // Exact match /chat (not /chatbot) — use regex key
      '^/chat$': {
        target: 'http://34.21.241.79:5002',
        changeOrigin: true,
      },
    },
  },
  define: {
    'import.meta.env.VITE_FLINK_URL': JSON.stringify('http://34.21.241.79:8081'),
    'import.meta.env.VITE_ADMIN_API_BASE_URL': JSON.stringify('http://34.21.241.79:5003'),
    'import.meta.env.VITE_GRAFANA_URL': JSON.stringify('http://34.21.241.79:3001'),
  },
})
