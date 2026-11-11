// This isolated controller is not an age or AI access control.
// Account creation is deliberately disabled in every runtime. Do not make this configurable here.
export function bindAccountScreen(doc, account) {
  const $ = id => doc.getElementById(id);
  const form = $('account-form'), email = $('account-email'), password = $('account-password');
  const status = $('account-status'), submit = $('account-submit'), signout = $('signout');
  const signinTab = $('show-signin'), signupTab = $('show-signup');
  let pending = !!account, signedIn = false;
  const available = !!account;
  function render() {
    form.hidden = signedIn;
    signinTab.disabled = !available || pending || signedIn;
    // Fail closed: no runtime config, DOM change, or account object enables registration.
    signupTab.disabled = true;
    submit.disabled = !available || pending || signedIn;
    signout.hidden = !signedIn;
    signout.disabled = !available || pending || !signedIn;
  }
  function showSignedIn() {
    signedIn = true;
    $('account-heading').textContent = 'Jy is aangemeld';
    $('account-intro').textContent = 'Hierdie is steeds net ’n privaat aanmeldingstoets.';
    status.textContent = 'Jy is aangemeld en jou aanmelding is geverifieer. AI is steeds nie beskikbaar nie.';
  }
  function showSignedOut() {
    signedIn = false;
    signinTab.setAttribute('aria-pressed', 'true');
    signupTab.setAttribute('aria-pressed', 'false');
    $('account-heading').textContent = 'Welkom terug';
    $('account-intro').textContent = 'Meld aan met jou bestaande e-posrekening.';
    password.autocomplete = 'current-password';
    submit.textContent = 'Meld aan';
  }
  signinTab.addEventListener('click', () => {
    if (!available || pending || signedIn) return;
    form.reset(); status.textContent = '';
  });
  // Keep a defensive handler in case the disabled control is activated programmatically.
  signupTab.addEventListener('click', () => { status.textContent = 'Nuwe rekeningregistrasie is gedeaktiveer.'; });
  render();
  status.textContent = available ? 'Aanmelding word nagegaan.' : 'Rekeningdiens is nie ingestel nie. Geen werklike aanmelding is beskikbaar nie.';
  const ready = available ? (async () => {
    try {
      const user = await account.verifiedUser();
      if (user) showSignedIn();
      else { showSignedOut(); status.textContent = 'Registrasie is gedeaktiveer. Meld met ’n bestaande rekening aan sodra die diens ingestel is.'; }
    } catch {
      showSignedOut(); status.textContent = 'Aanmelding kon nie geverifieer word nie. Geen werklike aanmelding is beskikbaar nie.';
    } finally { pending = false; render(); }
  })() : Promise.resolve();
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!available || pending || signedIn) return;
    if (!email.validity.valid || !password.validity.valid) {
      status.textContent = 'Vul ’n geldige e-posadres en wagwoord van minstens 8 karakters in.'; return;
    }
    pending = true; render();
    const address = email.value, secret = password.value;
    password.value = '';
    status.textContent = 'Wag asseblief.';
    try {
      const result = await account.signIn(address, secret);
      form.reset();
      if (!result?.ok) status.textContent = 'Dit kon nie voltooi word nie. Gaan jou besonderhede na en probeer weer.';
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
