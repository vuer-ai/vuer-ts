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
  build: {
    minify: false, // <-- this is the important part
    lib: {
      entry: path.resolve(__dirname, 'vuer/index.tsx'),
      name: '@vuer-ai/vuer',
      formats: ['es', 'umd'],
      fileName: (format) => `@vuer-ai/vuer.${format}.js`,
    },
    rollupOptions: {
      // These are the libraries that we do not want to include in our bundle.
      external: [
        'react', 'react-dom', 'styled-components',
      ],
      output: {
        globals: {
          react: 'React',
          "react-dom": 'ReactDOM',
          "styled-components": 'styled',
        },
      },
    },
  },
} satisfies UserConfig) ;