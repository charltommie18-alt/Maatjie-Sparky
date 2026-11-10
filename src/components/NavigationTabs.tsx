import React from 'react';
import { MessageCircle, BookOpen, Gamepad2, Palette, Mail } from 'lucide-react';
import { speechService } from '../utils/speech';

export type ActiveTab = 'chat' | 'stories' | 'games' | 'art' | 'notes';

interface NavigationTabsProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  unreadNotesCount?: number;
  language?: 'af' | 'en' | 'bilingual';
}

export const NavigationTabs: React.FC<NavigationTabsProps> = ({
  activeTab,
  onSelectTab,
  unreadNotesCount = 1,
  language = 'af'
}) => {
  const tabs = [
    {
      id: 'chat',
      labelAf: 'Gesels',
      labelEn: 'Chat',
      icon: MessageCircle,
      emoji: '🦁',
      color: 'from-amber-400 to-orange-500'
    },
    {
      id: 'stories',
      labelAf: 'Stories',
      labelEn: 'Stories',
      icon: BookOpen,
      emoji: '📖',
      color: 'from-amber-500 to-amber-600'
    },
    {
      id: 'games',
      labelAf: 'Speletjies',
      labelEn: 'Games',
      icon: Gamepad2,
      emoji: '🎮',
      color: 'from-sky-400 to-indigo-500'
    },
    {
      id: 'art',
      labelAf: 'Kuns & Foto',
      labelEn: 'Art & Photo',
      icon: Palette,
      emoji: '🎨',
      color: 'from-pink-400 to-rose-500'
    },
    {
      id: 'notes',
      labelAf: 'Posbus',
      labelEn: 'Mailbox',
      icon: Mail,
      emoji: '💌',
      badge: unreadNotesCount,
      color: 'from-purple-400 to-pink-500'
    }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t-2 border-amber-200 shadow-xl px-2 py-2">
      <div className="max-w-xl mx-auto flex items-center justify-around gap-1">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                speechService.playSound('pop');
                onSelectTab(tab.id as ActiveTab);
              }}
              className={`flex-1 flex flex-col items-center py-1.5 px-1 rounded-2xl transition active:scale-90 relative cursor-pointer ${
                isActive
                  ? 'bg-amber-100 text-amber-950 font-black'
                  : 'text-slate-500 hover:text-slate-800 font-bold'
              }`}
            >
              <div className="relative">
                <span className="text-xl sm:text-2xl">{tab.emoji}</span>
                {tab.badge && tab.badge > 0 ? (
                  <span className="absolute -top-1 -right-2 bg-rose-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                    {tab.badge}
                  </span>
                ) : null}
              </div>
              <span className="text-[11px] sm:text-xs tracking-tight mt-0.5">
                {language === 'en' ? tab.labelEn : tab.labelAf}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
