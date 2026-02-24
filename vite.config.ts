import { resolve } from 'node:path'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import vuetify from 'vite-plugin-vuetify'

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  plugins: [
    vue(),
    vuetify({ autoImport: true }),
  ],
  build: {
    sourcemap: true,
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'VuetifyDateInputAdvanced',
      fileName: (format) =>
        format === 'es'
          ? 'vuetify-date-input-advanced.es.js'
          : 'vuetify-date-input-advanced.umd.js',
      cssFileName: 'vuetify-date-input-advanced',
      formats: ['es', 'umd'],
    },
    rollupOptions: {
      external: ['vue', 'vuetify'],
      output: {
        exports: 'named',
        globals: {
          vue: 'Vue',
          vuetify: 'Vuetify',
        },
      },
    },
  },
})
