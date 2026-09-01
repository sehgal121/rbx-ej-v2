import { defineConfig } from 'vite'

export default defineConfig({
  base: process.env.GITHUB_PAGES === '1' ? '/rbx-ej-v2/' : '/',
  server: {
    host: true,
    port: 5173,
    strictPort: true,
  },
  preview: {
    host: true,
    port: 4173,
  },
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        flowInfinite: 'flow-infinite.html',
        outer: 'outer.html',
        inner: 'inner.html',
      },
    },
  },
})
