import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Config exclusiva para build WEB (Vercel) — sem plugin Electron
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        // Code splitting: separa vendor de app para melhor cache no browser
        // Vite 8 (rolldown) exige função
        manualChunks(id) {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('node_modules/react-router-dom')) {
            return 'vendor';
          }
        },
      },
    },
  },
})
