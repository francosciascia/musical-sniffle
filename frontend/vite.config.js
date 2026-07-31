import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Vite = el "servidor de desarrollo" del front.
// El proxy hace que /api/... vaya al backend en :8080
// sin pelearnos con CORS mientras desarrollamos.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})
