import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // 1. API requests handle karne ke liye
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      // 2. Socket.io WebSockets handle karne ke liye
      '/socket.io': {
        target: 'http://localhost:5000',
        ws: true,
      }
    }
  }
})