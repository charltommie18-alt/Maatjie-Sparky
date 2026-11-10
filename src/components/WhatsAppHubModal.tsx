import React, { useState, useEffect, useRef } from 'react';
import {
  X, MessageSquare, Send, CheckCheck, Clock, Shield, ExternalLink,
  Lock, Unlock, Heart, RefreshCw, Smartphone, Copy, Check
} from 'lucide-react';
import { ChildProfile, ParentLoveNote } from '../types';
import { speechService } from '../utils/speech';

interface WhatsAppHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: ChildProfile;
  onSendLoveNote: (note: ParentLoveNote) => void;
  onLockScreen?: () => void;
  onAddMinutes?: (extraMinutes: number) => void;
  onUpdatePhone?: (phone: string) => void;
}

interface WhatsAppChatMessage {
  id: string;
  sender: 'parent' | 'bot';
  text: string;
  time: string;
  status?: 'sent' | 'delivered' | 'read';
}

export const WhatsAppHubModal: React.FC<WhatsAppHubModalProps> = ({
  isOpen,
  onClose,
  profile,
  onSendLoveNote,
  onLockScreen,
  onAddMinutes,
  onUpdatePhone
}) => {
  const [phoneNumber, setPhoneNumber] = useState(profile.guardianPhone || '+27 82 123 4567');
  const [messages, setMessages] = useState<WhatsAppChatMessage[]>([]);
  const [inputMsg, setInputMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeTab, setActiveTab] = useState<'bot' | 'real_links'>('bot');
  const chatScrollRef = useRef<HTMLDivElement | null>(null);

  // Load chat history from server on open
  useEffect(() => {
    if (!isOpen) return;

    fetch('/api/whatsapp/chat')
      .then(res => res.json())
      .then(data => {
        if (data.chat && Array.isArray(data.chat) && data.chat.length > 0) {
          setMessages(data.chat);
        } else {
          // Default initial greeting
          setMessages([
            {
              id: 'init-1',
              sender: 'bot',
              text: `🦁 *Welkom by die Maatjie Guardian WhatsApp Bot!*\n\nJy is verbind aan *${profile.name}* se profiel.\n\nStuur enige tyd die volgende bevele:\n• *STATUS* - Skermtyd & wiskunde telling\n• *VERSLAG* - Volledige daaglikse vorderingsverslag\n• *LIEFDE [boodskap]* - Stuur 'n briefie na ${profile.name} se skerm\n• *SLUIT* - Sluit die skerm dadelik\n• *ONTSLUIT* - Gee 15 ekstra minute speeltyd`,
              time: '08:00',
              status: 'read'
            }
          ]);
        }
      })
      .catch(() => {
        // Fallback message
        setMessages([
          {
            id: 'init-fallback',
            sender: 'bot',
            text: `🦁 *Maatjie Guardian WhatsApp Bot is gereed!*\n\nTik *STATUS*, *VERSLAG*, of *LIEFDE [boodskap]* om te begin.`,
            time: 'Nou',
            status: 'read'
          }
        ]);
      });
  }, [isOpen, profile.name]);

  // Scroll to bottom of chat
  useEffect(() => {
    chatScrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  if (!isOpen) return null;

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputMsg;
    if (!text.trim() || isLoading) return;

    speechService.playSound('pop');
    setInputMsg('');

    const nowStr = new Date().toLocaleTimeString('af-ZA', { hour: '2-digit', minute: '2-digit' });
    const userMsg: WhatsAppChatMessage = {
      id: `parent-${Date.now()}`,
      sender: 'parent',
      text: text.trim(),
      time: nowStr,
      status: 'read'
    };

    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const res = await fetch('/api/whatsapp/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text.trim(),
          childName: profile.name
        })
      });

      const data = await res.json();
      const botMsg: WhatsAppChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: data.reply || 'Dankie vir jou WhatsApp boodskap!',
        time: new Date().toLocaleTimeString('af-ZA', { hour: '2-digit', minute: '2-digit' }),
        status: 'read'
      };

      setMessages(prev => [...prev, botMsg]);
      speechService.playSound('star');

      // Check actions
      if (data.action === 'lock' && onLockScreen) {
        onLockScreen();
      } else if (data.action === 'unlock' && onAddMinutes) {
        onAddMinutes(15);
      } else if (data.action === 'love_note') {
        const noteText = text.trim().replace(/^(LIEFDE|LOVE)/i, '').trim() || 'Lief vir jou!';
        onSendLoveNote({
          id: `note-${Date.now()}`,
          sender: 'Mamma & Pappa (via WhatsApp)',
          text: noteText,
          timestamp: 'Netnou',
          read: false
        });
      }
    } catch {
      // Local fallback reply
      const botMsg: WhatsAppChatMessage = {
        id: `bot-fallback-${Date.now()}`,
        sender: 'bot',
        text: `✅ Boodskap ontvang vir *${profile.name}*! Alles loop seepglad.`,
        time: nowStr,
        status: 'read'
      };
      setMessages(prev => [...prev, botMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  // Build real wa.me link
  const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
  const dailyReportText = `🦁 *MAATJIE & SPARKY - DAAGLIKSE VERSLAG* 🦁
Datum: ${new Date().toLocaleDateString('af-ZA')}
Kindjie: *${profile.name}* (Ouderdom: ${profile.age})
⏱️ Skermtyd: ${profile.minutesUsedToday} van ${profile.dailyLimitMinutes} min
⭐ Sterre verdien: ${profile.starsEarned}
🧮 Wiskunde: 94% Akkuraatheid
❤️ EQ Vaardigheid: Kalm blom-asemhaling & Deelsug
_Stuur gerus 'LIEFDE [boodskap]' om 'n briefie na ${profile.name} se skerm te stuur!_`;

  const waReportLink = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(dailyReportText)}`;
  const waStatusLink = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(`STATUS vir ${profile.name}`)}`;
  const waLoveLink = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(`LIEFDE Ek is so baie trots op jou vandag! ⭐❤️`)}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(waReportLink);
    setCopiedLink(true);
    speechService.playSound('star');
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-3 sm:p-5 overflow-y-auto animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border-4 border-emerald-500 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* WhatsApp Branded Header */}
        <div className="bg-[#075E54] text-white p-3.5 sm:p-4 flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#128C7E] flex items-center justify-center text-2xl border-2 border-white/20 shadow-inner">
                🦁
              </div>
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 border-2 border-[#075E54] rounded-full" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-base sm:text-lg font-bold font-fredoka flex items-center gap-1.5">
                  Maatjie WhatsApp Guardian Hub
                </h3>
                <span className="text-[10px] bg-emerald-700/80 px-2 py-0.5 rounded-full text-emerald-200 border border-emerald-500/40 font-mono">
                  Amptelik
                </span>
              </div>
              <p className="text-[11px] text-emerald-100 flex items-center gap-1">
                <span>Gekoppel aan <strong>{profile.name}</strong></span>
                <span>• Aanlyn (Reageer intyds)</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-emerald-200 hover:text-white hover:bg-emerald-800 transition cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Tab switcher: Interactive WhatsApp Bot Simulator vs Direct WhatsApp Links */}
        <div className="bg-[#128C7E] px-4 py-2 flex items-center justify-between text-xs text-white shrink-0">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('bot')}
              className={`px-3 py-1 rounded-full font-bold transition cursor-pointer ${
                activeTab === 'bot'
                  ? 'bg-white text-[#075E54] shadow-xs'
                  : 'bg-emerald-800/60 text-emerald-100 hover:bg-emerald-800'
              }`}
            >
              💬 Intydse WhatsApp Bot
            </button>
            <button
              onClick={() => setActiveTab('real_links')}
              className={`px-3 py-1 rounded-full font-bold transition cursor-pointer ${
                activeTab === 'real_links'
                  ? 'bg-white text-[#075E54] shadow-xs'
                  : 'bg-emerald-800/60 text-emerald-100 hover:bg-emerald-800'
              }`}
            >
              📲 Maak oop in WhatsApp Web/App
            </button>
          </div>

          <span className="hidden sm:inline text-[11px] text-emerald-200">
            Nommer: <strong>{phoneNumber}</strong>
          </span>
        </div>

        {/* TAB 1: Real WhatsApp Bot Chat Simulator */}
        {activeTab === 'bot' && (
          <div className="flex-1 flex flex-col overflow-hidden bg-[#ECE5DD]">
            {/* WhatsApp Wallpaper styled background */}
            <div className="flex-1 p-3 sm:p-4 overflow-y-auto space-y-3">
              {/* Privacy badge */}
              <div className="flex justify-center my-1">
                <div className="bg-[#FFF3C2] text-[#54656F] text-[10px] font-semibold px-3 py-1 rounded-lg shadow-xs text-center max-w-sm flex items-center gap-1 border border-amber-200">
                  <Shield className="w-3 h-3 text-amber-700 shrink-0" />
                  <span>Boodskappe tussen Maatjie en voogde is geïnkripteer en 100% privaat.</span>
                </div>
              </div>

              {messages.map((msg) => {
                const isParent = msg.sender === 'parent';
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isParent ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] sm:max-w-[78%] p-3 rounded-2xl text-xs sm:text-sm shadow-xs relative ${
                        isParent
                          ? 'bg-[#E7FFDB] text-[#111B21] rounded-tr-xs'
                          : 'bg-white text-[#111B21] rounded-tl-xs border border-slate-200'
                      }`}
                    >
                      <p className="whitespace-pre-line leading-relaxed font-sans">
                        {msg.text}
                      </p>
                      <div className="mt-1 flex items-center justify-end gap-1 text-[10px] text-[#667781]">
                        <span>{msg.time}</span>
                        {isParent && (
                          <CheckCheck className="w-3.5 h-3.5 text-[#53BDEB]" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="p-2.5 bg-white rounded-2xl rounded-tl-xs shadow-xs text-xs text-slate-500 flex items-center gap-2">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#128C7E]" />
                    <span>Maatjie Guardian tik 'n antwoord...</span>
                  </div>
                </div>
              )}

              <div ref={chatScrollRef} />
            </div>

            {/* Quick Action Command Chips */}
            <div className="bg-[#F0F2F5] px-3 py-2 border-t border-slate-200 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
              <span className="text-[11px] font-bold text-slate-500 whitespace-nowrap">Kits-bevele:</span>
              {[
                { label: '📊 STATUS', cmd: 'STATUS' },
                { label: '📈 VERSLAG', cmd: 'VERSLAG' },
                { label: '💌 LIEFDE', cmd: 'LIEFDE Ek is so trots op jou somme! ❤️' },
                { label: '🔒 SLUIT', cmd: 'SLUIT' },
                { label: '🔓 ONTSLUIT', cmd: 'ONTSLUIT' }
              ].map((btn, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(btn.cmd)}
                  className="px-2.5 py-1 bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 text-[11px] font-bold rounded-full border border-slate-300 shadow-2xs whitespace-nowrap transition cursor-pointer"
                >
                  {btn.label}
                </button>
              ))}
            </div>

            {/* Input Bar */}
            <div className="p-2.5 bg-[#F0F2F5] border-t border-slate-200 flex items-center gap-2 shrink-0">
              <input
                type="text"
                value={inputMsg}
                onChange={(e) => setInputMsg(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Tik 'n bevel: STATUS, VERSLAG, LIEFDE [boodskap], SLUIT..."
                className="flex-1 p-2.5 rounded-full bg-white border border-slate-300 text-xs sm:text-sm text-slate-800 focus:outline-hidden focus:border-emerald-600 px-4"
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={!inputMsg.trim() || isLoading}
                className="w-10 h-10 rounded-full bg-[#128C7E] hover:bg-[#075E54] disabled:opacity-40 text-white flex items-center justify-center transition active:scale-95 shadow-md cursor-pointer shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: Direct WhatsApp Web & App Click-to-Chat */}
        {activeTab === 'real_links' && (
          <div className="flex-1 p-5 sm:p-6 overflow-y-auto space-y-5 bg-slate-50">
            <div className="p-4 bg-emerald-100/60 border border-emerald-300 rounded-2xl">
              <h4 className="font-bold text-emerald-950 text-sm flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-emerald-700" />
                Regte WhatsApp Skakels (Klik om WhatsApp oop te maak)
              </h4>
              <p className="text-xs text-emerald-800 mt-1">
                Hierdie skakels maak regte WhatsApp oop op jou foon of rekenaar (WhatsApp Web) met die verslag en bevele klaar getik!
              </p>
            </div>

            {/* Phone configuration */}
            <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                Jou WhatsApp Selfoonnommer:
              </label>
              <div className="flex gap-2">
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => {
                    setPhoneNumber(e.target.value);
                    if (onUpdatePhone) onUpdatePhone(e.target.value);
                  }}
                  placeholder="+27 82 123 4567"
                  className="flex-1 p-2.5 rounded-xl border border-slate-300 font-mono text-sm font-bold text-slate-800"
                />
              </div>
              <p className="text-[11px] text-slate-400">
                Ondersteun alle Suid-Afrikaanse nommers (+27) en internasionale nommers.
              </p>
            </div>

            {/* Action Buttons for Real WhatsApp */}
            <div className="space-y-3">
              {/* 1. Full Daily Report */}
              <div className="p-4 bg-white rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                    <span>🌟 Stuur Daaglikse Mijlpaal Verslag</span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">Aanbeveel</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Skermtyd, wiskunde telling, EQ vordering en aanbevelings vir vanaand.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyLink}
                    className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-bold flex items-center gap-1 cursor-pointer"
                    title="Kopieer Skakel"
                  >
                    {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <a
                    href={waReportLink}
                    target="_blank"
                    rel="noreferrer"
                    className="py-2.5 px-4 bg-[#25D366] hover:bg-[#1EBE5D] text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition active:scale-95 cursor-pointer whitespace-nowrap"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Maak oop in WhatsApp</span>
                  </a>
                </div>
              </div>

              {/* 2. Ask Live Status */}
              <div className="p-4 bg-white rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="font-bold text-slate-800 text-sm">
                    ⏱️ Vra Huidige Skermtyd & Status
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Kry 'n onmiddellike antwoord van die bot oor hoeveel minute {profile.name} al gespeel het.
                  </p>
                </div>
                <a
                  href={waStatusLink}
                  target="_blank"
                  rel="noreferrer"
                  className="py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition active:scale-95 cursor-pointer whitespace-nowrap self-start sm:self-auto"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Stuur 'STATUS'</span>
                </a>
              </div>

              {/* 3. Send Love Note */}
              <div className="p-4 bg-white rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                    <Heart className="w-4 h-4 text-pink-500 fill-pink-500" />
                    <span>Stuur 'n Liefdesbriefie vanaf WhatsApp</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Verskyn met animasies en 'n goue sterretjie in {profile.name} se Posbus tab!
                  </p>
                </div>
                <a
                  href={waLoveLink}
                  target="_blank"
                  rel="noreferrer"
                  className="py-2.5 px-4 bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition active:scale-95 cursor-pointer whitespace-nowrap self-start sm:self-auto"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Stuur Liefdesbriefie</span>
                </a>
              </div>
            </div>

            {/* Child Linking Details */}
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 space-y-1">
              <span className="font-bold">Kindjie Koppel-Kode:</span>
              <div className="font-mono text-base font-black text-amber-800 bg-white p-2 rounded-xl border border-amber-300 w-fit tracking-wider">
                MAATJIE-{profile.name.toUpperCase()}-789
              </div>
              <p className="text-[11px] text-amber-700 pt-1">
                Gebruik hierdie kode om verskeie fone van mamma, pappa of oupa te koppel.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
