#!/bin/sh
set -eu
[ "${VERCEL_GIT_COMMIT_REF:-}" = "maatjie-next-development" ] || { echo "Only the Slim Maat development branch may be deployed." >&2; exit 1; }
rm -rf dist
mkdir -p dist/src/next/preview dist/public
for file in index.html preview.css preview.js pwa.js sw.js manifest.webmanifest icon.svg; do cp "src/next/preview/$file" dist/src/next/preview/; done
for file in chatSession.js conversationHistory.js chatClient.js; do cp "src/next/$file" dist/src/next/; done
cp public/pwa-192x192.png public/pwa-512x512.png dist/public/