import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      mode: 'development',
      base: '/',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'LifeOS',
        short_name: 'LifeOS',
        theme_color: '#ffffff',
        icons: [
          {
            src: 'favicon.svg',
            sizes: '192x192',
            type: 'image/svg+xml'
          }
        ]
      }
    })
  ],
  build: {
    outDir: 'dist'
  }
});