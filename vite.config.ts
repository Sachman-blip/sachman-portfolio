import { defineConfig } from 'vite';

// Static single-page build, output to /dist for Vercel.
export default defineConfig({
  build: {
    target: 'es2020',
    assetsInlineLimit: 4096,
  },
});
