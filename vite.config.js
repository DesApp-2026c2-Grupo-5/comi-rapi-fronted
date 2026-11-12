import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Fix @react-aria/ssr v3 importing from 'react-aria/SSRProvider'
      // which doesn't exist in react-aria v3. Redirect to @react-aria/ssr which exports it.
      'react-aria/SSRProvider': '@react-aria/ssr',
      'react-aria/private/ssr/SSRProvider': '@react-aria/ssr',
    },
  },
  optimizeDeps: {
    include: ['@react-aria/ssr'],
  },
  build: {
    rollupOptions: {
      external: ['@react-aria/ssr'],
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