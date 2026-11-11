import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      // two pages: the pitch deck (index.html) and the previz review page (review.html)
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        review: resolve(import.meta.dirname, 'review.html'),
      },
    },
  },
})
