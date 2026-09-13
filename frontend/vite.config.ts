import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': process.env.ALLOTCF_DEV_BACKEND || 'http://localhost:8080',
      '^/(grammar(?:/|$)|content-assets/|sitemap\\.xml$|$)':
        process.env.ALLOTCF_DEV_BACKEND || 'http://localhost:8080',
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/__tests__/setup.ts',
  },
})
