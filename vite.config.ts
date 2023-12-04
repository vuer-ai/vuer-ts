// https://vitejs.dev/config/
import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react'
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
        lib: {
            entry: path.resolve(__dirname, 'vuer/index.tsx'),
            name: 'vuer',
            formats: ['es', 'umd'],
            fileName: (format) => `vuer.${format}.js`,
        },
        rollupOptions: {
            // These are the libraries that we do not want to include in our bundle.
            external: [
                'react', 'react-dom', 'styled-components'
            ],
            output: {
                globals: {
                    react: 'React',
                    'react-dom': 'reactdom',
                    'styled-components': 'styled',
                },
            },
        },
    },
})