// This isolated controller is not an age or AI access control.
export function bindAccountScreen(doc, account) {
  const $ = id => doc.getElementById(id);
  const form = $('account-form'), email = $('account-email'), password = $('account-password'), confirmation = $('account-confirm');
  const status = $('account-status'), submit = $('account-submit'), signout = $('signout');
  const signinTab = $('show-signin'), signupTab = $('show-signup');
  let mode = 'signin', pending = !!account, signedIn = false;
  const available = !!account;
  function render() {
    form.hidden = signedIn;
    signinTab.disabled = !available || pending || signedIn;
    // Production-backed preview: account creation is disabled for this test.
    signupTab.disabled = true;
    submit.disabled = !available || pending || signedIn;
    signout.hidden = !signedIn;
    signout.disabled = !available || pending || !signedIn;
  }
  function setMode(next) {
    if (!available || pending || signedIn || next !== 'signin') return;
    mode = next; form.reset(); status.textContent = '';
    const signup = mode === 'signup';
    signinTab.setAttribute('aria-pressed', String(!signup));
    signupTab.setAttribute('aria-pressed', String(signup));
    $('account-heading').textContent = signup ? 'Skep jou rekening' : 'Welkom terug';
    $('account-intro').textContent = signup ? 'Gebruik ’n e-posadres waartoe jy toegang het.' : 'Meld aan met jou e-posadres.';
    $('confirm-wrap').hidden = !signup; confirmation.required = signup;
    password.autocomplete = signup ? 'new-password' : 'current-password';
    submit.textContent = signup ? 'Skep rekening' : 'Meld aan';
  }
  function showSignedIn() {
    // Browsers may autofill while session restoration is pending. Do not leave
    // credentials in a hidden form after the restored user is verified.
    form.reset();
    password.value = ''; confirmation.value = ''; email.value = '';
    signedIn = true;
    $('account-heading').textContent = 'Jy is aangemeld';
    $('account-intro').textContent = 'Hierdie is steeds net ’n privaat rekeningtoets.';
    status.textContent = 'Jy is aangemeld en jou aanmelding is geverifieer. AI is steeds nie beskikbaar nie.';
  }
  function showSignedOut() {
    signedIn = false;
    mode = 'signin';
    signinTab.setAttribute('aria-pressed', 'true'); signupTab.setAttribute('aria-pressed', 'false');
    $('account-heading').textContent = 'Welkom terug';
    $('account-intro').textContent = 'Meld aan met jou e-posadres.';
    $('confirm-wrap').hidden = true; confirmation.required = false;
    password.autocomplete = 'current-password'; submit.textContent = 'Meld aan';
  }
  signinTab.addEventListener('click', () => setMode('signin'));
  signupTab.addEventListener('click', () => setMode('signup'));
  render();
  status.textContent = available ? 'Aanmelding word nagegaan.' : 'Rekeningdiens is nie ingestel nie.';
  const ready = available ? (async () => {
    try {
      const user = await account.verifiedUser();
      if (user) showSignedIn();
      else { showSignedOut(); status.textContent = 'Rekeningdiens is gereed vir ’n privaat toets.'; }
    } catch {
      showSignedOut(); status.textContent = 'Aanmelding kon nie geverifieer word nie. Meld weer aan.';
    } finally { pending = false; render(); }
  })() : Promise.resolve();
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!available || pending || signedIn) return;
    if (!email.validity.valid || !password.validity.valid || (mode === 'signup' && !confirmation.validity.valid)) {
      status.textContent = 'Vul ’n geldige e-posadres en wagwoord van minstens 8 karakters in.'; return;
    }
    if (mode === 'signup' && password.value !== confirmation.value) {
      confirmation.value = ''; status.textContent = 'Die wagwoorde stem nie ooreen nie.'; confirmation.focus(); return;
    }
    pending = true; render();
    const thisMode = mode, address = email.value, secret = password.value;
    password.value = ''; confirmation.value = '';
    status.textContent = 'Wag asseblief.';
    try {
      // This preview never calls registration against the production service.
      const result = await account.signIn(address, secret);
      form.reset();
      if (!result?.ok) status.textContent = 'Dit kon nie voltooi word nie. Gaan jou besonderhede na en probeer weer.';
      else if (thisMode === 'signup') status.textContent = 'As registrasie aanvaar is, kyk jou e-pos vir ’n bevestigingskakel voordat jy aanmeld.';
      else {
        const user = await account.verifiedUser();
        if (user) showSignedIn();
        else { showSignedOut(); status.textContent = 'Jou bevestigde aanmelding kon nie geverifieer word nie.'; }
      }
    } catch { form.reset(); showSignedOut(); status.textContent = 'Die rekeningdiens is nie beskikbaar nie. Probeer later weer.'; }
    finally { pending = false; render(); }
  });
  signout.addEventListener('click', async () => {
    if (!available || pending || !signedIn) return;
    pending = true; render();
    try {
      const result = await account.signOut();
      if (result?.ok) { showSignedOut(); form.reset(); status.textContent = 'Jy is op dié toestel afgemeld.'; }
      else status.textContent = 'Afmelding kon nie bevestig word nie. Probeer weer.';
    } catch { status.textContent = 'Afmelding kon nie bevestig word nie. Probeer weer.'; }
    finally { pending = false; render(); }
  });
  return ready;
}
