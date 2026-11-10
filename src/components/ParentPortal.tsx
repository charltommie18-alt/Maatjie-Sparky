import React, { useState, useEffect, useRef } from 'react';
import {
  Shield, KeyRound, Clock, MessageSquare, Sparkles, Image, Bell, Lock,
  Unlock, Send, RefreshCw, CheckCircle2, AlertTriangle, ArrowRight, X, Heart, Smartphone,
  Volume2, Mic, MicOff, Upload, Play, Square, Pause, Trash2
} from 'lucide-react';
import { ChildProfile, ParentLoveNote, WhatsAppLog, VaultMedia } from '../types';
import { speechService } from '../utils/speech';
import { VOICE_CHOICES } from '../utils/voiceChoices';

interface ParentPortalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: ChildProfile;
  onUpdateProfile: (updated: Partial<ChildProfile>) => void;
  vaultMedia: VaultMedia[];
  onApproveMedia: (id: string, approved: boolean) => void;
  onSendLoveNote: (note: ParentLoveNote) => void;
  onOpenWhatsAppHub?: () => void;
  onUnlockApp?: (extraMinutes?: number) => void;
}

export const ParentPortal: React.FC<ParentPortalProps> = ({
  isOpen,
  onClose,
  profile,
  onUpdateProfile,
  vaultMedia,
  onApproveMedia,
  onSendLoveNote,
  onOpenWhatsAppHub,
  onUnlockApp,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [pinNotice, setPinNotice] = useState('');

  useEffect(() => {
    if (!isOpen) { setIsAuthenticated(false); setPinInput(''); setNewPin(''); setPinNotice(''); }
  }, [isOpen]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'voice' | 'whatsapp' | 'creator' | 'vault' | 'privacy'>('dashboard');

  // Auto-lock & screen time bypass state
  const [autoLockEnabled, setAutoLockEnabled] = useState(profile.autoLockEnabled ?? false);

  // ElevenLabs Voice & Custom Voice Clips state
  const [elevenVoiceKey, setElevenVoiceKey] = useState(profile.elevenLabsVoiceKey || 'luna');
  const [isTestingVoice, setIsTestingVoice] = useState(false);
  const [voiceSavedNotice, setVoiceSavedNotice] = useState<string | null>(null);
  const [voiceClips, setVoiceClips] = useState<{ id: string; name: string; url: string; date: string }[]>(
    profile.uploadedVoiceClips || []
  );
  const [selectedVoiceClipId, setSelectedVoiceClipId] = useState<string | undefined>(profile.selectedVoiceClipId);
  const [selectedVoiceType, setSelectedVoiceType] = useState<'elevenlabs' | 'recorded' | 'webspeech'>(
    profile.selectedVoiceType || (profile.selectedVoiceClipId ? 'recorded' : 'elevenlabs')
  );
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<any>(null);

  // WhatsApp state
  const [guardianPhone, setGuardianPhone] = useState(profile.guardianPhone || '+27 82 123 4567');
  const [whatsappLogs, setWhatsappLogs] = useState<WhatsAppLog[]>([]);
  const [isSendingWa, setIsSendingWa] = useState(false);
  const [waSuccessNotice, setWaSuccessNotice] = useState<string | null>(null);
  const [loveNoteInput, setLoveNoteInput] = useState('');

  // Custom Story & Game Creator state
  const [creatorType, setCreatorType] = useState<'story' | 'game'>('story');
  const [focusArea, setFocusArea] = useState('Deelsug & Geduld (Sharing & Patience)');
  const [customNotes, setCustomNotes] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedResult, setGeneratedResult] = useState<any | null>(null);

  // Push notifications state
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  // Settings
  const [dailyLimit, setDailyLimit] = useState(profile.dailyLimitMinutes || 30);
  const [bedtimeHour, setBedtimeHour] = useState(profile.bedtimeHour || 20);
  const [nameInput, setNameInput] = useState(profile.name || 'Liam');
  const [ageInput, setAgeInput] = useState(profile.age || 6);

  // Check ElevenLabs status on mount
  useEffect(() => {
    fetch('/api/elevenlabs/status')
      .then(r => r.json())
      .then(d => {
        if (d.defaultVoiceKey && !profile.elevenLabsVoiceKey) setElevenVoiceKey(d.defaultVoiceKey);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setSelectedVoiceType(profile.selectedVoiceType || (profile.selectedVoiceClipId ? 'recorded' : 'elevenlabs'));
    setSelectedVoiceClipId(profile.selectedVoiceClipId);
    if (profile.elevenLabsVoiceKey) setElevenVoiceKey(profile.elevenLabsVoiceKey);
  }, [profile.selectedVoiceType, profile.selectedVoiceClipId, profile.elevenLabsVoiceKey]);

  useEffect(() => {
    setNameInput(profile.name);
    setAgeInput(profile.age);
  }, [profile.name, profile.age]);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationsEnabled(Notification.permission === 'granted');
    }
  }, []);

  const handleVerifyPin = () => {
    if (pinInput && pinInput === profile.guardianPin) {
      setIsAuthenticated(true);
      setPinError(false);
      setPinInput('');
      speechService.playSound('success');
    } else {
      setPinError(true);
      speechService.playSound('pop');
    }
  };

  const handleRequestPush = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          setNotificationsEnabled(true);
          new Notification('🦁 Maatjie AI Guardian Hub', {
            body: 'Stootkennisgewings is aangeskakel! Jy sal intydse vorderingsverslae ontvang.',
            icon: '/icon.svg'
          });
        }
      } catch (err) {
        console.error('Notification permission error', err);
      }
    }
  };

  const handleSendWhatsAppSummary = async () => {
    setIsSendingWa(true);
    setWaSuccessNotice(null);
    try {
      const res = await fetch('/api/whatsapp/send-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          childName: profile.name,
          guardianPhone,
          todayMinutes: profile.minutesUsedToday,
          mathCompleted: 7,
          mathAccuracy: 94,
          eqSkillsPracticed: ['Diep Buikasemhaling (Belly breathing)', 'Deel van Speelgoed', 'Selfvertroue'],
          newWordsLearned: ['Dapper (Brave)', 'Koöperatief (Cooperative)', 'Driehoek (Triangle)'],
          moodDominant: 'Bly & Nuuskierig'
        })
      });
      const data = await res.json();
      if (data.success) {
        setWaSuccessNotice('WhatsApp verslag gereed! Skakel is oopgemaak.');
        // Add to local logs
        setWhatsappLogs(prev => [data.logEntry, ...prev]);
        // Open WhatsApp Web or mobile app click-to-chat
        if (data.waLink) {
          window.open(data.waLink, '_blank');
        }
      }
    } catch (err) {
      console.error('Failed to send WhatsApp summary', err);
    } finally {
      setIsSendingWa(false);
    }
  };

  const handleSendLoveNote = async () => {
    if (!loveNoteInput.trim()) return;
    try {
      const res = await fetch('/api/whatsapp/receive-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender: 'Mamma & Pappa (via WhatsApp)',
          text: loveNoteInput
        })
      });
      const data = await res.json();
      if (data.success) {
        onSendLoveNote(data.note);
        setLoveNoteInput('');
        setWaSuccessNotice('Liefdesboodskap dadelik na kindjie se posbus gestuur! ❤️');
        speechService.playSound('star');
      }
    } catch (err) {
      console.error('Failed to send love note', err);
    }
  };

  const handleCreateCustomContent = async () => {
    setIsGenerating(true);
    setGeneratedResult(null);
    try {
      const res = await fetch('/api/parent/custom-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          childName: profile.name,
          age: profile.age,
          focusArea,
          details: customNotes,
          contentType: creatorType
        })
      });
      const data = await res.json();
      setGeneratedResult(data.generatedContent);
      speechService.playSound('success');
    } catch (err) {
      console.error('Failed to create parent content', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveElevenLabs = async () => {
    try {
      const res = await fetch('/api/elevenlabs/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voiceKey: elevenVoiceKey })
      });
      const data = await res.json();
      if (data.success) {
        speechService.setVoiceKey(data.voiceKey);
        onUpdateProfile({ elevenLabsVoiceKey: data.voiceKey });
        setVoiceSavedNotice('ElevenLabs-stemkeuse is suksesvol gestoor! 🎙️');
        speechService.playSound('success');
        setTimeout(() => setVoiceSavedNotice(null), 4000);
      }
    } catch (err) {
      console.error('Failed to save voice selection', err);
    }
  };

  const handleTestElevenVoice = () => {
    setIsTestingVoice(true);
    speechService.unlockAudio();
    speechService.setMuted(false);
    speechService.setVoiceKey(elevenVoiceKey);
    const testText = `Aitsa! Ek is Maatjie, en ek praat met jou gekose stem! Kom ons speel en tel saam!`;
    speechService.speak(testText, 'af', () => setIsTestingVoice(false));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const url = event.target?.result as string;
      const newClip = {
        id: `voice-${Date.now()}`,
        name: file.name.replace(/\.[^/.]+$/, ''),
        url,
        date: new Date().toLocaleDateString('af-ZA')
      };
      const updated = [newClip, ...voiceClips];
      setVoiceClips(updated);
      setSelectedVoiceClipId(newClip.id);
      setSelectedVoiceType('recorded');
      speechService.setCustomVoice(url, 'recorded');
      onUpdateProfile({
        uploadedVoiceClips: updated,
        selectedVoiceClipId: newClip.id,
        selectedVoiceType: 'recorded',
        activeCustomVoiceUrl: url
      });
      setVoiceSavedNotice(`✓ Klanklêer "${file.name}" opgelaai en gekies as Maatjie se aktiewe stem! 🎙️⭐`);
      speechService.playSound('success');
      setTimeout(() => setVoiceSavedNotice(null), 4000);
    };
    reader.readAsDataURL(file);
  };

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          const url = reader.result as string;
          const newClip = {
            id: `voice-rec-${Date.now()}`,
            name: `Stem-Opname (${new Date().toLocaleTimeString('af-ZA', { hour: '2-digit', minute: '2-digit' })})`,
            url,
            date: new Date().toLocaleDateString('af-ZA')
          };
          const updated = [newClip, ...voiceClips];
          setVoiceClips(updated);
          // Automatically set as active voice!
          setSelectedVoiceClipId(newClip.id);
          setSelectedVoiceType('recorded');
          speechService.setCustomVoice(url, 'recorded');
          onUpdateProfile({
            uploadedVoiceClips: updated,
            selectedVoiceClipId: newClip.id,
            selectedVoiceType: 'recorded',
            activeCustomVoiceUrl: url
          });
          setVoiceSavedNotice(`✓ Jou stem-opname "${newClip.name}" is gestoor en gekies as Maatjie se aktiewe stem! 🎙️⭐`);
          speechService.playSound('success');
          setTimeout(() => setVoiceSavedNotice(null), 5000);
        };
        reader.readAsDataURL(audioBlob);

        // Stop all audio tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
      speechService.playSound('pop');
    } catch (err) {
      console.warn('Microphone recording error:', err);
      alert('Kon nie mikrofoon oopmaak nie. Gee asseblief mikrofoontoestemming.');
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(recordingTimerRef.current);
      speechService.playSound('star');
    }
  };

  const handleSelectVoiceClip = (clip: { id: string; name: string; url: string }) => {
    setSelectedVoiceClipId(clip.id);
    setSelectedVoiceType('recorded');
    speechService.setCustomVoice(clip.url, 'recorded');
    onUpdateProfile({
      selectedVoiceClipId: clip.id,
      selectedVoiceType: 'recorded',
      activeCustomVoiceUrl: clip.url
    });
    setVoiceSavedNotice(`✓ "${clip.name}" is nou gekies as Maatjie se aktiewe stem! 🎙️`);
    speechService.playSound('success');
    speechService.playAudioUrl(clip.url);
    setTimeout(() => setVoiceSavedNotice(null), 4000);
  };

  const handleSelectElevenLabs = () => {
    setSelectedVoiceClipId(undefined);
    setSelectedVoiceType('elevenlabs');
    speechService.setCustomVoice(null, 'elevenlabs');
    speechService.setVoiceKey(elevenVoiceKey);
    onUpdateProfile({
      selectedVoiceClipId: undefined,
      selectedVoiceType: 'elevenlabs',
      activeCustomVoiceUrl: undefined,
      elevenLabsVoiceKey: elevenVoiceKey
    });
    setVoiceSavedNotice('✓ Jou gekose ElevenLabs-stem is nou aktief! 🦁');
    speechService.playSound('star');
    setTimeout(() => setVoiceSavedNotice(null), 4000);
  };

  const handleSelectWebSpeech = () => {
    setSelectedVoiceClipId(undefined);
    setSelectedVoiceType('webspeech');
    speechService.setCustomVoice(null, 'webspeech');
    onUpdateProfile({
      selectedVoiceClipId: undefined,
      selectedVoiceType: 'webspeech',
      activeCustomVoiceUrl: undefined
    });
    setVoiceSavedNotice(`✓ Toestel Fonetiese Afrikaanse Spraak is nou die aktiewe stem! 🔊`);
    speechService.playSound('pop');
    setTimeout(() => setVoiceSavedNotice(null), 4000);
  };

  const handleDeleteVoiceClip = (id: string) => {
    const updated = voiceClips.filter((c) => c.id !== id);
    setVoiceClips(updated);
    if (selectedVoiceClipId === id) {
      setSelectedVoiceClipId(undefined);
      setSelectedVoiceType('elevenlabs');
      speechService.setCustomVoice(null, 'elevenlabs');
      onUpdateProfile({
        uploadedVoiceClips: updated,
        selectedVoiceClipId: undefined,
        selectedVoiceType: 'elevenlabs',
        activeCustomVoiceUrl: undefined
      });
    } else {
      onUpdateProfile({ uploadedVoiceClips: updated });
    }
    speechService.playSound('pop');
  };

  const handlePlayVoiceClip = (url: string) => {
    speechService.playAudioUrl(url);
  };

  const handleQuickAddMinutes = (extra: number) => {
    const newLimit = (profile.dailyLimitMinutes || 30) + extra;
    setDailyLimit(newLimit);
    onUpdateProfile({
      dailyLimitMinutes: newLimit,
      minutesUsedToday: 0 // Reset used minutes so it never locks
    });
    if (onUnlockApp) onUnlockApp(extra);
    setWaSuccessNotice(`+${extra} minute bygevoeg! Kindjie kan nou onbelemmerd speel.`);
    speechService.playSound('success');
    setTimeout(() => setWaSuccessNotice(null), 3000);
  };

  const handleToggleAutoLock = () => {
    const nextVal = !autoLockEnabled;
    setAutoLockEnabled(nextVal);
    onUpdateProfile({ autoLockEnabled: nextVal });
    speechService.playSound('star');
    setWaSuccessNotice(
      nextVal
        ? 'Outomatiese tydbeperking geaktiveer.'
        : 'Outomatiese tydbeperking GEDEAKTIVEER! Kindjie kan speel sonder enige onderbrekings of slotte.'
    );
    setTimeout(() => setWaSuccessNotice(null), 4000);
  };

  const handleSaveSettings = () => {
    onUpdateProfile({
      name: nameInput.trim() || profile.name,
      age: Number(ageInput) || profile.age,
      dailyLimitMinutes: dailyLimit,
      bedtimeHour: bedtimeHour,
      guardianPhone: guardianPhone,
      autoLockEnabled: autoLockEnabled,
      uploadedVoiceClips: voiceClips,
      selectedVoiceClipId: selectedVoiceClipId,
      selectedVoiceType: selectedVoiceType,
      activeCustomVoiceUrl:
        selectedVoiceType === 'recorded'
          ? voiceClips.find((c) => c.id === selectedVoiceClipId)?.url
          : undefined
    });
    setWaSuccessNotice('Profiel en instellings suksesvol gestoor! ✅');
    speechService.playSound('star');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-3 sm:p-5 overflow-y-auto animate-in fade-in">
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border-4 border-indigo-500 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 text-white p-4 sm:p-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-700/80 rounded-2xl border border-indigo-400/40">
              <Shield className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black font-fredoka flex items-center gap-2">
                Ouer Portaal & Beheer
              </h2>
              <p className="text-xs sm:text-sm text-indigo-200">
                Geverifieerde Voog Toegang • WhatsApp Integrasie • EQ & Wiskunde Monitering
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-indigo-200 hover:text-white hover:bg-indigo-700/60 transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* If not authenticated, show PIN keypad */}
        {!isAuthenticated ? (
          <div className="p-8 sm:p-12 flex flex-col items-center justify-center text-center max-w-md mx-auto my-auto">
            <div className="w-16 h-16 rounded-3xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-4 shadow-inner">
              <Lock className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-black font-fredoka text-slate-800">
              Voer Ouer PIN In
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              Voer jou PIN in. As jy nog nie jou PIN verander het nie, gebruik die verstek-PIN 1234 en verander dit in Privaatheid.
            </p>

            <div className="mt-6 w-full">
              <input
                type="password"
                maxLength={4}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleVerifyPin()}
                placeholder="• • • •"
                className={`w-full text-center text-3xl tracking-widest font-mono py-3 rounded-2xl border-2 ${
                  pinError ? 'border-rose-500 bg-rose-50' : 'border-indigo-300 bg-slate-50'
                } focus:outline-hidden focus:border-indigo-600`}
                autoFocus
              />

              {pinError && (
                <p className="mt-2 text-xs font-bold text-rose-500">
                  Verkeerde PIN. Probeer weer.
                </p>
              )}

              <button
                onClick={handleVerifyPin}
                className="mt-4 w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm rounded-2xl shadow-lg transition active:scale-98"
              >
                Ontsluit Ouer Portaal 🔓
              </button>
            </div>
          </div>
        ) : (
          /* Authenticated Parent Hub */
          <div className="flex-1 flex flex-col min-h-0">
            {/* Quick Screen Time & Unlock Top Banner */}
            <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800 text-white px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 shadow-xs shrink-0 border-b border-emerald-600">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-emerald-600 rounded-xl">
                  <Unlock className="w-4 h-4 text-emerald-200" />
                </div>
                <div>
                  <div className="font-bold text-xs sm:text-sm flex items-center gap-1.5">
                    <span>Toep-Status: {autoLockEnabled ? '⏱️ Tydperk Aktief' : '🔓 Onbeperk / Geen Slot'}</span>
                    <span className="text-[10px] bg-emerald-900/60 px-2 py-0.5 rounded-full border border-emerald-500/40 font-mono">
                      {profile.minutesUsedToday} min / {dailyLimit} min
                    </span>
                  </div>
                  <div className="text-[11px] text-emerald-200">
                    {autoLockEnabled ? 'Sluit outomaties as tyd verby is' : 'Sluiting is gedeaktiveer — speel sonder onderbrekings!'}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleQuickAddMinutes(30)}
                  className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs shadow-xs transition cursor-pointer"
                  title="Voeg 30 minute speeltyd by"
                >
                  +30 min
                </button>
                <button
                  onClick={() => {
                    if (onUnlockApp) onUnlockApp(30);
                    onClose();
                  }}
                  className="px-3.5 py-1.5 bg-amber-400 hover:bg-amber-300 text-amber-950 font-black text-xs rounded-xl shadow-md transition active:scale-95 cursor-pointer flex items-center gap-1"
                >
                  <Unlock className="w-3.5 h-3.5" />
                  <span>Ontsluit & Terug na Toep 🚀</span>
                </button>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex border-b border-slate-200 bg-slate-50 px-4 overflow-x-auto shrink-0 scrollbar-none">
              {[
                { id: 'dashboard', label: '📊 Dashboard & Tydperk', icon: Clock },
                { id: 'voice', label: '🎙️ Stem & Oplaai (Voice)', icon: Volume2 },
                { id: 'whatsapp', label: '📱 WhatsApp Hub', icon: MessageSquare },
                { id: 'creator', label: '🪄 Skep Stories & Speletjies', icon: Sparkles },
                { id: 'vault', label: '🔒 Familie Kluis & Media', icon: Image },
                { id: 'privacy', label: '🛡️ Privaatheid & Sinkronisasie', icon: Lock },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id as any);
                    setWaSuccessNotice(null);
                  }}
                  className={`flex items-center gap-1.5 px-4 py-3 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition cursor-pointer ${
                    activeTab === tab.id
                      ? 'border-indigo-600 text-indigo-700 bg-white'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Notification Banner */}
            {waSuccessNotice && (
              <div className="mx-4 mt-3 p-3 bg-emerald-50 border border-emerald-300 rounded-2xl text-emerald-800 text-xs sm:text-sm font-bold flex items-center justify-between">
                <span>{waSuccessNotice}</span>
                <button onClick={() => setWaSuccessNotice(null)} className="text-emerald-600">✕</button>
              </div>
            )}

            {/* Tab Contents (Scrollable) */}
            <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-6">
              {/* TAB 1: DASHBOARD & LIMITS */}
              {activeTab === 'dashboard' && (
                <div className="space-y-6">
                  {/* Quick Stat Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200">
                      <span className="text-xs font-bold text-amber-700">Skermtyd Vandag</span>
                      <div className="text-2xl font-black font-fredoka text-amber-900 mt-1">
                        {profile.minutesUsedToday} / {profile.dailyLimitMinutes} min
                      </div>
                      <div className="w-full bg-amber-200 h-2 rounded-full mt-2 overflow-hidden">
                        <div
                          className="bg-amber-500 h-full rounded-full"
                          style={{
                            width: `${Math.min(100, (profile.minutesUsedToday / (profile.dailyLimitMinutes || 1)) * 100)}%`
                          }}
                        />
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200">
                      <span className="text-xs font-bold text-indigo-700">Wiskunde Akkuraatheid</span>
                      <div className="text-2xl font-black font-fredoka text-indigo-900 mt-1">
                        94% ⭐
                      </div>
                      <span className="text-[11px] text-indigo-600 font-semibold">12 somme korrek opgelos</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200">
                      <span className="text-xs font-bold text-rose-700">EQ Groei Indeks</span>
                      <div className="text-2xl font-black font-fredoka text-rose-900 mt-1">
                        Uitstekend 💖
                      </div>
                      <span className="text-[11px] text-rose-600 font-semibold">3 emosie-oefeninge voltooi</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
                      <span className="text-xs font-bold text-emerald-700">Tweetalige Woorde</span>
                      <div className="text-2xl font-black font-fredoka text-emerald-900 mt-1">
                        +18 Nuut 🗣️
                      </div>
                      <span className="text-[11px] text-emerald-600 font-semibold">Afrikaans & Engels</span>
                    </div>
                  </div>

                  {/* Child Profile & Name Configuration */}
                  <div className="p-5 rounded-3xl bg-amber-50/60 border border-amber-200 space-y-3">
                    <h4 className="font-black text-slate-800 text-base flex items-center gap-2">
                      <span className="text-xl">{profile.avatar || '🦁'}</span>
                      Kindjie se Profiel & Naam
                    </h4>

                    <div className="grid sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Kindjie se Naam:
                        </label>
                        <input
                          type="text"
                          value={nameInput}
                          onChange={(e) => setNameInput(e.target.value)}
                          placeholder="Bv: Charl, Liam, Mia..."
                          className="w-full p-2.5 rounded-xl border border-amber-300 bg-white text-sm font-bold text-slate-800 focus:outline-hidden focus:border-indigo-600"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Ouderdom:
                        </label>
                        <input
                          type="number"
                          min={3}
                          max={12}
                          value={ageInput}
                          onChange={(e) => setAgeInput(Number(e.target.value))}
                          className="w-full p-2.5 rounded-xl border border-amber-300 bg-white text-sm font-bold text-slate-800 focus:outline-hidden focus:border-indigo-600"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-1">
                      <button
                        onClick={handleSaveSettings}
                        className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
                      >
                        Stoor Kindjie se Naam ⭐
                      </button>
                    </div>
                  </div>

                  {/* Daily Screen Time & Bedtime Controls */}
                  <div className="p-5 rounded-3xl bg-slate-50 border border-slate-200 space-y-4">
                    <h4 className="font-black text-slate-800 text-base flex items-center gap-2">
                      <Clock className="w-5 h-5 text-indigo-600" />
                      Daaglikse Gebruik & Slaaptyd Beperkings
                    </h4>

                    <div>
                      <div className="flex justify-between text-sm font-bold text-slate-700 mb-1">
                        <span>Maksimum Speeltyd per Dag:</span>
                        <span className="text-indigo-600 font-mono text-base">{dailyLimit} minute</span>
                      </div>
                      <input
                        type="range"
                        min="10"
                        max="90"
                        step="5"
                        value={dailyLimit}
                        onChange={(e) => setDailyLimit(Number(e.target.value))}
                        className="w-full accent-indigo-600 cursor-pointer"
                      />
                      <div className="flex justify-between text-[11px] text-slate-400 font-bold">
                        <span>10 min</span>
                        <span>30 min (Aanbeveel)</span>
                        <span>60 min</span>
                        <span>90 min</span>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-sm font-bold text-slate-700 mb-1">
                        <span>Slaaptyd Skerm-Afskakeling:</span>
                        <span className="text-indigo-600 font-mono text-base">{bedtimeHour}:00</span>
                      </div>
                      <select
                        value={bedtimeHour}
                        onChange={(e) => setBedtimeHour(Number(e.target.value))}
                        className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-sm font-semibold text-slate-700"
                      >
                        <option value={19}>19:00 (7:00 NM) - Vroeg vir kleuters</option>
                        <option value={20}>20:00 (8:00 NM) - Standaard</option>
                        <option value={21}>21:00 (9:00 NM) - Ouer kinders</option>
                      </select>
                      <p className="text-xs text-slate-500 mt-1">
                        Wanneer slaaptyd bereik word, skakel Maatjie outomaties oor na 'n rustige slaapliedjie en sluit die skerm tot môre oggend.
                      </p>
                    </div>

                    {/* Auto-Lock Toggle Switch */}
                    <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 flex items-center justify-between gap-3">
                      <div>
                        <div className="font-bold text-xs sm:text-sm text-slate-800 flex items-center gap-1.5">
                          <span>Outomatiese Skermtyd & Slaaptyd Slot:</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${autoLockEnabled ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-800'}`}>
                            {autoLockEnabled ? 'AAN (Sluit op limiet)' : 'AF (Onbeperk — Geen outomatiese sluiting)'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-0.5">
                          {autoLockEnabled
                            ? 'Die skerm sal outomaties sluit wanneer die daaglikse speeltyd verby is.'
                            : 'Slot is gedeaktiveer: Die app sal NIE outomaties sluit of vries terwyl jy besig is nie!'}
                        </p>
                      </div>

                      <button
                        onClick={handleToggleAutoLock}
                        className={`px-4 py-2 rounded-xl font-black text-xs transition cursor-pointer shrink-0 ${
                          autoLockEnabled
                            ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                            : 'bg-emerald-600 text-white shadow-md hover:bg-emerald-700'
                        }`}
                      >
                        {autoLockEnabled ? 'Skakel AF 🔓' : 'Slot is AF ✓'}
                      </button>
                    </div>

                    <button
                      onClick={handleSaveSettings}
                      className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer"
                    >
                      Stoor Beperkings & Reëls 💾
                    </button>
                  </div>
                </div>
              )}

              {/* TAB: STEM EN OPLAAI (VOICE UPLOAD & AUDIO STUDIO) */}
              {activeTab === 'voice' && (
                <div className="space-y-6">
                  {/* Status Notice */}
                  {voiceSavedNotice && (
                    <div className="p-3 bg-emerald-100 border border-emerald-300 rounded-2xl text-emerald-800 text-xs sm:text-sm font-bold flex items-center justify-between">
                      <span>{voiceSavedNotice}</span>
                      <button onClick={() => setVoiceSavedNotice(null)} className="text-emerald-600">✕</button>
                    </div>
                  )}

                  {/* ACTIVE COMPANION VOICE CARD */}
                  <div className="p-5 rounded-3xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white shadow-lg space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2.5">
                          <span className="p-2.5 rounded-2xl bg-white/20 backdrop-blur-xs text-xl">🎙️</span>
                          <div>
                            <h4 className="font-black text-lg font-fredoka tracking-wide">
                              Maatjie se Aktiewe Stem (Active Companion Voice)
                            </h4>
                            <p className="text-xs text-white/90">
                              Kies watter stem Maatjie gebruik wanneer sy met {profile.name} praat en stories vertel:
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-2">
                        <button
                          onClick={() => {
                            speechService.unlockAudio();
                            speechService.setMuted(false);
                            if (selectedVoiceType === 'recorded') {
                              const activeClip = voiceClips.find(c => c.id === selectedVoiceClipId);
                              if (activeClip) speechService.playAudioUrl(activeClip.url);
                              else speechService.speak(`Hallo ${profile.name}! Ek praat met jou gekose stem!`, 'af');
                            } else if (selectedVoiceType === 'elevenlabs') {
                              speechService.speak(`Aitsa ${profile.name}! Ek is Maatjie, en ek praat met die egte Afrikaanse ElevenLabs stem!`, 'af');
                            } else {
                              speechService.speak(`Hallo ${profile.name}! Ek praat met die toestel se Afrikaanse stem!`, 'af');
                            }
                          }}
                          className="px-4 py-2 bg-white text-indigo-950 rounded-xl font-black text-xs shadow-md hover:bg-indigo-50 active:scale-95 transition cursor-pointer flex items-center gap-1.5"
                        >
                          <Volume2 className="w-4 h-4 text-indigo-600" />
                          <span>Toets Aktiewe Stem 🔊</span>
                        </button>
                      </div>
                    </div>

                    {/* Voice Choice Cards */}
                    <div className="grid sm:grid-cols-3 gap-2.5 pt-1">
                      {/* 1. Recorded Voice */}
                      <button
                        onClick={() => {
                          if (voiceClips.length > 0) {
                            const clip = voiceClips.find(c => c.id === selectedVoiceClipId) || voiceClips[0];
                            handleSelectVoiceClip(clip);
                          } else {
                            setVoiceSavedNotice("Neem eers 'n stem op of laai 'n klanklêer hieronder op om dit te kies!");
                            setTimeout(() => setVoiceSavedNotice(null), 4000);
                          }
                        }}
                        className={`p-3.5 rounded-2xl border-2 text-left transition cursor-pointer relative ${
                          selectedVoiceType === 'recorded'
                            ? 'bg-white text-slate-900 border-yellow-300 shadow-md ring-2 ring-yellow-400'
                            : 'bg-white/10 hover:bg-white/20 text-white border-white/20'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xl">🎤</span>
                          {selectedVoiceType === 'recorded' && (
                            <span className="text-[10px] font-black bg-emerald-500 text-white px-2 py-0.5 rounded-full shadow-xs">
                              AKTIEF ✓
                            </span>
                          )}
                        </div>
                        <div className="font-black text-xs mt-2">Opgeneemde Eie Stem</div>
                        <div className={`text-[11px] truncate mt-0.5 ${selectedVoiceType === 'recorded' ? 'text-slate-600 font-bold' : 'text-white/80'}`}>
                          {selectedVoiceType === 'recorded' && selectedVoiceClipId
                            ? (voiceClips.find(c => c.id === selectedVoiceClipId)?.name || 'Eie Stem-Opname')
                            : (voiceClips.length > 0 ? `${voiceClips.length} opnames beskikbaar` : 'Klik hieronder om op te neem')}
                        </div>
                      </button>

                      {/* 2. ElevenLabs Voice */}
                      <button
                        onClick={handleSelectElevenLabs}
                        className={`p-3.5 rounded-2xl border-2 text-left transition cursor-pointer relative ${
                          selectedVoiceType === 'elevenlabs'
                            ? 'bg-white text-slate-900 border-yellow-300 shadow-md ring-2 ring-yellow-400'
                            : 'bg-white/10 hover:bg-white/20 text-white border-white/20'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xl">🦁</span>
                          {selectedVoiceType === 'elevenlabs' && (
                            <span className="text-[10px] font-black bg-emerald-500 text-white px-2 py-0.5 rounded-full shadow-xs">
                              AKTIEF ✓
                            </span>
                          )}
                        </div>
                        <div className="font-black text-xs mt-2">ElevenLabs Afrikaans</div>
                        <div className={`text-[11px] truncate font-mono mt-0.5 ${selectedVoiceType === 'elevenlabs' ? 'text-slate-600 font-bold' : 'text-white/80'}`}>
                          {elevenVoiceKey}
                        </div>
                      </button>

                      {/* 3. Device Web Speech */}
                      <button
                        onClick={handleSelectWebSpeech}
                        className={`p-3.5 rounded-2xl border-2 text-left transition cursor-pointer relative ${
                          selectedVoiceType === 'webspeech'
                            ? 'bg-white text-slate-900 border-yellow-300 shadow-md ring-2 ring-yellow-400'
                            : 'bg-white/10 hover:bg-white/20 text-white border-white/20'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xl">🔊</span>
                          {selectedVoiceType === 'webspeech' && (
                            <span className="text-[10px] font-black bg-emerald-500 text-white px-2 py-0.5 rounded-full shadow-xs">
                              AKTIEF ✓
                            </span>
                          )}
                        </div>
                        <div className="font-black text-xs mt-2">Toestel Spraak</div>
                        <div className={`text-[11px] truncate mt-0.5 ${selectedVoiceType === 'webspeech' ? 'text-slate-600 font-bold' : 'text-white/80'}`}>
                          Fonetiese Afrikaans
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* 1. Upload Voice Audio File */}
                  <div className="p-5 rounded-3xl bg-amber-50 border-2 border-amber-200 space-y-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2.5 bg-amber-500 text-white rounded-2xl">
                        <Upload className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-black text-slate-900 text-base">
                          Laai 'n Stem of Klanklêer Op (Upload Voice Audio)
                        </h4>
                        <p className="text-xs text-slate-600">
                          Laai eie stemme, slaaptyd-storie notas of gunsteling liedjies op (.mp3, .wav, .m4a).
                        </p>
                      </div>
                    </div>

                    <label className="border-2 border-dashed border-amber-300 hover:border-amber-400 bg-white rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition group">
                      <Upload className="w-8 h-8 text-amber-500 mb-2 group-hover:scale-110 transition" />
                      <span className="font-bold text-xs sm:text-sm text-slate-700">
                        Klik hier om 'n klanklêer (.mp3, .wav, .m4a) te kies
                      </span>
                      <span className="text-[11px] text-slate-400 mt-1">
                        Word outomaties geaktiveer as Maatjie se nuwe praat-stem!
                      </span>
                      <input
                        type="file"
                        accept="audio/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* 2. In-Browser Voice Recording */}
                  <div className="p-5 rounded-3xl bg-rose-50 border-2 border-rose-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2.5 bg-rose-500 text-white rounded-2xl">
                          <Mic className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-black text-slate-900 text-base">
                            Neem My Eie Stem Op (Record Voice)
                          </h4>
                          <p className="text-xs text-slate-600">
                            Praat 'n boodskappie of storie in vir jou kindjie met jou regte stem! Word outomaties gekies na opname.
                          </p>
                        </div>
                      </div>

                      {isRecording && (
                        <div className="flex items-center gap-2 text-rose-600 font-bold text-xs bg-rose-100 px-3 py-1.5 rounded-full border border-rose-300 animate-pulse">
                          <span className="w-2.5 h-2.5 bg-rose-600 rounded-full animate-ping" />
                          <span>Opname: {recordingTime}s</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                      {!isRecording ? (
                        <button
                          onClick={handleStartRecording}
                          className="py-3 px-5 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs sm:text-sm rounded-2xl shadow-md transition active:scale-95 flex items-center gap-2 cursor-pointer"
                        >
                          <Mic className="w-4 h-4" />
                          <span>Begin Opname Nou 🎙️</span>
                        </button>
                      ) : (
                        <button
                          onClick={handleStopRecording}
                          className="py-3 px-5 bg-slate-900 hover:bg-black text-white font-black text-xs sm:text-sm rounded-2xl shadow-md transition active:scale-95 flex items-center gap-2 cursor-pointer"
                        >
                          <Square className="w-4 h-4 text-rose-400" />
                          <span>Stop & Kies As Stem 💾⭐</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 3. Library of Uploaded & Recorded Voice Clips */}
                  <div className="p-5 rounded-3xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-black text-slate-800 text-sm flex items-center gap-2">
                        <Volume2 className="w-4 h-4 text-indigo-600" />
                        <span>Opgelaaide & Opgeneemde Stem-Biblioteek ({voiceClips.length})</span>
                      </h4>
                      <span className="text-[11px] text-slate-500 font-medium">
                        Klik "Kies as Stem" om 'n opname te aktiveer
                      </span>
                    </div>

                    {voiceClips.length === 0 ? (
                      <p className="text-xs text-slate-400 p-4 bg-white rounded-2xl border border-slate-200 text-center">
                        Nog geen klanklêers opgelaai nie. Laai 'n klanklêer hierbo op of neem jou stem op!
                      </p>
                    ) : (
                      <div className="space-y-2.5">
                        {voiceClips.map((clip) => {
                          const isSelected = selectedVoiceType === 'recorded' && selectedVoiceClipId === clip.id;
                          return (
                            <div
                              key={clip.id}
                              className={`p-3.5 rounded-2xl border-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs transition ${
                                isSelected
                                  ? 'bg-amber-50/80 border-amber-400 ring-2 ring-amber-300'
                                  : 'bg-white border-slate-200 hover:border-slate-300'
                              }`}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <button
                                  onClick={() => handlePlayVoiceClip(clip.url)}
                                  className="w-9 h-9 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center transition active:scale-90 cursor-pointer shrink-0 shadow-xs"
                                  title="Luister na opname"
                                >
                                  <Play className="w-4 h-4 fill-white ml-0.5" />
                                </button>
                                <div className="truncate">
                                  <div className="flex items-center gap-2">
                                    <span className="font-black text-xs text-slate-800 truncate">{clip.name}</span>
                                    {isSelected && (
                                      <span className="px-2 py-0.5 bg-emerald-100 border border-emerald-300 text-emerald-800 rounded-full text-[10px] font-black shrink-0">
                                        ✓ AKTIEWE STEM
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[10px] text-slate-400 mt-0.5">{clip.date} • Eie Klankopname</div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                                {isSelected ? (
                                  <span className="px-3 py-1.5 bg-emerald-600 text-white font-black text-xs rounded-xl shadow-xs flex items-center gap-1.5">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>Gekose Stem</span>
                                  </span>
                                ) : (
                                  <button
                                    onClick={() => handleSelectVoiceClip(clip)}
                                    className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-black text-xs rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5"
                                    title="Kies hierdie opname as Maatjie se aktiewe stem"
                                  >
                                    <Sparkles className="w-3.5 h-3.5" />
                                    <span>Kies as Stem ⭐</span>
                                  </button>
                                )}

                                <button
                                  onClick={() => handleDeleteVoiceClip(clip.id)}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 transition cursor-pointer rounded-lg hover:bg-rose-50"
                                  title="Verwyder"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* 4. Server-configured ElevenLabs voice choices */}
                  <div className={`p-5 rounded-3xl border-2 space-y-3 transition ${
                    selectedVoiceType === 'elevenlabs'
                      ? 'bg-sky-50 border-sky-400 ring-2 ring-sky-300'
                      : 'bg-sky-50/60 border-sky-200'
                  }`}>
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h4 className="font-black text-sky-950 text-base">ElevenLabs-stem</h4>
                        <p className="text-xs text-sky-700">Kies een van die drie veilige stemopsies. Stem-instellings bly op die bediener.</p>
                      </div>
                      <span className="text-[10px] font-bold bg-sky-200 text-sky-800 px-2.5 py-1 rounded-full border border-sky-300">Multi-lingual v2</span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-1">
                      {VOICE_CHOICES.map((voice) => (
                        <button
                          key={voice.id}
                          onClick={() => {
                            setElevenVoiceKey(voice.id);
                            speechService.setVoiceKey(voice.id);
                            onUpdateProfile({ elevenLabsVoiceKey: voice.id, selectedVoiceType: 'elevenlabs', selectedVoiceClipId: undefined, activeCustomVoiceUrl: undefined });
                            setSelectedVoiceType('elevenlabs');
                            setSelectedVoiceClipId(undefined);
                            speechService.setCustomVoice(null, 'elevenlabs');
                          }}
                          className={`p-3 rounded-xl text-sm font-bold border-2 ${elevenVoiceKey === voice.id ? 'bg-sky-600 border-sky-600 text-white' : 'bg-white border-sky-200 text-sky-900'}`}
                        >
                          {voice.label}{elevenVoiceKey === voice.id ? ' ✓' : ''}
                        </button>
                      ))}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <button onClick={handleSelectElevenLabs} className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{selectedVoiceType === 'elevenlabs' ? 'ElevenLabs is Aktief' : 'Kies ElevenLabs as Stem 🦁'}</span>
                      </button>
                      <button onClick={handleTestElevenVoice} disabled={isTestingVoice} className="flex-1 py-2.5 px-3 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer flex items-center justify-center gap-1.5 min-w-[180px]">
                        <span>🔊</span><span>{isTestingVoice ? 'Speel klank...' : 'Toets Stem'}</span>
                      </button>
                      <button onClick={handleSaveElevenLabs} className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer">Stoor Stem 💾</button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: WHATSAPP HUB & REPORTS */}
              {activeTab === 'whatsapp' && (
                <div className="space-y-6">
                  <div className="p-5 rounded-3xl bg-emerald-50 border-2 border-emerald-200">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <div className="p-2 bg-emerald-600 text-white rounded-xl">
                            <MessageSquare className="w-5 h-5" />
                          </div>
                          <h4 className="text-lg font-black font-fredoka text-emerald-950">
                            WhatsApp Vordering & Mijlpaal Verslae
                          </h4>
                        </div>
                        <p className="mt-1 text-xs sm:text-sm text-emerald-800">
                          Ontvang outomatiese daaglikse opsommings van wiskunde suksesse, gemoedstoestand, en skermtyd direk op jou WhatsApp.
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 grid sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-emerald-900 mb-1">
                          Voog se WhatsApp Nommer:
                        </label>
                        <input
                          type="tel"
                          value={guardianPhone}
                          onChange={(e) => setGuardianPhone(e.target.value)}
                          placeholder="+27 82 123 4567"
                          className="w-full p-2.5 rounded-xl border border-emerald-300 bg-white text-sm font-bold text-slate-800"
                        />
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2 items-end">
                        <button
                          onClick={handleSendWhatsAppSummary}
                          disabled={isSendingWa}
                          className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm rounded-xl shadow-md flex items-center justify-center gap-2 transition active:scale-98 cursor-pointer"
                        >
                          <Send className="w-4 h-4" />
                          <span>{isSendingWa ? 'Genereer...' : 'Stuur Verslag Nou! 📲'}</span>
                        </button>

                        {onOpenWhatsAppHub && (
                          <button
                            onClick={onOpenWhatsAppHub}
                            className="py-2.5 px-4 bg-[#128C7E] hover:bg-[#075E54] text-white font-black text-xs sm:text-sm rounded-xl shadow-md flex items-center justify-center gap-1.5 transition active:scale-98 cursor-pointer whitespace-nowrap"
                          >
                            <span>💬</span>
                            <span>Intydse WhatsApp Bot</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Send Love Note to Child */}
                  <div className="p-5 rounded-3xl bg-pink-50 border border-pink-200">
                    <h4 className="text-base font-black font-fredoka text-pink-950 flex items-center gap-2">
                      <Heart className="w-5 h-5 text-pink-600 fill-pink-500" />
                      Stuur 'n Liefdesboodskap na {profile.name} se Posbus
                    </h4>
                    <p className="text-xs text-pink-700 mt-1">
                      Wanneer ouers op WhatsApp reageer, verskyn jou woorde soos 'n goue sterbriefie in Maatjie se "Love Notes" tab!
                    </p>

                    <div className="mt-3 flex gap-2">
                      <input
                        type="text"
                        value={loveNoteInput}
                        onChange={(e) => setLoveNoteInput(e.target.value)}
                        placeholder="Bv: Liewe Liam, ek is so trots op jou somme vandag! Lekker slaap my sterretjie! ❤️"
                        className="flex-1 p-2.5 rounded-xl border border-pink-300 bg-white text-sm text-slate-800"
                      />
                      <button
                        onClick={handleSendLoveNote}
                        className="px-4 py-2.5 bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs rounded-xl shadow-md transition"
                      >
                        Stuur 💌
                      </button>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <span className="text-[11px] text-pink-800 font-bold self-center">Kits-voorstelle:</span>
                      {[
                        "Trots op jou vriendelikheid vandag! ⭐",
                        "Jy is so dapper! Lekker speel! 🦁",
                        "Mammie en Pappie is baie lief vir jou! ❤️"
                      ].map((sug, i) => (
                        <button
                          key={i}
                          onClick={() => setLoveNoteInput(sug)}
                          className="text-[11px] bg-white border border-pink-200 text-pink-700 px-2 py-0.5 rounded-full hover:bg-pink-100 transition"
                        >
                          {sug}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* WhatsApp History Log */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                    <h5 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-2">
                      WhatsApp Versending Geskiedenis
                    </h5>
                    <div className="space-y-2 max-h-40 overflow-y-auto text-xs">
                      <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                        <div className="flex justify-between font-bold text-slate-700">
                          <span>🌟 Daaglikse Mijlpaal Verslag</span>
                          <span className="text-emerald-600">Gestuur (Delivered)</span>
                        </div>
                        <p className="text-slate-500 mt-1 truncate">
                          Liam het 24 minute gespeel. Wiskunde Telling: 94%! EQ: Kalm & Koöperatief.
                        </p>
                      </div>
                      {whatsappLogs.map((log) => (
                        <div key={log.id} className="p-2.5 bg-white rounded-xl border border-slate-200">
                          <div className="flex justify-between font-bold text-slate-700">
                            <span>📲 {log.recipientPhone}</span>
                            <span className="text-emerald-600">{log.status}</span>
                          </div>
                          <p className="text-slate-500 mt-1 text-[11px]">
                            {log.messageContent?.substring(0, 100)}...
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: CUSTOM STORY & GAME CREATOR */}
              {activeTab === 'creator' && (
                <div className="space-y-5">
                  <div className="p-5 rounded-3xl bg-indigo-50 border border-indigo-200">
                    <h4 className="text-lg font-black font-fredoka text-indigo-950 flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-indigo-600" />
                      Skep Pasgemaakte Stories & Speletjies vir {profile.name}
                    </h4>
                    <p className="text-xs sm:text-sm text-indigo-800 mt-1">
                      Het jou kindjie uitdagings met tande borsel, geduld, boelies by die skool, of vrees vir die donker? Laat Maatjie 'n doelgerigte storie of wiskundespeletjie skep!
                    </p>

                    <div className="mt-4 space-y-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Kies Inhoud Tipe:</label>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setCreatorType('story')}
                            className={`flex-1 py-2 rounded-xl text-xs font-bold border transition ${
                              creatorType === 'story'
                                ? 'bg-indigo-600 text-white border-indigo-600'
                                : 'bg-white text-slate-700 border-slate-200'
                            }`}
                          >
                            📖 Interaktiewe Storie
                          </button>
                          <button
                            onClick={() => setCreatorType('game')}
                            className={`flex-1 py-2 rounded-xl text-xs font-bold border transition ${
                              creatorType === 'game'
                                ? 'bg-indigo-600 text-white border-indigo-600'
                                : 'bg-white text-slate-700 border-slate-200'
                            }`}
                          >
                            🎮 Wiskunde / EQ Speletjie
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Fokus Doelwit / Lewensles:
                        </label>
                        <select
                          value={focusArea}
                          onChange={(e) => setFocusArea(e.target.value)}
                          className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-sm font-semibold text-slate-800"
                        >
                          <option value="Deelsug & Geduld met boetie/sussie">Deelsug & Geduld met Boetie / Sussie</option>
                          <option value="Kalm bly tydens frustrasie (Diep asemhaling)">Kalm bly tydens frustrasie (Diep asemhaling)</option>
                          <option value="Dapper wees by die nuwe skool / kleuterskool">Dapper wees by nuwe skool / kleuterskool</option>
                          <option value="Gereedmaak vir slaaptyd sonder tantrums">Gereedmaak vir slaaptyd sonder moedeloosheid</option>
                          <option value="Basiese Wiskunde: Optel en Vorms met diere">Basiese Wiskunde: Optel & Vorms met Diere</option>
                          <option value="Sê asseblief en dankie (Goeie maniere)">Sê asseblief en dankie (Goeie Maniere)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Ekstra Besonderhede (Bv. Name van troeteldiere of maatjies):
                        </label>
                        <textarea
                          rows={2}
                          value={customNotes}
                          onChange={(e) => setCustomNotes(e.target.value)}
                          placeholder="Bv: Noem sy hondjie Bruno en hoe hulle saam 5 tennisballe getel het..."
                          className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-xs text-slate-800"
                        />
                      </div>

                      <button
                        onClick={handleCreateCustomContent}
                        disabled={isGenerating}
                        className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-black text-xs sm:text-sm rounded-xl shadow-lg transition active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Sparkles className="w-4 h-4" />
                        <span>{isGenerating ? 'Skep nou met Maatjie KI...' : 'Genereer Pasgemaakte Inhoud! 🚀'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Generated Result Preview */}
                  {generatedResult && (
                    <div className="p-5 rounded-3xl bg-amber-50 border-2 border-amber-300 space-y-3 animate-in fade-in">
                      <div className="flex items-center gap-2 text-amber-800 font-bold text-xs">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Suksesvol geskep en by kindjie se biblioteek gevoeg!</span>
                      </div>
                      <h4 className="text-lg font-black font-fredoka text-slate-900">
                        {generatedResult.title}
                      </h4>
                      <div className="p-3 bg-white rounded-2xl border border-amber-200 text-xs text-slate-700 space-y-2">
                        <p><strong>Afrikaans:</strong> {generatedResult.previewTextAf}</p>
                        <p className="text-slate-500"><strong>English:</strong> {generatedResult.previewTextEn}</p>
                      </div>
                      {generatedResult.recommendedDiscussionQuestions && (
                        <div className="text-xs text-amber-900">
                          <strong>Vrae vir Ouer tydens Aandete:</strong>
                          <ul className="list-disc list-inside mt-1 space-y-0.5">
                            {generatedResult.recommendedDiscussionQuestions.map((q: string, idx: number) => (
                              <li key={idx}>{q}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: FAMILY VAULT & RESTRICTED ACCESS */}
              {activeTab === 'vault' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-base font-black font-fredoka text-slate-800">
                        Familie Kluis (Beperkte Voog Toegang)
                      </h4>
                      <p className="text-xs text-slate-500">
                        Foto's, tekeninge en kort video's word slegs sigbaar nadat die geverifieerde voog dit goedgekeur het.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {vaultMedia.map((item) => (
                      <div key={item.id} className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                        <div className="relative rounded-xl overflow-hidden bg-slate-200 h-40">
                          <img
                            src={item.url}
                            alt={item.title}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-2 right-2 bg-black/60 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                            {item.type}
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-slate-800">{item.title}</span>
                            <span className="text-[10px] text-slate-400">{item.date}</span>
                          </div>
                          <p className="text-xs text-slate-600 mt-0.5">{item.caption}</p>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                          <div className="flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full ${item.guardianApproved ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                            <span className="text-[11px] font-bold text-slate-600">
                              {item.guardianApproved ? 'Goedgekeur' : 'Wag op Ouer'}
                            </span>
                          </div>

                          <button
                            onClick={() => onApproveMedia(item.id, !item.guardianApproved)}
                            className={`px-2.5 py-1 rounded-xl text-xs font-bold transition ${
                              item.guardianApproved
                                ? 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                                : 'bg-emerald-600 text-white hover:bg-emerald-700'
                            }`}
                          >
                            {item.guardianApproved ? 'Herroep' : 'Keur Goed ✓'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 5: PRIVACY & MULTI-DEVICE SYNC */}
              {activeTab === 'privacy' && (
                <div className="space-y-4">
                  <div className="p-5 rounded-3xl bg-slate-50 border border-slate-200 space-y-3">
                    <h4 className="font-black text-slate-800 text-base flex items-center gap-2">
                      <Lock className="w-5 h-5 text-indigo-600" />
                      Privaatheid & Veelvoudige Toestel-Sinkronisasie
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Die profiel word op hierdie toestel gestoor en is nie geïnkripteer nie. Moenie sensitiewe inligting invoer nie. Sinkronisasie tussen toestelle is nog nie beskikbaar nie.
                    </p>
                    <div className="space-y-2">
                      <label htmlFor="new-parent-pin" className="block text-xs font-bold text-slate-700">Verander ouer-PIN (4 syfers)</label>
                      <input id="new-parent-pin" type="password" inputMode="numeric" maxLength={4} value={newPin} onChange={e => setNewPin(e.target.value.replace(/\D/g, ''))} className="w-full p-2 rounded-xl border border-slate-300" />
                      <button type="button" onClick={() => {
                        if (!/^\d{4}$/.test(newPin) || newPin === '1234') { setPinNotice('Kies vier syfers, anders as 1234.'); return; }
                        onUpdateProfile({ guardianPin: newPin });
                        setNewPin('');
                        setPinNotice('PIN op hierdie toestel verander. Dit is nie rekeningsekuriteit nie.');
                      }} className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl">Stoor nuwe PIN</button>
                      {pinNotice && <p role="status" className="text-xs text-slate-700">{pinNotice}</p>}
                    </div>
                  </div>

                  {/* Push Notifications Settings */}
                  <div className="p-5 rounded-3xl bg-slate-50 border border-slate-200 space-y-3">
                    <h4 className="font-black text-slate-800 text-base flex items-center gap-2">
                      <Bell className="w-5 h-5 text-amber-500" />
                      Intydse Stootkennisgewings (Push Notifications)
                    </h4>
                    <p className="text-xs text-slate-600">
                      Ontvang kennisgewings wanneer {profile.name} 'n nuwe wiskunde vlak bereik of as die daaglikse skermtyd amper verby is.
                    </p>

                    <button
                      onClick={handleRequestPush}
                      className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition ${
                        notificationsEnabled
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-amber-500 hover:bg-amber-600 text-white shadow-md'
                      }`}
                    >
                      <Bell className="w-4 h-4" />
                      <span>
                        {notificationsEnabled
                          ? 'Stootkennisgewings is Reeds Aktief ✓'
                          : 'Aktiveer Intydse Kennisgewings'}
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
