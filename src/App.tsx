/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { KidHeader } from './components/KidHeader';
import { NavigationTabs, ActiveTab } from './components/NavigationTabs';
import { CompanionChat } from './components/CompanionChat';
import { StorybookReader } from './components/StorybookReader';
import { GamesArcade } from './components/GamesArcade';
import { DrawingCanvas } from './components/DrawingCanvas';
import { LoveNotesView } from './components/LoveNotesView';
import { ParentPortal } from './components/ParentPortal';
import { BedtimeModal } from './components/BedtimeModal';
import { EditProfileModal } from './components/EditProfileModal';
import { WhatsAppHubModal } from './components/WhatsAppHubModal';
import { ChildProfile, InteractiveStory, ParentLoveNote, VaultMedia, LanguageMode } from './types';
import { speechService } from './utils/speech';

export default function App() {
  // 1. Profile State with local storage persistence
  const [profile, setProfile] = useState<ChildProfile>(() => {
    const saved = localStorage.getItem('maatjie_profile_v1');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // use default
      }
    }
    return {
      id: 'child-1',
      name: 'Liam',
      age: 6,
      avatar: '🦁',
      language: 'af',
      mathLevel: 1,
      starsEarned: 15,
      dailyLimitMinutes: 30,
      minutesUsedToday: 0,
      bedtimeHour: 20,
      bedtimeMinute: 0,
      guardianPin: '1234',
      guardianPhone: '+27 82 123 4567',
      isEncrypted: true,
      autoLockEnabled: false // Disabled by default so app never freezes or auto-locks while user is busy
    };
  });

  // Save profile to local storage whenever updated
  useEffect(() => {
    localStorage.setItem('maatjie_profile_v1', JSON.stringify(profile));
  }, [profile]);

  // Synchronize speechService with active companion voice
  useEffect(() => {
    speechService.setCustomVoice(
      profile.activeCustomVoiceUrl || null,
      profile.selectedVoiceType || 'elevenlabs'
    );
    if (profile.elevenLabsVoiceKey) speechService.setVoiceKey(profile.elevenLabsVoiceKey);
  }, [profile.selectedVoiceType, profile.activeCustomVoiceUrl, profile.elevenLabsVoiceKey]);

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<ActiveTab>('chat');

  // Modals state
  const [isGuardianPortalOpen, setIsGuardianPortalOpen] = useState(false);
  const [isWhatsAppOpen, setIsWhatsAppOpen] = useState(false);
  const [isBedtimeModalOpen, setIsBedtimeModalOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [bedtimeReason, setBedtimeReason] = useState<'limit' | 'bedtime'>('limit');
  const [isMuted, setIsMuted] = useState(false);

  // Love Notes state
  const [parentNotes, setParentNotes] = useState<ParentLoveNote[]>([
    {
      id: 'note-1',
      sender: 'Mamma & Pappa (via WhatsApp)',
      text: 'Liewe Liam, ons is so baie trots op jou dat jy vandag jou speelgoed gedeel het! Jy is ons dapper sterretjie! ⭐❤️',
      timestamp: 'Vandag, 14:20',
      read: false
    }
  ]);

  // Vault media items
  const [vaultMedia, setVaultMedia] = useState<VaultMedia[]>([
    {
      id: 'media-1',
      childId: 'child-1',
      title: 'Liam se Eerste Somme! (Math Master)',
      url: 'https://images.unsplash.com/photo-1596495578065-6e0763fa1178?auto=format&fit=crop&w=600&q=80',
      type: 'image',
      caption: 'Liam het 5 sterre verdien deur vorms te pas! ⭐⭐⭐⭐⭐',
      date: '2026-11-08',
      guardianApproved: true,
      tags: ['Wiskunde', 'Trots']
    },
    {
      id: 'media-2',
      childId: 'child-1',
      title: 'Emosie Tekening: Vrolike Leeu',
      url: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=600&q=80',
      type: 'image',
      caption: 'Tekening van hoe gelukkig voel: Geel sonnetjies en glimlaggende leeus!',
      date: '2026-11-09',
      guardianApproved: true,
      tags: ['Kuns', 'EQ']
    }
  ]);

  // Initial curated stories with EQ and Math embedded
  const [stories] = useState<InteractiveStory[]>([
    {
      id: 'story-1',
      titleAf: 'Die Klein Olifantjie wat Geler het om Asem te Haal',
      titleEn: 'The Little Elephant Who Learned to Breathe',
      eqTheme: 'Emosie Regulering & Kalmte (Calmness)',
      mathConcept: 'Tel tot 5 & Vorms (Counting to 5 & Shapes)',
      badgeEarned: 'Kalmte Kampioen 🌸',
      scenes: [
        {
          sceneNumber: 1,
          textAf: `Klein Olifantjie Ollie het met kleurvolle blokke ’n hoë toring van 5 blokke gebou: 1, 2, 3, 4, 5! Skielik het die wind gewaai en *KABOEM!* Die toring val om. Ollie se gesiggie word rooi en sy hartjie klop vinnig van frustrasie.`,
          textEn: `Little Elephant Ollie built a high tower of 5 blocks: 1, 2, 3, 4, 5! Suddenly the wind blew and *CRASH!* The tower fell down. Ollie's face turned red and his heart beat fast with frustration.`,
          questionAf: `Wat kan Ollie doen om sy hartjie te help kalmeer?`,
          questionEn: `What can Ollie do to help his heart calm down?`,
          choices: [
            {
              textAf: `Vat sy slurp en haal 3 groot blom-asemte in 🌸🌬️`,
              textEn: `Use his trunk to take 3 big flower breaths 🌸🌬️`,
              isCorrectOrPositive: true,
              outcomeNote: 'Sy hartjie klop weer rustig en hy voel baie beter.'
            },
            {
              textAf: `Skop al die blokke in die bosse in 💥`,
              textEn: `Kick all the blocks into the bushes 💥`,
              isCorrectOrPositive: false,
              outcomeNote: 'Dit maak sy toontjie seer en los nie die toring op nie.'
            }
          ]
        },
        {
          sceneNumber: 2,
          textAf: `Ollie blaas saggies uit soos ’n rustige briesie. "Dit voel beter!" sê hy. Sy maatjie die apie kom aangedraf met 3 nuwe driehoek-blokke. Ollie het 2 vierkantige blokke.`,
          textEn: `Ollie blew out softly like a gentle breeze. "That feels better!" he said. His friend Monkey jogged over with 3 new triangle blocks. Ollie had 2 square blocks.`,
          questionAf: `Hoeveel blokke het hulle as hulle saambou? (3 + 2 = ?)`,
          questionEn: `How many blocks do they have if they build together? (3 + 2 = ?)`,
          choices: [
            {
              textAf: `5 stewige blokke! (3 + 2 = 5) 🧱`,
              textEn: `5 sturdy blocks! (3 + 2 = 5) 🧱`,
              isCorrectOrPositive: true
            },
            {
              textAf: `4 blokke`,
              textEn: `4 blocks`,
              isCorrectOrPositive: false
            }
          ]
        },
        {
          sceneNumber: 3,
          textAf: `Presies 5! Hulle bou saam die mooiste en sterkste kasteel in die hele bos. Ollie het geleer: As dinge skeefloop, vat ons net asem en probeer weer saam!`,
          textEn: `Exactly 5! Together they built the most beautiful and sturdy castle in the whole forest. Ollie learned: When things go wrong, we just breathe and try again together!`,
          questionAf: `Hoe voel Ollie se hartjie aan die einde van die dag?`,
          questionEn: `How does Ollie feel at the end of the day?`,
          choices: [
            {
              textAf: `Trots, vreedsaam en gelukkig! ❤️`,
              textEn: `Proud, peaceful and happy! ❤️`,
              isCorrectOrPositive: true
            },
            {
              textAf: `Hartseer`,
              textEn: `Sad`,
              isCorrectOrPositive: false
            }
          ]
        }
      ]
    },
    {
      id: 'story-2',
      titleAf: 'Haasie Huppel se Ster-Koekies',
      titleEn: 'Bunny Hops and the Star Cookies',
      eqTheme: 'Deelsug & Vrygewigheid (Generosity)',
      mathConcept: 'Halvering & Ewe Getalle (4 gedeel deur 2)',
      badgeEarned: 'Deelsug Sterretjie ⭐',
      scenes: [
        {
          sceneNumber: 1,
          textAf: `Haasie Huppel het 4 goue ster-koekies gebak. Hulle het so lekker geruik na heuning en kaneel! Skilpad Sam kom kuier met ’n knorrende magie.`,
          textEn: `Bunny Hops baked 4 golden star cookies. They smelled delicious like honey and cinnamon! Sam the Turtle visited with a rumbling tummy.`,
          questionAf: `Hoeveel koekies moet Haasie vir Sam gee sodat hulle ewe veel het?`,
          questionEn: `How many cookies should Bunny give Sam so they have equal amounts?`,
          choices: [
            {
              textAf: `Gee 2 koekies vir Sam (4 - 2 = 2 vir elkeen) 🍪🍪`,
              textEn: `Give 2 cookies to Sam (4 - 2 = 2 each) 🍪🍪`,
              isCorrectOrPositive: true
            },
            {
              textAf: `Eet al 4 vinnig alleen op`,
              textEn: `Eat all 4 quickly alone`,
              isCorrectOrPositive: false
            }
          ]
        },
        {
          sceneNumber: 2,
          textAf: `Sam se ogies het geblink van blydskap! "Dankie my maatjie!" Sam gee toe vir Haasie 2 sappige aarbeie as ’n dankie-geskenk.`,
          textEn: `Sam's eyes sparkled with joy! "Thank you my friend!" Sam then gave Bunny 2 juicy strawberries as a thank you gift.`,
          questionAf: `Wat het Haasie geleer oor deel?`,
          questionEn: `What did Bunny learn about sharing?`,
          choices: [
            {
              textAf: `Wanneer ons deel, word albei harte warm en vol vrolikheid! 💖`,
              textEn: `When we share, both hearts become warm and full of joy! 💖`,
              isCorrectOrPositive: true
            },
            {
              textAf: `Om nooit weer te deel nie`,
              textEn: `To never share again`,
              isCorrectOrPositive: false
            }
          ]
        }
      ]
    }
  ]);

  // Screen time tracking & Bedtime checker (only active if autoLockEnabled is true)
  useEffect(() => {
    if (!profile.autoLockEnabled) {
      return;
    }

    const timer = setInterval(() => {
      const now = new Date();
      const currentHour = now.getHours();

      // Check bedtime (only between bedtimeHour and 6:00 in the morning)
      if (currentHour >= profile.bedtimeHour || currentHour < 6) {
        setBedtimeReason('bedtime');
        setIsBedtimeModalOpen(true);
      }

      // Increment usage if auto-lock is active
      setProfile((prev) => {
        if (!prev.autoLockEnabled) return prev;
        const nextUsed = prev.minutesUsedToday + 1;
        if (nextUsed >= prev.dailyLimitMinutes) {
          setBedtimeReason('limit');
          setIsBedtimeModalOpen(true);
        }
        return { ...prev, minutesUsedToday: nextUsed };
      });
    }, 60000); // every 1 min

    return () => clearInterval(timer);
  }, [profile.bedtimeHour, profile.dailyLimitMinutes, profile.autoLockEnabled]);

  const remainingMinutes = Math.max(0, profile.dailyLimitMinutes - profile.minutesUsedToday);

  // App unlock handlers so users are never trapped or frozen
  const handleUnlockApp = (extraMinutes = 30) => {
    setIsBedtimeModalOpen(false);
    setIsGuardianPortalOpen(false);
    setProfile((prev) => ({
      ...prev,
      minutesUsedToday: 0,
      dailyLimitMinutes: Math.max(prev.dailyLimitMinutes, 30) + extraMinutes
    }));
    speechService.playSound('success');
  };

  const handleDisableAutoLock = () => {
    setIsBedtimeModalOpen(false);
    setIsGuardianPortalOpen(false);
    setProfile((prev) => ({
      ...prev,
      autoLockEnabled: false,
      minutesUsedToday: 0
    }));
    speechService.playSound('star');
  };

  const handleAwardStars = (count: number) => {
    setProfile((prev) => ({
      ...prev,
      starsEarned: prev.starsEarned + count
    }));
  };

  const handleUpdateLanguage = (lang: LanguageMode) => {
    setProfile((prev) => ({ ...prev, language: lang }));
  };

  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    speechService.setMuted(nextMuted);
    if (!nextMuted) {
      speechService.playSound('success');
      speechService.speak(
        profile.language === 'en'
          ? `Sound is on! Hello ${profile.name}!`
          : `Klank is weer aan! Hallo ${profile.name}! Ek praat lekker saam met jou!`,
        profile.language
      );
    }
  };

  const handleSaveVaultMedia = (media: Omit<VaultMedia, 'id'>) => {
    const newMedia: VaultMedia = {
      ...media,
      id: `media-${Date.now()}`
    };
    setVaultMedia((prev) => [newMedia, ...prev]);
  };

  const handleApproveMedia = (id: string, approved: boolean) => {
    setVaultMedia((prev) =>
      prev.map((item) => (item.id === id ? { ...item, guardianApproved: approved } : item))
    );
  };

  const handleSendLoveNote = (note: ParentLoveNote) => {
    setParentNotes((prev) => [note, ...prev]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-orange-50/40 to-amber-100/60 pb-24 text-slate-800">
      {/* Kid Header */}
      <KidHeader
        profile={profile}
        onUpdateLanguage={handleUpdateLanguage}
        onOpenGuardianPortal={() => setIsGuardianPortalOpen(true)}
        onOpenEditProfile={() => setIsEditProfileOpen(true)}
        onOpenWhatsApp={() => setIsWhatsAppOpen(true)}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        remainingMinutes={remainingMinutes}
      />

      {/* Main Content Arena */}
      <main className="max-w-4xl mx-auto px-3 sm:px-6 pt-4 sm:pt-6">
        {activeTab === 'chat' && (
          <CompanionChat
            language={profile.language}
            childName={profile.name}
            age={profile.age}
            mathLevel={profile.mathLevel}
            onAwardStars={handleAwardStars}
          />
        )}

        {activeTab === 'stories' && (
          <StorybookReader
            initialStories={stories}
            language={profile.language}
            childName={profile.name}
            age={profile.age}
            onAwardStars={handleAwardStars}
          />
        )}

        {activeTab === 'games' && (
          <GamesArcade
            language={profile.language}
            childName={profile.name}
            age={profile.age}
            mathLevel={profile.mathLevel}
            onAwardStars={handleAwardStars}
          />
        )}

        {activeTab === 'art' && (
          <DrawingCanvas
            onSaveMedia={handleSaveVaultMedia}
            language={profile.language}
          />
        )}

        {activeTab === 'notes' && (
          <LoveNotesView
            notes={parentNotes}
            language={profile.language}
            childName={profile.name}
            onOpenWhatsApp={() => setIsWhatsAppOpen(true)}
          />
        )}
      </main>

      {/* Navigation Tabs (Fixed Bottom) */}
      <NavigationTabs
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        unreadNotesCount={parentNotes.filter((n) => !n.read).length}
        language={profile.language}
      />

      {/* Guardian / Parent Controls Portal */}
      <ParentPortal
        isOpen={isGuardianPortalOpen}
        onClose={() => {
          setIsGuardianPortalOpen(false);
          // Ensure closing the portal never traps the user in a locked screen
          setIsBedtimeModalOpen(false);
        }}
        profile={profile}
        onUpdateProfile={(updated) => setProfile((prev) => ({ ...prev, ...updated }))}
        vaultMedia={vaultMedia}
        onApproveMedia={handleApproveMedia}
        onSendLoveNote={handleSendLoveNote}
        onOpenWhatsAppHub={() => {
          setIsGuardianPortalOpen(false);
          setIsWhatsAppOpen(true);
        }}
        onUnlockApp={handleUnlockApp}
      />

      {/* WhatsApp Guardian Hub Modal */}
      <WhatsAppHubModal
        isOpen={isWhatsAppOpen}
        onClose={() => setIsWhatsAppOpen(false)}
        profile={profile}
        onSendLoveNote={handleSendLoveNote}
        onLockScreen={() => {
          setIsWhatsAppOpen(false);
          setBedtimeReason('limit');
          setIsBedtimeModalOpen(true);
        }}
        onAddMinutes={(extraMinutes) => {
          setProfile((prev) => ({
            ...prev,
            dailyLimitMinutes: (prev.dailyLimitMinutes || 30) + extraMinutes,
            minutesUsedToday: 0
          }));
          setIsBedtimeModalOpen(false);
          speechService.playSound('star');
        }}
        onUpdatePhone={(phone) => {
          setProfile((prev) => ({ ...prev, guardianPhone: phone }));
        }}
      />

      {/* Bedtime / Usage Limit Lock Screen */}
      <BedtimeModal
        isOpen={isBedtimeModalOpen}
        onOpenParentPin={() => {
          setIsBedtimeModalOpen(false);
          setIsGuardianPortalOpen(true);
        }}
        onUnlockApp={handleUnlockApp}
        onDisableAutoLock={handleDisableAutoLock}
        guardianPin={profile.guardianPin || '1234'}
        reason={bedtimeReason}
        language={profile.language}
      />

      {/* Edit Child Profile & Name Modal */}
      <EditProfileModal
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
        profile={profile}
        onSaveProfile={(updated) => setProfile((prev) => ({ ...prev, ...updated }))}
      />
    </div>
  );
}
