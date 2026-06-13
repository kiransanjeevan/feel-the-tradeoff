import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Using vitest/config (not vite/config) so the `test` block below is typed.
export default defineConfig({
  plugins: [react()],
  // Relative base so the static build works on GitHub Pages or Vercel without config.
  base: './',
  test: {
    globals: true,
    environment: 'node', // metrics.ts is pure — no DOM needed. Switch to 'jsdom' when component tests arrive.
  },
});
