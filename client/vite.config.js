import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  // GitHub Pages serves this project from /mymoney/, not the domain root.
  // Only apply that prefix for production builds — the dev server should
  // still run at http://localhost:5173/ as normal.
  base: command === 'build' ? '/mymoney/' : '/',
  plugins: [react()],
}))
