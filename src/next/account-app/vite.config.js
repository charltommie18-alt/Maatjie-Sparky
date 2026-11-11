import { defineConfig } from vite;

// This is a deliberately isolated build. It is served only at /account/
// and does not install or register a service worker.
export default defineConfig({
  base: /account/,
  build: {
    outDir: ../../../dist/account,
    emptyOutDir: false,
  },
});
