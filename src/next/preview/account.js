// Development-only UI. No auth client, network call, storage or real account.
const $ = id => document.getElementById(id);
const form = $('account-form');
const email = $('account-email');
const password = $('account-password');
const confirmPassword = $('account-confirm');
const status = $('account-status');
let mode = 'signin';
function setMode(next) {
  mode = next;
  form.reset();
  status.textContent = '';
  const signup = mode === 'signup';
  $('show-signin').setAttribute('aria-pressed', String(!signup));
  $('show-signup').setAttribute('aria-pressed', String(signup));
  $('account-heading').textContent = signup ? 'Skep jou rekening' : 'Welkom terug';
  $('account-intro').textContent = signup ? 'Probeer registrasie met opgemaakte besonderhede.' : 'Probeer die aanmeldskerm met opgemaakte besonderhede.';
  $('confirm-wrap').hidden = !signup;
  confirmPassword.required = signup;
  $('account-submit').textContent = signup ? 'Toets registrasie' : 'Toets aanmelding';
}
$('show-signin').addEventListener('click', () => setMode('signin'));
$('show-signup').addEventListener('click', () => setMode('signup'));
form.addEventListener('submit', event => {
  event.preventDefault();
  if (!email.validity.valid || !password.validity.valid || (mode === 'signup' && !confirmPassword.validity.valid)) {
    status.textContent = 'Vul ’n geldige toets-e-posadres en toetswagwoord van minstens 8 karakters in.';
    return;
  }
  if (mode === 'signup' && password.value !== confirmPassword.value) {
    confirmPassword.value = '';
    status.textContent = 'Die toetswagwoorde stem nie ooreen nie.';
    confirmPassword.focus();
    return;
  }
  form.reset();
  status.textContent = mode === 'signup'
    ? 'Voorskou voltooi. Geen rekening is geskep en geen e-pos is gestuur nie.'
    : 'Voorskou voltooi. Jy is nie aangemeld nie.';
});
