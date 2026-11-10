import React, { useState } from 'react';
import { Gamepad2, Heart, Calculator, Wind, CheckCircle2, RefreshCw, Star, Trophy } from 'lucide-react';
import confetti from 'canvas-confetti';
import { GameChallenge, LanguageMode } from '../types';
import { speechService } from '../utils/speech';

interface GamesArcadeProps {
  language: LanguageMode;
  childName: string;
  age: number;
  mathLevel: number;
  onAwardStars: (count: number) => void;
}

export const GamesArcade: React.FC<GamesArcadeProps> = ({
  language,
  childName,
  age,
  mathLevel,
  onAwardStars,
}) => {
  const [activeCategory, setActiveCategory] = useState<'math' | 'eq' | 'breath' | 'kindness'>('math');
  const [currentScore, setCurrentScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [feedback, setFeedback] = useState<{ textAf: string; textEn: string; isCorrect: boolean } | null>(null);
  const [selectedOptionIdx, setSelectedOptionIdx] = useState<number | null>(null);

  // Breathing state
  const [breathPhase, setBreathPhase] = useState<'in' | 'hold' | 'out'>('in');
  const [breathCount, setBreathCount] = useState(0);
  const [isBreathingActive, setIsBreathingActive] = useState(false);

  // Pre-loaded adaptive challenges
  const mathChallenges: GameChallenge[] = [
    {
      id: 'math-1',
      category: 'math',
      titleAf: 'Tel die Diertjies!',
      titleEn: 'Count the Animals!',
      instructionAf: 'Hoeveel olifante en leeus sien jy altesaam?',
      instructionEn: 'How many elephants and lions do you see in total?',
      questionAf: '2 Olifante + 3 Leeus = ?',
      questionEn: '2 Elephants + 3 Lions = ?',
      visualEmoji: '🐘🐘 + 🦁🦁🦁',
      options: [
        { text: '5 diere 🐾', isCorrect: true, feedbackAf: 'Mooi so! 2 + 3 = 5!', feedbackEn: 'Awesome! 2 + 3 = 5!' },
        { text: '4 diere 🐾', isCorrect: false, feedbackAf: 'Byna! Kom ons tel weer: 1, 2, 3, 4, 5!', feedbackEn: 'Almost! Let’s count again: 1, 2, 3, 4, 5!' },
        { text: '6 diere 🐾', isCorrect: false, feedbackAf: 'Nie heeltemal nie. 2 + 3 = 5!', feedbackEn: 'Not quite. 2 + 3 = 5!' }
      ],
      starsAwarded: 3
    },
    {
      id: 'math-2',
      category: 'math',
      titleAf: 'Vorm Speurder!',
      titleEn: 'Shape Detective!',
      instructionAf: 'Watter vorm het 3 hoeke?',
      instructionEn: 'Which shape has 3 corners?',
      questionAf: 'Kies die regte vorm:',
      questionEn: 'Choose the correct shape:',
      visualEmoji: '🔺 🟦 🟢',
      options: [
        { text: 'Driehoek (Triangle) 🔺', isCorrect: true, feedbackAf: 'Presies! ’n Driehoek het 3 sye en 3 hoeke.', feedbackEn: 'Exactly! A triangle has 3 sides and 3 corners.' },
        { text: 'Vierkant (Square) 🟦', isCorrect: false, feedbackAf: '’n Vierkant het 4 gelyke sye.', feedbackEn: 'A square has 4 equal sides.' },
        { text: 'Sirkel (Circle) 🟢', isCorrect: false, feedbackAf: '’n Sirkel is heeltemal rond sonder hoeke.', feedbackEn: 'A circle is completely round with no corners.' }
      ],
      starsAwarded: 3
    },
    {
      id: 'math-3',
      category: 'math',
      titleAf: 'Wortel Delery!',
      titleEn: 'Carrot Sharing!',
      instructionAf: 'Haasie het 6 wortels. Hy gee 2 vir Skilpad.',
      instructionEn: 'Bunny has 6 carrots. He gives 2 to Tortoise.',
      questionAf: 'Hoeveel wortels het Haasie nou oor? (6 - 2 = ?)',
      questionEn: 'How many carrots does Bunny have left? (6 - 2 = ?)',
      visualEmoji: '🥕🥕🥕🥕🥕🥕 ➔ 🥕🥕',
      options: [
        { text: '4 wortels 🥕', isCorrect: true, feedbackAf: 'Puik! 6 minus 2 is 4!', feedbackEn: 'Super! 6 minus 2 is 4!' },
        { text: '3 wortels 🥕', isCorrect: false, feedbackAf: 'Byna! Tel een meer af.', feedbackEn: 'Almost! Count one less.' },
        { text: '5 wortels 🥕', isCorrect: false, feedbackAf: 'Probeer weer.', feedbackEn: 'Try again.' }
      ],
      starsAwarded: 3
    }
  ];

  const eqChallenges: GameChallenge[] = [
    {
      id: 'eq-1',
      category: 'eq',
      titleAf: 'Emosie Speurder: Kwaad na Kalm',
      titleEn: 'Emotion Detective: Mad to Calm',
      instructionAf: 'Jou legkaart pas nie en jy voel woedend binne-in jou maag. Wat is die beste ding om te doen?',
      instructionEn: 'Your puzzle won’t fit and you feel angry inside your tummy. What is the best thing to do?',
      questionAf: 'Kies die slimste keuse:',
      questionEn: 'Choose the smartest action:',
      visualEmoji: '🧩 😡 ➔ 🧘',
      options: [
        { text: 'Vat 3 diep blom-asemte en vra vir hulp 🌬️🤝', isCorrect: true, feedbackAf: 'Fantasties! Diep asemhaling kalmeer jou brein en hart.', feedbackEn: 'Fantastic! Deep breathing calms your brain and heart.' },
        { text: 'Gooi die legkaart op die grond 💥', isCorrect: false, feedbackAf: 'Dit kan die stukke breek en jou hartjie meer ontsteld maak.', feedbackEn: 'That might break the pieces and make your heart more upset.' },
        { text: 'Skreeu op jou maatjie 📢', isCorrect: false, feedbackAf: 'Skreeu maak ander bang. Praat liewer rustig.', feedbackEn: 'Yelling scares others. Talking softly helps.' }
      ],
      starsAwarded: 3
    },
    {
      id: 'eq-2',
      category: 'eq',
      titleAf: 'Emosie Speurder: Deel van Speelgoed',
      titleEn: 'Emotion Detective: Sharing Toys',
      instructionAf: 'Jy speel met die rooi brandweerwa, maar jou maatjie wil ook ’n beurt hê.',
      instructionEn: 'You are playing with the red fire truck, but your friend also wants a turn.',
      questionAf: 'Wat maak albei harte bly?',
      questionEn: 'What makes both hearts happy?',
      visualEmoji: '🚒 🧑‍🤝‍🧑 ❤️',
      options: [
        { text: 'Stel ’n 2-minute tydhouer en neem beurte ⏱️🚒', isCorrect: true, feedbackAf: 'Wonderlik! Om beurte te neem maak vriendskap sterker!', feedbackEn: 'Wonderful! Taking turns makes friendship stronger!' },
        { text: 'Steek die brandweerwa weg onder die bed 🙈', isCorrect: false, feedbackAf: 'Wegsteek laat ander hartseer voel.', feedbackEn: 'Hiding things makes others feel sad.' },
        { text: 'Sê hy mag nooit weer speel nie 🙅', isCorrect: false, feedbackAf: 'Dit is nie vriendelik nie. Probeer deel.', feedbackEn: 'That is not kind. Let’s try sharing.' }
      ],
      starsAwarded: 3
    }
  ];

  const [mathIdx, setMathIdx] = useState(0);
  const [eqIdx, setEqIdx] = useState(0);

  const activeChallenge = activeCategory === 'math' ? mathChallenges[mathIdx] : eqChallenges[eqIdx];

  const handleOptionClick = (idx: number, isCorrect: boolean, feedbackAf: string, feedbackEn: string) => {
    setSelectedOptionIdx(idx);
    setFeedback({ textAf: feedbackAf, textEn: feedbackEn, isCorrect });

    speechService.unlockAudio();
    speechService.setMuted(false);

    if (isCorrect) {
      speechService.playSound('success');
      speechService.speak(language === 'en' ? feedbackEn : feedbackAf, language);
      setStreak((s) => s + 1);
      setCurrentScore((s) => s + 10);
      onAwardStars(activeChallenge.starsAwarded);

      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.7 }
      });
    } else {
      speechService.playSound('pop');
      speechService.speak(language === 'en' ? feedbackEn : feedbackAf, language);
      setStreak(0);
    }
  };

  const handleNextChallenge = () => {
    setFeedback(null);
    setSelectedOptionIdx(null);
    if (activeCategory === 'math') {
      setMathIdx((idx) => (idx + 1) % mathChallenges.length);
    } else {
      setEqIdx((idx) => (idx + 1) % eqChallenges.length);
    }
    speechService.playSound('pop');
  };

  // Breathing journey handler
  const handleStartBreathing = () => {
    setIsBreathingActive(true);
    setBreathCount(0);
    speechService.playSound('breathe');

    let count = 0;
    const interval = setInterval(() => {
      count++;
      setBreathCount(count);
      if (count % 3 === 1) {
        setBreathPhase('in');
        speechService.playSound('breathe');
      } else if (count % 3 === 2) {
        setBreathPhase('hold');
      } else {
        setBreathPhase('out');
      }

      if (count >= 9) {
        clearInterval(interval);
        setIsBreathingActive(false);
        onAwardStars(5);
        speechService.playSound('success');
        confetti({ particleCount: 50 });
      }
    }, 2800);
  };

  return (
    <div className="space-y-6">
      {/* Arcade Game Selector Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        <button
          onClick={() => {
            setActiveCategory('math');
            setFeedback(null);
            setSelectedOptionIdx(null);
          }}
          className={`p-3.5 rounded-3xl border-3 font-bold text-xs sm:text-sm flex flex-col items-center gap-1.5 transition active:scale-95 cursor-pointer ${
            activeCategory === 'math'
              ? 'bg-amber-400 border-amber-500 text-amber-950 shadow-md ring-2 ring-amber-300'
              : 'bg-white border-amber-200 text-slate-700 hover:bg-amber-50'
          }`}
        >
          <Calculator className="w-6 h-6 text-amber-900" />
          <span>Wiskunde Safarie 🧮</span>
        </button>

        <button
          onClick={() => {
            setActiveCategory('eq');
            setFeedback(null);
            setSelectedOptionIdx(null);
          }}
          className={`p-3.5 rounded-3xl border-3 font-bold text-xs sm:text-sm flex flex-col items-center gap-1.5 transition active:scale-95 cursor-pointer ${
            activeCategory === 'eq'
              ? 'bg-pink-400 border-pink-500 text-pink-950 shadow-md ring-2 ring-pink-300'
              : 'bg-white border-pink-200 text-slate-700 hover:bg-pink-50'
          }`}
        >
          <Heart className="w-6 h-6 text-pink-900" />
          <span>Emosie Speurder 💖</span>
        </button>

        <button
          onClick={() => {
            setActiveCategory('breath');
            setFeedback(null);
          }}
          className={`p-3.5 rounded-3xl border-3 font-bold text-xs sm:text-sm flex flex-col items-center gap-1.5 transition active:scale-95 cursor-pointer ${
            activeCategory === 'breath'
              ? 'bg-sky-400 border-sky-500 text-sky-950 shadow-md ring-2 ring-sky-300'
              : 'bg-white border-sky-200 text-slate-700 hover:bg-sky-50'
          }`}
        >
          <Wind className="w-6 h-6 text-sky-900" />
          <span>Blaas & Kalmeer 🎈</span>
        </button>

        <button
          onClick={() => {
            setActiveCategory('kindness');
            setFeedback(null);
          }}
          className={`p-3.5 rounded-3xl border-3 font-bold text-xs sm:text-sm flex flex-col items-center gap-1.5 transition active:scale-95 cursor-pointer ${
            activeCategory === 'kindness'
              ? 'bg-emerald-400 border-emerald-500 text-emerald-950 shadow-md ring-2 ring-emerald-300'
              : 'bg-white border-emerald-200 text-slate-700 hover:bg-emerald-50'
          }`}
        >
          <Trophy className="w-6 h-6 text-emerald-900" />
          <span>Vriendelikheid ⭐</span>
        </button>
      </div>

      {/* Main Arcade Arena */}
      {activeCategory === 'breath' ? (
        /* Calming Breathing Journey */
        <div className="bg-gradient-to-b from-sky-50 to-indigo-50 rounded-3xl p-8 border-4 border-sky-300 shadow-2xl text-center space-y-6">
          <div className="max-w-md mx-auto">
            <h3 className="text-2xl font-black font-fredoka text-sky-900">
              {language === 'af' ? 'Magiese Ballon Asemhaling 🎈' : 'Magical Balloon Breathing 🎈'}
            </h3>
            <p className="text-xs sm:text-sm text-sky-700 mt-1">
              {language === 'af'
                ? "Asem diep in deur jou neus soos jy aan ’n blommetjie ruik, hou dit vas, en blaas sag uit soos jy ’n kersie doof."
                : "Breathe deep in through your nose smelling a flower, hold it gently, and blow out softly like blowing a candle."}
            </p>
          </div>

          {/* Animated Breathing Balloon */}
          <div className="py-8 flex flex-col items-center justify-center">
            <div
              className={`w-36 h-36 sm:w-48 sm:h-48 rounded-full bg-gradient-to-tr from-sky-400 to-indigo-400 flex items-center justify-center shadow-2xl text-white transition-all duration-1000 ease-in-out border-4 border-white ${
                breathPhase === 'in'
                  ? 'scale-125 bg-gradient-to-tr from-sky-500 to-emerald-400'
                  : breathPhase === 'hold'
                  ? 'scale-125 ring-8 ring-amber-300'
                  : 'scale-90 bg-gradient-to-tr from-indigo-500 to-purple-400'
              }`}
            >
              <span className="font-fredoka font-black text-xl sm:text-2xl drop-shadow-md">
                {breathPhase === 'in' && (language === 'af' ? 'Asem In 🌸' : 'Breathe In 🌸')}
                {breathPhase === 'hold' && (language === 'af' ? 'Hou Vas ✨' : 'Hold Calm ✨')}
                {breathPhase === 'out' && (language === 'af' ? 'Blaas Uit 🕯️' : 'Breathe Out 🕯️')}
              </span>
            </div>
            {isBreathingActive && (
              <span className="mt-4 text-xs font-bold text-sky-800">
                Asemhaling siklus: {Math.floor(breathCount / 3) + 1} van 3
              </span>
            )}
          </div>

          <button
            onClick={handleStartBreathing}
            disabled={isBreathingActive}
            className="px-8 py-3.5 bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white font-black text-sm rounded-2xl shadow-lg transition active:scale-95 cursor-pointer"
          >
            {isBreathingActive ? 'Asem saam met die ballon...' : 'Begin Kalmering (Start Journey) 🧘'}
          </button>
        </div>
      ) : activeCategory === 'kindness' ? (
        /* Kindness Quest */
        <div className="bg-gradient-to-b from-emerald-50 to-teal-50 rounded-3xl p-6 sm:p-8 border-4 border-emerald-300 shadow-2xl space-y-5">
          <div className="text-center max-w-md mx-auto">
            <h3 className="text-2xl font-black font-fredoka text-emerald-950">
              {language === 'af' ? 'Daaglikse Vriendelikheid Missie 🤝' : 'Daily Kindness Mission 🤝'}
            </h3>
            <p className="text-xs sm:text-sm text-emerald-800 mt-1">
              {language === 'af'
                ? "Klein dade van vriendelikheid maak groot verskille in almal se harte!"
                : "Small acts of kindness make big smiles in everyone’s hearts!"}
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-3">
            {[
              { titleAf: 'Mooi Woorde', titleEn: 'Kind Words', descAf: 'Sê vandag vir iemand: "Jy lyk mooi vandag!" of "Dankie dat jy my maatjie is."', stars: 3 },
              { titleAf: 'Helpende Handjies', titleEn: 'Helping Hands', descAf: 'Help Mamma of Pappa om jou bord na die kombuis te dra.', stars: 4 },
              { titleAf: 'Deel ’n Speelding', titleEn: 'Share a Toy', descAf: 'Laat jou boetie, sussie of maatjie eerste met jou gunsteling speelding speel.', stars: 5 }
            ].map((mission, idx) => (
              <div key={idx} className="p-4 bg-white rounded-2xl border-2 border-emerald-200 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center text-xs font-bold text-emerald-700">
                    <span>Missie {idx + 1}</span>
                    <span>⭐ +{mission.stars}</span>
                  </div>
                  <h4 className="font-fredoka font-black text-slate-800 text-base mt-1">
                    {language === 'en' ? mission.titleEn : mission.titleAf}
                  </h4>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                    {mission.descAf}
                  </p>
                </div>
                <button
                  onClick={() => {
                    onAwardStars(mission.stars);
                    speechService.playSound('success');
                    confetti({ particleCount: 50 });
                  }}
                  className="mt-4 w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition active:scale-95"
                >
                  Ek het dit gedoen! ✓
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : activeChallenge ? (
        /* Math or EQ Active Quest */
        <div className="bg-white rounded-3xl p-6 sm:p-8 border-4 border-amber-300 shadow-2xl space-y-6">
          {/* Header Info */}
          <div className="flex items-center justify-between pb-3 border-b border-amber-100">
            <div>
              <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">
                {activeCategory === 'math' ? 'Wiskunde Vlak ' + mathLevel : 'Emosionele Intelligensie'}
              </span>
              <h3 className="text-xl sm:text-2xl font-black font-fredoka text-slate-800">
                {language === 'en' ? activeChallenge.titleEn : activeChallenge.titleAf}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-black">
                Streak: {streak} 🔥
              </span>
              <span className="px-3 py-1 rounded-full bg-indigo-100 text-indigo-800 text-xs font-black">
                Telling: {currentScore}
              </span>
            </div>
          </div>

          {/* Visual Emoji / Clue */}
          {activeChallenge.visualEmoji && (
            <div className="p-6 rounded-3xl bg-amber-50/70 border-2 border-amber-200 text-center">
              <div className="text-4xl sm:text-5xl tracking-widest animate-pulse">
                {activeChallenge.visualEmoji}
              </div>
              <p className="mt-3 text-base sm:text-lg font-bold text-slate-800">
                {language === 'en' ? activeChallenge.questionEn : activeChallenge.questionAf}
              </p>
            </div>
          )}

          {/* Interactive Answer Choices */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {activeChallenge.options.map((opt, idx) => (
              <button
                key={idx}
                onClick={() => handleOptionClick(idx, opt.isCorrect, opt.feedbackAf, opt.feedbackEn)}
                className={`p-4 rounded-2xl border-2 text-left font-bold text-sm sm:text-base transition active:scale-95 cursor-pointer ${
                  selectedOptionIdx === idx
                    ? opt.isCorrect
                      ? 'bg-emerald-100 border-emerald-400 text-emerald-950 ring-2 ring-emerald-300'
                      : 'bg-rose-100 border-rose-400 text-rose-950 ring-2 ring-rose-300'
                    : 'bg-white border-amber-200 text-slate-800 hover:bg-amber-50 hover:border-amber-300'
                }`}
              >
                <span>{opt.text}</span>
              </button>
            ))}
          </div>

          {/* Feedback Display */}
          {feedback && (
            <div
              className={`p-4 rounded-2xl border-2 flex items-center justify-between gap-3 animate-in fade-in ${
                feedback.isCorrect
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                  : 'bg-amber-50 border-amber-300 text-amber-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <CheckCircle2
                  className={`w-5 h-5 shrink-0 ${
                    feedback.isCorrect ? 'text-emerald-600' : 'text-amber-600'
                  }`}
                />
                <span className="text-xs sm:text-sm font-bold">
                  {language === 'en' ? feedback.textEn : feedback.textAf}
                </span>
              </div>
              <button
                onClick={handleNextChallenge}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-black shrink-0 transition"
              >
                Volgende Som ➔
              </button>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
};
