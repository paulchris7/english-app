import React from "react";
import { motion } from "motion/react";
import { 
  RefreshCw, 
  Sparkles, 
  Volume2 
} from "lucide-react";

interface SrsWord {
  word: string;
  definition: string;
  stage: number;
  nextReview: number;
  lessonId: number;
  lessonTitle: string;
}

interface SrsViewProps {
  lessons: any[];
  srsDeck: SrsWord[];
  srsCurrentIdx: number;
  setSrsCurrentIdx: React.Dispatch<React.SetStateAction<number>>;
  srsRevealed: boolean;
  setSrsRevealed: React.Dispatch<React.SetStateAction<boolean>>;
  srsFilter: "due" | "all" | "mastered";
  setSrsFilter: (val: "due" | "all" | "mastered") => void;
  syncSrsDeck: (lessons: any) => void;
  forceReadySrsWords: () => void;
  handleSrsAnswer: (word: string, isCorrect: boolean) => void;
  speakText: (text: string) => void;
}

export const SrsView: React.FC<SrsViewProps> = ({
  lessons,
  srsDeck,
  srsCurrentIdx,
  setSrsCurrentIdx,
  srsRevealed,
  setSrsRevealed,
  srsFilter,
  setSrsFilter,
  syncSrsDeck,
  forceReadySrsWords,
  handleSrsAnswer,
  speakText
}) => {
  const totalDueCount = srsDeck.filter(item => item.nextReview <= Date.now()).length;

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Stats and sync actions banner */}
      <div className="bg-white border border-indigo-100 rounded-3xl p-6 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-1.5 text-center md:text-left">
          <span className="text-[10px] font-extrabold text-indigo-500 bg-indigo-50 px-3 py-1 rounded-full uppercase tracking-wider">
            Spaced Repetition System
          </span>
          <h3 className="text-xl font-display font-bold text-slate-900 tracking-tight">Your Leitner Vocabulary Engine</h3>
          <p className="text-xs text-slate-500">We schedule reviews at optimal intervals (30s, 2m, 10m, 1h, 5h, 24h) to solidify long-term recall.</p>
        </div>

        <div className="flex flex-wrap gap-2 justify-center shrink-0">
          <button
            onClick={() => syncSrsDeck(lessons)}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sync Words ({lessons.reduce((acc, l) => acc + (l.vocabulary?.items?.length || 0), 0)})</span>
          </button>
          <button
            onClick={forceReadySrsWords}
            className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
            title="Forces all words to become immediately due for rapid testing"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>⚡ Test Deck Instantly</span>
          </button>
        </div>
      </div>

      {/* Stats breakdown */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Synced", val: srsDeck.length, sub: "words in deck", color: "text-indigo-600 bg-indigo-50/50 border-indigo-100/30" },
          { label: "Due for Review", val: totalDueCount, sub: "need recall now", color: "text-rose-600 bg-rose-50/50 border-rose-100/30" },
          { label: "Learning / Fresh", val: srsDeck.filter(item => item.stage > 0 && item.stage < 5).length, sub: "stages 1 to 4", color: "text-amber-600 bg-amber-50/50 border-amber-100/30" },
          { label: "Fully Mastered", val: srsDeck.filter(item => item.stage === 5).length, sub: "Leitner level 5", color: "text-emerald-600 bg-emerald-50/50 border-emerald-100/30" }
        ].map((stat, i) => (
          <div key={i} className={`bg-white border rounded-2xl p-4.5 text-center shadow-xs ${stat.color}`}>
            <p className="text-xxs font-bold text-slate-400 uppercase tracking-wider mb-1">{stat.label}</p>
            <h4 className="text-2xl sm:text-3xl font-display font-black leading-tight mb-0.5">{stat.val}</h4>
            <p className="text-xxs text-slate-400 font-medium italic">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* MAIN PRACTICE CANVASES */}
      {srsDeck.length === 0 ? (
        <div className="bg-white border border-rose-100/60 rounded-[2rem] p-12 text-center shadow-sm space-y-4 max-w-lg mx-auto">
          <div className="text-5xl animate-bounce">🧠</div>
          <h4 className="font-display font-bold text-lg text-slate-900">Your SRS Deck is Ready for Setup</h4>
          <p className="text-sm text-slate-500 leading-relaxed">
            Synchronize your vocabulary words to pull travel, anatomy, social, and professional vocabulary from the lessons into your dynamic recall deck!
          </p>
          <button
            onClick={() => syncSrsDeck(lessons)}
            className="px-6 py-3 bg-rose-500 hover:bg-rose-600 text-white font-bold text-sm rounded-xl shadow-md cursor-pointer transition-all hover:scale-[1.02]"
          >
            ➕ Import All Lesson Vocabulary Now
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT COLUMN: THE ACTIVE DUE WORKSPACE */}
          <div className="lg:col-span-2 space-y-6">
            <h4 className="font-display font-bold text-base text-slate-900 px-1 flex items-center gap-2">
              <span>🎯 Recall Practice Arena</span>
              <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-mono">
                {totalDueCount} due
              </span>
            </h4>

            {totalDueCount === 0 ? (
              <div className="bg-white border border-emerald-100 rounded-3xl p-8 text-center space-y-4 shadow-sm">
                <div className="text-5xl">🏆✨</div>
                <h5 className="font-display font-bold text-lg text-emerald-800">You are completely caught up!</h5>
                <p className="text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
                  Amazing work! All words have been successfully reviewed. You can wait for the scheduled times, or force-ready all reviews above to test yourself again.
                </p>
              </div>
            ) : (
              (() => {
                const dueWords = srsDeck.filter(item => item.nextReview <= Date.now());
                const currentWord = dueWords[srsCurrentIdx] || dueWords[0];
                if (!currentWord) return null;

                return (
                  <div className="bg-white border border-indigo-50 border-b-4 border-b-indigo-100 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
                    {/* Info and pronounce */}
                    <div className="flex justify-between items-center border-b border-indigo-50/50 pb-4">
                      <span className="text-xxs font-mono font-bold bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-md uppercase">
                        Word {srsCurrentIdx + 1} of {dueWords.length} due
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-xxs font-mono text-slate-400">Leitner Level: {currentWord.stage}/5</span>
                        <button
                          onClick={() => speakText(currentWord.word)}
                          className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-500 flex items-center justify-center hover:bg-indigo-100 transition-all cursor-pointer"
                          title="Speak word"
                        >
                          <Volume2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Center display word */}
                    <div className="text-center py-6 space-y-2">
                      <h3 className="font-display font-black text-3xl sm:text-4xl text-slate-950 uppercase tracking-tight">
                        {currentWord.word}
                      </h3>
                      <p className="text-xxs text-slate-400">Source: Lesson {currentWord.lessonId} - {currentWord.lessonTitle}</p>
                    </div>

                    {/* Action or revealed contents */}
                    {!srsRevealed ? (
                      <button
                        onClick={() => setSrsRevealed(true)}
                        className="w-full py-4.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl cursor-pointer transition-all shadow-sm hover:scale-[1.01]"
                      >
                        🔍 Reveal Definition & Sentence context
                      </button>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6 border-t border-indigo-50/50 pt-5"
                      >
                        <div className="bg-indigo-50/15 border border-indigo-100/40 p-4.5 rounded-2xl text-center space-y-2.5">
                          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Meaning</p>
                          <p className="text-sm font-semibold text-slate-800 leading-normal max-w-md mx-auto">{currentWord.definition}</p>
                        </div>

                        <div className="space-y-3.5 text-center">
                          <p className="text-xs text-slate-500 font-bold">Did you recall this word correctly?</p>
                          <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto">
                            <button
                              onClick={() => handleSrsAnswer(currentWord.word, false)}
                              className="py-3 px-4 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-bold rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1"
                            >
                              <span>❌ Forgot</span>
                            </button>
                            <button
                              onClick={() => handleSrsAnswer(currentWord.word, true)}
                              className="py-3 px-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-200 text-xs font-bold rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1"
                            >
                              <span>✅ Remembered</span>
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                );
              })()
            )}
          </div>

          {/* RIGHT COLUMN: LIST OF ALL WORDS WITH LEITNER STATUS PILLS */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h4 className="font-display font-bold text-base text-slate-900 px-1">📖 Deck Reference Key</h4>
              <select
                value={srsFilter}
                onChange={(e) => setSrsFilter(e.target.value as any)}
                className="text-xs font-semibold bg-white border border-rose-100 rounded-lg px-2 py-1 focus:outline-none"
              >
                <option value="due">Due Review</option>
                <option value="all">All Words ({srsDeck.length})</option>
                <option value="mastered">Mastered (Stage 5)</option>
              </select>
            </div>

            <div className="bg-white border border-rose-100/50 rounded-2xl p-4.5 shadow-sm space-y-3 max-h-[460px] overflow-y-auto">
              {(() => {
                let list = [...srsDeck];
                if (srsFilter === "due") {
                  list = list.filter(item => item.nextReview <= Date.now());
                } else if (srsFilter === "mastered") {
                  list = list.filter(item => item.stage === 5);
                }

                if (list.length === 0) {
                  return <p className="text-xs text-slate-400 italic text-center py-8">No vocabulary words match this filter.</p>;
                }

                return list.map((item) => {
                  const isReady = item.nextReview <= Date.now();
                  return (
                    <div key={item.word} className="border-b border-rose-50 pb-2.5 last:border-0 last:pb-0 space-y-1.5">
                      <div className="flex justify-between items-center gap-2">
                        <h5 className="font-display font-bold text-xs text-slate-900 uppercase tracking-tight">{item.word}</h5>
                        {isReady ? (
                          <span className="text-[9px] font-mono font-bold bg-rose-50 text-rose-500 border border-rose-100/50 px-1.5 py-0.5 rounded animate-pulse">Due now</span>
                        ) : (
                          <span className="text-[9px] font-mono text-slate-400">
                            Next: {Math.max(1, Math.round((item.nextReview - Date.now()) / 60000))}m
                          </span>
                        )}
                      </div>
                      <p className="text-xxs text-slate-500 line-clamp-1 leading-relaxed font-normal">{item.definition}</p>
                      
                      {/* Leitner Stage progress pills */}
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((lvl) => {
                          let dotColor = "bg-slate-100";
                          if (item.stage >= lvl) {
                            if (item.stage === 5) dotColor = "bg-emerald-500";
                            else if (item.stage >= 3) dotColor = "bg-indigo-500";
                            else dotColor = "bg-amber-400";
                          }
                          return <span key={lvl} className={`w-2.5 h-1.5 rounded-full ${dotColor}`} />;
                        })}
                        <span className="text-[9px] text-slate-400 font-bold ml-1 uppercase tracking-tight">Stage {item.stage}</span>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
