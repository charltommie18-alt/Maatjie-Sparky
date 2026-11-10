import React, { useState } from 'react';
import { Moon, Sparkles, KeyRound, Unlock, Clock, Shield, Check, X } from 'lucide-react';
import { speechService } from '../utils/speech';

interface BedtimeModalProps {
  isOpen: boolean;
  onOpenParentPin: () => void;
  onUnlockApp: (extraMinutes?: number) => void;
  onDisableAutoLock: () => void;
  guardianPin?: string;
  reason: 'limit' | 'bedtime';
  language: 'af' | 'en' | 'bilingual';
}

export const BedtimeModal: React.FC<BedtimeModalProps> = ({
  isOpen,
  onOpenParentPin,
  onUnlockApp,
  onDisableAutoLock,
  guardianPin = '1234',
  reason,
  language
}) => {
  const [showPinInput, setShowPinInput] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);

  if (!isOpen) return null;

  const isAf = language === 'af' || language === 'bilingual';

  const handlePlayLullaby = () => {
    speechService.playSound('breathe');
    speechService.speak(
      isAf
        ? "Lekker slaap liewe maatjie! Maak jou ogies toe, tel drie sagte wolke: een, twee, drie. Sien jou môre vir nog avonture!"
        : "Sweet dreams little star! Close your eyes, count three soft clouds: one, two, three. See you tomorrow for more adventures!",
      language
    );
  };

  const handleCheckPin = (pinToTest?: string) => {
    const val = pinToTest || pin;
    if (val && val === guardianPin) {
      setIsUnlocked(true);
      setPinError(false);
      speechService.playSound('success');
    } else {
      setPinError(true);
      speechService.playSound('pop');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 backdrop-blur-md p-4 animate-in fade-in duration-300 text-white">
      {/* Twinkling background stars */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-amber-200 animate-pulse"
            style={{
              top: `${(i * 19) % 95}%`,
              left: `${(i * 29) % 95}%`,
              width: `${(i % 3) + 2}px`,
              height: `${(i % 3) + 2}px`,
              animationDelay: `${(i % 5) * 0.4}s`
            }}
          />
        ))}
      </div>

      <div className="relative max-w-md w-full bg-slate-900 border-2 border-indigo-500/40 rounded-3xl p-6 sm:p-8 text-center shadow-2xl">
        {/* Sleeping Moon Icon */}
        <div className="mx-auto w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-indigo-900/60 border-2 border-amber-300/60 flex items-center justify-center text-amber-300 shadow-xl mb-4 relative">
          <Moon className="w-10 h-10 sm:w-12 sm:h-12 text-amber-300 fill-amber-300 animate-float" />
          <Sparkles className="w-5 h-5 text-amber-200 absolute top-3 right-4 animate-spin" />
        </div>

        <h2 className="text-xl sm:text-2xl font-black font-fredoka text-amber-300 tracking-wide">
          {reason === 'bedtime'
            ? isAf ? 'Slaaptyd het Aangebreek! 🌙' : 'Bedtime has Arrived! 🌙'
            : isAf ? 'Speeltyd is Klaar vir Vandag! ⏳' : 'Playtime is Finished for Today! ⏳'}
        </h2>

        <p className="mt-2 text-slate-300 text-xs sm:text-sm leading-relaxed">
          {reason === 'bedtime'
            ? isAf
              ? "Die maantjie skyn en jou ogies verdien rus. Droom soet van lekker avonture!"
              : "The moon is shining and your eyes deserve rest. Dream of wonderful adventures!"
            : isAf
              ? "Jy het al jou skermtyd vir vandag gebruik. Tyd om buite te speel of 'n boek te lees!"
              : "You have used all your screen time for today. Time to play or read a book!"}
        </p>

        {/* If PIN verified, show instant unlock buttons */}
        {isUnlocked ? (
          <div className="mt-5 p-4 rounded-2xl bg-emerald-950/80 border-2 border-emerald-500/60 space-y-3 animate-in zoom-in-95">
            <div className="flex items-center justify-center gap-2 text-emerald-300 font-bold text-sm">
              <Check className="w-5 h-5 text-emerald-400" />
              <span>Ouer Geverifieer! Kies Aksie:</span>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => {
                  speechService.playSound('success');
                  onUnlockApp(30);
                }}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm rounded-xl shadow-lg transition active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Unlock className="w-4 h-4" />
                <span>Ontsluit Speeltyd (+30 min) 🚀</span>
              </button>

              <button
                onClick={() => {
                  speechService.playSound('star');
                  onDisableAutoLock();
                }}
                className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Deaktiveer Tydsbeperking vir Vandag (Speel Sonder Slot)
              </button>

              <button
                onClick={() => {
                  onOpenParentPin();
                }}
                className="w-full py-2 px-3 text-slate-300 hover:text-white text-xs underline cursor-pointer"
              >
                Maak Volle Ouer Portaal Oop ⚙️
              </button>
            </div>
          </div>
        ) : showPinInput ? (
          /* Direct PIN Entry inside modal */
          <div className="mt-5 p-4 rounded-2xl bg-slate-800/90 border border-indigo-400/30 space-y-3 animate-in fade-in">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span className="font-bold flex items-center gap-1">
                <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                Voer Ouer PIN in:
              </span>
              <button
                onClick={() => setShowPinInput(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex gap-2">
              <input
                type="password"
                maxLength={4}
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  if (e.target.value.length === 4) {
                    handleCheckPin(e.target.value);
                  }
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleCheckPin()}
                placeholder="• • • •"
                className={`flex-1 text-center font-mono text-2xl tracking-widest py-2 rounded-xl border-2 ${
                  pinError ? 'border-rose-500 bg-rose-950/40 text-rose-200' : 'border-indigo-400 bg-slate-900 text-white'
                } focus:outline-hidden`}
                autoFocus
              />
              <button
                onClick={() => handleCheckPin()}
                className="py-2 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                Ontsluit
              </button>
            </div>

            {pinError && (
              <p className="text-[11px] text-rose-400 font-bold">
                Verkeerde PIN. Probeer weer.
              </p>
            )}


          </div>
        ) : (
          /* Standard Bedtime Buttons */
          <div className="mt-5 space-y-2.5">
            {/* Calming Lullaby Action */}
            <button
              onClick={handlePlayLullaby}
              className="w-full py-2.5 px-4 rounded-2xl bg-indigo-800/80 hover:bg-indigo-700 border border-indigo-400/30 text-amber-200 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition active:scale-98 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>{isAf ? "Luister na Maatjie se Slaaptyd Liedjie 🎵" : "Listen to Maatjie's Bedtime Lullaby 🎵"}</span>
            </button>

            {/* Quick 1-click Unlock with PIN entry toggle */}
            <button
              onClick={() => setShowPinInput(true)}
              className="w-full py-2.5 px-4 rounded-2xl bg-emerald-700/80 hover:bg-emerald-600 border border-emerald-400/40 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition active:scale-98 cursor-pointer"
            >
              <Unlock className="w-4 h-4 text-emerald-300" />
              <span>Ouer Ontsluiting (Voer PIN In) 🔓</span>
            </button>
          </div>
        )}

        {/* Link to Open Parent Portal */}
        <div className="mt-5 pt-3 border-t border-slate-800 flex justify-center">
          <button
            onClick={onOpenParentPin}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-amber-300 font-semibold transition cursor-pointer"
          >
            <Shield className="w-3.5 h-3.5" />
            <span>{isAf ? 'Gaan na Ouer Portaal & Beheer' : 'Open Parent Portal'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
