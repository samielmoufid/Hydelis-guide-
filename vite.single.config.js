import { defineConfig } from 'vite'
import { viteSingleFile } from 'vite-plugin-singlefile'

// Build « fichier unique » : tout est inliné (JS, CSS, images, polices).
// Sert pour la preview partageable et un éventuel envoi par e-mail.
export default defineConfig({
  base: './',
  plugins: [viteSingleFile()],
  build: {
    target: 'es2019',
    outDir: 'dist-single',
    assetsInlineLimit: 100000000
  }
})
