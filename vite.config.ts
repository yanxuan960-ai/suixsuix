import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // 必须与 GitHub 仓库名一致
  base: '/suixsuix/',
  build: {
    outDir: 'dist',
  },
  server: {
    port: 3000
  }
});