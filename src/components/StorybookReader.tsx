import React, { useState } from 'react';
import { BookOpen, Volume2, Sparkles, CheckCircle2, ChevronRight, Award, RefreshCw } from 'lucide-react';
import confetti from 'canvas-confetti';
import { InteractiveStory, StoryScene, LanguageMode } from '../types';
import { speechService } from '../utils/speech';

interface StorybookReaderProps {
  initialStories: InteractiveStory[];
  language: LanguageMode;
  childName: string;
  age: number;
  onAwardStars: (count: number) => void;
}

export const StorybookReader: React.FC<StorybookReaderProps> = ({
  initialStories,
  language,
  childName,
  age,
  onAwardStars
}) => {
  const [stories, setStories] = useState<InteractiveStory[]>(initialStories);
  const [selectedStory, setSelectedStory] = useState<InteractiveStory | null>(initialStories[0] || null);
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [chosenChoices, setChosenChoices] = useState<number[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [customThemeInput, setCustomThemeInput] = useState('');

  const activeScene: StoryScene | undefined = selectedStory?.scenes[currentSceneIndex];

  const handleSelectChoice = (choiceIndex: number) => {
    speechService.playSound('star');
    const newChoices = [...chosenChoices, choiceIndex];
    setChosenChoices(newChoices);

    if (selectedStory && currentSceneIndex + 1 < selectedStory.scenes.length) {
      setCurrentSceneIndex(currentSceneIndex + 1);
    } else {
      setIsCompleted(true);
      onAwardStars(5);
      speechService.playSound('success');
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
      // Speak congratulations
      const congrats = language === 'af'
        ? `Baie geluk ${childName}! Jy het die storie voltooi en 'n goue kenteken verdien!`
        : `Congratulations ${childName}! You completed the story and earned a golden badge!`;
      speechService.speak(congrats, language);
    }
  };

  const handleReadScene = () => {
    if (!activeScene) return;
    speechService.unlockAudio();
    speechService.setMuted(false);
    const textToRead = language === 'en' ? activeScene.textEn : activeScene.textAf;
    speechService.speak(textToRead, language);
  };

  const handleResetStory = () => {
    setCurrentSceneIndex(0);
    setChosenChoices([]);
    setIsCompleted(false);
  };

  const handleGenerateNewStory = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch('/api/stories/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          theme: customThemeInput || 'Emosie & Wiskunde Avontuur',
          childName,
          age,
          language
        })
      });
      const newStory = await res.json();
      setStories((prev) => [newStory, ...prev]);
      setSelectedStory(newStory);
      setCurrentSceneIndex(0);
      setChosenChoices([]);
      setIsCompleted(false);
      setCustomThemeInput('');
      speechService.playSound('success');
    } catch (err) {
      console.error('Failed to generate story', err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Story Selection Carousel */}
      <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
        {stories.map((story) => (
          <button
            key={story.id}
            onClick={() => {
              setSelectedStory(story);
              setCurrentSceneIndex(0);
              setChosenChoices([]);
              setIsCompleted(false);
              speechService.playSound('pop');
            }}
            className={`shrink-0 p-3 rounded-2xl border-2 transition text-left w-52 sm:w-60 cursor-pointer ${
              selectedStory?.id === story.id
                ? 'bg-amber-100 border-amber-400 shadow-md ring-2 ring-amber-300'
                : 'bg-white border-amber-200 hover:bg-amber-50'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-bold text-amber-700">
              <span>{story.eqTheme.split('(')[0]}</span>
              <span>⭐ +5</span>
            </div>
            <h4 className="font-fredoka font-black text-slate-800 text-sm mt-1 line-clamp-1">
              {language === 'en' ? story.titleEn : story.titleAf}
            </h4>
            <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
              {story.mathConcept}
            </p>
          </button>
        ))}

        {/* Generate New AI Story Card */}
        <div className="shrink-0 p-3 rounded-2xl border-2 border-dashed border-indigo-300 bg-indigo-50/70 w-52 sm:w-60 flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold text-indigo-700">✨ KI Storiemaker</span>
            <input
              type="text"
              value={customThemeInput}
              onChange={(e) => setCustomThemeInput(e.target.value)}
              placeholder="Bv: Dinosourusse & Koekies"
              className="mt-1 w-full p-1.5 text-xs rounded-xl bg-white border border-indigo-200"
            />
          </div>
          <button
            onClick={handleGenerateNewStory}
            disabled={isGenerating}
            className="mt-2 w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1"
          >
            <RefreshCw className={`w-3 h-3 ${isGenerating ? 'animate-spin' : ''}`} />
            <span>{isGenerating ? 'Skep tans...' : 'Nuwe Storie'}</span>
          </button>
        </div>
      </div>

      {/* Main Storybook Stage */}
      {selectedStory && (
        <div className="bg-white rounded-3xl p-5 sm:p-8 border-4 border-amber-300 shadow-2xl relative overflow-hidden">
          {/* Top Info Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-amber-100">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-amber-100 text-amber-600 rounded-2xl">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-black font-fredoka text-slate-800">
                  {language === 'en' ? selectedStory.titleEn : selectedStory.titleAf}
                </h3>
                <div className="flex items-center gap-2 text-xs font-bold text-amber-700">
                  <span>EQ: {selectedStory.eqTheme}</span>
                  <span>•</span>
                  <span>Wiskunde: {selectedStory.mathConcept}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleReadScene}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-amber-100 hover:bg-amber-200 text-amber-800 font-bold text-xs border border-amber-300 transition cursor-pointer"
                title="Lees hierdie toneel hardop"
              >
                <Volume2 className="w-4 h-4 text-amber-600" />
                <span>Lees Hardop 🔊</span>
              </button>

              <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-black">
                Toneel {currentSceneIndex + 1} van {selectedStory.scenes.length}
              </span>
            </div>
          </div>

          {!isCompleted && activeScene ? (
            /* Active Scene Content */
            <div className="mt-6 space-y-6">
              {/* Scene Narrative */}
              <div className="p-6 rounded-3xl bg-amber-50/70 border-2 border-amber-200 space-y-3">
                <p className="text-base sm:text-lg text-slate-800 font-semibold leading-relaxed">
                  {activeScene.textAf}
                </p>
                {(language === 'en' || language === 'bilingual') && (
                  <p className="text-sm sm:text-base text-slate-500 italic pt-2 border-t border-amber-200/60 leading-relaxed">
                    {activeScene.textEn}
                  </p>
                )}
              </div>

              {/* Interactive Decision / Math Challenge */}
              <div className="space-y-3">
                <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-2xl">
                  <h4 className="text-sm sm:text-base font-black font-fredoka text-indigo-950">
                    🤔 {language === 'en' ? activeScene.questionEn : activeScene.questionAf}
                  </h4>
                  {language === 'bilingual' && (
                    <p className="text-xs text-indigo-600 italic mt-0.5">{activeScene.questionEn}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {activeScene.choices.map((choice, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSelectChoice(idx)}
                      className="p-4 rounded-2xl border-2 border-amber-300 bg-white hover:bg-amber-100 hover:border-amber-400 text-slate-800 font-bold text-sm sm:text-base text-left shadow-sm hover:shadow-md transition active:scale-98 flex items-center justify-between group cursor-pointer"
                    >
                      <div>
                        <div>{choice.textAf}</div>
                        {(language === 'en' || language === 'bilingual') && (
                          <div className="text-xs text-slate-400 group-hover:text-slate-600 mt-1 font-normal">
                            {choice.textEn}
                          </div>
                        )}
                      </div>
                      <ChevronRight className="w-5 h-5 text-amber-500 group-hover:translate-x-1 transition shrink-0 ml-2" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Completed Story Celebration Screen */
            <div className="mt-8 text-center p-8 bg-gradient-to-b from-amber-50 to-orange-50 rounded-3xl border-3 border-amber-300 space-y-4 animate-in zoom-in-95">
              <div className="w-20 h-20 mx-auto rounded-full bg-amber-400 text-white flex items-center justify-center text-4xl shadow-xl animate-bounce">
                🏆
              </div>

              <h3 className="text-2xl sm:text-3xl font-black font-fredoka text-amber-900">
                {language === 'af' ? 'Hoera! Jy het die Storie Voltooi!' : 'Hooray! You Completed the Story!'}
              </h3>

              <p className="text-slate-600 text-sm sm:text-base max-w-md mx-auto">
                {language === 'af'
                  ? `Wonderlik gedoen, ${childName}! Jy het geleer hoe om groot emosies te verstaan en somme soos 'n kampioen op te los.`
                  : `Wonderful job, ${childName}! You learned how to handle big feelings and solve math puzzles like a champion.`}
              </p>

              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-amber-200 border-2 border-amber-400 text-amber-900 font-black text-sm">
                <Award className="w-5 h-5 text-amber-700" />
                <span>Kenteken Verwerf: {selectedStory.badgeEarned} ⭐⭐⭐</span>
              </div>

              <div className="pt-4 flex justify-center gap-3">
                <button
                  onClick={handleResetStory}
                  className="px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-black text-sm shadow-md transition active:scale-95 cursor-pointer"
                >
                  Lees Weer van Voor af 🔄
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
