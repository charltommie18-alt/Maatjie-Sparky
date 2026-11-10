// Enhanced Speech Synthesis & Recognition + Web Audio FX for Maatjie AI Companion
// With proper Afrikaans phonetics, voice fallback routing, unmuting safeguards, and anti-drop keep-alive.

export class SpeechHelper {
  private synth: SpeechSynthesis | null = null;
  private audioCtx: AudioContext | null = null;
  private currentAudio: HTMLAudioElement | null = null;
  private activeUtterances: Set<SpeechSynthesisUtterance> = new Set();
  public voices: SpeechSynthesisVoice[] = [];
  public isSpeaking = false;
  public isMuted = false;
  public selectedVoiceUri: string | null = null;
  // This is a public choice key, never an ElevenLabs voice ID.
  public elevenLabsVoiceKey = 'luna';
  public useElevenLabs = true;
  public customVoiceUrl: string | null = null; // User's recorded or uploaded voice clip
  public voiceMode: 'recorded' | 'elevenlabs' | 'webspeech' = 'elevenlabs';
  public speechRate = 0.95; // Clear natural rate for young children
  public speechPitch = 1.05; // Warm, friendly kid companion pitch

  constructor() {
    if (typeof window !== 'undefined') {
      if ('speechSynthesis' in window) {
        this.synth = window.speechSynthesis;
        this.loadVoices();
        if (this.synth.onvoiceschanged !== undefined) {
          this.synth.onvoiceschanged = () => this.loadVoices();
        }
      }

      // Auto-unlock audio on the first user interaction anywhere in the window
      const unlockHandler = () => {
        this.unlockAudio();
        window.removeEventListener('click', unlockHandler);
        window.removeEventListener('touchstart', unlockHandler);
        window.removeEventListener('keydown', unlockHandler);
      };
      window.addEventListener('click', unlockHandler, { passive: true });
      window.addEventListener('touchstart', unlockHandler, { passive: true });
      window.addEventListener('keydown', unlockHandler, { passive: true });
    }
  }

  // Wakes up any suspended AudioContext or SpeechSynthesis
  public unlockAudio() {
    try {
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      if (this.synth) {
        if (this.synth.paused) {
          this.synth.resume();
        }
      }
    } catch {}
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted) {
      this.stopSpeaking();
    } else {
      this.unlockAudio();
    }
  }

  public loadVoices(): SpeechSynthesisVoice[] {
    if (!this.synth) return [];
    const list = this.synth.getVoices();
    if (list && list.length > 0) {
      this.voices = list;
    }
    return this.voices;
  }

  // Phonetic adaptation for English voice engines reading Afrikaans words
  public adaptAfrikaansForEnglishVoice(text: string): string {
    let result = text;
    const phoneticDictionary: [RegExp, string][] = [
      [/\bbaie\b/gi, 'buy-uh'],
      [/\bmaatjie\b/gi, 'maah-kee'],
      [/\bmaatjies\b/gi, 'maah-kees'],
      [/\basseblief\b/gi, 'ah-suh-bleef'],
      [/\bdankie\b/gi, 'dahn-kee'],
      [/\bbly\b/gi, 'blay'],
      [/\bblydskap\b/gi, 'blay-skup'],
      [/\bkuier\b/gi, 'kay-er'],
      [/\bkwaad\b/gi, 'kwaht'],
      [/\bhartseer\b/gi, 'huht-see-er'],
      [/\bleeu\b/gi, 'lee-oo'],
      [/\bleeus\b/gi, 'lee-oos'],
      [/\bolifant\b/gi, 'oh-lee-fuhnt'],
      [/\bolifantjie\b/gi, 'oh-lee-fahn-kee'],
      [/\bhaas\b/gi, 'hahs'],
      [/\bhaasie\b/gi, 'hah-see'],
      [/\bskilpad\b/gi, 'skul-puht'],
      [/\bvriendelik\b/gi, 'freen-duh-lik'],
      [/\bvriendelikheid\b/gi, 'freen-duh-luhk-hayt'],
      [/\bblommetjie\b/gi, 'blaw-muh-kee'],
      [/\bblom-asem\b/gi, 'blawm-ah-sim'],
      [/\bkersie\b/gi, 'kehr-see'],
      [/\bsomme\b/gi, 'saw-muh'],
      [/\bsterretjie\b/gi, 'steh-ruh-kee'],
      [/\bsterretjies\b/gi, 'steh-ruh-kees'],
      [/\btrots\b/gi, 'trawts'],
      [/\bsoet\b/gi, 'soot'],
      [/\bslaap\b/gi, 'slahp'],
      [/\bslaaptyd\b/gi, 'slahp-tayt'],
      [/\bgelukkig\b/gi, 'khuh-luh-kukh'],
      [/\bhoe voel\b/gi, 'hoo fool'],
      [/\bpraat\b/gi, 'praht'],
      [/\bluister\b/gi, 'lay-ster'],
      [/\bvrolik\b/gi, 'froo-lik'],
      [/\bdapper\b/gi, 'duh-pur'],
      [/\bogies\b/gi, 'oo-gees'],
      [/\bhartjie\b/gi, 'huht-kee'],
      [/\btoring\b/gi, 'too-ring'],
      [/\bblokke\b/gi, 'blaw-kuh'],
      [/\bkom ons\b/gi, 'kawm awns'],
      [/\bvandag\b/gi, 'fuhn-duhkh'],
      [/\bweer\b/gi, 'vee-er'],
      [/\bmooi so\b/gi, 'moy soo'],
      [/\blekker\b/gi, 'leh-kur'],
      [/\baitsa\b/gi, 'eye-tsah'],
      [/\bhoera\b/gi, 'hoo-rah'],
      [/\bspeel\b/gi, 'spee-uhl'],
      [/\bspeelgoed\b/gi, 'spee-uhl-khoot'],
      [/\bdeel\b/gi, 'dee-uhl'],
      [/\bdeelsug\b/gi, 'dee-uhl-sukh'],
      [/\buitdagings\b/gi, 'ayt-dah-khings'],
      [/\bgeduld\b/gi, 'khuh-dult'],
      [/\bkoekies\b/gi, 'koo-kees'],
      [/\bwiskunde\b/gi, 'vis-koon-duh'],
      [/\bvorms\b/gi, 'fawrms'],
      [/\bdriehoek\b/gi, 'dree-hook'],
      [/\bvierkant\b/gi, 'feer-kuhnt'],
      [/\bsirkel\b/gi, 'ser-kul'],
      [/\breghoek\b/gi, 'rekh-hook'],
    ];

    for (const [pattern, replacement] of phoneticDictionary) {
      result = result.replace(pattern, replacement);
    }
    return result;
  }

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }

  // Play synthetic pleasant sound effects for kids
  public playSound(type: 'star' | 'pop' | 'success' | 'breathe' | 'gentle') {
    if (this.isMuted) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'star') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(587.33, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.15);
        osc.frequency.exponentialRampToValueAtTime(1174.66, now + 0.3);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
      } else if (type === 'pop') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.08);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
        osc.start(now);
        osc.stop(now + 0.09);
      } else if (type === 'success') {
        [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
          const subOsc = ctx.createOscillator();
          const subGain = ctx.createGain();
          subOsc.type = 'sine';
          subOsc.frequency.setValueAtTime(freq, now + idx * 0.09);
          subGain.gain.setValueAtTime(0.18, now + idx * 0.09);
          subGain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.09 + 0.3);
          subOsc.connect(subGain);
          subGain.connect(ctx.destination);
          subOsc.start(now + idx * 0.09);
          subOsc.stop(now + idx * 0.09 + 0.35);
        });
      } else if (type === 'breathe') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(260, now + 2);
        gain.gain.setValueAtTime(0.01, now);
        gain.gain.linearRampToValueAtTime(0.15, now + 1);
        gain.gain.linearRampToValueAtTime(0.01, now + 2);
        osc.start(now);
        osc.stop(now + 2);
      } else {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
      }
    } catch {
      // AudioContext fallback
    }
  }

  // Determine best voice for Afrikaans or English
  public getBestVoice(lang: 'af' | 'en' | 'bilingual' = 'af'): { voice: SpeechSynthesisVoice | null; isNativeOrDutch: boolean } {
    if (!this.synth || this.voices.length === 0) {
      this.loadVoices();
    }

    // 1. If user explicitly picked a voice
    if (this.selectedVoiceUri) {
      const custom = this.voices.find(v => v.voiceURI === this.selectedVoiceUri);
      if (custom) {
        const isAfOrNl = custom.lang.toLowerCase().startsWith('af') || custom.lang.toLowerCase().startsWith('nl');
        return { voice: custom, isNativeOrDutch: isAfOrNl };
      }
    }

    const isAf = lang === 'af' || lang === 'bilingual';

    if (isAf) {
      // Priority 1: Direct native Afrikaans voice
      const nativeAf = this.voices.find(v =>
        v.lang.toLowerCase().startsWith('af') ||
        v.name.toLowerCase().includes('afrikaans')
      );
      if (nativeAf) return { voice: nativeAf, isNativeOrDutch: true };

      // Priority 2: Dutch / Flemish voice (Dutch phonetics are ~95% identical to Afrikaans)
      const dutchVoice = this.voices.find(v =>
        v.lang.toLowerCase().startsWith('nl') ||
        v.name.toLowerCase().includes('nederlands') ||
        v.name.toLowerCase().includes('dutch')
      );
      if (dutchVoice) return { voice: dutchVoice, isNativeOrDutch: true };

      // Priority 3: South African English voice
      const saVoice = this.voices.find(v =>
        v.lang.toLowerCase().includes('en-za') ||
        v.name.toLowerCase().includes('south africa')
      );
      if (saVoice) return { voice: saVoice, isNativeOrDutch: false };

      // Priority 4: Natural English voice
      const friendlyEn = this.voices.find(v =>
        v.lang.toLowerCase().startsWith('en') &&
        (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Ava'))
      );
      if (friendlyEn) return { voice: friendlyEn, isNativeOrDutch: false };
    }

    // English mode
    const enVoice = this.voices.find(v =>
      v.lang.toLowerCase().startsWith('en') &&
      (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Ava'))
    ) || this.voices.find(v => v.lang.toLowerCase().startsWith('en')) || this.voices[0] || null;

    return { voice: enVoice, isNativeOrDutch: false };
  }

  // Stop any active audio or speech
  public stopSpeaking() {
    if (this.currentAudio) {
      try {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
      } catch {}
      this.currentAudio = null;
    }
    if (this.synth) {
      try {
        this.synth.cancel();
      } catch {}
    }
    this.activeUtterances.clear();
    this.isSpeaking = false;
  }

  // Speak text: tries recorded clip, server-configured ElevenLabs voice, or resilient on-device Web Speech
  public async speak(rawText: string, lang: 'af' | 'en' | 'bilingual' = 'af', onEnd?: () => void) {
    if (this.isMuted) {
      if (onEnd) onEnd();
      return;
    }

    this.stopSpeaking();
    this.unlockAudio();

    // Clean emojis, symbols and markdown formatting
    const cleanedText = rawText
      .replace(/[*_#`~]/g, '')
      .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
      .trim();

    if (!cleanedText) {
      if (onEnd) onEnd();
      return;
    }

    // 0. If user selected a custom recorded/uploaded voice clip
    if (this.voiceMode === 'recorded' && this.customVoiceUrl) {
      const played = await this.playAudioUrl(this.customVoiceUrl, onEnd);
      // If the custom clip played successfully, we are done!
      if (played) return;
      // If custom clip failed to play (e.g. invalid format or blocked), fall through to Web Speech so it's never silent!
      console.warn('Custom recorded clip playback failed, falling back to speech synthesis');
    }

    // 1. Try ElevenLabs TTS, allowing time for network and synthesis.
    if (this.useElevenLabs && this.voiceMode !== 'webspeech') {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        const response = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            text: cleanedText,
            voiceKey: this.elevenLabsVoiceKey || 'luna'
          })
        });
        clearTimeout(timeoutId);

        const data = await response.json();

        if (data.success && data.audioUrl) {
          const played = await this.playAudioUrl(data.audioUrl, onEnd);
          if (played) return;
        }
      } catch (err) {
        // Network slow, aborted or no key: seamlessly fall back without freezing
      }
    }

    // 2. Guaranteed Fallback: Resilient Web Speech Synthesis
    this.speakWebSpeech(cleanedText, lang, onEnd);
  }

  // Play direct audio URL (e.g. uploaded voice clip, recorded voice)
  public async playAudioUrl(url: string, onEnd?: () => void): Promise<boolean> {
    if (this.isMuted) {
      if (onEnd) onEnd();
      return false;
    }

    this.stopSpeaking();
    this.unlockAudio();

    return new Promise<boolean>((resolve) => {
      try {
        this.isSpeaking = true;
        const audio = new Audio();
        audio.src = url;
        this.currentAudio = audio;

        audio.onended = () => {
          this.isSpeaking = false;
          this.currentAudio = null;
          if (onEnd) onEnd();
          resolve(true);
        };

        audio.onerror = (e) => {
          console.warn('Audio play error:', e);
          this.isSpeaking = false;
          this.currentAudio = null;
          resolve(false);
        };

        audio.play().catch((err) => {
          console.warn('audio.play() rejected:', err);
          this.isSpeaking = false;
          this.currentAudio = null;
          resolve(false);
        });
      } catch (err) {
        this.isSpeaking = false;
        this.currentAudio = null;
        resolve(false);
      }
    });
  }

  // Web Speech Synthesis with Chromium keep-alive and anti-cancel delay
  public speakWebSpeech(text: string, lang: 'af' | 'en' | 'bilingual' = 'af', onEnd?: () => void) {
    if (this.isMuted) {
      this.isSpeaking = false;
      if (onEnd) onEnd();
      return;
    }

    if (!this.synth) {
      this.isSpeaking = false;
      if (onEnd) onEnd();
      return;
    }

    try {
      this.unlockAudio();

      // Ensure voices are fetched
      if (this.voices.length === 0) {
        this.loadVoices();
      }

      const { voice, isNativeOrDutch } = this.getBestVoice(lang);

      let phoneticText = text;
      // If language is Afrikaans and voice is English, apply phonetic adaptation so it sounds like genuine Afrikaans!
      if ((lang === 'af' || lang === 'bilingual') && !isNativeOrDutch) {
        phoneticText = this.adaptAfrikaansForEnglishVoice(text);
      }

      const utterance = new SpeechSynthesisUtterance(phoneticText);

      // Explicitly set language so synthesis engine never drops it
      utterance.lang = (lang === 'af' || lang === 'bilingual') ? 'af-ZA' : 'en-US';

      if (voice) {
        utterance.voice = voice;
        utterance.lang = voice.lang || utterance.lang;
      }

      utterance.rate = this.speechRate;
      utterance.pitch = this.speechPitch;

      // Keep utterance in memory so Chromium garbage collector does not kill it mid-speech
      this.activeUtterances.add(utterance);

      utterance.onstart = () => {
        this.isSpeaking = true;
      };

      utterance.onend = () => {
        this.activeUtterances.delete(utterance);
        this.isSpeaking = false;
        if (onEnd) onEnd();
      };

      utterance.onerror = (e) => {
        console.warn('Speech synthesis utterance error:', e);
        this.activeUtterances.delete(utterance);
        this.isSpeaking = false;
        if (onEnd) onEnd();
      };

      // Slight tick so any previous cancel event finishes without dropping the new utterance
      setTimeout(() => {
        if (!this.synth) return;
        if (this.synth.paused) {
          this.synth.resume();
        }
        this.synth.speak(utterance);
      }, 15);
    } catch (err) {
      console.warn('Web Speech error:', err);
      this.isSpeaking = false;
      if (onEnd) onEnd();
    }
  }

  public setVoiceKey(voiceKey: string) {
    this.elevenLabsVoiceKey = voiceKey;
  }

  public setCustomVoice(url: string | null, mode: 'recorded' | 'elevenlabs' | 'webspeech' = 'recorded') {
    this.customVoiceUrl = url;
    this.voiceMode = mode;
  }

  public setVoiceMode(mode: 'recorded' | 'elevenlabs' | 'webspeech') {
    this.voiceMode = mode;
  }
}

export const speechService = new SpeechHelper();
