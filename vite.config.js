import { defineConfig } from 'vite';
import { resolve } from 'path';

// Multi-page Vite build so /es/ and /fi/ (when added) get their own
// pre-rendered index.html with the right <html lang> for SEO + crawlers.
export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        es:   resolve(__dirname, 'es/index.html'),
      },
    },
  },
});
