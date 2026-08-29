import { defineConfig } from 'vite'

export default defineConfig({
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
        flow: 'flow.html',
        outer: 'outer.html',
        inner: 'inner.html',
      },
    },
  },
})
