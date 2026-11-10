import React from 'react';
import { Heart, Volume2, Sparkles, Send } from 'lucide-react';
import { ParentLoveNote, LanguageMode } from '../types';
import { speechService } from '../utils/speech';

interface LoveNotesViewProps {
  notes: ParentLoveNote[];
  language: LanguageMode;
  childName: string;
  onOpenWhatsApp?: () => void;
}

export const LoveNotesView: React.FC<LoveNotesViewProps> = ({ notes, language, childName, onOpenWhatsApp }) => {
  const handleReadNote = (text: string) => {
    speechService.playSound('star');
    speechService.speak(text, language);
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border-4 border-pink-300 shadow-2xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-pink-100">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-pink-100 text-pink-600 rounded-2xl shadow-inner">
            <Heart className="w-8 h-8 fill-pink-500" />
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-black font-fredoka text-slate-800">
              {language === 'af' ? 'Liefdesboodskappe van Mammie & Pappie ❤️' : 'Love Notes from Mom & Dad ❤️'}
            </h3>
            <p className="text-xs sm:text-sm text-pink-700 font-semibold">
              {language === 'af'
                ? 'Wanneer jou ouers op WhatsApp vir jou ’n boodskap stuur, verskyn dit hier!'
                : 'Messages sent by your parents via WhatsApp appear right here for you!'}
            </p>
          </div>
        </div>

        {onOpenWhatsApp && (
          <button
            onClick={onOpenWhatsApp}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition active:scale-95 cursor-pointer self-start sm:self-auto"
          >
            <span>💬</span>
            <span>Stuur via WhatsApp</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {notes.map((note) => (
          <div
            key={note.id}
            className="p-5 rounded-3xl bg-gradient-to-br from-pink-50 to-amber-50 border-2 border-pink-200 shadow-md relative overflow-hidden flex flex-col justify-between space-y-3"
          >
            <div>
              <div className="flex items-center justify-between text-xs font-bold text-pink-700">
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-pink-500" />
                  {note.sender}
                </span>
                <span className="text-slate-400">{note.timestamp}</span>
              </div>

              <p className="mt-3 text-sm sm:text-base font-bold text-slate-800 leading-relaxed">
                "{note.text}"
              </p>
            </div>

            <div className="pt-2 border-t border-pink-200/60 flex items-center justify-between">
              <span className="text-xs font-bold text-pink-600">
                Liefde vir {childName} ⭐
              </span>
              <button
                onClick={() => handleReadNote(note.text)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-pink-500 hover:bg-pink-600 text-white font-bold text-xs shadow-xs transition active:scale-95 cursor-pointer"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>Lees vir My 🔊</span>
              </button>
            </div>
          </div>
        ))}

        {notes.length === 0 && (
          <div className="col-span-2 text-center p-8 bg-pink-50/50 rounded-2xl border border-pink-100 text-pink-800">
            Nog geen boodskappies vandag nie. Vra Mamma of Pappa om vir jou ’n WhatsApp boodskappie te stuur!
          </div>
        )}
      </div>
    </div>
  );
};
