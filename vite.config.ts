import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Split React into separate chunk (reduces main bundle)
          'react-vendor': ['react', 'react-dom'],
          // Split Firebase into separate chunk (largest dependency ~330KB)
          'firebase-vendor': ['firebase/app', 'firebase/firestore', 'firebase/auth', 'firebase/storage'],
          // Split ExcelJS (large library ~200KB)
          'excel-vendor': ['exceljs']
        }
      }
    },
    chunkSizeWarningLimit: 1000 // Increase warning threshold from 500KB to 1000KB
  }
});
