import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const GRAFANA_TARGET = 'http://34.124.131.144:3001'
const GRAFANA_PROXY_BASE = '/grafana-proxy'

// SSH tunnel config (HTTP — no mixed-content). GCP services = direct HTTP URLs.
// Vast.ai localhost services = proxied (mediamtx HLS + VioMoViNet API).
export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: ['.trycloudflare.com', '.ngrok.io', '.vercel.app', 'localhost'],
    proxy: {
      // ── Grafana dashboard iframe ── same-origin proxy for HTTPS tunnels.
      [GRAFANA_PROXY_BASE]: {
        target: GRAFANA_TARGET,
        changeOrigin: true,
        ws: true,
      },

      // ── Chatbot data API (GCP :5002) ── relative /api/* calls from frontend
      '/api/chat': {
        target: 'http://34.124.131.144:5002', changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/chat/, '/chat'),
        timeout: 300000, proxyTimeout: 300000,
      },
      '/api/recent-incidents': { target: 'http://34.124.131.144:5002', changeOrigin: true, timeout: 120000, proxyTimeout: 120000 },
      '/api/stats':            { target: 'http://34.124.131.144:5002', changeOrigin: true, timeout: 120000, proxyTimeout: 120000 },
      '/api/grafana':          { target: 'http://34.124.131.144:5002', changeOrigin: true },
      '/api/evidence':         { target: 'http://34.124.131.144:5002', changeOrigin: true },
      '/api/camera-status':    { target: 'http://34.124.131.144:5002', changeOrigin: true },
      '/api/layer-counts':     { target: 'http://34.124.131.144:5002', changeOrigin: true },
      '/api/latency':          { target: 'http://34.124.131.144:5002', changeOrigin: true },
      '/api/union-read':       { target: 'http://34.124.131.144:5002', changeOrigin: true },
      '/health':               { target: 'http://34.124.131.144:5002', changeOrigin: true },
      '^/chat$':               { target: 'http://34.124.131.144:5002', changeOrigin: true },

      // ── VioMoViNet inference server (Vast.ai :8000) ── real active streams
      '/vio': {
        target: 'http://localhost:8000', changeOrigin: true,
        rewrite: (path) => path.replace(/^\/vio/, ''),
      },

      // ── WebRTC live video (Vast.ai mediamtx :8889) ── proxy WHEP calls
      '^/rtc_': {
        target: 'http://localhost:8889', changeOrigin: true,
        rewrite: (path) => path.replace(/^\/rtc_/, ''),
      },

      // ── HLS live video (Vast.ai mediamtx :8888) ── proxy ALL cam_* paths
      // Matches: cam_01, cam_01_result, cam_01_bbox, cam_02_result, etc.
      '^/cam_': {
        target: 'http://localhost:8888', changeOrigin: true,
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            if (!proxyReq.path.includes('cookieCheck')) {
              proxyReq.path += (proxyReq.path.includes('?') ? '&' : '?') + 'cookieCheck=1';
            }
          });
        },
      },
    },
  },
  // GCP HTTP services that render inside the app must use same-origin proxies.
  define: {
    'import.meta.env.VITE_FLINK_URL': JSON.stringify('http://34.124.131.144:8081'),
    'import.meta.env.VITE_ADMIN_API_BASE_URL': JSON.stringify('http://34.124.131.144:5003'),
    'import.meta.env.VITE_GRAFANA_URL': JSON.stringify(GRAFANA_PROXY_BASE),
    'import.meta.env.VITE_GRAFANA_DIRECT_URL': JSON.stringify(`${GRAFANA_TARGET}${GRAFANA_PROXY_BASE}`),
  },
})
