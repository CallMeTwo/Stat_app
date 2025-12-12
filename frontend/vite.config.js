import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
const API_TARGET = process.env.VITE_API_TARGET || 'http://localhost:5000'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',  // Listen on all network interfaces
    port: 5173,
    strictPort: false,
    proxy: {
      '/api': {
        target: API_TARGET,
        changeOrigin: true,
        secure: false,
        // Don't rewrite the path, send it as-is
        rewrite: (path) => path,
        // Ensure multipart/form-data is handled correctly
        headers: {
          'Connection': 'upgrade',
        },
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'esbuild',
  },
})
