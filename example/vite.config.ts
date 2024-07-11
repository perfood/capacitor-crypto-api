import fs from 'fs';
import { defineConfig } from 'vite';

export default defineConfig({
  root: './src',
  build: {
    outDir: '../dist',
    minify: false,
    emptyOutDir: true,
  },
  server: {
    https: {
      cert: fs.readFileSync('cert/cert.pem'),
      key: fs.readFileSync('cert/key.pem'),
    }
  }
});
