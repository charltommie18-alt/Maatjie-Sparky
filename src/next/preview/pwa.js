const indicator = document.getElementById('offline-state');
async function prepareOffline() {
  if (!('serviceWorker' in navigator) || !window.isSecureContext) {
    indicator.textContent = 'Vanlyn gebruik is nie op hierdie verbinding beskikbaar nie. HTTPS is nodig.';
    return;
  }
  try {
    await navigator.serviceWorker.register('./sw.js', { scope: './' });
    const timer = setTimeout(() => {
      indicator.textContent = 'Vanlyn voorbereiding neem langer. Hou die voorskou aanlyn oop totdat dit gereed is.';
    }, 12000);
    try {
      await navigator.serviceWorker.ready;
      indicator.textContent = 'Toetsvoorskou is gereed vir vanlyn gebruik op hierdie toestel. Regte AI is nie beskikbaar nie.';
    } finally { clearTimeout(timer); }
  } catch {
    indicator.textContent = 'Vanlyn voorbereiding kon nie bevestig word nie. Maak die toets weer aanlyn oop en probeer weer.';
  }
}
prepareOffline();
