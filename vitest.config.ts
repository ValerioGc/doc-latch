import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pkg = require('./package.json') as { version: string };

export default defineConfig({
  plugins: [vue()],
  define: {
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(pkg.version),
    'import.meta.env.VITE_GITHUB_URL': JSON.stringify('https://github.com/ValerioGc/doclatch'),
  },
  css: {
    preprocessorOptions: {
      scss: {
        loadPaths: [resolve(__dirname, './src/styles')],
        additionalData: `@use 'variables' as *;\n@use 'mixins' as *;\n@use 'placeholders' as *;\n@use 'settings' as *;\n`,
        silenceDeprecations: ['legacy-js-api'],
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    testTimeout: 15000,
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/types/**',
        'src/styles/**',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80,
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
})
