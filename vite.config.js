import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const reactAriaFile = (relativePath) =>
  fileURLToPath(new URL(`./node_modules/react-aria/${relativePath}`, import.meta.url))

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // @react-aria/ssr v3 importa estos subpaths, pero el exports map de
      // react-aria apunta a archivos .mjs que no se publican. Resolvemos
      // directamente a los ESM reales para evitar el ciclo de alias.
      'react-aria/SSRProvider': reactAriaFile('dist/exports/SSRProvider.js'),
      'react-aria/private/ssr/SSRProvider': reactAriaFile('dist/exports/private/ssr/SSRProvider.js'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})