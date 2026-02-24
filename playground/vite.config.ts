import { resolve } from 'node:path'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import vuetify from 'vite-plugin-vuetify'

export default defineConfig({
  root: __dirname,
  plugins: [
    vue(),
    vuetify({ autoImport: true }),
  ],
  resolve: {
    alias: [
      {
        find: '@gigerit/vuetify-date-input-advanced/styles',
        replacement: resolve(__dirname, '../src/styles/main.scss'),
      },
      {
        find: '@gigerit/vuetify-date-input-advanced',
        replacement: resolve(__dirname, '../src/index.ts'),
      },
      {
        find: '@',
        replacement: resolve(__dirname, '../src'),
      },
    ],
  },
})
