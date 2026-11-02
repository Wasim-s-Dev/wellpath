import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Dev server proxies API calls to the backend, so the browser never hits CORS issues locally.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    proxy: {
      '/api': 'http://localhost:4000',
      '/health': 'http://localhost:4000',
    },
  },
})
