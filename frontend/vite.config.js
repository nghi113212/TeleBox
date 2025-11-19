import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      // Proxy API requests to backend
      '/api': {
        target: 'http://localhost:8386',
        changeOrigin: true,
      },
      // Proxy Socket.IO requests to backend
      '/socket.io': {
        target: 'http://localhost:8386',
        changeOrigin: true,
        ws: true, // Enable WebSocket proxy
      },
    },
  },
})
