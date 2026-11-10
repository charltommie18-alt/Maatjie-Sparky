/* Isolated Supabase Auth boundary. Not mounted and no client is configured here.
 * Supply a Supabase client configured for the intended runtime. Do not log secrets,
 * passwords, tokens, raw auth errors, or responses. This does not verify age. */
export function createSupabaseAccount(client) {
  const auth = client?.auth;
  if (!auth || ["signUp", "signInWithPassword", "signOut", "getUser"].some(name => typeof auth[name] !== "function")) throw new TypeError("Supabase Auth client is required");
  function valid(email, password) { return typeof email === "string" && !!email.trim() && email.length <= 254 && typeof password === "string" && password.length > 0 && password.length <= 1024; }
  async function credentials(method, email, password) {
    if (!valid(email, password)) return { ok: false };
    try { const { error } = await auth[method]({ email: email.trim(), password }); return { ok: !error }; } catch { return { ok: false }; }
  }
  return {
    signUp(email, password) { return credentials("signUp", email, password); },
    signIn(email, password) { return credentials("signInWithPassword", email, password); },
    async signOut() { try { const { error } = await auth.signOut({ scope: "local" }); return { ok: !error }; } catch { return { ok: false }; } },
    async verifiedUser() {
      try { const { data, error } = await auth.getUser(); const u = data?.user;
        if (error || typeof u?.id !== "string" || !u.id.trim() || !u.email_confirmed_at) return null;
        return { id: u.id };
      } catch { return null; }
    }
  };
}
