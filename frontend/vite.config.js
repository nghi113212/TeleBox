import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Intercept console errors to suppress WebSocket proxy errors
const originalError = console.error
console.error = (...args) => {
  const msg = args[0]?.toString() || ''
  if (msg.includes('ws proxy error') || msg.includes('ws proxy socket error') || 
      msg.includes('ECONNABORTED')) {
    return // Suppress WebSocket proxy errors
  }
  originalError.apply(console, args)
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      // Proxy API requests to backend
      '/api': {
        target: 'http://localhost:8386',
        changeOrigin: true,
        secure: false,
        timeout: 10000,
      },
      // Proxy Socket.IO requests to backend
      '/socket.io': {
        target: 'http://localhost:8386',
        changeOrigin: true,
        ws: true, // Enable WebSocket proxy
        secure: false,
        timeout: 10000,
        // Handle WebSocket errors more gracefully
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            // Suppress ECONNABORTED errors (expected when user not authenticated)
            if (err.code !== 'ECONNABORTED') {
              console.log('proxy error', err);
            }
          });
          proxy.on('proxyReq', (proxyReq, req, res) => {
            // Set headers to keep connection alive
            proxyReq.setHeader('Connection', 'keep-alive');
          });
          proxy.on('proxyReqWs', (proxyReq, req, socket, options, head) => {
            // Handle WebSocket upgrade errors
            socket.on('error', (err) => {
              // Suppress ECONNABORTED errors (expected when user not authenticated)
              if (err.code !== 'ECONNABORTED') {
                console.error('WebSocket proxy socket error:', err.message);
              }
            });
          });
        },
      },
    },
  },
})
