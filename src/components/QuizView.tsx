import React from "react";
import { ArrowRight, Trophy } from "lucide-react";

interface QuizViewProps {
  quizHighScores: Record<string, number>;
  activeQuizType: "phase1" | "phase2" | "phase3" | "cumulative" | null;
  setActiveQuizType: React.Dispatch<React.SetStateAction<"phase1" | "phase2" | "phase3" | "cumulative" | null>>;
  quizQuestions: any[];
  quizCurrentIdx: number;
  quizSelectedOption: string;
  setQuizSelectedOption: (val: string) => void;
  quizSubmitted: boolean;
  quizUserAnswers: Record<number, { selected: string; isCorrect: boolean }>;
  quizScore: number;
  quizCompleted: boolean;
  startCumulativeQuiz: (type: "phase1" | "phase2" | "phase3" | "cumulative") => void;
  submitQuizQuestion: () => void;
  nextQuizQuestion: () => void;
}

export const QuizView: React.FC<QuizViewProps> = ({
  quizHighScores,
  activeQuizType,
  setActiveQuizType,
  quizQuestions,
  quizCurrentIdx,
  quizSelectedOption,
  setQuizSelectedOption,
  quizSubmitted,
  quizUserAnswers,
  quizScore,
  quizCompleted,
  startCumulativeQuiz,
  submitQuizQuestion,
  nextQuizQuestion
}) => {
  if (activeQuizType === null) {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-1.5">
          <span className="text-[10px] font-extrabold text-pink-500 bg-pink-50 px-3 py-1 rounded-full uppercase tracking-wider">
            Evaluation Center
          </span>
          <h2 className="text-2xl sm:text-3xl font-display font-bold text-slate-900 tracking-tight">Cumulative Quiz Arena</h2>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Validate your retention with randomized 10-question evaluation checkouts from across completed checkpoints.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {[
            {
              id: "phase1",
              title: "Phase 1: Foundations",
              range: "Lessons 1 - 5",
              desc: "Populations, molecular biology, and bioscience. True/False and grammatical integrations.",
              scoreKey: "phase1"
            },
            {
              id: "phase2",
              title: "Phase 2: World Around Us",
              range: "Lessons 6 - 10",
              desc: "Environmental structures, active tenses, and medical scenarios.",
              scoreKey: "phase2"
            },
            {
              id: "phase3",
              title: "Phase 3: Deep Dives",
              range: "Lessons 11 - 15",
              desc: "Neurobiology, genetic structures, and advanced core sentence structures.",
              scoreKey: "phase3"
            },
            {
              id: "cumulative",
              title: "Phase Grand Cumulative",
              range: "Lessons 1 - 15",
              desc: "The ultimate cumulative 10-question checkout. Perfect for locked-in mastery.",
              scoreKey: "cumulative"
            }
          ].map((qz) => {
            const highScore = quizHighScores[qz.scoreKey] || 0;
            return (
              <div
                key={qz.id}
                className="bg-white border border-rose-100/50 hover:border-pink-200/60 rounded-[2rem] p-6.5 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between gap-5 relative overflow-hidden group"
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <span className="text-[9px] font-mono font-bold bg-pink-50 text-pink-500 px-2 py-0.5 rounded-full border border-pink-100/50 uppercase tracking-widest">
                      {qz.range}
                    </span>
                    {highScore > 0 ? (
                      <div className="flex items-center gap-1.5 text-xs font-bold text-pink-600 bg-pink-50 px-2.5 py-1 rounded-full border border-pink-100">
                        <Trophy className="w-3.5 h-3.5 fill-pink-100" />
                        <span>High Score: {highScore}%</span>
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-medium">Unattempted</span>
                    )}
                  </div>
                  <h4 className="font-display font-bold text-lg text-slate-900">{qz.title}</h4>
                  <p className="text-xs text-slate-500 leading-relaxed font-normal">{qz.desc}</p>
                </div>

                <button
                  onClick={() => startCumulativeQuiz(qz.id as any)}
                  className="w-full py-3 bg-pink-500 hover:bg-pink-600 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer text-center"
                >
                  ⚡ Enter Quiz Arena
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  /* ACTIVE QUIZ VIEWPORT */
  return (
    <div className="bg-white border border-pink-50 border-b-4 border-b-pink-100 rounded-[2rem] p-6 sm:p-8 shadow-sm space-y-6">
      {/* Quiz Header */}
      <div className="flex justify-between items-center border-b border-pink-50 pb-4">
        <div>
          <span className="text-xxs font-mono font-bold uppercase tracking-widest text-pink-500">
            Active Quiz: {activeQuizType === "cumulative" ? "Grand Cumulative" : activeQuizType === "phase1" ? "Phase 1" : activeQuizType === "phase2" ? "Phase 2" : "Phase 3"}
          </span>
          <h4 className="font-display font-bold text-lg text-slate-900 mt-0.5">Evaluation Check</h4>
        </div>
        <button
          onClick={() => {
            if (window.confirm("Are you sure you want to exit the current quiz? Your score will be lost.")) {
              setActiveQuizType(null);
            }
          }}
          className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
        >
          Exit Arena
        </button>
      </div>

      {!quizCompleted ? (
        /* 1. RUNNING QUESTION VIEWPORT */
        (() => {
          const currentQ = quizQuestions[quizCurrentIdx];
          if (!currentQ) return null;

          return (
            <div className="space-y-6">
              {/* Question Progress bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xxs font-mono text-slate-400 font-bold">
                  <span>Question {quizCurrentIdx + 1} of {quizQuestions.length}</span>
                  <span>Current Score: {quizScore} / {quizQuestions.length}</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-pink-500 transition-all duration-300"
                    style={{ width: `${((quizCurrentIdx + 1) / quizQuestions.length) * 100}%` }}
                  />
                </div>
              </div>

              {/* Question box */}
              <div className="space-y-4 bg-pink-50/15 border border-pink-100/35 p-5 sm:p-6 rounded-2xl relative">
                <span className="text-[9px] font-mono font-extrabold bg-pink-50 text-pink-500 border border-pink-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  {currentQ.category || "Populations Exam"}
                </span>
                <p className="text-sm sm:text-base font-semibold text-slate-900 leading-normal">{currentQ.question}</p>
                <p className="text-[10px] text-slate-400 font-mono">Derived from: Lesson {currentQ.lessonId} - {currentQ.lessonTitle}</p>
              </div>

              {/* OPTIONS / INPUT AREA */}
              {currentQ.type === "true_false" && (
                <div className="grid grid-cols-2 gap-3 pl-4">
                  {["true", "false"].map((val) => {
                    const isSelected = quizSelectedOption === val;
                    return (
                      <button
                        key={val}
                        disabled={quizSubmitted}
                        onClick={() => setQuizSelectedOption(val)}
                        className={`py-3 px-4 rounded-xl border text-sm font-semibold capitalize transition-all cursor-pointer ${
                          isSelected
                            ? "border-pink-500 bg-pink-50 text-pink-600 font-bold"
                            : "border-rose-100 hover:bg-rose-50/20 text-slate-700"
                        } disabled:opacity-80`}
                      >
                        {val}
                      </button>
                    );
                  })}
                </div>
              )}

              {currentQ.type === "qcm" && (
                <div className="space-y-2.5 pl-4">
                  {currentQ.options?.map((opt: string) => {
                    const isSelected = quizSelectedOption === opt;
                    return (
                      <button
                        key={opt}
                        disabled={quizSubmitted}
                        onClick={() => setQuizSelectedOption(opt)}
                        className={`w-full text-left py-3 px-4 rounded-xl border text-sm transition-all cursor-pointer ${
                          isSelected
                            ? "border-pink-500 bg-pink-50 text-pink-600 font-bold"
                            : "border-rose-100 hover:bg-rose-50/20 text-slate-700"
                        } disabled:opacity-80`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              )}

              {currentQ.type === "fill_in_the_blank" && (
                <div className="flex flex-col sm:flex-row items-stretch gap-3 pl-4">
                  <input
                    type="text"
                    disabled={quizSubmitted}
                    value={quizSelectedOption}
                    placeholder="Type answer form..."
                    onChange={(e) => setQuizSelectedOption(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && quizSelectedOption.trim()) {
                        submitQuizQuestion();
                      }
                    }}
                    className="flex-1 px-4 py-3 text-sm bg-pink-50/5 focus:bg-white border border-pink-100 rounded-xl outline-none transition-all font-mono font-semibold"
                  />
                </div>
              )}

              {/* ACTIONS & EXPLANATION ROW */}
              <div className="pl-4 border-t border-pink-50 pt-5 mt-4 flex flex-col gap-4">
                {!quizSubmitted ? (
                  <button
                    disabled={!quizSelectedOption.trim()}
                    onClick={submitQuizQuestion}
                    className="px-6 py-3 bg-pink-500 hover:bg-pink-600 text-white font-bold text-xs rounded-xl disabled:bg-slate-50 disabled:text-slate-300 self-start transition-all cursor-pointer"
                  >
                    Submit Verification
                  </button>
                ) : (
                  <div className="space-y-4 w-full">
                    <div className="flex items-center gap-3">
                      <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                        quizUserAnswers[quizCurrentIdx]?.isCorrect
                          ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                          : "bg-red-50 text-red-600 border-red-200"
                      }`}>
                        {quizUserAnswers[quizCurrentIdx]?.isCorrect ? "Correct answer!" : "Incorrect Answer"}
                      </div>
                      <button
                        onClick={nextQuizQuestion}
                        className="px-5 py-2.5 bg-pink-500 hover:bg-pink-600 text-white font-bold text-xs rounded-xl flex items-center gap-1 transition-all cursor-pointer shadow-xs"
                      >
                        <span>{quizCurrentIdx + 1 === quizQuestions.length ? "Finish Quiz" : "Next Question"}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Explanation */}
                    <div className="bg-pink-50/20 border border-pink-100 p-4 rounded-xl text-xs sm:text-sm text-slate-600 leading-relaxed">
                      <p className="font-bold text-slate-800 mb-1">
                        Correct Answer: <span className="font-mono text-emerald-600 bg-emerald-50/60 px-1.5 py-0.5 rounded">{currentQ.correct_answer}</span>
                      </p>
                      {currentQ.explanation && <p className="text-slate-500 font-medium">{currentQ.explanation}</p>}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })()
      ) : (
        /* 2. COMPLETED SUMMARY VIEWS */
        <div className="text-center py-6 space-y-6 max-w-md mx-auto">
          <div className="text-6xl animate-bounce">🏆⭐🥇</div>
          <div className="space-y-1.5">
            <h4 className="font-display font-black text-2xl text-slate-900">Quiz Completed!</h4>
            <p className="text-sm text-slate-500 font-medium">Outstanding work completing this cumulative checkout.</p>
          </div>

          <div className="bg-[#FFFAF9] border border-pink-100 rounded-3xl p-6 grid grid-cols-2 gap-4">
            <div className="text-center">
              <p className="text-xxs font-bold text-slate-400 uppercase tracking-wider mb-1">Your Score</p>
              <h5 className="text-2xl font-display font-black text-pink-600">{quizScore} / {quizQuestions.length}</h5>
            </div>
            <div className="text-center border-l border-pink-100/40">
              <p className="text-xxs font-bold text-slate-400 uppercase tracking-wider mb-1">Percentage</p>
              <h5 className="text-2xl font-display font-black text-pink-600">
                {Math.round((quizScore / quizQuestions.length) * 100)}%
              </h5>
            </div>
          </div>

          <div className="flex gap-3 justify-center">
            <button
              onClick={() => startCumulativeQuiz(activeQuizType!)}
              className="px-5 py-2.5 bg-white hover:bg-rose-50 border border-rose-200 text-rose-500 font-bold text-xs rounded-xl cursor-pointer transition-colors"
            >
              🔄 Retake Quiz
            </button>
            <button
              onClick={() => setActiveQuizType(null)}
              className="px-5 py-2.5 bg-pink-500 hover:bg-pink-600 text-white font-bold text-xs rounded-xl cursor-pointer transition-colors shadow-xs"
            >
              🏆 Return to Arena
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
