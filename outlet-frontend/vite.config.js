import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://70rgsz56-8080.inc1.devtunnels.ms/',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
