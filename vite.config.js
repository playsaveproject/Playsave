// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';

export default defineConfig({
  plugins: [
    react(),
    svgr({
      // opcional: configura habilitar o deshabilitar
      exportAsDefault: false,
    }),
  ],
});