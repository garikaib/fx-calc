import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  base: '/wp-content/plugins/api-vuejs/assets/fx-calc/',
  build: {
    outDir: '/home/garikaib/Local Sites/zpc/app/public/wp-content/plugins/api-vuejs/assets/fx-calc',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        entryFileNames: 'assets/fx-calc.js',
        chunkFileNames: 'assets/fx-calc-[name].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name && assetInfo.name.endsWith('.css')) {
            return 'assets/fx-calc.css'
          }
          return 'assets/[name][extname]'
        }
      }
    }
  }
})
