import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import cloudflare from '@cloudflare/vite-plugin-cloudflare'
import path from 'path'
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    cloudflare({
      getLoadContext: () => ({}),
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: './index.html',
    },
  },
  publicDir: 'public',
})