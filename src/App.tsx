/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  BookOpen,
  Brain,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Trophy,
  Heart,
  ArrowRight,
  ArrowLeft,
  Volume2,
  BookmarkCheck,
  Award,
  Sparkles,
  Layers,
  ChevronRight,
  BookMarked,
  RotateCcw,
  Star,
  Check,
  User,
  GraduationCap,
  Download,
  Printer
} from "lucide-react";
import staticLessonsData from "../public/data/lessons.json";
import { RoadmapView } from "./components/RoadmapView";
import { SrsView } from "./components/SrsView";
import { QuizView } from "./components/QuizView";
import { GrammarExplanationRenderer } from "./components/GrammarExplanationRenderer";
import { exportLessonToPrintPDF } from "./utils/pdfExporter";
import Markdown from "react-markdown";

// --- TYPES ---
interface Exercise {
  id: string;
  type: "true_false" | "qcm" | "fill_in_the_blank";
  question: string;
  options?: string[];
  correct_answer: string;
  explanation?: string;
}

interface ReadingSection {
  title: string;
  text: string;
  exercises: Exercise[];
}

interface GrammarSection {
  title: string;
  explanation: string;
  exercises: Exercise[];
}

interface VocabularyItem {
  word: string;
  definition: string;
}

interface VocabularySection {
  theme: string;
  display_type: "visual_diagram" | "text_list";
  image_url?: string;
  items: VocabularyItem[];
}

interface Verb {
  base: string;
  past_simple: string;
  past_participle: string;
  meaning: string;
  example: string;
}

interface Lesson {
  id: number;
  title: string;
  reading: ReadingSection;
  grammar: GrammarSection;
  vocabulary: VocabularySection;
  verbs: Verb[];
}

// Interactive support messages for our custom platform
const SUCCESS_MESSAGES = [
  "Incredible! Your English is as brilliant as your mind! 🧠✨",
  "Aced it! I am so incredibly proud of you! ❤️",
  "Perfect answer, my favorite scientist! 🌸",
  "Exactly! You are mastering this step-by-step! 🚀",
  "Look at you go! Absolute genius! 🤍",
  "Spot on! Your hard work is locking in those acquisitions! 🔒✨",
  "Brilliant! Keep shining bright! ⭐",
  "Amazing! ILY to the moon and back! 🌙💫"
];

export default function App() {
  // --- STATE ---
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [activeLessonId, setActiveLessonId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"reading" | "grammar" | "vocabulary" | "verbs">("reading");
  
  // Home Page Sub-tabs
  const [homeSubTab, setHomeSubTab] = useState<"roadmap" | "srs" | "quiz">("roadmap");

  // Expanded verb list states for conjugations
  const [expandedVerbs, setExpandedVerbs] = useState<Record<string, boolean>>({});

  // Spaced Repetition System (SRS) states
  const [srsDeck, setSrsDeck] = useState<any[]>([]);
  const [srsCurrentIdx, setSrsCurrentIdx] = useState<number>(0);
  const [srsRevealed, setSrsRevealed] = useState<boolean>(false);
  const [srsFilter, setSrsFilter] = useState<"due" | "all" | "mastered">("due");

  // Cumulative Quiz Arena states
  const [activeQuizType, setActiveQuizType] = useState<"phase1" | "phase2" | "phase3" | "cumulative" | null>(null);
  const [quizQuestions, setQuizQuestions] = useState<any[]>([]);
  const [quizCurrentIdx, setQuizCurrentIdx] = useState<number>(0);
  const [quizSelectedOption, setQuizSelectedOption] = useState<string>("");
  const [quizSubmitted, setQuizSubmitted] = useState<boolean>(false);
  const [quizUserAnswers, setQuizUserAnswers] = useState<Record<number, { selected: string; isCorrect: boolean }>>({});
  const [quizScore, setQuizScore] = useState<number>(0);
  const [quizCompleted, setQuizCompleted] = useState<boolean>(false);
  const [quizHighScores, setQuizHighScores] = useState<Record<string, number>>({});

  // Loading & Dynamic states
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Exercise & Quiz completion tracking (persisted via localStorage)
  // Format: { [exerciseId]: { selectedAnswer: string, isCorrect: boolean, submitted: boolean } }
  const [answers, setAnswers] = useState<Record<string, { selected: string; isCorrect: boolean; submitted: boolean }>>({});
  
  // Vocab Practice Quiz state
  const [vocabQuizActive, setVocabQuizActive] = useState<boolean>(false);
  const [vocabQuizScore, setVocabQuizScore] = useState<{ correct: number; total: number; submitted: boolean } | null>(null);
  const [vocabQuizAnswers, setVocabQuizAnswers] = useState<Record<string, string>>({}); // { [word]: selectedDefinition }
  
  // Verb Quiz state
  const [verbQuizActive, setVerbQuizActive] = useState<boolean>(false);
  const [verbQuizSubmitted, setVerbQuizSubmitted] = useState<boolean>(false);
  const [verbQuizInput, setVerbQuizInput] = useState<Record<string, { past: string; participle: string }>>({}); // { [baseVerb]: { past, participle } }

  // Cute interactive visual diagram active hotspot
  const [activeHotspot, setActiveHotspot] = useState<string | null>(null);

  // 3D Flashcard State
  const [currentFlashcardIndex, setCurrentFlashcardIndex] = useState<number>(0);
  const [isFlashcardFlipped, setIsFlashcardFlipped] = useState<boolean>(false);

  // Encouragement overlay
  const [successQuote, setSuccessQuote] = useState<string>("");
  const [showCelebration, setShowCelebration] = useState<boolean>(false);

  // --- COMPILER FALLBACK & FETCH LOGIC ---
  useEffect(() => {
    setLoading(true);
    // Fetch data/lessons.json dynamically
    fetch("data/lessons.json")
      .then((res) => {
        if (!res.ok) throw new Error("Could not fetch database file");
        return res.json();
      })
      .then((data) => {
        if (data && data.lessons) {
          setLessons(data.lessons);
        } else {
          throw new Error("Invalid lessons database format");
        }
        setLoading(false);
      })
      .catch((err) => {
        console.warn("Dynamic lessons.json fetch failed. Falling back to statically bundled lessons.", err);
        // Bulletproof fallback to synchronous import
        if (staticLessonsData && staticLessonsData.lessons) {
          setLessons(staticLessonsData.lessons as Lesson[]);
        } else {
          setError("Failed to load platform materials. Please try reloading.");
        }
        setLoading(false);
      });
  }, []);

  // --- PERSISTENCE LOAD/SAVE ---
  useEffect(() => {
    const savedAnswers = localStorage.getItem("english_platform_progress");
    if (savedAnswers) {
      try {
        setAnswers(JSON.parse(savedAnswers));
      } catch (e) {
        console.error("Error reading saved progress", e);
      }
    }

    const savedSrs = localStorage.getItem("english_platform_srs");
    if (savedSrs) {
      try {
        setSrsDeck(JSON.parse(savedSrs));
      } catch (e) {
        console.error("Error reading saved SRS deck", e);
      }
    }

    const savedHighScores = localStorage.getItem("english_platform_quiz_high_scores");
    if (savedHighScores) {
      try {
        setQuizHighScores(JSON.parse(savedHighScores));
      } catch (e) {
        console.error("Error reading saved quiz high scores", e);
      }
    }
  }, []);

  const saveProgress = (newAnswers: typeof answers) => {
    setAnswers(newAnswers);
    localStorage.setItem("english_platform_progress", JSON.stringify(newAnswers));
  };

  const saveSrsDeckToStorage = (newDeck: any[]) => {
    setSrsDeck(newDeck);
    localStorage.setItem("english_platform_srs", JSON.stringify(newDeck));
  };

  const saveQuizHighScoresToStorage = (newScores: Record<string, number>) => {
    setQuizHighScores(newScores);
    localStorage.setItem("english_platform_quiz_high_scores", JSON.stringify(newScores));
  };

  const handleResetAllProgress = () => {
    if (window.confirm("Would you like to reset all of your lesson progress, SRS vocabulary deck, and cumulative quiz scores? ❤️")) {
      setAnswers({});
      setSrsDeck([]);
      setQuizHighScores({});
      localStorage.removeItem("english_platform_progress");
      localStorage.removeItem("english_platform_srs");
      localStorage.removeItem("english_platform_quiz_high_scores");
      
      // Reset current active states
      setActiveQuizType(null);
      setQuizQuestions([]);
      setQuizCompleted(false);
      
      setSuccessQuote("All progress, SRS reviews, and quiz scores have been cleared. A fresh start awaits! 🤍");
      setTimeout(() => setSuccessQuote(""), 3000);
    }
  };

  // --- ROUTING & HASH NAVIGATION ---
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (!hash || hash === "#") {
        setActiveLessonId(null);
        setVocabQuizActive(false);
        setVerbQuizActive(false);
        setVerbQuizSubmitted(false);
      } else {
        const params = new URLSearchParams(hash.substring(1));
        const lessonIdStr = params.get("lesson");
        const tabStr = params.get("tab");
        
        if (lessonIdStr) {
          const id = parseInt(lessonIdStr, 10);
          setActiveLessonId(id);
          setVocabQuizActive(false);
          setVerbQuizActive(false);
          setVerbQuizSubmitted(false);
          if (tabStr && ["reading", "grammar", "vocabulary", "verbs"].includes(tabStr)) {
            setActiveTab(tabStr as any);
          } else {
            setActiveTab("reading");
          }
        }
      }
    };

    window.addEventListener("hashchange", handleHashChange);
    // Execute on initial render
    handleHashChange();

    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const navigateToLesson = (lessonId: number, tab: string = "reading") => {
    window.location.hash = `lesson=${lessonId}&tab=${tab}`;
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const navigateToHome = () => {
    window.location.hash = "";
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // --- CALCULATE PROGRESS STATS ---
  const activeLesson = useMemo(() => {
    return lessons.find((l) => l.id === activeLessonId) || null;
  }, [lessons, activeLessonId]);

  // Track completed exercise counts per lesson
  const lessonProgressStats = useMemo(() => {
    const stats: Record<number, { completed: number; total: number; perfect: boolean }> = {};
    
    lessons.forEach((lesson) => {
      let total = 0;
      let completed = 0;
      let allCorrect = true;

      // Count reading exercises
      lesson.reading.exercises.forEach((ex) => {
        total++;
        if (answers[ex.id]?.submitted) {
          completed++;
          if (!answers[ex.id]?.isCorrect) allCorrect = false;
        } else {
          allCorrect = false;
        }
      });

      // Count grammar exercises
      lesson.grammar.exercises.forEach((ex) => {
        total++;
        if (answers[ex.id]?.submitted) {
          completed++;
          if (!answers[ex.id]?.isCorrect) allCorrect = false;
        } else {
          allCorrect = false;
        }
      });

      stats[lesson.id] = { completed, total, perfect: allCorrect && completed === total };
    });

    return stats;
  }, [lessons, answers]);

  // Current lesson-specific progress
  const currentLessonCompletionStatus = useMemo(() => {
    if (!activeLesson) return { reading: false, grammar: false, totalCompleted: 0, totalQuestions: 0 };
    
    const rCompleted = activeLesson.reading.exercises.every(ex => answers[ex.id]?.submitted);
    const gCompleted = activeLesson.grammar.exercises.every(ex => answers[ex.id]?.submitted);
    
    const rCorrectCount = activeLesson.reading.exercises.filter(ex => answers[ex.id]?.isCorrect && answers[ex.id]?.submitted).length;
    const gCorrectCount = activeLesson.grammar.exercises.filter(ex => answers[ex.id]?.isCorrect && answers[ex.id]?.submitted).length;

    const totalQuestions = activeLesson.reading.exercises.length + activeLesson.grammar.exercises.length;
    const totalCompleted = activeLesson.reading.exercises.filter(ex => answers[ex.id]?.submitted).length +
                           activeLesson.grammar.exercises.filter(ex => answers[ex.id]?.submitted).length;

    return {
      reading: rCompleted,
      grammar: gCompleted,
      rCorrectCount,
      gCorrectCount,
      totalCompleted,
      totalQuestions,
      percentage: totalQuestions > 0 ? Math.round((totalCompleted / totalQuestions) * 100) : 0
    };
  }, [activeLesson, answers]);

  // --- AUDIO TEXT-TO-SPEECH ENGINES ---
  const speakText = (text: string) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel(); // cancel current speech
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9; // speak slightly slower for ultimate learning clarity
      // Try to find a premium English voice if possible
      const voices = window.speechSynthesis.getVoices();
      const engVoice = voices.find(v => v.lang.startsWith("en-GB") || v.lang.startsWith("en-US"));
      if (engVoice) {
        utterance.voice = engVoice;
      }
      window.speechSynthesis.speak(utterance);
    } else {
      alert("Text-to-speech is not supported in this browser, but your English sounds amazing anyway!");
    }
  };

  // --- INTERACTIVE ACTIONS & SUBMITS ---
  const handleAnswerSelect = (exerciseId: string, value: string) => {
    // Only allow selecting if not yet submitted
    if (answers[exerciseId]?.submitted) return;
    
    setAnswers(prev => ({
      ...prev,
      [exerciseId]: {
        selected: value,
        isCorrect: false,
        submitted: false
      }
    }));
  };

  const handleAnswerSubmit = (exerciseId: string, correctAnswer: string) => {
    const state = answers[exerciseId];
    if (!state || !state.selected || state.submitted) return;

    const isCorrect = state.selected.trim().toLowerCase() === correctAnswer.trim().toLowerCase();
    
    const updated = {
      ...answers,
      [exerciseId]: {
        ...state,
        isCorrect,
        submitted: true
      }
    };

    saveProgress(updated);

    if (isCorrect) {
      // Show celebration and a lovely customized feedback quote
      const randMessage = SUCCESS_MESSAGES[Math.floor(Math.random() * SUCCESS_MESSAGES.length)];
      setSuccessQuote(randMessage);
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 4000);
    } else {
      setSuccessQuote("Oh, almost! Don't worry, we are polishing those skills step-by-step. Let's read the explanation! 🤍");
      setTimeout(() => setSuccessQuote(""), 3500);
    }
  };

  const handleResetExercise = (exerciseId: string) => {
    const updated = { ...answers };
    delete updated[exerciseId];
    saveProgress(updated);
    if (successQuote) setSuccessQuote("");
  };

  // --- SPACED REPETITION SYSTEM (SRS) LOGIC ---
  const syncSrsDeck = (loadedLessons: Lesson[] = lessons) => {
    const allVocabItems: any[] = [];
    loadedLessons.forEach((lesson) => {
      if (lesson.vocabulary && lesson.vocabulary.items) {
        lesson.vocabulary.items.forEach((item) => {
          allVocabItems.push({
            word: item.word,
            definition: item.definition,
            lessonId: lesson.id,
            lessonTitle: lesson.title,
          });
        });
      }
    });

    const updatedDeck = [...srsDeck];
    let addedCount = 0;
    allVocabItems.forEach((vItem) => {
      const exists = updatedDeck.some((dItem) => dItem.word.toLowerCase() === vItem.word.toLowerCase());
      if (!exists) {
        updatedDeck.push({
          word: vItem.word,
          definition: vItem.definition,
          lessonId: vItem.lessonId,
          lessonTitle: vItem.lessonTitle,
          stage: 0, // 0 = New, 1 = Fresh, 2 = Familiar, 3 = Proficient, 4 = Advanced, 5 = Mastered
          nextReview: Date.now(), // Due immediately
          history: [],
        });
        addedCount++;
      }
    });

    if (addedCount > 0) {
      saveSrsDeckToStorage(updatedDeck);
      setSuccessQuote(`Synchronized successfully! Added ${addedCount} vocabulary words to your memory deck. 🧠⚡`);
    } else {
      setSuccessQuote("Your memory deck is already fully up-to-date with all lesson vocabulary! 🤍");
    }
    setTimeout(() => setSuccessQuote(""), 3500);
  };

  const handleSrsAnswer = (word: string, isCorrect: boolean) => {
    const updated = srsDeck.map((item) => {
      if (item.word.toLowerCase() === word.toLowerCase()) {
        const oldStage = item.stage;
        let newStage = oldStage;
        if (isCorrect) {
          newStage = Math.min(5, oldStage + 1);
        } else {
          newStage = 0; // classic Leitner reset or drop to 0 for deep relearning
        }

        // Intervals:
        // Stage 0: 30s
        // Stage 1: 2m
        // Stage 2: 10m
        // Stage 3: 1h
        // Stage 4: 5h
        // Stage 5: 24h
        const intervals = [30 * 1000, 120 * 1000, 600 * 1000, 3600 * 1000, 18000 * 1000, 86400 * 1000];
        const nextInterval = intervals[newStage] || 30 * 1000;
        
        return {
          ...item,
          stage: newStage,
          nextReview: Date.now() + nextInterval,
          history: [...(item.history || []), isCorrect],
        };
      }
      return item;
    });

    saveSrsDeckToStorage(updated);
    setSrsRevealed(false);

    // Filter down to the list of remaining due words after this review
    const dueRemaining = updated.filter(item => item.nextReview <= Date.now());
    if (dueRemaining.length === 0) {
      setSrsCurrentIdx(0);
      setSuccessQuote("Glorious! All due reviews are complete for now. No pressure, just progress! 🤍🏆");
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 5000);
    } else {
      // Stay on current or wrap around
      if (srsCurrentIdx >= dueRemaining.length) {
        setSrsCurrentIdx(0);
      }
    }
  };

  const forceReadySrsWords = () => {
    const updated = srsDeck.map(item => ({
      ...item,
      nextReview: Date.now() // set review to now
    }));
    saveSrsDeckToStorage(updated);
    setSrsCurrentIdx(0);
    setSrsRevealed(false);
    setSuccessQuote("Time Leap Activated! ⚡ All vocabulary reviews are due immediately.");
    setTimeout(() => setSuccessQuote(""), 3000);
  };


  // --- CUMULATIVE QUIZ ARENA LOGIC ---
  const startCumulativeQuiz = (type: "phase1" | "phase2" | "phase3" | "cumulative") => {
    let targetLessons: Lesson[] = [];
    if (type === "phase1") {
      targetLessons = lessons.filter(l => l.id >= 1 && l.id <= 5);
    } else if (type === "phase2") {
      targetLessons = lessons.filter(l => l.id >= 6 && l.id <= 10);
    } else if (type === "phase3") {
      targetLessons = lessons.filter(l => l.id >= 11 && l.id <= 15);
    } else {
      targetLessons = lessons;
    }

    // Accumulate all exercises from reading and grammar
    const pool: any[] = [];
    targetLessons.forEach((lesson) => {
      if (lesson.reading && lesson.reading.exercises) {
        lesson.reading.exercises.forEach((ex) => {
          pool.push({
            ...ex,
            lessonId: lesson.id,
            lessonTitle: lesson.title,
            category: "Scientific Reading"
          });
        });
      }
      if (lesson.grammar && lesson.grammar.exercises) {
        lesson.grammar.exercises.forEach((ex) => {
          pool.push({
            ...ex,
            lessonId: lesson.id,
            lessonTitle: lesson.title,
            category: "Grammar Mastery"
          });
        });
      }
    });

    if (pool.length === 0) {
      alert("No questions are currently available for this phase range. Fill in the lessons first! ❤️");
      return;
    }

    // Shuffle pool and take 10
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, 10);

    setActiveQuizType(type);
    setQuizQuestions(selected);
    setQuizCurrentIdx(0);
    setQuizSelectedOption("");
    setQuizSubmitted(false);
    setQuizUserAnswers({});
    setQuizScore(0);
    setQuizCompleted(false);
    
    setSuccessQuote(`Quiz started! 10 cumulative questions ready. You've got this! 🌱`);
    setTimeout(() => setSuccessQuote(""), 3000);
  };

  const submitQuizQuestion = () => {
    if (quizSubmitted) return;
    const currentQ = quizQuestions[quizCurrentIdx];
    if (!currentQ) return;

    const answerToCheck = quizSelectedOption.trim().toLowerCase();
    const correctToCheck = currentQ.correct_answer.trim().toLowerCase();
    const isCorrect = answerToCheck === correctToCheck;

    setQuizUserAnswers(prev => ({
      ...prev,
      [quizCurrentIdx]: { selected: quizSelectedOption, isCorrect }
    }));
    
    if (isCorrect) {
      setQuizScore(prev => prev + 1);
      const randMessage = SUCCESS_MESSAGES[Math.floor(Math.random() * SUCCESS_MESSAGES.length)];
      setSuccessQuote(randMessage);
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 3000);
    } else {
      setSuccessQuote(`Oh! The correct answer is: "${currentQ.correct_answer}". We grow through errors! 🌱`);
    }
    setQuizSubmitted(true);
  };

  const nextQuizQuestion = () => {
    setSuccessQuote("");
    if (quizCurrentIdx + 1 < quizQuestions.length) {
      setQuizCurrentIdx(prev => prev + 1);
      setQuizSelectedOption("");
      setQuizSubmitted(false);
    } else {
      // Quiz completed! Save high score
      setQuizCompleted(true);
      const finalScorePercentage = Math.round((quizScore / quizQuestions.length) * 100);
      const prevHighScore = quizHighScores[activeQuizType!] || 0;
      
      if (finalScorePercentage > prevHighScore) {
        const updatedHighScores = {
          ...quizHighScores,
          [activeQuizType!]: finalScorePercentage
        };
        saveQuizHighScoresToStorage(updatedHighScores);
        setSuccessQuote(`🎉 AMAZING! New High Score: ${finalScorePercentage}%! ILY to the moon and back! 🤍🚀`);
        setShowCelebration(true);
        setTimeout(() => setShowCelebration(false), 5000);
      } else {
        setSuccessQuote(`Quiz Complete! You scored ${quizScore}/${quizQuestions.length}. Every step is progress! ❤️`);
      }
    }
  };

  const toggleVerbExpanded = (base: string) => {
    setExpandedVerbs(prev => ({ ...prev, [base]: !prev[base] }));
  };

  const getVerbConjugations = (v: Verb) => {
    const base = v.base.toLowerCase().trim();
    
    let present3rd = base + "s";
    if (base === "do") present3rd = "does";
    else if (base === "have") present3rd = "has";
    else if (base === "go") present3rd = "goes";
    else if (base === "be") present3rd = "is";
    else if (base.endsWith("y") && !["a","e","i","o","u"].includes(base[base.length - 2])) {
      present3rd = base.slice(0, -1) + "ies";
    } else if (base.endsWith("sh") || base.endsWith("ch") || base.endsWith("x") || base.endsWith("z") || base.endsWith("s")) {
      present3rd = base + "es";
    }

    const isBe = base === "be";
    const presentBase = base === "have" ? "have" : base;

    return {
      present: {
        title: "Present Simple (General Truths & Habits)",
        formRule: isBe 
          ? "Irregular. I am, He/She/It is, We/You/They are." 
          : `Subject + base form (add -s/-es for 3rd person singular).`,
        conjugations: [
          { pronoun: "I", form: isBe ? "am" : presentBase },
          { pronoun: "You", form: isBe ? "are" : presentBase },
          { pronoun: "He / She / It", form: isBe ? "is" : present3rd },
          { pronoun: "We", form: isBe ? "are" : presentBase },
          { pronoun: "You", form: isBe ? "are" : presentBase },
          { pronoun: "They", form: isBe ? "are" : presentBase },
        ]
      },
      past: {
        title: "Past Simple (Completed Past Actions)",
        formRule: isBe 
          ? "Irregular. I/He/She/It was, We/You/They were." 
          : `Subject + Past Simple form (${v.past_simple}).`,
        conjugations: [
          { pronoun: "I", form: isBe ? "was" : v.past_simple },
          { pronoun: "You", form: isBe ? "were" : v.past_simple },
          { pronoun: "He / She / It", form: isBe ? "was" : v.past_simple },
          { pronoun: "We", form: isBe ? "were" : v.past_simple },
          { pronoun: "You", form: isBe ? "were" : v.past_simple },
          { pronoun: "They", form: isBe ? "were" : v.past_simple },
        ]
      },
      perfect: {
        title: "Present Perfect (Unspecified/Ongoing Actions)",
        formRule: `Subject + have/has + Past Participle (${v.past_participle}).`,
        conjugations: [
          { pronoun: "I", form: `have ${v.past_participle}` },
          { pronoun: "You", form: `have ${v.past_participle}` },
          { pronoun: "He / She / It", form: `has ${v.past_participle}` },
          { pronoun: "We", form: `have ${v.past_participle}` },
          { pronoun: "You", form: `have ${v.past_participle}` },
          { pronoun: "They", form: `have ${v.past_participle}` },
        ]
      },
      future: {
        title: "Future Simple (Future Intentions & Facts)",
        formRule: `Subject + will + base form (${v.base}).`,
        conjugations: [
          { pronoun: "I", form: `will ${v.base}` },
          { pronoun: "You", form: `will ${v.base}` },
          { pronoun: "He / She / It", form: `will ${v.base}` },
          { pronoun: "We", form: `will ${v.base}` },
          { pronoun: "You", form: `will ${v.base}` },
          { pronoun: "They", form: `will ${v.base}` },
        ]
      }
    };
  };

  // --- VOCABULARY PRACTICE QUIZ SUBMIT ---
  const startVocabQuiz = () => {
    if (!activeLesson) return;
    
    // Prepare blank choices
    const initialQuizState: Record<string, string> = {};
    activeLesson.vocabulary.items.forEach(item => {
      initialQuizState[item.word] = "";
    });
    setVocabQuizAnswers(initialQuizState);
    setVocabQuizScore(null);
    setVocabQuizActive(true);
  };

  const handleVocabQuizOptionSelect = (word: string, definition: string) => {
    if (vocabQuizScore?.submitted) return;
    setVocabQuizAnswers(prev => ({ ...prev, [word]: definition }));
  };

  const submitVocabQuiz = () => {
    if (!activeLesson) return;
    
    let correct = 0;
    const total = activeLesson.vocabulary.items.length;
    
    activeLesson.vocabulary.items.forEach(item => {
      const selected = vocabQuizAnswers[item.word];
      if (selected === item.definition) {
        correct++;
      }
    });

    setVocabQuizScore({
      correct,
      total,
      submitted: true
    });

    if (correct === total) {
      setSuccessQuote("All vocabulary matched perfectly! You are an absolute master of bioscience words! 🌸🔬❤️");
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 5000);
    } else {
      setSuccessQuote(`You got ${correct}/${total} correct! Let's review the reference key below and master them all! ✨`);
    }
  };

  // --- VERB CONJUGATION CHALLENGE SUBMIT ---
  const startVerbQuiz = () => {
    if (!activeLesson) return;
    const initialInput: Record<string, { past: string; participle: string }> = {};
    activeLesson.verbs.forEach(v => {
      initialInput[v.base] = { past: "", participle: "" };
    });
    setVerbQuizInput(initialInput);
    setVerbQuizSubmitted(false);
    setVerbQuizActive(true);
  };

  const handleVerbInputChange = (baseVerb: string, field: "past" | "participle", value: string) => {
    if (verbQuizSubmitted) return;
    setVerbQuizInput(prev => ({
      ...prev,
      [baseVerb]: {
        ...prev[baseVerb],
        [field]: value
      }
    }));
  };

  const submitVerbQuiz = () => {
    setVerbQuizSubmitted(true);
    let allPerfect = true;

    activeLesson?.verbs.forEach(v => {
      const inputs = verbQuizInput[v.base];
      const correctPast = v.past_simple.toLowerCase().split("/").map(s => s.trim());
      const correctParticiple = v.past_participle.toLowerCase().split("/").map(s => s.trim());

      const userPast = inputs?.past.trim().toLowerCase() || "";
      const userParticiple = inputs?.participle.trim().toLowerCase() || "";

      const pastOk = correctPast.some(p => p === userPast);
      const partOk = correctParticiple.some(p => p === userParticiple);

      if (!pastOk || !partOk) {
        allPerfect = false;
      }
    });

    if (allPerfect) {
      setSuccessQuote("Flawless! All 5 core verbs conjugated perfectly! Your acquisitions are fully locked in! ⚡🔓❤️");
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 5000);
    } else {
      setSuccessQuote("Good try! Let's review the verb cards to iron out any little doubts. We grow step-by-step! 🌱");
    }
  };

  // --- RENDER HEADING LOGO ---
  const renderNavbar = () => (
    <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-rose-100 px-6 py-3.5 flex items-center justify-between">
      <div 
        onClick={navigateToHome}
        className="flex items-center gap-2 cursor-pointer font-display font-bold text-slate-900 tracking-tight text-lg hover:opacity-90 transition-opacity"
      >
        <div className="w-8 h-8 bg-rose-500 rounded-lg flex items-center justify-center text-white font-black text-sm shadow-sm">
          E
        </div>
        <span>English Journey <span className="text-rose-400">🤍</span></span>
      </div>
      <div className="flex items-center gap-4">
        <button
          onClick={handleResetAllProgress}
          className="text-xs text-rose-500 hover:text-rose-600 hover:bg-rose-50/50 flex items-center gap-1.5 transition-colors px-3 py-1.5 rounded-full border border-transparent hover:border-rose-100/50"
          title="Reset progress"
        >
          <RotateCcw className="w-3 h-3" />
          <span className="hidden sm:inline font-medium">Reset Progress</span>
        </button>
        <span className="text-xs font-semibold text-rose-500 bg-rose-50 border border-rose-100/60 px-3 py-1.5 rounded-full tracking-wider uppercase text-[10px]">
          Personal Portal v1.0
        </span>
      </div>
    </nav>
  );

  return (
    <div className="min-h-screen bg-[#FFFAF9] text-slate-800 font-sans antialiased selection:bg-rose-100 selection:text-rose-900 pb-12">
      {renderNavbar()}

      {/* SUCCESS OVERLAY ALERT */}
      <AnimatePresence>
        {successQuote && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-18 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4"
          >
            <div className="bg-white border border-rose-100 shadow-xl rounded-2xl p-4 flex items-start gap-3.5 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-rose-400 to-pink-500" />
              <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center shrink-0">
                <Heart className="w-5 h-5 text-rose-500 fill-rose-200 animate-pulse" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 leading-relaxed">{successQuote}</p>
              </div>
              <button 
                onClick={() => setSuccessQuote("")} 
                className="text-gray-400 hover:text-gray-600 text-lg font-light"
              >
                ×
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CONFETTI CELEBRATION */}
      {showCelebration && (
        <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden">
          <div className="absolute inset-0 flex justify-center items-center">
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: [0.5, 1.2, 1], opacity: [0, 1, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 1 }}
              className="text-6xl"
            >
              🎉✨🤍✨🌸
            </motion.div>
          </div>
        </div>
      )}

      {/* MAIN VIEW SYSTEM */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <RefreshCw className="w-8 h-8 text-rose-400 animate-spin" />
            <p className="text-sm text-gray-500 font-medium">Fetching lessons catalog...</p>
          </div>
        ) : error ? (
          <div className="max-w-lg mx-auto bg-white border border-red-100 rounded-3xl p-8 text-center my-12 shadow-sm">
            <XCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Could not load platform</h3>
            <p className="text-sm text-gray-500 mb-6">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-sm font-medium transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : activeLessonId === null ? (
          
          /* =========================================
             1. HOME PAGE VIEW SYSTEM (ROADMAP, SRS, QUIZZES)
             ========================================= */
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-12"
          >
            {/* HERO WELCOMING HEADER */}
            <header className="max-w-3xl mx-auto py-4">
              <div className="bg-white rounded-[2rem] p-8 sm:p-10 border border-rose-50 border-b-4 border-b-rose-100 shadow-sm relative overflow-hidden">
                <div className="absolute -top-12 -right-12 w-48 h-48 bg-rose-50 rounded-full blur-3xl opacity-60 pointer-events-none" />
                
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1, type: "spring" }}
                  className="inline-flex items-center gap-2 bg-rose-50 border border-rose-100 px-4 py-1.5 rounded-full text-rose-500 font-bold text-xs uppercase tracking-wider mb-6"
                >
                  <Sparkles className="w-3.5 h-3.5 text-rose-400 animate-spin-slow" />
                  <span>Coded from scratch, just for you 🤍</span>
                </motion.div>
                
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-black text-slate-900 leading-tight mb-4">
                  Welcome to Your <br/>
                  <span className="text-rose-500 bg-gradient-to-r from-rose-500 to-pink-500 bg-clip-text text-transparent">Custom English Journey</span>
                </h1>
                
                <p className="text-rose-400 font-bold mb-6 uppercase tracking-wider text-xs sm:text-sm">
                  Personal Portal v1.0
                </p>
                
                <p className="text-slate-600 leading-relaxed text-base sm:text-lg italic font-normal">
                  "I wanted to build something special to support you. Just like when we work on your study summaries together, this platform is our dedicated space to tackle English step-by-step. You already have a fantastic foundation—now, our goal is to secure those acquisitions, build your confidence, and make your English as brilliant as your mind."
                </p>
                
                <div className="mt-6 flex items-center justify-between flex-wrap gap-4 border-t border-rose-50 pt-4">
                  <div className="flex items-center gap-2 text-rose-600 font-bold italic text-sm sm:text-base">
                    <span>ILY to the moon and back. Let’s get started! 🤍🚀</span>
                  </div>
                  {/* OVERALL STATISTICS SUMMARY FOR TRACKING */}
                  <div className="flex items-center gap-3 bg-rose-50/50 border border-rose-100 px-3.5 py-1.5 rounded-xl">
                    <span className="text-xxs text-rose-500 font-bold uppercase tracking-wider">Overall Progress</span>
                    <span className="font-mono text-xs font-black text-rose-600 bg-white border border-rose-100 px-2 py-0.5 rounded-md">
                      {Math.round((Object.keys(answers).filter(k => answers[k]?.submitted).length / 225) * 100)}%
                    </span>
                  </div>
                </div>
              </div>
            </header>

            {/* MAIN PORTAL NAV SWITCHER */}
            <div className="flex justify-center border-b border-rose-100 max-w-2xl mx-auto pb-0">
              {[
                { id: "roadmap", label: "📚 Lessons Roadmap", color: "border-rose-500 text-rose-600 font-bold" },
                { id: "srs", label: "🧠 Vocabulary SRS Deck", color: "border-indigo-500 text-indigo-600 font-bold" },
                { id: "quiz", label: "🏆 Cumulative Quiz Arena", color: "border-pink-500 text-pink-600 font-bold" }
              ].map(tab => {
                const isActive = homeSubTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setHomeSubTab(tab.id as any);
                      setSuccessQuote("");
                    }}
                    className={`px-4 sm:px-6 py-3 text-xs sm:text-sm font-display tracking-tight border-b-2 transition-all cursor-pointer ${
                      isActive 
                        ? `${tab.color} scale-[1.02]` 
                        : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-200"
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={homeSubTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-12"
              >
                {/* Roadmap View */}
                {homeSubTab === "roadmap" && (
                  <RoadmapView
                    lessons={lessons}
                    lessonProgressStats={lessonProgressStats}
                    navigateToLesson={navigateToLesson}
                    answers={answers}
                  />
                )}

                {/* Vocabulary SRS View */}
                {homeSubTab === "srs" && (
                  <SrsView
                    lessons={lessons}
                    srsDeck={srsDeck}
                    srsCurrentIdx={srsCurrentIdx}
                    setSrsCurrentIdx={setSrsCurrentIdx}
                    srsRevealed={srsRevealed}
                    setSrsRevealed={setSrsRevealed}
                    srsFilter={srsFilter}
                    setSrsFilter={setSrsFilter}
                    syncSrsDeck={syncSrsDeck}
                    forceReadySrsWords={forceReadySrsWords}
                    handleSrsAnswer={handleSrsAnswer}
                    speakText={speakText}
                  />
                )}

                {/* Cumulative Quiz View */}
                {homeSubTab === "quiz" && (
                  <QuizView
                    quizHighScores={quizHighScores}
                    activeQuizType={activeQuizType}
                    setActiveQuizType={setActiveQuizType}
                    quizQuestions={quizQuestions}
                    quizCurrentIdx={quizCurrentIdx}
                    quizSelectedOption={quizSelectedOption}
                    setQuizSelectedOption={setQuizSelectedOption}
                    quizSubmitted={quizSubmitted}
                    quizUserAnswers={quizUserAnswers}
                    quizScore={quizScore}
                    quizCompleted={quizCompleted}
                    startCumulativeQuiz={startCumulativeQuiz}
                    submitQuizQuestion={submitQuizQuestion}
                    nextQuizQuestion={nextQuizQuestion}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </motion.div>
        ) : (
          
          /* =========================================
             2. DYNAMIC ACTIVE LESSON INTERFACE
             ========================================= */
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-8"
          >
            {/* STICKY TOP HEADER */}
            <div className="bg-white border border-rose-50 border-b-4 border-b-rose-100 rounded-[2rem] p-5 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                {/* Back button and title */}
                <div className="flex items-center gap-3.5">
                  <button
                    onClick={navigateToHome}
                    className="w-10 h-10 rounded-xl hover:bg-rose-50 flex items-center justify-center border border-rose-100/50 text-rose-500 hover:text-rose-600 transition-colors cursor-pointer"
                    title="Return to curriculum map"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-extrabold text-rose-500 uppercase tracking-widest bg-rose-50 px-2.5 py-1 rounded-full">Active Lesson</span>
                      <button
                        onClick={() => activeLesson && exportLessonToPrintPDF(activeLesson)}
                        className="flex items-center gap-1.5 px-3 py-1 text-[10px] font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100/80 border border-indigo-100 rounded-full transition-all cursor-pointer shadow-2xs"
                        title="Download/Print PDF Study Sheet for this lesson"
                      >
                        <Printer className="w-3 h-3 text-indigo-500" />
                        <span>Export PDF Guide</span>
                      </button>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-display font-bold text-slate-900 tracking-tight mt-1.5">
                      {activeLesson?.title}
                    </h2>
                  </div>
                </div>

                {/* Progress bar and score stats */}
                <div className="flex items-center gap-4 bg-rose-50/20 border border-rose-100/40 p-3 rounded-2xl self-start sm:self-auto shrink-0">
                  <div className="text-right">
                    <p className="text-xs text-rose-500/80 font-bold uppercase tracking-wider text-[10px]">Lesson Progress</p>
                    <p className="text-sm font-bold text-slate-800 font-mono">
                      {currentLessonCompletionStatus.totalCompleted} / {currentLessonCompletionStatus.totalQuestions} Exercises
                    </p>
                  </div>
                  <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
                    <svg className="absolute w-full h-full transform -rotate-90">
                      <circle
                        cx="24"
                        cy="24"
                        r="20"
                        stroke="rgba(251, 113, 133, 0.1)"
                        strokeWidth="4"
                        fill="transparent"
                      />
                      <circle
                        cx="24"
                        cy="24"
                        r="20"
                        stroke="url(#roseGradient)"
                        strokeWidth="4"
                        fill="transparent"
                        strokeDasharray={2 * Math.PI * 20}
                        strokeDashoffset={2 * Math.PI * 20 * (1 - currentLessonCompletionStatus.percentage / 100)}
                        strokeLinecap="round"
                        className="transition-all duration-500"
                      />
                      <defs>
                        <linearGradient id="roseGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#f43f5e" />
                          <stop offset="100%" stopColor="#ec4899" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <span className="text-xxs font-bold text-rose-600 font-mono">
                      {currentLessonCompletionStatus.percentage}%
                    </span>
                  </div>
                </div>
              </div>

              {/* TAB NAVIGATION BAR */}
              <div className="grid grid-cols-4 gap-1 sm:gap-2 border-t border-rose-100/50 pt-4">
                {[
                  { id: "reading", label: "Reading", icon: BookOpen, desc: "Articles & Qs" },
                  { id: "grammar", label: "Grammar", icon: Brain, desc: "Rules & Blanks" },
                  { id: "vocabulary", label: "Vocabulary", icon: Layers, desc: "Words & Diagrams" },
                  { id: "verbs", label: "Core Verbs", icon: Sparkles, desc: "The Big 5" }
                ].map((t) => {
                  const Icon = t.icon;
                  const isActive = activeTab === t.id;
                  
                  return (
                    <button
                      key={t.id}
                      onClick={() => navigateToLesson(activeLessonId!, t.id)}
                      className={`flex flex-col items-center justify-center py-2.5 px-1.5 sm:px-3 rounded-2xl transition-all cursor-pointer ${
                        isActive
                          ? "bg-rose-50 text-rose-600 font-bold border border-rose-100/50 shadow-xs"
                          : "hover:bg-rose-50/30 text-slate-500 hover:text-rose-600 border border-transparent"
                      }`}
                    >
                      <Icon className={`w-4 h-4 sm:w-5 h-5 mb-1 ${isActive ? "text-rose-500" : ""}`} />
                      <span className="text-xs font-display tracking-tight leading-none">{t.label}</span>
                      <span className="hidden sm:inline text-xxs font-light mt-0.5 opacity-70">{t.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* TAB CONTAINER - OPTIMIZED FOR COMFORT READING */}
            <div className="max-w-3xl mx-auto w-full space-y-8">
              
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  
                  {/* =========================================
                     TAB A: READING CONTENT
                     ========================================= */}
                  {activeTab === "reading" && activeLesson && (
                    <div className="space-y-8">
                       {/* Editorial Reading Card */}
                      <div className="bg-white border border-rose-50 border-b-4 border-b-rose-100 rounded-[2rem] p-6 sm:p-8 shadow-sm max-w-2xl mx-auto">
                        <span className="text-[10px] font-extrabold text-rose-500 bg-rose-50 px-3 py-1 rounded-full uppercase tracking-wider">
                          POPULAR SCIENCE SERIES
                        </span>
                        <h3 className="text-2xl sm:text-3xl font-display font-bold text-slate-900 mt-3 mb-6 tracking-tight">
                          {activeLesson.reading.title}
                        </h3>
                        
                        {/* Elegant typography: Drop cap, comfortable line height (1.6), spacious margins */}
                        <div className="prose text-slate-700 text-base leading-relaxed tracking-normal font-sans space-y-4">
                          {activeLesson.reading.text.split("\n\n").map((p, idx) => {
                            if (idx === 0) {
                              return (
                                <p key={idx} className="first-letter:text-5xl first-letter:font-bold first-letter:text-rose-500 first-letter:mr-3 first-letter:float-left first-letter:font-display">
                                  {p}
                                </p>
                              );
                            }
                            return <p key={idx}>{p}</p>;
                          })}
                        </div>
                      </div>

                      {/* Reading Comprehension Checks */}
                      <div className="max-w-2xl mx-auto space-y-6">
                        <div className="flex items-center gap-2 px-2">
                          <CheckCircle2 className="w-5 h-5 text-rose-500" />
                          <h4 className="font-display font-bold text-lg text-slate-900">Check Your Comprehension</h4>
                        </div>

                        {activeLesson.reading.exercises.map((ex, idx) => {
                          const state = answers[ex.id];
                          const hasSubmitted = state?.submitted;
                          const isCorrect = state?.isCorrect;
                          
                          return (
                            <div 
                              key={ex.id}
                              className={`bg-white border rounded-2xl p-5 sm:p-6 transition-colors shadow-sm space-y-4 ${
                                hasSubmitted 
                                  ? isCorrect ? "border-emerald-300 bg-emerald-50/20" : "border-red-300 bg-red-50/20"
                                  : "border-rose-100/60"
                              }`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <span className="font-mono text-xs text-rose-500 font-bold bg-rose-50 w-7 h-7 flex items-center justify-center rounded-lg shrink-0">
                                  Q{idx + 1}
                                </span>
                                <p className="text-sm sm:text-base font-semibold text-slate-800 leading-normal flex-1">
                                  {ex.question}
                                </p>
                              </div>

                              {/* True/False Question Option Mode */}
                              {ex.type === "true_false" && (
                                <div className="grid grid-cols-2 gap-3 pl-10">
                                  {["true", "false"].map((val) => {
                                    const isSelected = state?.selected === val;
                                    return (
                                      <button
                                        key={val}
                                        onClick={() => handleAnswerSelect(ex.id, val)}
                                        disabled={hasSubmitted}
                                        className={`py-2.5 px-4 rounded-xl border font-semibold text-sm capitalize transition-all cursor-pointer ${
                                          isSelected
                                            ? "border-rose-500 bg-rose-50 text-rose-600"
                                            : "border-rose-100/50 hover:bg-rose-50/20 text-slate-700"
                                        } disabled:opacity-80`}
                                      >
                                        {val}
                                      </button>
                                    );
                                  })}
                                </div>
                              )}

                              {/* Multiple Choice QCM Question Option Mode */}
                              {ex.type === "qcm" && (
                                <div className="space-y-2.5 pl-10">
                                  {ex.options?.map((opt) => {
                                    const isSelected = state?.selected === opt;
                                    return (
                                      <button
                                        key={opt}
                                        onClick={() => handleAnswerSelect(ex.id, opt)}
                                        disabled={hasSubmitted}
                                        className={`w-full text-left py-2.5 px-4 rounded-xl border text-sm transition-all cursor-pointer ${
                                          isSelected
                                            ? "border-rose-500 bg-rose-50 text-rose-600 font-semibold"
                                            : "border-rose-100/50 hover:bg-rose-50/20 text-slate-700"
                                        } disabled:opacity-80`}
                                      >
                                        {opt}
                                      </button>
                                    );
                                  })}
                                </div>
                              )}

                              {/* SUBMIT CONTROLS */}
                              <div className="pl-10 flex items-center justify-between gap-4 pt-2">
                                {!hasSubmitted ? (
                                  <button
                                    onClick={() => handleAnswerSubmit(ex.id, ex.correct_answer)}
                                    disabled={!state?.selected}
                                    className="px-5 py-2.5 bg-rose-500 hover:bg-rose-600 text-white disabled:bg-rose-50 disabled:text-rose-300 rounded-xl text-xs font-bold transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-sm"
                                  >
                                    Submit Answer
                                  </button>
                                ) : (
                                  <div className="flex items-center gap-3">
                                    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                                      isCorrect 
                                        ? "bg-emerald-50 text-emerald-600 border-emerald-200" 
                                        : "bg-red-50 text-red-600 border-red-200"
                                    }`}>
                                      {isCorrect ? (
                                        <>
                                          <Check className="w-3.5 h-3.5" /> Correct
                                        </>
                                      ) : (
                                        <>
                                          <XCircle className="w-3.5 h-3.5" /> Incorrect
                                        </>
                                      )}
                                    </div>
                                    <button
                                      onClick={() => handleResetExercise(ex.id)}
                                      className="text-xs text-rose-500 hover:text-rose-600 flex items-center gap-1 transition-colors cursor-pointer"
                                    >
                                      <RefreshCw className="w-3 h-3 animate-spin-slow" /> Retry
                                    </button>
                                  </div>
                                )}
                              </div>

                              {/* EXPLANATION SLIDEDOWN PANEL */}
                              <AnimatePresence>
                                {hasSubmitted && ex.explanation && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden"
                                  >
                                    <div className="pl-10 pt-4 border-t border-rose-100/50 mt-4 text-xs sm:text-sm text-slate-500 leading-relaxed bg-rose-50/20 p-4 rounded-xl">
                                      <p className="font-semibold text-slate-800 mb-1">Explanation:</p>
                                      {ex.explanation}
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* =========================================
                     TAB B: GRAMMAR RULE PRACTICE
                     ========================================= */}
                  {activeTab === "grammar" && activeLesson && (
                    <div className="space-y-8 max-w-2xl mx-auto">
                      {/* Grammar Explanation Box */}
                      <div className="bg-white border border-indigo-50 border-b-4 border-b-indigo-100 rounded-[2rem] p-6 sm:p-8 shadow-sm space-y-2">
                        <span className="text-[10px] font-extrabold text-indigo-500 bg-indigo-50 px-3 py-1 rounded-full uppercase tracking-wider">
                          ACQUISITION LOCK-IN
                        </span>
                        <h3 className="text-2xl font-display font-bold text-slate-900 mt-2 tracking-tight">
                          {activeLesson.grammar.title}
                        </h3>
                        <GrammarExplanationRenderer explanation={activeLesson.grammar.explanation} />
                      </div>

                      {/* Grammar Interactive Tasks */}
                      <div className="space-y-6">
                        <div className="flex items-center gap-2 px-2">
                          <Brain className="w-5 h-5 text-indigo-500" />
                          <h4 className="font-display font-bold text-lg text-slate-900">Fill-in-the-Blank Practice</h4>
                        </div>

                        {activeLesson.grammar.exercises.map((ex, idx) => {
                          const state = answers[ex.id];
                          const hasSubmitted = state?.submitted;
                          const isCorrect = state?.isCorrect;
                          
                          return (
                            <div
                              key={ex.id}
                              className={`bg-white border rounded-2xl p-5 sm:p-6 transition-all shadow-sm space-y-4 ${
                                hasSubmitted
                                  ? isCorrect ? "border-emerald-300 bg-emerald-50/20" : "border-red-300 bg-red-50/20"
                                  : "border-indigo-100/60"
                              }`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <span className="font-mono text-xs text-indigo-500 font-bold bg-indigo-50 w-7 h-7 flex items-center justify-center rounded-lg shrink-0">
                                  G{idx + 1}
                                </span>
                                <div className="flex-1 space-y-4">
                                  <p className="text-sm sm:text-base font-semibold text-slate-800 leading-relaxed">
                                    {ex.question}
                                  </p>
                                  
                                  {/* Input field */}
                                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                                    <input
                                      type="text"
                                      disabled={hasSubmitted}
                                      value={state?.selected || ""}
                                      placeholder="Type your answer here..."
                                      onChange={(e) => handleAnswerSelect(ex.id, e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter" && state?.selected) {
                                          handleAnswerSubmit(ex.id, ex.correct_answer);
                                        }
                                      }}
                                      className="flex-1 px-4 py-2.5 text-sm bg-indigo-50/10 hover:bg-indigo-50/20 focus:bg-white border border-indigo-100/50 focus:border-indigo-400 rounded-xl outline-none transition-all font-mono font-medium disabled:opacity-75 disabled:bg-indigo-50/5"
                                    />
                                    
                                    {!hasSubmitted ? (
                                      <button
                                        onClick={() => handleAnswerSubmit(ex.id, ex.correct_answer)}
                                        disabled={!state?.selected?.trim()}
                                        className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white disabled:bg-indigo-50 disabled:text-indigo-300 rounded-xl text-xs font-bold transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer shrink-0 shadow-sm"
                                      >
                                        Verify Answer
                                      </button>
                                    ) : (
                                      <div className="flex items-center gap-3 shrink-0">
                                        <div className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold border ${
                                          isCorrect
                                            ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                                            : "bg-red-50 text-red-600 border-red-200"
                                        }`}>
                                          {isCorrect ? <Check className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                                          <span>{isCorrect ? "Correct" : "Incorrect"}</span>
                                        </div>
                                        <button
                                          onClick={() => handleResetExercise(ex.id)}
                                          className="text-xs text-indigo-500 hover:text-indigo-600 flex items-center gap-1 transition-colors cursor-pointer"
                                        >
                                          <RefreshCw className="w-3 h-3 animate-spin-slow" /> Retry
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Error Correction slide */}
                              <AnimatePresence>
                                {hasSubmitted && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden"
                                  >
                                    <div className="pl-10 pt-4 border-t border-indigo-100/50 mt-2 text-xs sm:text-sm space-y-1 bg-indigo-50/20 p-4 rounded-xl text-slate-600">
                                      <p className="font-semibold text-slate-800">
                                        Correct answer: <span className="font-mono text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-md">{ex.correct_answer}</span>
                                      </p>
                                      {ex.explanation && (
                                        <p className="text-slate-500 leading-relaxed mt-1">{ex.explanation}</p>
                                      )}
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* =========================================
                     TAB C: VOCABULARY MEMORY PRACTICE
                     ========================================= */}
                  {activeTab === "vocabulary" && activeLesson && (
                    <div className="space-y-8">
                      {/* Sub-header theme info */}
                      <div className="text-center max-w-xl mx-auto space-y-2">
                        <span className="text-[10px] font-extrabold text-rose-500 bg-rose-50 px-3 py-1 rounded-full uppercase tracking-wider">
                          THEMED GLOSSARY
                        </span>
                        <h3 className="text-2xl font-display font-bold text-slate-900 tracking-tight">
                          {activeLesson.vocabulary.theme}
                        </h3>
                        <p className="text-sm text-slate-500">
                          Secure essential words to discuss travel, emotions, shopping, and everyday environments with complete comfort.
                        </p>
                      </div>

                      {/* DISPLAY TYPE 1: VISUAL DIAGRAM */}
                      {false && activeLesson.vocabulary.display_type === "visual_diagram" && (
                        <div className="bg-white border border-rose-50 border-b-4 border-b-rose-100 rounded-[2rem] p-6 shadow-sm max-w-2xl mx-auto space-y-6">
                          <h4 className="font-display font-semibold text-base text-slate-900 text-center">
                            Anatomy & Symptoms Hotspot Key
                          </h4>
                          
                          {/* Built-in high fidelity interactive visual diagram of a human body schematic */}
                          <div className="relative w-full max-w-[280px] h-[340px] mx-auto border border-rose-50 bg-[#FFFAF9]/30 rounded-2xl shadow-inner overflow-hidden flex items-center justify-center">
                            
                            {/* Abstract anatomical representation drawn dynamically in SVG */}
                            <svg className="w-48 h-72 text-rose-100" viewBox="0 0 100 150" fill="none" xmlns="http://www.w3.org/2000/svg">
                              {/* Head */}
                              <circle cx="50" cy="22" r="10" stroke="currentColor" strokeWidth="1.5" />
                              {/* Neck */}
                              <line x1="50" y1="32" x2="50" y2="38" stroke="currentColor" strokeWidth="1.5" />
                              {/* Shoulders */}
                              <path d="M30 45 C 38 40, 62 40, 70 45" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                              {/* Spine/Torso */}
                              <rect x="42" y="44" width="16" height="48" rx="8" stroke="currentColor" strokeWidth="1.5" />
                              <path d="M38 52 L62 52 M38 60 L62 60 M38 68 L62 68" stroke="currentColor" strokeWidth="1" strokeOpacity="0.5" />
                              {/* Limbs & Joint sockets */}
                              <line x1="30" y1="45" x2="22" y2="85" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                              <line x1="70" y1="45" x2="78" y2="85" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                              <line x1="38" y1="92" x2="34" y2="135" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                              <line x1="62" y1="92" x2="66" y2="135" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                            </svg>
 
                             {/* HOTSPOT INTERACTIVE OVERLAY BUTTONS */}
                             {/* Hotspot: Head */}
                             <button
                               onMouseEnter={() => setActiveHotspot("Head")}
                               onMouseLeave={() => setActiveHotspot(null)}
                               onClick={() => speakText("Head")}
                               className={`absolute top-[16px] left-[138px] w-4 h-4 rounded-full flex items-center justify-center border transition-all cursor-pointer z-10 ${
                                 activeHotspot === "Head"
                                   ? "bg-rose-500 scale-125 border-white shadow-md text-white"
                                   : "bg-white border-rose-200 shadow-xs text-rose-500"
                               }`}
                               title="Click for pronunciation"
                             >
                               <span className="text-[9px] font-bold leading-none">Hd</span>
                             </button>

                             {/* Hotspot: Neck */}
                             <button
                               onMouseEnter={() => setActiveHotspot("Neck")}
                               onMouseLeave={() => setActiveHotspot(null)}
                               onClick={() => speakText("Neck")}
                               className={`absolute top-[36px] left-[138px] w-4 h-4 rounded-full flex items-center justify-center border transition-all cursor-pointer z-10 ${
                                 activeHotspot === "Neck"
                                   ? "bg-rose-500 scale-125 border-white shadow-md text-white"
                                   : "bg-white border-rose-200 shadow-xs text-rose-500"
                               }`}
                             >
                               <span className="text-[9px] font-bold leading-none">Nk</span>
                             </button>

                             {/* Hotspot: Jaw */}
                             <button
                               onMouseEnter={() => setActiveHotspot("Jaw")}
                               onMouseLeave={() => setActiveHotspot(null)}
                               onClick={() => speakText("Jaw")}
                               className={`absolute top-[52px] left-[138px] w-4 h-4 rounded-full flex items-center justify-center border transition-all cursor-pointer z-10 ${
                                 activeHotspot === "Jaw"
                                   ? "bg-rose-500 scale-125 border-white shadow-md text-white"
                                   : "bg-white border-rose-200 shadow-xs text-rose-500"
                               }`}
                             >
                               <span className="text-[9px] font-bold leading-none">J</span>
                             </button>

                             {/* Hotspot: Sore throat */}
                             <button
                               onMouseEnter={() => setActiveHotspot("Sore throat")}
                               onMouseLeave={() => setActiveHotspot(null)}
                               onClick={() => speakText("Sore throat")}
                               className={`absolute top-[70px] left-[138px] w-4 h-4 rounded-full flex items-center justify-center border transition-all cursor-pointer z-10 ${
                                 activeHotspot === "Sore throat"
                                   ? "bg-rose-500 scale-125 border-white shadow-md text-white"
                                   : "bg-white border-rose-200 shadow-xs text-rose-500"
                               }`}
                             >
                               <span className="text-[9px] font-bold leading-none">T</span>
                             </button>

                             {/* Hotspot: Shoulder */}
                             <button
                               onMouseEnter={() => setActiveHotspot("Shoulder")}
                               onMouseLeave={() => setActiveHotspot(null)}
                               onClick={() => speakText("Shoulder")}
                               className={`absolute top-[82px] left-[98px] w-4 h-4 rounded-full flex items-center justify-center border transition-all cursor-pointer z-10 ${
                                 activeHotspot === "Shoulder"
                                   ? "bg-rose-500 scale-125 border-white shadow-md text-white"
                                   : "bg-white border-rose-200 shadow-xs text-rose-500"
                               }`}
                             >
                               <span className="text-[9px] font-bold leading-none">Sh</span>
                             </button>

                             {/* Hotspot: Chest */}
                             <button
                               onMouseEnter={() => setActiveHotspot("Chest")}
                               onMouseLeave={() => setActiveHotspot(null)}
                               onClick={() => speakText("Chest")}
                               className={`absolute top-[92px] left-[138px] w-4 h-4 rounded-full flex items-center justify-center border transition-all cursor-pointer z-10 ${
                                 activeHotspot === "Chest"
                                   ? "bg-rose-500 scale-125 border-white shadow-md text-white"
                                   : "bg-white border-rose-200 shadow-xs text-rose-500"
                               }`}
                             >
                               <span className="text-[9px] font-bold leading-none">Ch</span>
                             </button>

                             {/* Hotspot: Ribcage */}
                             <button
                               onMouseEnter={() => setActiveHotspot("Ribcage")}
                               onMouseLeave={() => setActiveHotspot(null)}
                               onClick={() => speakText("Ribcage")}
                               className={`absolute top-[108px] left-[138px] w-4 h-4 rounded-full flex items-center justify-center border transition-all cursor-pointer z-10 ${
                                 activeHotspot === "Ribcage"
                                   ? "bg-rose-500 scale-125 border-white shadow-md text-white"
                                   : "bg-white border-rose-200 shadow-xs text-rose-500"
                               }`}
                             >
                               <span className="text-[9px] font-bold leading-none">R</span>
                             </button>

                             {/* Hotspot: Heartburn */}
                             <button
                               onMouseEnter={() => setActiveHotspot("Heartburn")}
                               onMouseLeave={() => setActiveHotspot(null)}
                               onClick={() => speakText("Heartburn")}
                               className={`absolute top-[124px] left-[138px] w-4 h-4 rounded-full flex items-center justify-center border transition-all cursor-pointer z-10 ${
                                 activeHotspot === "Heartburn"
                                   ? "bg-rose-500 scale-125 border-white shadow-md text-white"
                                   : "bg-white border-rose-200 shadow-xs text-rose-500"
                               }`}
                             >
                               <span className="text-[9px] font-bold leading-none">H</span>
                             </button>

                             {/* Hotspot: Arm */}
                             <button
                               onMouseEnter={() => setActiveHotspot("Arm")}
                               onMouseLeave={() => setActiveHotspot(null)}
                               onClick={() => speakText("Arm")}
                               className={`absolute top-[110px] left-[84px] w-4 h-4 rounded-full flex items-center justify-center border transition-all cursor-pointer z-10 ${
                                 activeHotspot === "Arm"
                                   ? "bg-rose-500 scale-125 border-white shadow-md text-white"
                                   : "bg-white border-rose-200 shadow-xs text-rose-500"
                               }`}
                             >
                               <span className="text-[9px] font-bold leading-none">A</span>
                             </button>

                             {/* Hotspot: Stomach */}
                             <button
                               onMouseEnter={() => setActiveHotspot("Stomach")}
                               onMouseLeave={() => setActiveHotspot(null)}
                               onClick={() => speakText("Stomach")}
                               className={`absolute top-[138px] left-[118px] w-4 h-4 rounded-full flex items-center justify-center border transition-all cursor-pointer z-10 ${
                                 activeHotspot === "Stomach"
                                   ? "bg-rose-500 scale-125 border-white shadow-md text-white"
                                   : "bg-white border-rose-200 shadow-xs text-rose-500"
                               }`}
                             >
                               <span className="text-[9px] font-bold leading-none">St</span>
                             </button>

                             {/* Hotspot: Bloating */}
                             <button
                               onMouseEnter={() => setActiveHotspot("Bloating")}
                               onMouseLeave={() => setActiveHotspot(null)}
                               onClick={() => speakText("Bloating")}
                               className={`absolute top-[152px] left-[138px] w-4 h-4 rounded-full flex items-center justify-center border transition-all cursor-pointer z-10 ${
                                 activeHotspot === "Bloating"
                                   ? "bg-rose-500 scale-125 border-white shadow-md text-white"
                                   : "bg-white border-rose-200 shadow-xs text-rose-500"
                               }`}
                             >
                               <span className="text-[9px] font-bold leading-none">B</span>
                             </button>

                             {/* Hotspot: Hand */}
                             <button
                               onMouseEnter={() => setActiveHotspot("Hand")}
                               onMouseLeave={() => setActiveHotspot(null)}
                               onClick={() => speakText("Hand")}
                               className={`absolute top-[170px] left-[70px] w-4 h-4 rounded-full flex items-center justify-center border transition-all cursor-pointer z-10 ${
                                 activeHotspot === "Hand"
                                   ? "bg-rose-500 scale-125 border-white shadow-md text-white"
                                   : "bg-white border-rose-200 shadow-xs text-rose-500"
                               }`}
                             >
                               <span className="text-[9px] font-bold leading-none">Hn</span>
                             </button>

                             {/* Hotspot: Leg */}
                             <button
                               onMouseEnter={() => setActiveHotspot("Leg")}
                               onMouseLeave={() => setActiveHotspot(null)}
                               onClick={() => speakText("Leg")}
                               className={`absolute top-[215px] left-[108px] w-4 h-4 rounded-full flex items-center justify-center border transition-all cursor-pointer z-10 ${
                                 activeHotspot === "Leg"
                                   ? "bg-rose-500 scale-125 border-white shadow-md text-white"
                                   : "bg-white border-rose-200 shadow-xs text-rose-500"
                               }`}
                             >
                               <span className="text-[9px] font-bold leading-none">L</span>
                             </button>

                             {/* Hotspot: Knee */}
                             <button
                               onMouseEnter={() => setActiveHotspot("Knee")}
                               onMouseLeave={() => setActiveHotspot(null)}
                               onClick={() => speakText("Knee")}
                               className={`absolute top-[250px] left-[108px] w-4 h-4 rounded-full flex items-center justify-center border transition-all cursor-pointer z-10 ${
                                 activeHotspot === "Knee"
                                   ? "bg-rose-500 scale-125 border-white shadow-md text-white"
                                   : "bg-white border-rose-200 shadow-xs text-rose-500"
                               }`}
                             >
                               <span className="text-[9px] font-bold leading-none">K</span>
                             </button>

                             {/* Hotspot: Sprain */}
                             <button
                               onMouseEnter={() => setActiveHotspot("Sprain")}
                               onMouseLeave={() => setActiveHotspot(null)}
                               onClick={() => speakText("Sprain")}
                               className={`absolute top-[282px] left-[110px] w-4 h-4 rounded-full flex items-center justify-center border transition-all cursor-pointer z-10 ${
                                 activeHotspot === "Sprain"
                                   ? "bg-rose-500 scale-125 border-white shadow-md text-white"
                                   : "bg-white border-rose-200 shadow-xs text-rose-500"
                               }`}
                             >
                               <span className="text-[9px] font-bold leading-none">S</span>
                             </button>

                             {/* Hotspot: Foot */}
                             <button
                               onMouseEnter={() => setActiveHotspot("Foot")}
                               onMouseLeave={() => setActiveHotspot(null)}
                               onClick={() => speakText("Foot")}
                               className={`absolute top-[312px] left-[112px] w-4 h-4 rounded-full flex items-center justify-center border transition-all cursor-pointer z-10 ${
                                 activeHotspot === "Foot"
                                   ? "bg-rose-500 scale-125 border-white shadow-md text-white"
                                   : "bg-white border-rose-200 shadow-xs text-rose-500"
                               }`}
                             >
                               <span className="text-[9px] font-bold leading-none">F</span>
                             </button>

                            <div className="absolute bottom-2 text-xxs font-mono text-rose-500 bg-white/80 backdrop-blur px-2.5 py-1 rounded-full border border-rose-100/50">
                              Hover nodes to highlight
                            </div>
                          </div>

                          <p className="text-xs text-slate-400 text-center italic font-medium">
                            *Note: Clicking nodes plays high-clarity pronunciation audio via browser.
                          </p>
                        </div>
                      )}

                      {/* DOUBLE MODE: CHOOSE FLASHCARDS OR GLOSSARY GRID */}
                      <div className="max-w-2xl mx-auto flex justify-center gap-3 border-b border-rose-100/50 pb-4">
                        <button
                          onClick={() => setVocabQuizActive(false)}
                          className={`px-5 py-2 rounded-xl text-xs font-bold font-display transition-all cursor-pointer ${
                            !vocabQuizActive
                              ? "bg-rose-500 text-white shadow-sm"
                              : "bg-white border border-rose-100 text-rose-500 hover:bg-rose-50/50"
                          }`}
                        >
                          📚 Flashcards & Reference Key
                        </button>
                        <button
                          onClick={startVocabQuiz}
                          className={`px-5 py-2 rounded-xl text-xs font-bold font-display transition-all cursor-pointer ${
                            vocabQuizActive
                              ? "bg-rose-500 text-white shadow-sm"
                              : "bg-white border border-rose-100 text-rose-500 hover:bg-rose-50/50"
                          }`}
                        >
                          🎯 Match Definition Quiz
                        </button>
                      </div>

                      {/* INTERACTIVE FLASHCARDS & LIST MODE */}
                      {!vocabQuizActive ? (
                        <div className="space-y-8">
                          {/* 3D FLASHCARD CAROUSEL */}
                          <div className="max-w-md mx-auto space-y-4">
                            <div className="flex items-center justify-between px-2">
                              <span className="text-xs text-slate-400 font-mono font-bold">
                                Card {currentFlashcardIndex + 1} of {activeLesson.vocabulary.items.length}
                              </span>
                              <span className="text-xs text-rose-400 font-medium italic">
                                Click card to reveal definition
                              </span>
                            </div>

                            {/* Flashcard container */}
                            <div 
                              onClick={() => setIsFlashcardFlipped(!isFlashcardFlipped)}
                              className="relative h-48 w-full cursor-pointer perspective-1000 group"
                            >
                              <div className={`relative w-full h-full duration-500 transform-style-3d transition-transform ${
                                isFlashcardFlipped ? "rotate-y-180" : ""
                              }`}>
                                {/* FRONT FACE */}
                                <div className="absolute inset-0 bg-white border border-rose-100/70 hover:border-rose-300 rounded-3xl p-6 shadow-sm flex flex-col items-center justify-between backface-hidden">
                                  {/* Top row with reference key and pronunciation */}
                                  <div className="w-full flex justify-between items-center">
                                    <span className="text-[10px] font-mono font-bold text-rose-500 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-100/30">
                                      Word Key: W-{currentFlashcardIndex + 1}
                                    </span>
                                    <div className="w-7 h-7 rounded-full bg-rose-50 flex items-center justify-center text-rose-500 hover:scale-110 transition-transform cursor-pointer"
                                      onClick={(e) => {
                                        e.stopPropagation(); // prevent flipping the card
                                        speakText(activeLesson.vocabulary.items[currentFlashcardIndex].word);
                                      }}
                                      title="Listen pronunciation"
                                    >
                                      <Volume2 className="w-4 h-4" />
                                    </div>
                                  </div>

                                  {/* Center word */}
                                  <div className="text-center my-auto py-2">
                                    <h4 className="font-display font-extrabold text-3xl text-slate-900 tracking-tight mb-2">
                                      {activeLesson.vocabulary.items[currentFlashcardIndex].word}
                                    </h4>
                                    <span className="text-[10px] text-rose-500 bg-rose-50/40 font-mono tracking-wider block px-3 py-1 rounded-full border border-rose-100/20 max-w-max mx-auto">
                                      Click to Flip Card
                                    </span>
                                  </div>

                                  {/* Bottom spacer to keep balanced alignment */}
                                  <div className="h-4 w-full" />
                                </div>

                                {/* BACK FACE */}
                                <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/40 to-rose-50/20 border border-rose-200/50 rounded-3xl p-6 shadow-sm flex flex-col items-center justify-between backface-hidden rotate-y-180 text-center">
                                  {/* Top header on back */}
                                  <div className="w-full flex justify-between items-center">
                                    <span className="text-[10px] font-mono font-bold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100/30">
                                      Definition Key: W-{currentFlashcardIndex + 1}
                                    </span>
                                    <span className="text-xxs font-bold text-rose-500 bg-rose-50 px-2 py-0.5 rounded-md">
                                      Memory Active
                                    </span>
                                  </div>

                                  {/* Large full definition centered */}
                                  <div className="my-auto py-2 px-1">
                                    <h5 className="text-[11px] font-bold text-rose-500 uppercase tracking-widest mb-1.5 font-mono">Meaning</h5>
                                    <p className="text-sm font-semibold text-slate-800 leading-relaxed max-w-xs">
                                      {activeLesson.vocabulary.items[currentFlashcardIndex].definition}
                                    </p>
                                  </div>

                                  {/* Bottom helper */}
                                  <div className="text-[10px] text-slate-400 font-bold tracking-wide">
                                    Word: {activeLesson.vocabulary.items[currentFlashcardIndex].word}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Carousel Controls */}
                            <div className="flex justify-between items-center px-4">
                              <button
                                disabled={currentFlashcardIndex === 0}
                                onClick={() => {
                                  setCurrentFlashcardIndex(prev => prev - 1);
                                  setIsFlashcardFlipped(false);
                                }}
                                className="px-4 py-2 bg-white hover:bg-rose-50 border border-rose-100 text-rose-500 disabled:opacity-40 text-xs font-bold rounded-xl flex items-center gap-1 transition-colors cursor-pointer"
                              >
                                ‹ Prev
                              </button>
                              <button
                                onClick={() => speakText(activeLesson.vocabulary.items[currentFlashcardIndex].word)}
                                className="w-10 h-10 rounded-full bg-rose-50 hover:bg-rose-100 flex items-center justify-center text-rose-600 transition-colors cursor-pointer"
                                title="Listen pronunciation"
                              >
                                <Volume2 className="w-4 h-4" />
                              </button>
                              <button
                                disabled={currentFlashcardIndex === activeLesson.vocabulary.items.length - 1}
                                onClick={() => {
                                  setCurrentFlashcardIndex(prev => prev + 1);
                                  setIsFlashcardFlipped(false);
                                }}
                                className="px-4 py-2 bg-white hover:bg-rose-50 border border-rose-100 text-rose-500 disabled:opacity-40 text-xs font-bold rounded-xl flex items-center gap-1 transition-colors cursor-pointer"
                              >
                                Next ›
                              </button>
                            </div>
                          </div>

                          {/* GENERAL REFERENCE LIST KEY */}
                          <div className="max-w-2xl mx-auto space-y-4">
                            <h4 className="font-display font-bold text-lg text-slate-900 px-2 flex items-center gap-2">
                              <BookMarked className="w-5 h-5 text-rose-500" />
                              <span>Vocabulary Reference Key</span>
                            </h4>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              {activeLesson.vocabulary.items.map((item) => {
                                const isHighlighted = activeHotspot === item.word;
                                return (
                                  <div
                                    key={item.word}
                                    onMouseEnter={() => setActiveHotspot(item.word)}
                                    onMouseLeave={() => setActiveHotspot(null)}
                                    className={`bg-white border rounded-2xl p-4 transition-all duration-300 flex flex-col gap-1.5 ${
                                      isHighlighted 
                                        ? "border-rose-400 bg-rose-50/20 shadow-sm translate-x-1" 
                                        : "border-rose-100/60 hover:border-rose-300 hover:bg-rose-50/10"
                                    }`}
                                  >
                                    <div className="flex justify-between items-center">
                                      <h5 className="font-display font-bold text-sm text-slate-900">{item.word}</h5>
                                      <button
                                        onClick={() => speakText(item.word)}
                                        className="text-slate-400 hover:text-rose-500 p-1 rounded hover:bg-rose-50 transition-colors cursor-pointer"
                                        title="Hear word"
                                      >
                                        <Volume2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                    <p className="text-xs text-slate-500 leading-relaxed font-normal">
                                      {item.definition}
                                    </p>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      ) : (
                        
                        /* VOCAB MATCH QUIZ ACTIVE PANEL */
                        <div className="max-w-2xl mx-auto bg-white border border-rose-50 border-b-4 border-b-rose-100 rounded-[2rem] p-6 shadow-sm space-y-6">
                          <div className="text-center space-y-1">
                            <h4 className="font-display font-bold text-lg text-slate-900">Vocabulary Match Challenge 🎯</h4>
                            <p className="text-xs text-slate-400">Select the correct vocabulary word for each definition below.</p>
                          </div>

                          <div className="space-y-6">
                            {activeLesson.vocabulary.items.map((item, idx) => {
                              const selectedVal = vocabQuizAnswers[item.word];
                              const isSubmitted = vocabQuizScore?.submitted;
                              const isCorrect = selectedVal === item.definition;

                              return (
                                <div key={item.word} className="space-y-2 border-b border-rose-100/50 pb-5 last:border-0 last:pb-0">
                                  <div className="flex items-start justify-between gap-3">
                                    <h5 className="font-display font-bold text-sm text-slate-900 flex items-center gap-2">
                                      <span className="font-mono text-xxs font-bold bg-rose-50 text-rose-500 px-2 py-0.5 rounded">
                                        W{idx + 1}
                                      </span>
                                      <span>{item.word}</span>
                                    </h5>
                                    {isSubmitted && (
                                      <div className="shrink-0">
                                        {isCorrect ? (
                                          <span className="text-emerald-600 flex items-center gap-1 text-xs font-bold"><Check className="w-3.5 h-3.5" /> Correct</span>
                                        ) : (
                                          <span className="text-red-500 flex items-center gap-1 text-xs font-bold"><XCircle className="w-3.5 h-3.5" /> Wrong</span>
                                        )}
                                      </div>
                                    )}
                                  </div>

                                  {/* Custom dropdown matching key */}
                                  <div className="grid grid-cols-1 gap-2 pl-6">
                                    {activeLesson.vocabulary.items.map((defItem) => {
                                      const isOptionSelected = selectedVal === defItem.definition;
                                      return (
                                        <button
                                          key={defItem.word}
                                          disabled={isSubmitted}
                                          onClick={() => handleVocabQuizOptionSelect(item.word, defItem.definition)}
                                          className={`text-left p-2.5 rounded-xl text-xs transition-all border cursor-pointer ${
                                            isOptionSelected
                                              ? "bg-rose-50 border-rose-300 text-rose-800 font-bold"
                                              : "bg-[#FFFAF9]/40 border-rose-100/50 hover:bg-rose-50/20 text-slate-600"
                                          } disabled:opacity-85`}
                                        >
                                          {defItem.definition}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* ACTION SUBMITS */}
                          <div className="flex items-center justify-between border-t border-rose-100/50 pt-5 mt-4">
                            {!vocabQuizScore?.submitted ? (
                              <button
                                onClick={submitVocabQuiz}
                                disabled={Object.values(vocabQuizAnswers).some(v => !v)}
                                className="px-6 py-2.5 bg-rose-500 hover:bg-rose-600 disabled:bg-rose-50 disabled:text-rose-300 text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
                              >
                                Submit Match Quiz
                              </button>
                            ) : (
                              <div className="flex items-center gap-4 justify-between w-full">
                                <p className="text-sm font-semibold text-slate-800">
                                  Quiz Score: <span className="font-mono text-rose-500 font-bold bg-rose-50 px-2.5 py-0.5 rounded-lg">{vocabQuizScore.correct} / {vocabQuizScore.total}</span>
                                </p>
                                <button
                                  onClick={startVocabQuiz}
                                  className="px-5 py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                                >
                                  <RefreshCw className="w-3.5 h-3.5" /> Retake Quiz
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* =========================================
                     TAB D: CORE VERBS ACQUISITION
                     ========================================= */}
                  {activeTab === "verbs" && activeLesson && (
                    <div className="space-y-8">
                       {/* Section intro header */}
                      <div className="text-center max-w-xl mx-auto space-y-2">
                        <span className="text-[10px] font-extrabold text-rose-500 bg-rose-50 px-3 py-1 rounded-full uppercase tracking-wider">
                          THE CORE 5 VERBS
                        </span>
                        <h3 className="text-2xl font-display font-bold text-slate-900 tracking-tight">
                          The Engines of English
                        </h3>
                        <p className="text-sm text-slate-500">
                          These represent the 5 foundational verbs for this lesson. Master their structures, spelling, and meanings with perfect examples.
                        </p>
                      </div>

                      {/* DOUBLE MODE BUTTONS */}
                      <div className="max-w-2xl mx-auto flex justify-center gap-3 border-b border-rose-100/50 pb-4">
                        <button
                          onClick={() => setVerbQuizActive(false)}
                          className={`px-5 py-2 rounded-xl text-xs font-bold font-display transition-all cursor-pointer ${
                            !verbQuizActive
                              ? "bg-rose-500 text-white shadow-sm"
                              : "bg-white border border-rose-100 text-rose-500 hover:bg-rose-50/50"
                          }`}
                        >
                          ⚡ Study Verb Conjugations
                        </button>
                        <button
                          onClick={startVerbQuiz}
                          className={`px-5 py-2 rounded-xl text-xs font-bold font-display transition-all cursor-pointer ${
                            verbQuizActive
                              ? "bg-rose-500 text-white shadow-sm"
                              : "bg-white border border-rose-100 text-rose-500 hover:bg-rose-50/50"
                          }`}
                        >
                          ✍️ Conjugation Challenge
                        </button>
                      </div>

                      {/* STUDY CARDS MODE */}
                      {!verbQuizActive ? (
                        <div className="space-y-6 max-w-2xl mx-auto">
                          {activeLesson.verbs.map((v, index) => (
                            <div
                              key={v.base}
                              className="bg-white border border-rose-100/60 rounded-3xl p-6 shadow-sm flex flex-col gap-6 relative overflow-hidden hover:border-rose-300 hover:shadow-md transition-all duration-300"
                            >
                              <div className="absolute top-0 left-0 h-full w-1.5 bg-rose-500" />
                              
                              <div className="flex flex-col sm:flex-row items-stretch gap-6">
                                {/* Verb forms col */}
                                <div className="sm:w-1/3 flex flex-col justify-center gap-2 pl-2">
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-[10px] font-extrabold bg-rose-50 text-rose-500 px-2 py-0.5 rounded-md uppercase">
                                      VERB {index + 1}
                                    </span>
                                  </div>
                                  <h4 className="font-display font-bold text-xl text-slate-900 uppercase">{v.base}</h4>
                                  
                                  <div className="space-y-1.5 pt-1">
                                    <p className="text-xs text-slate-500 flex justify-between border-b border-rose-50 pb-1">
                                      <span className="font-medium text-slate-400">Past Simple:</span>
                                      <span className="font-mono font-extrabold text-rose-600">{v.past_simple}</span>
                                    </p>
                                    <p className="text-xs text-slate-500 flex justify-between pb-1">
                                      <span className="font-medium text-slate-400">Past Participle:</span>
                                      <span className="font-mono font-extrabold text-rose-600">{v.past_participle}</span>
                                    </p>
                                  </div>
                                </div>

                                {/* Details and Example col */}
                                <div className="sm:w-2/3 flex flex-col justify-between gap-4">
                                  <div className="space-y-1.5">
                                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Meaning</p>
                                    <p className="text-sm font-semibold text-slate-800 leading-normal">{v.meaning}</p>
                                  </div>

                                  <div className="bg-rose-50/15 border border-rose-100/40 rounded-2xl p-4 space-y-2 relative">
                                    <button
                                      onClick={() => speakText(v.example)}
                                      className="absolute top-3.5 right-3.5 w-7 h-7 rounded-full bg-white hover:bg-rose-50 border border-rose-100/60 flex items-center justify-center text-rose-400 hover:text-rose-500 transition-colors cursor-pointer"
                                      title="Listen to pronunciation example"
                                    >
                                      <Volume2 className="w-3.5 h-3.5" />
                                    </button>
                                    
                                    <p className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider">Example sentence</p>
                                    <p className="text-sm text-slate-700 italic pr-8 leading-relaxed">
                                      "{v.example}"
                                    </p>
                                  </div>
                                </div>
                              </div>

                              {/* ACCORDION TRIGGER FOR EXPANDED CONJUGATION & RULES */}
                              <div className="border-t border-rose-50 pt-4 mt-2">
                                <button
                                  onClick={() => toggleVerbExpanded(v.base)}
                                  className="flex items-center gap-2 text-xs font-bold text-rose-500 hover:text-rose-600 transition-colors cursor-pointer"
                                >
                                  <ChevronRight className={`w-4 h-4 transform transition-transform ${expandedVerbs[v.base] ? "rotate-90 text-rose-600" : "text-rose-400"}`} />
                                  <span>{expandedVerbs[v.base] ? "Hide" : "Show"} Full Conjugation & Tense Rules</span>
                                </button>

                                <AnimatePresence>
                                  {expandedVerbs[v.base] && (
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: "auto", opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      className="overflow-hidden"
                                    >
                                      <div className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {Object.entries(getVerbConjugations(v)).map(([key, item]: any) => (
                                          <div key={key} className="bg-[#FFFAF9]/50 border border-rose-100/35 rounded-2xl p-4 space-y-2">
                                            <div className="flex items-center justify-between">
                                              <h5 className="font-display font-bold text-xs text-rose-800 tracking-tight leading-snug">{item.title}</h5>
                                            </div>
                                            <p className="text-[10px] text-slate-400 leading-normal">{item.formRule}</p>
                                            <div className="space-y-1 font-mono text-xs border-t border-rose-100/30 pt-2 bg-white/50 p-2 rounded-xl">
                                              {item.conjugations.map((c: any, idx: number) => (
                                                <div key={idx} className="flex justify-between text-slate-500 py-0.5 border-b border-rose-100/5 last:border-0">
                                                  <span>{c.pronoun}</span>
                                                  <span className="font-extrabold text-rose-600">{c.form}</span>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        
                        /* CONJUGATION CHALLENGE WRITE MODE */
                        <div className="max-w-2xl mx-auto bg-white border border-rose-50 border-b-4 border-b-rose-100 rounded-[2rem] p-6 shadow-sm space-y-6">
                          <div className="text-center space-y-1">
                            <h4 className="font-display font-bold text-lg text-slate-900">Conjugation Speed Check ✍️</h4>
                            <p className="text-xs text-slate-400">Complete the Past Simple and Past Participle forms for the core verbs.</p>
                          </div>

                          <div className="space-y-6">
                            {activeLesson.verbs.map((v) => {
                              const inputs = verbQuizInput[v.base] || { past: "", participle: "" };
                              
                              const correctPastList = v.past_simple.toLowerCase().split("/").map(s => s.trim());
                              const correctPartList = v.past_participle.toLowerCase().split("/").map(s => s.trim());
                              
                              const userPast = inputs.past.trim().toLowerCase();
                              const userParticiple = inputs.participle.trim().toLowerCase();

                              const isPastCorrect = correctPastList.includes(userPast);
                              const isPartCorrect = correctPartList.includes(userParticiple);

                              return (
                                <div key={v.base} className="space-y-3 border-b border-rose-100/50 pb-5 last:border-0 last:pb-0">
                                  <div className="flex items-center justify-between">
                                    <h5 className="font-display font-bold text-base text-slate-900 uppercase">{v.base} <span className="text-xs font-light text-slate-400 font-sans">({v.meaning})</span></h5>
                                  </div>

                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-2">
                                    {/* Past Simple input */}
                                    <div className="space-y-1">
                                      <label className="text-xxs font-mono text-slate-400 font-bold uppercase tracking-wider">Past Simple form</label>
                                      <div className="relative flex items-center">
                                        <input
                                          type="text"
                                          placeholder="Type Past Simple..."
                                          disabled={verbQuizSubmitted}
                                          value={inputs.past}
                                          onChange={(e) => handleVerbInputChange(v.base, "past", e.target.value)}
                                          className={`w-full px-3.5 py-2 text-xs border rounded-xl font-mono outline-none focus:bg-white transition-all ${
                                            verbQuizSubmitted
                                              ? isPastCorrect ? "border-emerald-300 text-emerald-800 bg-emerald-50/15" : "border-red-300 text-red-800 bg-red-50/15"
                                              : "border-rose-100/50 focus:border-rose-400 bg-rose-50/10"
                                          }`}
                                        />
                                        {verbQuizSubmitted && (
                                          <span className="absolute right-3">
                                            {isPastCorrect ? <Check className="w-4 h-4 text-emerald-500" /> : <XCircle className="w-4 h-4 text-red-500" />}
                                          </span>
                                        )}
                                      </div>
                                      {verbQuizSubmitted && !isPastCorrect && (
                                        <p className="text-xxs font-mono text-red-500 font-bold pl-1">Correct: {v.past_simple}</p>
                                      )}
                                    </div>

                                    {/* Past Participle input */}
                                    <div className="space-y-1">
                                      <label className="text-xxs font-mono text-slate-400 font-bold uppercase tracking-wider">Past Participle form</label>
                                      <div className="relative flex items-center">
                                        <input
                                          type="text"
                                          placeholder="Type Past Participle..."
                                          disabled={verbQuizSubmitted}
                                          value={inputs.participle}
                                          onChange={(e) => handleVerbInputChange(v.base, "participle", e.target.value)}
                                          className={`w-full px-3.5 py-2 text-xs border rounded-xl font-mono outline-none focus:bg-white transition-all ${
                                            verbQuizSubmitted
                                              ? isPartCorrect ? "border-emerald-300 text-emerald-800 bg-emerald-50/15" : "border-red-300 text-red-800 bg-red-50/15"
                                              : "border-rose-100/50 focus:border-rose-400 bg-rose-50/10"
                                          }`}
                                        />
                                        {verbQuizSubmitted && (
                                          <span className="absolute right-3">
                                            {isPartCorrect ? <Check className="w-4 h-4 text-emerald-500" /> : <XCircle className="w-4 h-4 text-red-500" />}
                                          </span>
                                        )}
                                      </div>
                                      {verbQuizSubmitted && !isPartCorrect && (
                                        <p className="text-xxs font-mono text-red-500 font-bold pl-1">Correct: {v.past_participle}</p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* CONTROLS SUBMIT */}
                          <div className="border-t border-rose-100/50 pt-5 flex justify-between items-center mt-4">
                            {!verbQuizSubmitted ? (
                              <button
                                onClick={submitVerbQuiz}
                                disabled={Object.values(verbQuizInput).some((v: any) => !v.past?.trim() || !v.participle?.trim())}
                                className="px-6 py-2.5 bg-rose-500 hover:bg-rose-600 disabled:bg-rose-50 disabled:text-rose-300 text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
                              >
                                Submit Verbs Quiz
                              </button>
                            ) : (
                              <button
                                onClick={startVerbQuiz}
                                className="px-5 py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                              >
                                <RefreshCw className="w-3.5 h-3.5" /> Retake Verbs Quiz
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                </motion.div>
              </AnimatePresence>

              {/* NAVIGATION CONTROLS BOTTOM CARDS */}
              <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between border-t border-rose-100/50 pt-6 gap-4">
                <button
                  onClick={navigateToHome}
                  className="px-5 py-2.5 rounded-xl border border-rose-100 hover:bg-rose-50/50 text-rose-500 hover:text-rose-600 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer w-full sm:w-auto justify-center"
                >
                  <ArrowLeft className="w-4 h-4" /> Return to Curriculum
                </button>

                {activeLessonId < 15 && (
                  <button
                    onClick={() => navigateToLesson(activeLessonId + 1)}
                    className="px-6 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer justify-center w-full sm:w-auto"
                  >
                    <span>Proceed to Lesson {activeLessonId + 1}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

          </motion.div>
        )}
      </main>
    </div>
  );
}
