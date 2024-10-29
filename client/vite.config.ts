import { createRequire } from 'module';
import inject from '@rollup/plugin-inject';
import stdLibBrowser from 'node-stdlib-browser';
import path from 'path';
import wasm from 'vite-plugin-wasm';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

const require = createRequire(import.meta.url);

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    wasm(),
    {
      ...inject({
        global: [
          require.resolve(
            './node_modules/node-stdlib-browser/helpers/esbuild/shim',
          ),
          'global',
        ],
        process: [
          require.resolve(
            './node_modules/node-stdlib-browser/helpers/esbuild/shim',
          ),
          'process',
        ],
        Buffer: [
          require.resolve(
            './node_modules/node-stdlib-browser/helpers/esbuild/shim',
          ),
          'Buffer',
        ],
      }),
      enforce: 'post',
    },
  ],
  resolve: {
    alias: {
      ...stdLibBrowser,
      'symbol-crypto-wasm-node': path.resolve(
        __dirname,
        'node_modules/symbol-crypto-wasm-web/symbol_crypto_wasm.js',
      ),
    },
  },
  optimizeDeps: {
    esbuildOptions: {
      target: 'esnext',
    },
    include: ['buffer', 'process'],
  },
  build: {
    target: 'esnext',
    rollupOptions: {
      output: {
        manualChunks: {},
      },
    },
  },
});