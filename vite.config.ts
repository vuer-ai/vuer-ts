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
      entry: {
        "vuer": path.resolve(__dirname, './vuer/index.tsx'),
        "registry": path.resolve(__dirname, './vuer/registry.tsx'),
        "html_components/contexts/websocket": path.resolve(__dirname, './vuer/html_components/contexts/websocket.tsx'),
      },
      formats: [ 'es', 'cjs' ],
      fileName: (format, name) => `${name}.${format}.js`,
    },
    rollupOptions: {
      // These are the libraries that we do not want to include in our bundle.
      external: [
        'react', 'react-dom', 'styled-components',
      ],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          'styled-components': 'styled'
        },
      },
    },
  },
} satisfies UserConfig);
