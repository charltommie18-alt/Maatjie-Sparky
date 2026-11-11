#!/bin/sh
set -eu
[ "${VERCEL_GIT_COMMIT_REF:-}" = "slim-maat-preview-isolated-account" ] || { echo "Only the isolated Slim Maat preview branch may be deployed." >&2; exit 1; }
rm -rf dist
mkdir -p dist/src/next/preview dist/src/next dist/public
# Keep the original mock preview exactly at its original source path only.
for file in index.html preview.css preview.js pwa.js sw.js manifest.webmanifest icon.svg; do
  cp "src/next/preview/$file" "dist/src/next/preview/$file"
done
for file in account.html account.css account.js; do
  cp "src/next/preview/$file" "dist/src/next/preview/$file"
done
for file in chatSession.js conversationHistory.js chatClient.js; do cp "src/next/$file" "dist/src/next/$file"; done
cp public/pwa-192x192.png public/pwa-512x512.png dist/public/
# The account application is source-built at /account/. It has no PWA plugin,
# so it cannot register the old preview service worker.
cd src/next/account-app
npx --yes pnpm@9.15.5 install --frozen-lockfile --ignore-scripts
npx --yes --package=vite@6.4.1 vite build
