import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      rollupOptions: {
        output: {
          // Split heavy third-party libraries into separate chunks so the main
          // bundle stays small and vendor code can be cached independently.
          manualChunks(id) {
            if (!id.includes('node_modules')) return;
            if (id.includes('pdfmake') || id.includes('jspdf') || id.includes('html2pdf') || id.includes('html-to-image')) return 'pdf';
            if (id.includes('exceljs') || id.includes('xlsx')) return 'sheets';
            if (id.includes('recharts') || id.includes('d3-') || id.includes('victory')) return 'charts';
            if (id.includes('firebase') || id.includes('@firebase') || id.includes('@google-cloud')) return 'firebase';
            if (id.includes('react') || id.includes('scheduler')) return 'react-vendor';
            if (id.includes('lucide-react') || id.includes('motion')) return 'ui';
            return 'vendor';
          },
        },
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: false,
    },
  };
});
