import { defineConfig } from 'vite';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const icons = ['pwa-192x192.png', 'pwa-512x512.png'];
const iconBytes = name => readFileSync(fileURLToPath(new URL(`../../../public/${name}`, import.meta.url)));

// Reuse the existing project icons while keeping the built app self-contained.
export default defineConfig({
  base: './',
  // The local tools preview is a separate entry point, not account or AI access.
  build: { rollupOptions: { input: {
    account: fileURLToPath(new URL('./index.html', import.meta.url)),
    tools: fileURLToPath(new URL('./tools-prototype.html', import.meta.url)),
    historyDemo: fileURLToPath(new URL('./history-demo.html', import.meta.url))
  } } },
  plugins: [{
    name: 'slim-maat-icons',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const name = icons.find(icon => req.url?.split('?')[0] === `/${icon}`);
        if (!name) return next();
        res.setHeader('Content-Type', 'image/png');
        res.end(iconBytes(name));
      });
    },
    generateBundle() {
      for (const name of icons) this.emitFile({ type: 'asset', fileName: name, source: iconBytes(name) });
    }
  }]
});
