import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Markdown Reader – Free Online Markdown Editor & Viewer',
        short_name: 'MD Reader',
        description: 'Fast, private online Markdown editor and viewer with live preview, LaTeX math, Mermaid diagrams, and offline support.',
        theme_color: '#0f111a',
        background_color: '#0f111a',
        display: 'standalone',
        orientation: 'any',
        lang: 'en',
        dir: 'ltr',
        start_url: './',
        scope: './',
        categories: ['productivity', 'utilities', 'developer'],
        icons: [
          {
            src: 'icon.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'icon.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          }
        ],
        shortcuts: [
          {
            name: 'New Markdown Document',
            short_name: 'New Doc',
            description: 'Start writing or editing a markdown document',
            url: './',
            icons: [{ src: 'icon.png', sizes: '192x192' }]
          }
        ]
      }
    })
  ],
  base: './',
})
