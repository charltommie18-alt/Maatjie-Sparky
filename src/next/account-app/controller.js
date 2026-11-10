// This isolated controller is not an age or AI access control.
export function bindAccountScreen(doc, account) {
  const $ = id => doc.getElementById(id);
  const form = $('account-form'), email = $('account-email'), password = $('account-password'), confirmation = $('account-confirm');
  const status = $('account-status'), submit = $('account-submit'), signout = $('signout');
  let mode = 'signin', pending = !!account;
  const available = !!account;
  function setMode(next) {
    if (pending) return;
    mode = next; form.reset(); status.textContent = '';
    const signup = mode === 'signup';
    $('show-signin').setAttribute('aria-pressed', String(!signup));
    $('show-signup').setAttribute('aria-pressed', String(signup));
    $('account-heading').textContent = signup ? 'Skep jou rekening' : 'Welkom terug';
    $('account-intro').textContent = signup ? 'Gebruik ’n e-posadres waartoe jy toegang het.' : 'Meld aan met jou e-posadres.';
    $('confirm-wrap').hidden = !signup; confirmation.required = signup;
    password.autocomplete = signup ? 'new-password' : 'current-password';
    submit.textContent = signup ? 'Skep rekening' : 'Meld aan';
    if (!available) status.textContent = 'Rekeningdiens is nie ingestel nie.';
  }
  $('show-signin').addEventListener('click', () => setMode('signin'));
  $('show-signup').addEventListener('click', () => setMode('signup'));
  submit.disabled = true;
  status.textContent = available ? 'Aanmelding word nagegaan.' : 'Rekeningdiens is nie ingestel nie.';
  const ready = available ? (async () => {
    try {
      const user = await account.verifiedUser();
      if (user) {
        signout.hidden = false;
        status.textContent = 'Jy is op dié toestel aangemeld. AI is steeds nie beskikbaar nie.';
      } else {
        signout.hidden = true;
        status.textContent = 'Rekeningdiens is gereed vir ’n privaat toets.';
      }
    } catch {
      signout.hidden = true;
      status.textContent = 'Aanmelding kon nie geverifieer word nie. Meld weer aan.';
    } finally { pending = false; submit.disabled = false; }
  })() : Promise.resolve();
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!available || pending) return;
    if (!email.validity.valid || !password.validity.valid || (mode === 'signup' && !confirmation.validity.valid)) {
      status.textContent = 'Vul ’n geldige e-posadres en wagwoord van minstens 8 karakters in.'; return;
    }
    if (mode === 'signup' && password.value !== confirmation.value) {
      confirmation.value = ''; status.textContent = 'Die wagwoorde stem nie ooreen nie.'; confirmation.focus(); return;
    }
    pending = true; submit.disabled = true;
    const thisMode = mode, address = email.value, secret = password.value;
    password.value = ''; confirmation.value = '';
    status.textContent = 'Wag asseblief.';
    try {
      const result = thisMode === 'signup' ? await account.signUp(address, secret) : await account.signIn(address, secret);
      form.reset();
      if (!result?.ok) status.textContent = 'Dit kon nie voltooi word nie. Gaan jou besonderhede na en probeer weer.';
      else if (thisMode === 'signup') status.textContent = 'As registrasie aanvaar is, kyk jou e-pos vir ’n bevestigingskakel voordat jy aanmeld.';
      else {
        const user = await account.verifiedUser();
        if (user) { status.textContent = 'Jy is op dié toestel aangemeld. AI is steeds nie beskikbaar nie.'; signout.hidden = false; }
        else { signout.hidden = true; status.textContent = 'Jou bevestigde aanmelding kon nie geverifieer word nie.'; }
      }
    } catch { form.reset(); status.textContent = 'Die rekeningdiens is nie beskikbaar nie. Probeer later weer.'; }
    finally { pending = false; submit.disabled = false; }
  });
  signout.addEventListener('click', async () => {
    if (!available || pending) return;
    pending = true; submit.disabled = true; signout.disabled = true;
    try { const result = await account.signOut(); if (result?.ok) { signout.hidden = true; status.textContent = 'Jy is op dié toestel afgemeld.'; } else status.textContent = 'Afmelding kon nie bevestig word nie. Probeer weer.'; }
    catch { status.textContent = 'Afmelding kon nie bevestig word nie. Probeer weer.'; }
    finally { pending = false; submit.disabled = false; signout.disabled = false; }
  });
  return ready;
}
