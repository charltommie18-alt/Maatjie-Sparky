import React, { useState } from 'react';
import { User, X, Check, Sparkles, Volume2, Globe, Calculator } from 'lucide-react';
import { ChildProfile, LanguageMode } from '../types';
import { speechService } from '../utils/speech';
import { VOICE_CHOICES } from '../utils/voiceChoices';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: ChildProfile;
  onSaveProfile: (updated: Partial<ChildProfile>) => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  profile,
  onSaveProfile
}) => {
  const [name, setName] = useState(profile.name);
  const [age, setAge] = useState(profile.age);
  const [avatar, setAvatar] = useState(profile.avatar || '🦁');
  const [language, setLanguage] = useState<LanguageMode>(profile.language);
  const [mathLevel, setMathLevel] = useState(profile.mathLevel || 1);
  const [isTestingVoice, setIsTestingVoice] = useState(false);
  const [voiceTestError, setVoiceTestError] = useState('');

  if (!isOpen) return null;

  const avatars = ['🦁', '🦄', '🐼', '🚀', '🐶', '🐱', '🦖', '🐻', '🦊', '🐰', '🐘', '⭐'];

  const handleChooseVoice = (voiceId: string) => {
    setVoiceTestError('');
    speechService.stopSpeaking();
    speechService.setCustomVoice(null, 'elevenlabs');
    speechService.setVoiceKey(voiceId);
    onSaveProfile({ selectedVoiceType: 'elevenlabs', selectedVoiceClipId: undefined, activeCustomVoiceUrl: undefined, elevenLabsVoiceKey: voiceId });
  };

  const handleTestVoice = async () => {
    setIsTestingVoice(true);
    setVoiceTestError('');
    speechService.unlockAudio();
    speechService.setMuted(false);
    const testPhrase = language === 'en'
      ? `Hello ${name || 'friend'}! I am ready to play and learn with you!`
      : `Hallo ${name || 'maatjie'}! Ek is Maatjie. Kom ons speel saam!`;
    if (profile.selectedVoiceType !== 'elevenlabs' && profile.selectedVoiceType) {
      speechService.speak(testPhrase, language, () => setIsTestingVoice(false));
      return;
    }
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch('/api/tts', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: controller.signal,
        body: JSON.stringify({ text: testPhrase, voiceKey: profile.elevenLabsVoiceKey || speechService.elevenLabsVoiceKey })
      });
      const data = await response.json();
      if (!response.ok || !data.success || !data.audioUrl || !(await speechService.playAudioUrl(data.audioUrl))) {
        setVoiceTestError('Die stem kon nie gespeel word nie. Vra ’n ouer om die ElevenLabs-verbinding na te gaan.');
      }
    } catch {
      setVoiceTestError('Die stem kon nie gespeel word nie. Vra ’n ouer om die ElevenLabs-verbinding na te gaan.');
    } finally {
      clearTimeout(timeout);
      setIsTestingVoice(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim() || 'Maatjie';
    onSaveProfile({
      name: cleanName,
      age,
      avatar,
      language,
      mathLevel
    });
    speechService.playSound('success');

    // Announce name change in companion voice
    const greeting = language === 'en'
      ? `Hooray ${cleanName}! What a wonderful name! Let's play!`
      : `Hoera ${cleanName}! Wat 'n pragtige naam! Kom ons speel en tel saam! Aitsa!`;
    speechService.speak(greeting, language);

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in overflow-y-auto">
      <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border-4 border-amber-300 relative my-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-amber-100">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center text-xl font-bold">
              ✏️
            </div>
            <div>
              <h3 className="text-xl font-black font-fredoka text-slate-800">
                Verander Jou Naam & Profiel
              </h3>
              <p className="text-xs text-slate-500">
                Pas jou naam, ouderdom, avatar en taal aan!
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isTestingVoice}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="mt-4 space-y-4">
          {/* Child Name Input */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-1">
              Wat is jou naam? (Your Name)
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Bv: Charl, Liam, Mia, Anke..."
              className="w-full p-3 rounded-2xl border-2 border-amber-300 bg-amber-50/40 text-base font-bold text-slate-800 focus:outline-hidden focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
              autoFocus
            />
          </div>

          {/* Avatar Picker */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-1.5">
              Kies jou Karakter Avatar:
            </label>
            <div className="grid grid-cols-6 gap-2">
              {avatars.map((emoji) => (
                <button
                  type="button"
                  key={emoji}
                  onClick={() => {
                    setAvatar(emoji);
                    speechService.playSound('pop');
                  }}
                  className={`h-12 rounded-2xl text-2xl flex items-center justify-center transition active:scale-90 cursor-pointer ${
                    avatar === emoji
                      ? 'bg-amber-400 border-2 border-amber-600 shadow-md scale-105'
                      : 'bg-slate-50 hover:bg-amber-100 border border-slate-200'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Age Selection */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-1.5">
              Hoe oud is jy? (Ouderdom: {age} jaar)
            </label>
            <div className="flex flex-wrap gap-1.5">
              {[3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((a) => (
                <button
                  type="button"
                  key={a}
                  onClick={() => setAge(a)}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer ${
                    age === a
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {a}j
                </button>
              ))}
            </div>
          </div>

          {/* Language Selection */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-1.5">
              Taal / Language:
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'af', label: '🇿🇦 Afrikaans' },
                { id: 'en', label: '🇬🇧 English' },
                { id: 'bilingual', label: '🇿🇦🇬🇧 Tweetalig' }
              ].map((item) => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => setLanguage(item.id as LanguageMode)}
                  className={`p-2.5 rounded-2xl font-bold text-xs border text-center transition cursor-pointer ${
                    language === item.id
                      ? 'bg-amber-100 border-amber-500 text-amber-950 ring-2 ring-amber-300'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Math Stage Level */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-1.5">
              Wiskunde Vlak:
            </label>
            <select
              value={mathLevel}
              onChange={(e) => setMathLevel(Number(e.target.value))}
              className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-700"
            >
              <option value={1}>Vlak 1: Tel 1 tot 5 & Vorms (Kleuters 3-5j)</option>
              <option value={2}>Vlak 2: Optel & Aftrek tot 10 (Graad R & 1)</option>
              <option value={3}>Vlak 3: Twee-tel & Meetkunde Vorms (Graad 2)</option>
              <option value={4}>Vlak 4: Somme tot 20 & Woordsomme (Graad 3)</option>
              <option value={5}>Vlak 5: Vermenigvuldiging & Breuke (Graad 4+)</option>
            </select>
          </div>

          <fieldset className="p-3.5 rounded-2xl bg-sky-50 border border-sky-200">
            <legend className="text-xs font-black uppercase text-sky-800 px-1">Kies Maatjie se stem</legend>
            <div className="grid grid-cols-3 gap-2">
              {VOICE_CHOICES.map((voice) => {
                const selected = profile.selectedVoiceType === 'elevenlabs' && profile.elevenLabsVoiceKey === voice.id;
                return (
                  <button key={voice.id} type="button" disabled={isTestingVoice} aria-pressed={selected}
                    onClick={() => handleChooseVoice(voice.id)}
                    className={`p-3 rounded-xl text-sm font-bold border-2 ${selected ? 'bg-sky-600 border-sky-600 text-white' : 'bg-white border-sky-200 text-sky-900'} disabled:opacity-50`}>
                    {voice.label}{selected ? ' ✓' : ''}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-sky-800 mt-2">Kies 'n stem en druk Toets Stem om te luister. Jou keuse word dadelik gestoor.</p>
            {voiceTestError && <p role="alert" className="text-xs text-red-700 mt-2">{voiceTestError}</p>}
          </fieldset>

          {/* Voice Preview & Status */}
          <div className="p-3.5 rounded-2xl bg-sky-50 border border-sky-200 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[10px] font-black uppercase text-sky-800 tracking-wider">
                Maatjie se Aktiewe Stem:
              </div>
              <div className="text-xs font-bold text-sky-950 truncate mt-0.5">
                {profile.selectedVoiceType === 'recorded'
                  ? '🎤 Opgeneemde Eie Stem'
                  : profile.selectedVoiceType === 'webspeech'
                  ? '🔊 Toestel Foneties'
                  : `🦁 ${VOICE_CHOICES.find((voice) => voice.id === profile.elevenLabsVoiceKey)?.label || 'ElevenLabs stem'}`}
              </div>
            </div>

            <button
              type="button"
              onClick={handleTestVoice}
              disabled={isTestingVoice}
              className="px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl shadow-xs transition active:scale-95 cursor-pointer flex items-center gap-1.5 shrink-0"
            >
              <Volume2 className="w-3.5 h-3.5 text-white" />
              <span>{isTestingVoice ? 'Praat tans...' : 'Toets Stem 🔊'}</span>
            </button>
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isTestingVoice}
              className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black text-sm rounded-2xl shadow-lg transition active:scale-98 cursor-pointer flex items-center justify-center gap-2"
            >
              <Check className="w-5 h-5" />
              <span>Stoor My Profiel! ⭐</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
