import React from "react";
import { motion } from "motion/react";
import { 
  BookmarkCheck, 
  Award, 
  Trophy, 
  Sparkles, 
  Check, 
  ArrowRight 
} from "lucide-react";

interface Lesson {
  id: number;
  title: string;
  reading: { title: string };
  grammar: { title: string };
}

interface RoadmapViewProps {
  lessons: Lesson[];
  lessonProgressStats: Record<number, { completed: number; total: number; perfect: boolean }>;
  navigateToLesson: (id: number) => void;
  answers: any;
}

export const RoadmapView: React.FC<RoadmapViewProps> = ({
  lessons,
  lessonProgressStats,
  navigateToLesson,
  answers
}) => {
  return (
    <div className="space-y-12">
      {/* SECTION 1: THE OBJECTIVES */}
      <section className="space-y-6">
        <div className="text-center space-y-1.5">
          <h2 className="text-2xl sm:text-3xl font-display font-bold text-slate-900 tracking-tight">
            Our Core Objectives
          </h2>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Three tailored columns constructed exactly to support your academic and personal growth.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* CARD 1 */}
          <div className="bg-white border border-rose-50 border-l-4 border-l-teal-500 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-rose-100 transition-all duration-300 flex flex-col gap-4 relative overflow-hidden group">
            <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600">
              <BookmarkCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg text-teal-700 mb-2">Secure & Strengthen</h3>
              <p className="text-sm text-slate-600 leading-relaxed font-medium">
                "No pressure, just progress. We are going to lock in the English you already know and iron out any little doubts so you never have to second-guess yourself."
              </p>
            </div>
          </div>

          {/* CARD 2 */}
          <div className="bg-white border border-rose-50 border-l-4 border-l-indigo-500 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-rose-100 transition-all duration-300 flex flex-col gap-4 relative overflow-hidden group">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg text-indigo-700 mb-2">Master Your Field</h3>
              <p className="text-sm text-slate-600 leading-relaxed font-medium">
                "Because you are a scientist at heart, your reading modules are specifically tailored to bioscience. You'll master the vocabulary of your actual field."
              </p>
            </div>
          </div>

          {/* CARD 3 */}
          <div className="bg-white border border-rose-50 border-l-4 border-l-rose-500 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-rose-100 transition-all duration-300 flex flex-col gap-4 relative overflow-hidden group">
            <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg text-rose-700 mb-2">Real-World Fluency</h3>
              <p className="text-sm text-slate-600 leading-relaxed font-medium">
                "Beyond the lab, we’ll equip you with the exact words and grammar you need for traveling, daily life, and expressing yourself effortlessly."
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: HOW IT WORKS */}
      <section className="bg-white border border-rose-50 border-b-4 border-b-rose-100 rounded-[2rem] p-8 shadow-sm max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-1">
          <h2 className="text-2xl sm:text-3xl font-display font-bold text-slate-900 tracking-tight">How It Works</h2>
          <p className="text-sm text-slate-500">Every lesson is split into 4 intuitive, progressive checkpoints.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative">
          {/* STEP 1 */}
          <div className="bg-[#FFFAF9]/40 p-5 rounded-2xl border border-rose-100/50 text-center flex flex-col items-center gap-2.5 hover:border-rose-200 transition-all duration-200 shadow-xs">
            <div className="text-3xl">📖</div>
            <span className="text-[10px] font-extrabold uppercase text-rose-500 tracking-widest">Step 1</span>
            <h4 className="font-display font-bold text-sm text-slate-900 leading-tight">Scientific Reading</h4>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              Short articles on biology, genetics, or environmental science paired with True/False or QCM checks.
            </p>
          </div>

          {/* STEP 2 */}
          <div className="bg-[#FFFAF9]/40 p-5 rounded-2xl border border-rose-100/50 text-center flex flex-col items-center gap-2.5 hover:border-rose-200 transition-all duration-200 shadow-xs">
            <div className="text-3xl">🧠</div>
            <span className="text-[10px] font-extrabold uppercase text-indigo-500 tracking-widest">Step 2</span>
            <h4 className="font-display font-bold text-sm text-indigo-950 leading-tight">Grammar Mastery</h4>
            <p className="text-xs text-indigo-900/60 leading-relaxed font-medium">
              Targeted intermediate grammar rules to secure acquisitions + interactive fill-in-the-blank practice.
            </p>
          </div>

          {/* STEP 3 */}
          <div className="bg-[#FFFAF9]/40 p-5 rounded-2xl border border-rose-100/50 text-center flex flex-col items-center gap-2.5 hover:border-rose-200 transition-all duration-200 shadow-xs">
            <div className="text-3xl">🗣️</div>
            <span className="text-[10px] font-extrabold uppercase text-teal-600 tracking-widest">Step 3</span>
            <h4 className="font-display font-bold text-sm text-teal-950 leading-tight">Daily Vocab</h4>
            <p className="text-xs text-teal-900/60 leading-relaxed font-medium">
              Themed flashcard lists, mini match quizzes, or customized diagrams covering everyday life and social situations.
            </p>
          </div>

          {/* STEP 4 */}
          <div className="bg-[#FFFAF9]/40 p-5 rounded-2xl border border-rose-100/50 text-center flex flex-col items-center gap-2.5 hover:border-rose-200 transition-all duration-200 shadow-xs">
            <div className="text-3xl">⚡</div>
            <span className="text-[10px] font-extrabold uppercase text-pink-500 tracking-widest">Step 4</span>
            <h4 className="font-display font-bold text-sm text-slate-900 leading-tight">Core Verbs</h4>
            <p className="text-xs text-pink-900/60 leading-relaxed font-medium">
              Mastering foundational verbs, past forms, definitions, and real-world audio examples.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 3: YOUR ROADMAP */}
      <section className="space-y-8">
        <div className="text-center space-y-1.5">
          <h2 className="text-2xl sm:text-3xl font-display font-bold text-slate-900 tracking-tight">
            Your Curriculum Roadmap
          </h2>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            15 comprehensive lessons designed to build fluency and master biological vocabulary.
          </p>
        </div>

        {/* PHASES SPLIT */}
        <div className="space-y-12">
          {/* PHASE 1 */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-extrabold bg-rose-50 text-rose-500 px-3 py-1 rounded-full border border-rose-100 uppercase tracking-widest">
                PHASE 1 (Lessons 1 - 5)
              </span>
              <h3 className="font-display font-bold text-lg text-slate-900">The Foundations</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {lessons.slice(0, 5).map((l) => {
                const stats = lessonProgressStats[l.id];
                const isDone = stats && stats.completed === stats.total;
                const isPerfect = stats && stats.perfect;
                
                return (
                  <div
                    key={l.id}
                    onClick={() => navigateToLesson(l.id)}
                    className={`border cursor-pointer rounded-2xl p-4 transition-all duration-200 shadow-xs hover:shadow-md hover:-translate-y-1 ${
                      isPerfect 
                        ? "border-emerald-300 bg-emerald-50/20 hover:border-emerald-400 font-bold" 
                        : "bg-white border-rose-100/60 hover:border-rose-300 hover:bg-rose-50/10"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-mono text-slate-400 font-semibold">L{l.id}</span>
                      {isPerfect ? (
                        <span className="text-emerald-600 text-xs flex items-center gap-0.5 font-bold">
                          <Check className="w-3.5 h-3.5" /> Aced
                        </span>
                      ) : isDone ? (
                        <span className="text-rose-500 text-xs flex items-center gap-0.5 font-semibold">
                          <Check className="w-3 h-3" /> Done
                        </span>
                      ) : stats && stats.completed > 0 ? (
                        <span className="text-rose-500 text-xs font-bold">
                          {stats.completed}/{stats.total}
                        </span>
                      ) : null}
                    </div>
                    <h4 className="font-display font-bold text-sm text-slate-900 line-clamp-1 mb-1">
                      {l.title.replace(/Lesson \d+: /, "")}
                    </h4>
                    <p className="text-xxs text-slate-500 line-clamp-1">🔬 {l.reading.title}</p>
                    <p className="text-xxs text-slate-500 line-clamp-1">🧠 {l.grammar.title}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* PHASE 2 */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-extrabold bg-teal-50 text-teal-600 px-3 py-1 rounded-full border border-teal-100 uppercase tracking-widest">
                PHASE 2 (Lessons 6 - 10)
              </span>
              <h3 className="font-display font-bold text-lg text-slate-900">The World Around Us</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {lessons.slice(5, 10).map((l) => {
                const stats = lessonProgressStats[l.id];
                const isDone = stats && stats.completed === stats.total;
                const isPerfect = stats && stats.perfect;
                
                return (
                  <div
                    key={l.id}
                    onClick={() => navigateToLesson(l.id)}
                    className={`border cursor-pointer rounded-2xl p-4 transition-all duration-200 shadow-xs hover:shadow-md hover:-translate-y-1 ${
                      isPerfect 
                        ? "border-emerald-300 bg-emerald-50/20 hover:border-emerald-400 font-bold" 
                        : "bg-white border-rose-100/60 hover:border-rose-300 hover:bg-rose-50/10"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-mono text-slate-400 font-semibold">L{l.id}</span>
                      {isPerfect ? (
                        <span className="text-emerald-600 text-xs flex items-center gap-0.5 font-bold">
                          <Check className="w-3.5 h-3.5" /> Aced
                        </span>
                      ) : isDone ? (
                        <span className="text-rose-500 text-xs flex items-center gap-0.5 font-semibold">
                          <Check className="w-3 h-3" /> Done
                        </span>
                      ) : stats && stats.completed > 0 ? (
                        <span className="text-rose-500 text-xs font-bold">
                          {stats.completed}/{stats.total}
                        </span>
                      ) : null}
                    </div>
                    <h4 className="font-display font-bold text-sm text-slate-900 line-clamp-1 mb-1">
                      {l.title.replace(/Lesson \d+: /, "")}
                    </h4>
                    <p className="text-xxs text-slate-500 line-clamp-1">🔬 {l.reading.title}</p>
                    <p className="text-xxs text-slate-500 line-clamp-1">🧠 {l.grammar.title}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* PHASE 3 */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-extrabold bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full border border-indigo-100 uppercase tracking-widest">
                PHASE 3 (Lessons 11 - 15)
              </span>
              <h3 className="font-display font-bold text-lg text-slate-900">The Deep Dive</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {lessons.slice(10, 15).map((l) => {
                const stats = lessonProgressStats[l.id];
                const isDone = stats && stats.completed === stats.total;
                const isPerfect = stats && stats.perfect;
                
                return (
                  <div
                    key={l.id}
                    onClick={() => navigateToLesson(l.id)}
                    className={`border cursor-pointer rounded-2xl p-4 transition-all duration-200 shadow-xs hover:shadow-md hover:-translate-y-1 ${
                      isPerfect 
                        ? "border-emerald-300 bg-emerald-50/20 hover:border-emerald-400 font-bold" 
                        : "bg-white border-rose-100/60 hover:border-rose-300 hover:bg-rose-50/10"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-mono text-slate-400 font-semibold">L{l.id}</span>
                      {isPerfect ? (
                        <span className="text-emerald-600 text-xs flex items-center gap-0.5 font-bold">
                          <Check className="w-3.5 h-3.5" /> Aced
                        </span>
                      ) : isDone ? (
                        <span className="text-rose-500 text-xs flex items-center gap-0.5 font-semibold">
                          <Check className="w-3 h-3" /> Done
                        </span>
                      ) : stats && stats.completed > 0 ? (
                        <span className="text-rose-500 text-xs font-bold">
                          {stats.completed}/{stats.total}
                        </span>
                      ) : null}
                    </div>
                    <h4 className="font-display font-bold text-sm text-slate-900 line-clamp-1 mb-1">
                      {l.title.replace(/Lesson \d+: /, "")}
                    </h4>
                    <p className="text-xxs text-slate-500 line-clamp-1">🔬 {l.reading.title}</p>
                    <p className="text-xxs text-slate-500 line-clamp-1">🧠 {l.grammar.title}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* CALL TO ACTION FOOTER */}
      <footer className="max-w-2xl mx-auto text-center space-y-6 pt-6 pb-12">
        <button
          onClick={() => navigateToLesson(1)}
          className="group relative inline-flex items-center gap-3 bg-rose-500 hover:bg-rose-600 text-white font-display font-bold text-lg px-8 py-4 rounded-2xl shadow-lg shadow-rose-950/10 hover:shadow-rose-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 cursor-pointer"
        >
          <span>Begin Lesson 1: The Microbiome</span>
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
        </button>
        <p className="text-sm text-gray-500 italic">
          "Take it at your own pace. I am so proud of you. ❤️"
        </p>
      </footer>
    </div>
  );
};
