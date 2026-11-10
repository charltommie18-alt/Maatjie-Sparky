export type LanguageMode = 'af' | 'en' | 'bilingual';

export type CompanionEmotion = 'joy' | 'thinking' | 'proud' | 'calm' | 'surprised' | 'love';

export interface ChildProfile {
  id: string;
  name: string;
  age: number;
  avatar: string; // emoji or character style
  language: LanguageMode;
  mathLevel: number; // 1 to 5
  starsEarned: number;
  dailyLimitMinutes: number;
  minutesUsedToday: number;
  bedtimeHour: number; // e.g., 20 (8 PM)
  bedtimeMinute: number;
  guardianPin: string; // 4-digit PIN
  guardianPhone: string; // WhatsApp phone number e.g., +27821234567
  guardianEmail?: string;
  autoLockEnabled?: boolean; // When false, screen never auto-locks so parent/child can play without interruption
  uploadedVoiceClips?: { id: string; name: string; url: string; date: string; category?: string }[];
  selectedVoiceType?: 'elevenlabs' | 'recorded' | 'webspeech';
  /** Safe public selection key; actual voice IDs remain server-side. */
  elevenLabsVoiceKey?: string;
  /** @deprecated Legacy persisted field; ignored to prevent exposing voice IDs. */
  elevenLabsVoiceId?: never;
  selectedVoiceClipId?: string;
  activeCustomVoiceUrl?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'child' | 'companion';
  text: string;
  afrikaans?: string;
  english?: string;
  emotion?: CompanionEmotion;
  timestamp: string;
  suggestedActions?: string[];
  eqTip?: string;
  mathTip?: string;
  audioSpoken?: boolean;
}

export interface StoryChoice {
  textAf: string;
  textEn: string;
  isCorrectOrPositive?: boolean;
  outcomeNote?: string;
  mathOutcome?: string;
}

export interface StoryScene {
  sceneNumber: number;
  textAf: string;
  textEn: string;
  questionAf: string;
  questionEn: string;
  choices: StoryChoice[];
  illustration?: string;
}

export interface InteractiveStory {
  id: string;
  titleAf: string;
  titleEn: string;
  eqTheme: string;
  mathConcept: string;
  scenes: StoryScene[];
  badgeEarned: string;
  coverImage?: string;
}

export interface GameChallenge {
  id: string;
  category: 'math' | 'eq' | 'calm' | 'kindness';
  titleAf: string;
  titleEn: string;
  instructionAf: string;
  instructionEn: string;
  questionAf: string;
  questionEn: string;
  visualEmoji?: string;
  options: {
    text: string;
    isCorrect: boolean;
    feedbackAf: string;
    feedbackEn: string;
  }[];
  starsAwarded: number;
}

export interface VaultMedia {
  id: string;
  childId: string;
  title: string;
  url: string;
  type: 'image' | 'video' | 'drawing';
  caption: string;
  date: string;
  guardianApproved: boolean;
  tags: string[];
}

export interface ParentLoveNote {
  id: string;
  sender: string;
  text: string;
  timestamp: string;
  read: boolean;
  audioUrl?: string | null;
}

export interface WhatsAppLog {
  id: string;
  timestamp: string;
  recipientPhone: string;
  recipientName: string;
  type: string;
  status: string;
  messageContent?: string;
  waLink?: string;
}
