import { createClient } from '@supabase/supabase-js';
import { prepareSupabaseBrowserAccount } from '../supabaseBrowserSetup.js';
import { bindAccountScreen } from './controller.js';

// Public project config only. Never set a service-role or secret key here.
const account = prepareSupabaseBrowserAccount({
  createClient,
  url: import.meta.env.VITE_SUPABASE_URL,
  publishableKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
});
bindAccountScreen(document, account);
