import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
export default defineConfig({
  base: process.env.AXO_PREVIEW_BASE || '/axolotl-2/',
  plugins: [
    // Preview-only persistence adapter. The production module stays unchanged;
    // no temporary writes to the production sessionStorage key are necessary.
    {
      name:'header-preview-storage', enforce:'pre',
      transform(source, id) {
        if (!id.split('?')[0].endsWith('/src/lib/browser-bridge.ts')) return;
        const original='const storageKey = "axolotl-2-target-url";';
        if (source.split(original).length !== 2) throw new Error('Browser bridge persistence changed; review the preview adapter.');
        return {code:source.replace(original,'const storageKey = "axolotl-header-rebuild-target-url";'),map:null};
      },
    },
    react(), tailwindcss(),
  ],
  build: { outDir: 'dist-header-rebuild', rollupOptions: { input: 'header-rebuild.html' } },
});
