import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Optimizaciones para Netlify
    rollupOptions: {
      output: {
        manualChunks: {
          // Separar librerías grandes en chunks independientes
          'react-vendor': ['react', 'react-dom'],
          'router-vendor': ['react-router-dom'],
          'ui-vendor': ['lucide-react', 'react-hot-toast', 'react-dropzone'],
          'azure-vendor': ['@azure-rest/ai-document-intelligence'],
          'pdf-vendor': ['jspdf', 'html2canvas'],
          'tutorial-vendor': ['react-joyride'],
          'utils-vendor': ['axios', 'xlsx']
        }
      }
    },
    // Aumentar el límite de advertencia de chunk size
    chunkSizeWarningLimit: 1000,
    // Optimizaciones adicionales
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remover console.log en producción
        drop_debugger: true
      }
    },
    // Configuración de sourcemaps para producción
    sourcemap: false
  },
  // Configuración del servidor de desarrollo
  server: {
    port: 5173,
    host: true, // Permitir acceso desde red local
    cors: true
  },
  // Configuración de preview
  preview: {
    port: 4173,
    host: true
  },
  // Variables de entorno
  define: {
    __APP_VERSION__: JSON.stringify('1.0.0')
  }
})
