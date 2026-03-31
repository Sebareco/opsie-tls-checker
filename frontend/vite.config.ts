import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      // Redirige cualquier llamada que empiece con /api hacia el puerto 3000 de Bun.
      '/api': 'http://localhost:3000'
    }
  }
})