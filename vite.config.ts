import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vitest/config'

// `base: './'` keeps every asset URL relative, so the build works unchanged at a
// domain root (Vercel, Netlify) and under a sub-path (GitHub Pages: /entrena-libre/).
export default defineConfig({
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'EntrenaLibre',
        short_name: 'EntrenaLibre',
        description: 'Entrenamiento, plan mensual y nutrición. Gratis y sin cuenta.',
        lang: 'es',
        theme_color: '#0f766e',
        background_color: '#f6f7f5',
        display: 'standalone',
        start_url: '.',
        scope: '.',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
    }),
  ],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
