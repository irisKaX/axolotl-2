import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'node:url';
export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  base: process.env.AXO_VEIL_BASE || '/axolotl-preview/dark-veil-lab/',
  publicDir: false,
  plugins: [react(), tailwindcss()],
  build: { outDir: fileURLToPath(new URL('../../../dist-dark-veil', import.meta.url)), emptyOutDir: true },
});
