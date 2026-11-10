import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Send, Volume2, Sparkles, Smile, RefreshCw, Heart, Settings2 } from 'lucide-react';
import { CompanionAvatar } from './CompanionAvatar';
import { ChatMessage, CompanionEmotion, LanguageMode } from '../types';
import { speechService } from '../utils/speech';

interface CompanionChatProps {
  language: LanguageMode;
  childName: string;
  age: number;
  mathLevel: number;
  onAwardStars: (count: number) => void;
  onOpenVoiceSettings?: () => void;
}

export const CompanionChat: React.FC<CompanionChatProps> = ({
  language,
  childName,
  age,
  mathLevel,
  onAwardStars,
  onOpenVoiceSettings
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      sender: 'companion',
      text: language === 'af'
        ? `Aitsa ${childName}! Ek is so bly jy is hier! Waaroor wil jy vandag gesels? Ons kan somme tel, stories vertel of net lekker lag!`
        : `Hello sweet ${childName}! I'm Maatjie, your clever AI buddy! What would you like to talk about today? We can tell stories, do fun math, or talk about our feelings!`,
      afrikaans: `Aitsa ${childName}! Ek is so bly jy is hier!`,
      english: `Hello ${childName}! I am so glad you are here!`,
      emotion: 'joy',
      timestamp: 'Netnou',
      suggestedActions: language === 'af'
        ? ["Kom ons tel sterre! 🧮", "Ek voel baie bly vandag! 😄", "Vertel my 'n leeu storie 🦁", "Ek voel hartseer vandag 🥺"]
        : ["Let's count stars! 🧮", "I feel very happy today! 😄", "Tell me a lion story 🦁", "I feel sad today 🥺"]
    }
  ]);

  const [inputText, setInputText] = useState('');
  const [currentEmotion, setCurrentEmotion] = useState<CompanionEmotion>('joy');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // When childName changes, add an immediate warm welcome message
  useEffect(() => {
    const welcomeText = language === 'af'
      ? `Aitsa ${childName}! Wat 'n pragtige naam! Kom ons gesels en speel lekker saam!`
      : `Hooray ${childName}! What a lovely name! Let's talk and play together!`;

    const newMsg: ChatMessage = {
      id: `rename-${Date.now()}`,
      sender: 'companion',
      text: welcomeText,
      afrikaans: welcomeText,
      english: `Hooray ${childName}! What a lovely name!`,
      emotion: 'proud',
      timestamp: 'Netnou',
      suggestedActions: language === 'af'
        ? ["Kom ons tel sterre! 🧮", "Vertel my 'n grappie! 🎪", "Wat kan ons speel?"]
        : ["Let's count stars! 🧮", "Tell me a joke! 🎪", "What can we play?"]
    };

    setMessages((prev) => [...prev, newMsg]);
    speechService.speak(welcomeText, language);
  }, [childName]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Voice recognition setup
  const startListening = () => {
    if (typeof window === 'undefined') return;
    const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionClass) {
      alert(language === 'af' ? 'Stemherkenning word nie deur jou blaaier ondersteun nie.' : 'Speech recognition is not supported in this browser.');
      return;
    }

    try {
      const recognition = new SpeechRecognitionClass();
      recognition.lang = language === 'af' ? 'af-ZA' : 'en-ZA';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        speechService.playSound('pop');
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputText(transcript);
        handleSendMessage(transcript);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  // Instant pre-cached intelligent responses for common quick taps so response is under 100ms
  const getInstantResponse = (text: string) => {
    const isAf = language === 'af' || language === 'bilingual';
    const lower = text.toLowerCase();

    if (lower.includes('tel sterre') || lower.includes('count stars')) {
      return {
        reply: isAf
          ? `Kom ons tel saam: 1, 2, 3, 4, 5 goue sterretjies! ⭐⭐⭐⭐⭐ As ons nog 2 bysit, hoeveel is 5 + 2, ${childName}?`
          : `Let's count together: 1, 2, 3, 4, 5 golden stars! ⭐⭐⭐⭐⭐ If we add 2 more, how many is 5 + 2, ${childName}?`,
        emotion: 'proud' as CompanionEmotion,
        suggestedActions: isAf ? ["Dit is 7 sterre! ⭐", "Kom ons tel weer", "Nog 'n som!"] : ["It is 7 stars! ⭐", "Count again", "More math!"],
        mathTip: isAf ? "5 + 2 = 7! Jy is 'n wiskunde kampioen!" : "5 + 2 = 7! You are a math champion!"
      };
    }

    if (lower.includes('bly') || lower.includes('happy')) {
      return {
        reply: isAf
          ? `Dis wonderlik ${childName}! Wanneer ons bly voel, skyn ons glimlag soos 'n warm sonnetjie! Kom ons gee 'n hoë vyf! ✋`
          : `That is wonderful ${childName}! When we feel joyful, our smile shines like warm sunshine! High five! ✋`,
        emotion: 'joy' as CompanionEmotion,
        suggestedActions: isAf ? ["Hoë vyf! ✋", "Vertel 'n storie", "Kom ons lag!"] : ["High five! ✋", "Tell a story", "Let's laugh!"],
        eqTip: isAf ? "Om jou vreugde met maats te deel maak almal gelukkig." : "Sharing your joy makes everyone around you happy."
      };
    }

    if (lower.includes('hartseer') || lower.includes('sad')) {
      return {
        reply: isAf
          ? `Ai my liewe ${childName}, dit is heeltemal oukei om soms hartseer te voel. Sit jou handjie op jou borsie en vat 3 sagte blom-asemte saam met my: Asem in... en blaas sag uit. Ek is hier vir jou! ❤️`
          : `Oh sweet ${childName}, it is completely okay to feel sad sometimes. Place your hand on your heart and take 3 gentle belly breaths with me: Inhale... and exhale. I am right here with you! ❤️`,
        emotion: 'calm' as CompanionEmotion,
        suggestedActions: isAf ? ["Vat nog 'n asem 🌸", "Ek soek 'n drukkie 🤗", "Vertel 'n storie"] : ["Take another breath 🌸", "I want a hug 🤗", "Tell a story"],
        eqTip: isAf ? "Alle emosies is welkom. 'n Diep asem help ons hartjie kalmeer." : "All emotions are okay. Deep breathing helps soothe big feelings."
      };
    }

    if (lower.includes('grappie') || lower.includes('joke')) {
      return {
        reply: isAf
          ? `Hoekom het die olifant op die rekenaar gaan sit? Want hy wou op die muis trap! Haha! 🐘🐭`
          : `Why did the elephant sit on the computer? Because he wanted to catch the mouse! Haha! 🐘🐭`,
        emotion: 'joy' as CompanionEmotion,
        suggestedActions: isAf ? ["Nog 'n grappie! 🎪", "Haha baie snaaks", "Kom ons doen somme"] : ["Another joke! 🎪", "Haha so funny", "Let's do math"],
        eqTip: isAf ? "Lag is die beste medisyne vir die hart!" : "Laughter brings warmth and happiness to everyone!"
      };
    }

    return null;
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim() || isLoading) return;

    speechService.playSound('pop');
    setInputText('');

    const userMsg: ChatMessage = {
      id: `child-${Date.now()}`,
      sender: 'child',
      text: text.trim(),
      timestamp: 'Netnou'
    };

    setMessages((prev) => [...prev, userMsg]);

    // Check if we have an instant response for lightning speed
    const instant = getInstantResponse(text.trim());
    if (instant) {
      setCurrentEmotion(instant.emotion);
      const companionMsg: ChatMessage = {
        id: `comp-${Date.now()}`,
        sender: 'companion',
        text: instant.reply,
        afrikaans: instant.reply,
        english: instant.reply,
        emotion: instant.emotion,
        suggestedActions: instant.suggestedActions,
        mathTip: instant.mathTip,
        eqTip: instant.eqTip,
        timestamp: 'Netnou'
      };

      setMessages((prev) => [...prev, companionMsg]);
      setIsSpeaking(true);
      speechService.speak(instant.reply, language, () => {
        setIsSpeaking(false);
      });
      onAwardStars(1);
      return;
    }

    // Otherwise, fast API call with ThinkingLevel.LOW and timeout protection
    setIsLoading(true);
    setCurrentEmotion('thinking');

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000); // 4s timeout guarantee

      const res = await fetch('/api/companion/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          message: text,
          childName,
          age,
          language,
          currentMood: currentEmotion,
          mathLevel
        })
      });
      clearTimeout(timeoutId);

      const data = await res.json();
      const companionEmotion: CompanionEmotion = data.emotion || 'joy';
      setCurrentEmotion(companionEmotion);

      const companionMsg: ChatMessage = {
        id: `comp-${Date.now()}`,
        sender: 'companion',
        text: data.reply,
        afrikaans: data.afrikaans,
        english: data.english,
        emotion: companionEmotion,
        suggestedActions: data.suggestedActions || (language === 'af' ? ["Kom ons tel!", "Vertel nog", "Ek is slim!"] : ["Let's count!", "Tell more", "I'm smart!"]),
        eqTip: data.eqTip,
        mathTip: data.mathTip,
        timestamp: 'Netnou'
      };

      setMessages((prev) => [...prev, companionMsg]);

      setIsSpeaking(true);
      speechService.speak(data.reply, language, () => {
        setIsSpeaking(false);
      });

      onAwardStars(1);
    } catch (err) {
      console.warn('Fast fallback applied:', err);
      const fallbackReply = language === 'af'
        ? `Aitsa ${childName}! Jy praat so mooi! Kom ons tel gou saam tot by 5 en gee mekaar 'n glimlag!`
        : `Hooray ${childName}! You speak so nicely! Let's count quickly to 5 and share a smile!`;

      const fallbackMsg: ChatMessage = {
        id: `comp-fb-${Date.now()}`,
        sender: 'companion',
        text: fallbackReply,
        afrikaans: fallbackReply,
        english: `Hooray ${childName}! Let's count to 5 and share a smile!`,
        emotion: 'joy',
        suggestedActions: language === 'af' ? ["1, 2, 3, 4, 5! ⭐", "Kom ons speel!", "Somme"] : ["1, 2, 3, 4, 5! ⭐", "Let's play!", "Math"],
        timestamp: 'Netnou'
      };

      setMessages((prev) => [...prev, fallbackMsg]);
      setCurrentEmotion('joy');
      speechService.speak(fallbackReply, language);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSpeakMessage = (text: string) => {
    speechService.unlockAudio();
    speechService.setMuted(false);
    setIsSpeaking(true);
    speechService.speak(text, language, () => {
      setIsSpeaking(false);
    });
  };

  return (
    <div className="flex flex-col h-[74vh] bg-white rounded-3xl border-4 border-amber-300 shadow-2xl overflow-hidden">
      {/* Top Companion Stage */}
      <div className="p-3 sm:p-4 bg-gradient-to-r from-amber-100 via-orange-50 to-amber-100 border-b-2 border-amber-200 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <CompanionAvatar
            size="sm"
            emotion={currentEmotion}
            isSpeaking={isSpeaking}
            language={language}
          />
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-fredoka font-black text-slate-800 text-base sm:text-xl">
                Maatjie & Sparky 🦁✨
              </h3>
              <span className="text-[10px] font-bold bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded-full">
                Kits-reaksie ⚡
              </span>
            </div>
            <div className="text-xs text-amber-800 font-bold flex items-center gap-2">
              {speechService.isMuted ? (
                <button
                  onClick={() => {
                    speechService.unlockAudio();
                    speechService.setMuted(false);
                    speechService.speak(language === 'en' ? 'Sound is on!' : 'Klank is aangeskakel! Aitsa!', language);
                  }}
                  className="px-2 py-0.5 bg-rose-100 hover:bg-rose-200 border border-rose-300 text-rose-700 rounded-lg text-[11px] font-black animate-pulse flex items-center gap-1 cursor-pointer"
                >
                  <span>🔇 Klank is gedemp — Klik om aan te skakel 🔊</span>
                </button>
              ) : isSpeaking ? (
                <span className="text-orange-600 animate-pulse">Praat tans met jou... 🔊</span>
              ) : isListening ? (
                <span className="text-emerald-600 animate-pulse">Luister na jou stemmetjie... 🎙️</span>
              ) : (
                <span>Gereed om vinnig te luister en gesels!</span>
              )}
            </div>
          </div>
        </div>

        {/* Emotion quick pills for kid */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          {[
            { label: 'Bly 😄', emotion: 'joy' },
            { label: 'Kalm 🌸', emotion: 'calm' },
            { label: 'Trots 🏆', emotion: 'proud' },
            { label: 'Liefde 💖', emotion: 'love' }
          ].map((pill, idx) => (
            <button
              key={idx}
              onClick={() => {
                setCurrentEmotion(pill.emotion as any);
                speechService.playSound('pop');
              }}
              className="text-xs font-bold px-2 py-1 rounded-full bg-white/90 border border-amber-200 text-amber-900 hover:bg-amber-200 transition cursor-pointer"
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 p-3 sm:p-6 overflow-y-auto space-y-4 bg-amber-50/30">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === 'child' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[85%] sm:max-w-[75%] p-3.5 sm:p-4 rounded-3xl text-sm sm:text-base font-semibold shadow-xs leading-relaxed ${
                msg.sender === 'child'
                  ? 'bg-amber-500 text-white rounded-br-xs'
                  : 'bg-white text-slate-800 border-2 border-amber-200 rounded-bl-xs'
              }`}
            >
              <p>{msg.text}</p>

              {/* Tips */}
              {(msg.eqTip || msg.mathTip) && (
                <div className="mt-2 pt-2 border-t border-amber-100 text-xs font-bold text-amber-800 space-y-0.5">
                  {msg.eqTip && <div>💖 {msg.eqTip}</div>}
                  {msg.mathTip && <div>🧮 {msg.mathTip}</div>}
                </div>
              )}
            </div>

            {/* Read aloud icon for companion messages */}
            {msg.sender === 'companion' && (
              <button
                onClick={() => handleSpeakMessage(msg.text)}
                className="mt-1 ml-2 text-xs text-amber-600 hover:text-amber-800 flex items-center gap-1 font-bold cursor-pointer"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>Lees hardop 🔊</span>
              </button>
            )}

            {/* Suggested quick action buttons */}
            {msg.suggestedActions && msg.suggestedActions.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5 max-w-[85%]">
                {msg.suggestedActions.map((action, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(action)}
                    className="text-xs bg-white hover:bg-amber-100 border border-amber-300 text-amber-900 font-bold px-3 py-1.5 rounded-2xl shadow-xs transition active:scale-95 cursor-pointer"
                  >
                    {action}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 p-3 bg-white rounded-2xl border border-amber-200 text-amber-800 text-xs font-bold w-fit animate-pulse">
            <RefreshCw className="w-4 h-4 animate-spin text-amber-500" />
            <span>Maatjie dink blitsvinnig... ⚡</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div className="p-2.5 sm:p-4 bg-white border-t-2 border-amber-200 shrink-0">
        <div className="flex items-center gap-2">
          {/* Voice Input Microphone */}
          <button
            onClick={startListening}
            className={`p-3 rounded-2xl transition active:scale-90 cursor-pointer ${
              isListening
                ? 'bg-rose-500 text-white animate-pulse ring-4 ring-rose-200'
                : 'bg-amber-100 hover:bg-amber-200 text-amber-900'
            }`}
            title="Praat met Maatjie (Microphone)"
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder={
              language === 'af'
                ? `Tik of praat met Maatjie...`
                : `Type or talk with Maatjie...`
            }
            className="flex-1 p-3 rounded-2xl border-2 border-amber-200 bg-amber-50/50 text-sm font-semibold text-slate-800 focus:outline-hidden focus:border-amber-400"
          />

          <button
            onClick={() => handleSendMessage()}
            disabled={!inputText.trim() || isLoading}
            className="p-3 rounded-2xl bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white shadow-md transition active:scale-95 cursor-pointer"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
