# Slim Maat development-only chat preview

Isolated, not connected to the app entry point. Serve the repository root with a local static server and visit `/src/next/preview/`. Run `node --test src/next/preview/preview.test.js` for mocked DOM/storage tests. Do not deploy publicly or enter personal information.

The reply is a fixed test stub, not AI; messages never go to a backend in this preview. Local history is explicitly opt-in, unencrypted, browser-specific and remains when saving is switched off until deleted. Export is also unencrypted. No account, verified 18+ access, private multi-device sync, real AI backend, real WhatsApp integration, security review or production build is provided. The existing app is unaffected. This is a prototype, not a secure release.
