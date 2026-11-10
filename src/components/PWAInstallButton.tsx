import React, { useState } from 'react';
import { Download, Smartphone, X, CheckCircle2 } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [justInstalled, setJustInstalled] = useState(false);

  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      const ok = await install();
      if (ok) {
        setJustInstalled(true);
        setTimeout(() => setJustInstalled(false), 3000);
      }
    } else if (isIOS) {
      setShowIOSGuide(true);
    } else {
      // General instructions
      setShowIOSGuide(true);
    }
  };

  return (
    <>
      <button
        onClick={handleInstallClick}
        title="Download to Homescreen for offline play"
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer border border-amber-300"
      >
        <Download className="w-3.5 h-3.5 animate-bounce" />
        <span>Installeer / Download</span>
      </button>

      {/* iOS / General Install Guidance Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border-4 border-amber-300">
            <div className="flex items-center justify-between pb-3 border-b border-amber-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-100 rounded-2xl text-amber-600">
                  <Smartphone className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-black text-slate-800 font-fredoka">
                  Laai af op Huisskerm
                </h3>
              </div>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-2xl">
                <span className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">1</span>
                <p>
                  Tik op die <strong>Deel (Share)</strong> knoppie onderaan of bo-aan jou blaaier (Safari / Chrome).
                </p>
              </div>

              <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-2xl">
                <span className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">2</span>
                <p>
                  Blaai af en kies <strong>"Voeg by Huisskerm" / "Add to Home Screen"</strong>.
                </p>
              </div>

              <div className="flex items-start gap-3 p-3 bg-emerald-50 rounded-2xl text-emerald-800">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <p className="text-xs">
                  Nou werk Maatjie soos 'n regte app! Werk ook sonder internet (Vanlyn / Offline) vir stories en wiskunde.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowIOSGuide(false)}
              className="mt-5 w-full rounded-2xl bg-amber-500 py-3 text-sm font-black text-white hover:bg-amber-600 transition shadow-md active:scale-98"
            >
              Regso, Verstaan! (Got it)
            </button>
          </div>
        </div>
      )}

      {justInstalled && (
        <div className="fixed top-6 right-6 z-50 bg-emerald-600 text-white px-4 py-2 rounded-2xl shadow-xl flex items-center gap-2 text-sm font-bold">
          <CheckCircle2 className="w-4 h-4" />
          <span>Suksesvol geïnstalleer!</span>
        </div>
      )}
    </>
  );
};

export const OfflineIndicator: React.FC = () => {
  return null;
};
