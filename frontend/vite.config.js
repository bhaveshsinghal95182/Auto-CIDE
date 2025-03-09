import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    headers: {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
    },
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
      '/cdn': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
      '/socket.io': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
        ws: true,
      },
      '/_api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
      '/_assets': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  optimizeDeps: {
    // Exclude WebContainer from optimization to prevent issues
    exclude: ['@webcontainer/api'],
  },
  build: {
    // Ensure proper handling of WebContainer in production builds
    rollupOptions: {
      external: ['@webcontainer/api'],
      output: {
        manualChunks: {
          webcontainer: ['@webcontainer/api'],
        },
      },
    },
  },
})
