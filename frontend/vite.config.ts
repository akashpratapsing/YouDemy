import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;

          const normalized = id.replace(/\\/g, '/');
          if (
            normalized.includes('/@tiptap/') ||
            normalized.includes('/prosemirror/') ||
            normalized.includes('/orderedmap/') ||
            normalized.includes('/w3c-keyname/')
          ) {
            return 'editor';
          }
          if (normalized.includes('/@tanstack/')) return 'query';
          if (normalized.includes('/react-router')) return 'router';
          if (
            normalized.includes('/@radix-ui/') ||
            normalized.includes('/class-variance-authority/') ||
            normalized.includes('/clsx/') ||
            normalized.includes('/tailwind-merge/') ||
            normalized.includes('/lucide-react/') ||
            normalized.includes('/sonner/')
          ) {
            return 'ui';
          }
          if (
            normalized.includes('/react/') ||
            normalized.includes('/react-dom/') ||
            normalized.includes('/scheduler/')
          ) {
            return 'react';
          }
        },
      },
    },
  },
});
