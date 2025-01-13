import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5952,
  },
  resolve: {
    alias: {
      src: "/src",
      contracts: "/src/contracts",
      components: "/src/components",
      pages: "/src/pages",
      style: "/src/style",
      utils: "/src/utils"
    },
  },
  base: '/dw-escape-hatch/'
})
