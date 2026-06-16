import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // `host: true` exposes the dev server on 0.0.0.0 so it works inside Docker.
  server: { port: 5173, host: true },
  preview: { port: 5173, host: true },
  // The shared package is a linked workspace whose built output is CommonJS and
  // lives outside node_modules. Tell Rollup's commonjs plugin to transform it
  // (so its named exports are detected) and have esbuild pre-bundle it in dev.
  optimizeDeps: { include: ['@betterreviews/shared'] },
  build: {
    commonjsOptions: { include: [/packages\/shared/, /node_modules/] },
  },
});
