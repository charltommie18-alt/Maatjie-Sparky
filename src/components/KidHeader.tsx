import React from 'react';
import { Star, Shield, Volume2, VolumeX, Clock, Globe, Pencil } from 'lucide-react';
import { ChildProfile, LanguageMode } from '../types';
import { PWAInstallButton } from './PWAInstallButton';
import { speechService } from '../utils/speech';

interface KidHeaderProps {
  profile: ChildProfile;
  onUpdateLanguage: (lang: LanguageMode) => void;
  onOpenGuardianPortal: () => void;
  onOpenEditProfile: () => void;
  onOpenWhatsApp: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  remainingMinutes: number;
}

export const KidHeader: React.FC<KidHeaderProps> = ({
  profile,
  onUpdateLanguage,
  onOpenGuardianPortal,
  onOpenEditProfile,
  onOpenWhatsApp,
  isMuted,
  onToggleMute,
  remainingMinutes,
}) => {
  const isTimeLow = remainingMinutes <= 5;

  const cycleLanguage = () => {
    speechService.playSound('pop');
    if (profile.language === 'af') onUpdateLanguage('en');
    else if (profile.language === 'en') onUpdateLanguage('bilingual');
    else onUpdateLanguage('af');
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b-2 border-amber-200 shadow-xs px-3 sm:px-6 py-2.5">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
        {/* Child Profile Info - Clickable to change name & avatar */}
        <button
          onClick={() => {
            speechService.playSound('pop');
            onOpenEditProfile();
          }}
          title="Tik om jou naam, avatar of ouderdom te verander! (Click to change name)"
          className="flex items-center gap-2.5 text-left p-1.5 -ml-1 rounded-2xl hover:bg-amber-100/70 transition group cursor-pointer border border-transparent hover:border-amber-300"
        >
          <div className="relative">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-amber-100 border-2 border-amber-300 flex items-center justify-center text-2xl shadow-inner shrink-0 group-hover:scale-105 transition">
              {profile.avatar || '🦁'}
            </div>
            <div className="absolute -bottom-1 -right-1 bg-amber-500 text-white p-0.5 rounded-full border border-white shadow-xs">
              <Pencil className="w-2.5 h-2.5" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-fredoka font-bold text-slate-800 text-base sm:text-lg leading-tight group-hover:text-amber-800 transition">
                {profile.name}
              </span>
              <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                {profile.age}j
              </span>
            </div>
            {/* Screen time pill & change name hint */}
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-bold">
              <span className="flex items-center gap-1">
                <Clock className={`w-3 h-3 ${isTimeLow ? 'text-rose-500 animate-pulse' : 'text-amber-500'}`} />
                <span className={isTimeLow ? 'text-rose-600' : ''}>
                  {remainingMinutes} min
                </span>
              </span>
              <span className="text-amber-600 font-normal hidden sm:inline">
                • Verander Naam ✏️
              </span>
            </div>
          </div>
        </button>

        {/* Center: Stars & Achievements */}
        <div className="flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 shadow-inner">
          <Star className="w-5 h-5 text-amber-500 fill-amber-400 drop-shadow-sm animate-wiggle" />
          <span className="font-fredoka font-black text-amber-900 text-base sm:text-lg">
            {profile.starsEarned}
          </span>
          <span className="hidden md:inline text-xs font-bold text-amber-700">sterre</span>
        </div>

        {/* Right Actions: Language Switch, Sound, PWA, Parent Portal */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* PWA Homescreen install */}
          <div className="hidden sm:block">
            <PWAInstallButton />
          </div>

          {/* Language selector toggle */}
          <button
            onClick={cycleLanguage}
            title="Wissel Taal / Switch Language (Afrikaans / English / Tweetalig)"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-2xl bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-xs border border-amber-300 transition active:scale-95 cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5 text-amber-700" />
            <span>
              {profile.language === 'af' ? '🇿🇦 AF' : profile.language === 'en' ? '🇬🇧 EN' : '🇿🇦🇬🇧 Beide'}
            </span>
          </button>

          {/* Sound Toggle with clear Unmute indicator */}
          <button
            onClick={onToggleMute}
            title={isMuted ? 'Klank is gedemp! Klik hier om klank weer aan te skakel 🔊' : 'Klank is aktief! (Klik om te demp)'}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-2xl transition active:scale-95 cursor-pointer font-bold text-xs ${
              isMuted
                ? 'bg-rose-100 hover:bg-rose-200 text-rose-800 border-2 border-rose-400 animate-pulse shadow-xs'
                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300'
            }`}
          >
            {isMuted ? (
              <>
                <VolumeX className="w-4 h-4 text-rose-600 shrink-0" />
                <span className="font-black text-[11px] text-rose-700">GEDEMP (Klik vir Klank) 🔊</span>
              </>
            ) : (
              <>
                <Volume2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="hidden sm:inline text-[11px] text-emerald-700 font-bold">Klank Aan</span>
              </>
            )}
          </button>

          {/* WhatsApp Guardian Hub Button */}
          <button
            onClick={() => {
              speechService.playSound('pop');
              onOpenWhatsApp();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md transition active:scale-95 cursor-pointer ring-2 ring-emerald-300"
            title="WhatsApp Guardian Hub (Stuur verslag & boodskappe)"
          >
            <span className="text-sm">💬</span>
            <span className="font-bold">WhatsApp</span>
          </button>

          {/* Guardian / Parent Portal Locked Button */}
          <button
            onClick={onOpenGuardianPortal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shadow-md transition active:scale-95 cursor-pointer"
            title="Ouer Portaal (Ouer Sluitel) / Parent Portal"
          >
            <Shield className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Ouers</span>
          </button>
        </div>
      </div>
    </header>
  );
};
