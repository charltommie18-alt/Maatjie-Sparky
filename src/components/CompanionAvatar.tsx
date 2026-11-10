import React, { useState } from 'react';
import { motion } from 'motion/react';
import { CompanionEmotion } from '../types';
import { speechService } from '../utils/speech';

interface CompanionAvatarProps {
  emotion?: CompanionEmotion;
  isSpeaking?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  onTap?: () => void;
  language?: 'af' | 'en' | 'bilingual';
}

export const CompanionAvatar: React.FC<CompanionAvatarProps> = ({
  emotion = 'joy',
  isSpeaking = false,
  size = 'lg',
  onTap,
  language = 'af'
}) => {
  const [isTickled, setIsTickled] = useState(false);

  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-28 h-28',
    lg: 'w-44 h-44',
    xl: 'w-60 h-60'
  }[size];

  const handleTap = () => {
    setIsTickled(true);
    speechService.unlockAudio();
    speechService.setMuted(false);
    speechService.playSound('pop');
    
    // Giggles or greeting
    const giggles = language === 'af' 
      ? ["Hehehe! Dit kielie!", "Hoera maatjie!", "Ek hou van jou!", "Kyk hoe blink my sterretjie!"]
      : ["Hehehe! That tickles!", "Hooray buddy!", "I like you!", "Look at my shiny star!"];
    const randomGiggle = giggles[Math.floor(Math.random() * giggles.length)];
    speechService.speak(randomGiggle, language);

    setTimeout(() => setIsTickled(false), 900);
    if (onTap) onTap();
  };

  // Color schemes based on emotion
  const glowColors: Record<CompanionEmotion, string> = {
    joy: 'from-amber-400/40 to-orange-400/20 ring-amber-400',
    thinking: 'from-blue-400/40 to-indigo-400/20 ring-blue-400',
    proud: 'from-emerald-400/40 to-teal-400/20 ring-emerald-400',
    calm: 'from-cyan-400/40 to-sky-400/20 ring-sky-400',
    surprised: 'from-purple-400/40 to-pink-400/20 ring-purple-400',
    love: 'from-rose-400/40 to-red-400/20 ring-rose-400'
  };

  return (
    <div className="relative inline-block select-none cursor-pointer group" onClick={handleTap}>
      {/* Animated Aura Glow */}
      <div
        className={`absolute -inset-4 rounded-full bg-gradient-to-tr ${glowColors[emotion]} blur-xl transition-all duration-700 opacity-75 group-hover:opacity-100 ${
          isSpeaking ? 'animate-pulse' : ''
        }`}
      />

      <motion.div
        animate={
          isTickled
            ? { scale: [1, 1.18, 0.95, 1.1, 1], rotate: [0, -12, 12, -6, 0] }
            : isSpeaking
            ? { y: [0, -6, 0] }
            : { y: [0, -4, 0] }
        }
        transition={{
          duration: isTickled ? 0.7 : isSpeaking ? 0.35 : 3.5,
          repeat: isTickled ? 0 : Infinity,
          ease: 'easeInOut'
        }}
        className={`relative ${sizeClasses} rounded-full flex items-center justify-center`}
      >
        <svg
          viewBox="0 0 200 200"
          className="w-full h-full drop-shadow-xl"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="bodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFA726" />
              <stop offset="100%" stopColor="#FB8C00" />
            </linearGradient>
            <linearGradient id="faceGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFF9C4" />
              <stop offset="100%" stopColor="#FFE082" />
            </linearGradient>
          </defs>

          {/* Ears */}
          <motion.g
            animate={isTickled ? { rotate: [-10, 10, -10] } : { rotate: [0, 2, -2, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            {/* Left Ear */}
            <ellipse cx="65" cy="50" rx="18" ry="30" transform="rotate(-25 65 50)" fill="#E65100" />
            <ellipse cx="65" cy="50" rx="11" ry="20" transform="rotate(-25 65 50)" fill="#FFCC80" />

            {/* Right Ear */}
            <ellipse cx="135" cy="50" rx="18" ry="30" transform="rotate(25 135 50)" fill="#E65100" />
            <ellipse cx="135" cy="50" rx="11" ry="20" transform="rotate(25 135 50)" fill="#FFCC80" />
          </motion.g>

          {/* Little Star Spark Antenna */}
          <g>
            <line x1="100" y1="42" x2="100" y2="24" stroke="#FFB300" strokeWidth="4" strokeLinecap="round" />
            <motion.polygon
              animate={{ rotate: 360, scale: [1, 1.25, 1] }}
              transition={{ repeat: Infinity, duration: 4, ease: 'linear' }}
              style={{ originX: '100px', originY: '20px' }}
              points="100,10 103,17 110,18 105,23 107,30 100,26 93,30 95,23 90,18 97,17"
              fill="#FFD54F"
            />
          </g>

          {/* Main Face Circle */}
          <circle cx="100" cy="110" r="68" fill="url(#faceGrad)" stroke="#FFA000" strokeWidth="4" />

          {/* Cheeks */}
          <ellipse cx="62" cy="125" rx="12" ry="7" fill="#FF8A80" opacity="0.75" />
          <ellipse cx="138" cy="125" rx="12" ry="7" fill="#FF8A80" opacity="0.75" />

          {/* Eyes with Emotion variations */}
          {emotion === 'thinking' ? (
            // Looking up in wonder
            <g>
              <ellipse cx="78" cy="98" rx="8" ry="11" fill="#263238" />
              <circle cx="81" cy="93" r="3" fill="#FFFFFF" />
              <ellipse cx="122" cy="98" rx="8" ry="11" fill="#263238" />
              <circle cx="125" cy="93" r="3" fill="#FFFFFF" />
            </g>
          ) : emotion === 'calm' ? (
            // Peaceful curved eyes
            <g stroke="#3E2723" strokeWidth="3.5" strokeLinecap="round">
              <path d="M70 104 Q78 96 86 104" />
              <path d="M114 104 Q122 96 130 104" />
            </g>
          ) : isTickled || emotion === 'proud' ? (
            // Joyful happy crescents
            <g stroke="#3E2723" strokeWidth="4" strokeLinecap="round">
              <path d="M70 102 Q78 112 86 102" />
              <path d="M114 102 Q122 112 130 102" />
            </g>
          ) : (
            // Big sparkling round eyes
            <g>
              <ellipse cx="78" cy="102" rx="9" ry="12" fill="#263238" />
              <circle cx="81" cy="98" r="4.5" fill="#FFFFFF" />
              <circle cx="75" cy="107" r="2" fill="#FFFFFF" />

              <ellipse cx="122" cy="102" rx="9" ry="12" fill="#263238" />
              <circle cx="125" cy="98" r="4.5" fill="#FFFFFF" />
              <circle cx="119" cy="107" r="2" fill="#FFFFFF" />
            </g>
          )}

          {/* Nose */}
          <polygon points="100,114 96,120 104,120" fill="#E65100" />

          {/* Mouth: Talking animation if speaking, wide smile if happy */}
          {isSpeaking ? (
            <motion.ellipse
              cx="100"
              cy="134"
              rx="12"
              animate={{ ry: [4, 11, 5, 10] }}
              transition={{ repeat: Infinity, duration: 0.25 }}
              fill="#D84315"
            />
          ) : (
            <path
              d={isTickled ? "M86 128 Q100 150 114 128" : "M88 128 Q100 142 112 128"}
              fill={isTickled ? "#D84315" : "none"}
              stroke="#3E2723"
              strokeWidth="4"
              strokeLinecap="round"
            />
          )}

          {/* EQ Heart Pin on chest */}
          <g transform="translate(132, 142) scale(0.65)">
            <circle cx="20" cy="20" r="18" fill="#EC4899" />
            <path d="M20 28 C13 22 10 17 13 13 C16 9 20 13 20 15 C20 13 24 9 27 13 C30 17 27 22 20 28 Z" fill="#FFFFFF" />
          </g>
        </svg>
      </motion.div>

      {/* Floating Status / Emotion Badge */}
      <div className="absolute -bottom-1 -right-1 bg-white/90 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-amber-200 shadow-md text-xs font-bold text-amber-800 flex items-center gap-1">
        {emotion === 'joy' && '🌟 Bly'}
        {emotion === 'calm' && '🍃 Kalm'}
        {emotion === 'thinking' && '💡 Dink'}
        {emotion === 'proud' && '🏆 Trots'}
        {emotion === 'love' && '💖 Liefde'}
        {emotion === 'surprised' && '✨ Wow!'}
      </div>
    </div>
  );
};
