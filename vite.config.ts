/** @type {import('vite').UserConfig} */
import { defineConfig, UserConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import mdPlugin from 'vite-plugin-markdown';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [
    react(),
    dts({
      insertTypesEntry: true,
    }),
    mdPlugin(),
  ],
  root: "vuer",
  build: {
    outDir: path.resolve(__dirname, './dist'),
    emptyOutDir: true,
    cssCodeSplit: true,
    minify: false, // <-- this is the important part
    lib: {
      name: 'Vuer',
      entry: path.resolve(__dirname, './vuer/index.tsx'),
      formats: [ 'es', 'cjs' ],
      fileName: (format) => `vuer.${format}.js`,
    },
    rollupOptions: {
      // These are the libraries that we do not want to include in our bundle.
      external: [
        'react', 'react-dom', 'styled-components',
      ],
      output: {
        // preserveModules: true,
        // inlineDynamicImports: false,
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          'styled-components': 'styled'
        },
      },
    },
  },
} satisfies UserConfig);
