/** @type {import('vite').UserConfig} */
import { defineConfig, UserConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [
    react(),
    dts({
      insertTypesEntry: true,
    }),
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
        "vuer/index": path.resolve(__dirname, "./vuer/index.tsx"),
        "vuer/demos/3dfs_demo": path.resolve(__dirname, "./vuer/demos/3dfs_demo.tsx"),
        // "store": path.resolve(__dirname, "./vuer/store.tsx"),
        // "util": path.resolve(__dirname, "./vuer/util.tsx"),
        // "interfaces": path.resolve(__dirname, "./vuer/interfaces.tsx"),
      },
      formats: ['cjs'],
      // fileName: (format) => `vuer.${format}.js`,
    },
    rollupOptions: {
      // These are the libraries that we do not want to include in our bundle.
      external: [
        'react', 'react-dom', 'styled-components',
      ],
      output: {
        preserveModules: true,
        inlineDynamicImports: false,
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          'styled-components': 'styled',
        },
      },
    },
  },
} satisfies UserConfig);
