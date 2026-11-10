import { createClient } from '@supabase/supabase-js';
import { prepareSupabaseBrowserAccount } from '../supabaseBrowserSetup.js';
import { bindAccountScreen } from './controller.js';

// Public project config only. Never set a service-role or secret key here.
let storage;
try {
  storage = window.sessionStorage;
  const probe = 'slim-maat-storage-test';
  storage.setItem(probe, 'ok');
  storage.removeItem(probe);
} catch { storage = null; }
const account = storage && prepareSupabaseBrowserAccount({
  createClient,
  url: import.meta.env.VITE_SUPABASE_URL,
  publishableKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  sessionStorage: storage
});
bindAccountScreen(document, account);

// Offline support is only a generic status page; account access requires a network.
if ('serviceWorker' in navigator && window.isSecureContext) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js', { scope: './' }).catch(() => {
      console.warn('Offline status page could not be installed.');
    });
  });
}
