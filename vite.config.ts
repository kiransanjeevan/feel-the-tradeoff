import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Using vitest/config (not vite/config) so the `test` block below is typed.
export default defineConfig({
  plugins: [react()],
  // Relative base so the static build works on GitHub Pages or Vercel without config.
  base: './',
  // transformers.js ships WASM + workers that Vite's dep pre-bundler mishandles;
  // it's dynamically imported, so exclude it and let it load as its own chunk.
  optimizeDeps: { exclude: ['@huggingface/transformers'] },
  test: {
    globals: true,
    // metrics.ts is pure (node); component tests opt into jsdom via a
    // `// @vitest-environment jsdom` comment at the top of their file.
    environment: 'node',
    setupFiles: ['./vitest.setup.ts'],
  },
});
