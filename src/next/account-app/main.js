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
