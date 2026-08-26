import { resolve } from 'path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '@renderer': resolve('src/renderer/src'),
      '@shared': resolve('src/shared'),
      '@': resolve('src/renderer/src'),
      'bionapp-pkg': resolve('package.json')
    }
  }
})
