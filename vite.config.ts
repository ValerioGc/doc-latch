import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';
import { createRequire } from 'module';

import combineSelectors from 'postcss-combine-duplicated-selectors';
import purgecss from '@fullhuman/postcss-purgecss';
import cssnano from 'cssnano';

const require = createRequire(import.meta.url);
const pkg = require('./package.json') as { version: string };

const githubUrl = 'https://github.com/ValerioGc/doc-latch';

export default defineConfig({
  plugins: [vue()],

  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },

  define: {
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(pkg.version),
    'import.meta.env.VITE_GITHUB_URL': JSON.stringify(githubUrl),
  },

  css: {
    preprocessorOptions: {
      scss: {
        loadPaths: [resolve(__dirname, './src/styles')],
        additionalData: `@use 'variables' as *;\n@use 'mixins' as *;\n@use 'placeholders' as *;\n@use 'settings' as *;\n`,
        silenceDeprecations: ['legacy-js-api'],
      },
    },
    postcss: {
      plugins: [
        combineSelectors({ removeDuplicatedProperties: true }),
        purgecss({
          content: [
            './public/**/*.html',
            './src/**/*.vue',
            './src/**/*.ts',
            './src/**/*.scss',
          ],
          safelist: {
            standard: [/^v-/, /^dark/],
          },
          defaultExtractor: (content) => content.match(/[\w-/:]+(?<!:)/g) ?? [],
        }),
        cssnano({ preset: 'default' }),
      ],
    },
  },

  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    watch: {
      ignored: ['**/src-tauri/**'],
    },
  },
})
