import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

const ENV = process.env.NODE_ENV || 'development';
console.log('VITE_BASE_PATH:', ENV);

// https://vite.dev/config/
export default defineConfig({
  base: ENV === 'development' ? '/' : '/video-tools/',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
