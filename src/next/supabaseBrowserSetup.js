/* Isolated preparation only: not mounted by the app and not an access-control decision.
 * Pass the official @supabase/supabase-js createClient function and PUBLIC project
 * configuration. Never pass a service-role or secret key to a browser. */
import { createSupabaseAccount } from './supabaseAccount.js';

export function prepareSupabaseBrowserAccount({ createClient, url, publishableKey } = {}) {
  if (typeof createClient !== 'function' || typeof url !== 'string' || typeof publishableKey !== 'string') return null;
  let projectUrl;
  try {
    projectUrl = new URL(url);
    if (projectUrl.protocol !== 'https:' || !/^[a-z0-9-]+\.supabase\.co$/.test(projectUrl.hostname) ||
        projectUrl.username || projectUrl.password || projectUrl.port || projectUrl.pathname !== '/' || projectUrl.search || projectUrl.hash) return null;
  } catch { return null; }
  // This preparation accepts only the clearly labelled new publishable key format.
  // Legacy JWT-style keys, sb_secret keys and service-role credentials are rejected.
  if (!/^sb_publishable_[A-Za-z0-9_-]+$/.test(publishableKey)) return null;
  try {
    const client = createClient(projectUrl.origin, publishableKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
    });
    return createSupabaseAccount(client);
  } catch { return null; }
}
