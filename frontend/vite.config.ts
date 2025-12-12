import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV || "development"),
  },
  // Fix for @react-pdf/renderer AMD module loading conflict
  optimizeDeps: {
    include: ['@react-pdf/renderer'],
    esbuildOptions: {
      // Disable AMD detection for hyphen library used by react-pdf
      define: {
        'define.amd': 'false',
      },
    },
  },
  build: {
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'framer-motion'],
          ui: ['@radix-ui/react-slot', 'lucide-react'],
        },
      },
    },
  },
})
