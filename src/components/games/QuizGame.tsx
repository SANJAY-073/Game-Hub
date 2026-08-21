import React, { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  RotateCcw,
  Trophy,
  Timer,
  Sparkles,
  Flame,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Award,
  ArrowRight,
  Zap,
} from 'lucide-react';
import { QuizQuestion } from '../../types';
import { QUIZ_QUESTIONS } from '../../data/quizQuestions';
import { sound } from '../../utils/sound';
import { saveScore, getPlayerName } from '../../utils/storage';

const QUESTION_TIME_LIMIT = 15; // 15 seconds per question
const QUESTIONS_PER_ROUND = 8;

export const QuizGame: React.FC<{ onOpenLeaderboard: () => void }> = ({ onOpenLeaderboard }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [roundQuestions, setRoundQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME_LIMIT);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [correctAnswersCount, setCorrectAnswersCount] = useState(0);
  const [isRoundFinished, setIsRoundFinished] = useState(false);

  const timerRef = useRef<number | null>(null);

  // Initialize a new round
  const startNewRound = useCallback((cat: string) => {
    sound.playClick();
    let pool = [...QUIZ_QUESTIONS];
    if (cat !== 'All') {
      pool = pool.filter((q) => q.category === cat);
    }

    // Shuffle pool
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    const selected = pool.slice(0, Math.min(QUESTIONS_PER_ROUND, pool.length));
    setRoundQuestions(selected);
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsAnswerSubmitted(false);
    setTimeLeft(QUESTION_TIME_LIMIT);
    setScore(0);
    setStreak(0);
    setMaxStreak(0);
    setCorrectAnswersCount(0);
    setIsRoundFinished(false);
  }, []);

  useEffect(() => {
    startNewRound(selectedCategory);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [selectedCategory, startNewRound]);

  // Countdown timer for active question
  useEffect(() => {
    if (isAnswerSubmitted || isRoundFinished || roundQuestions.length === 0) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Time expired! Submit wrong
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentIndex, isAnswerSubmitted, isRoundFinished, roundQuestions.length]);

  const handleTimeout = () => {
    sound.playWrong();
    setIsAnswerSubmitted(true);
    setSelectedOption(-1); // timeout indicator
    setStreak(0);
  };

  const handleSelectOption = (index: number) => {
    if (isAnswerSubmitted || isRoundFinished) return;

    if (timerRef.current) clearInterval(timerRef.current);

    setSelectedOption(index);
    setIsAnswerSubmitted(true);

    const currentQuestion = roundQuestions[currentIndex];
    const isCorrect = index === currentQuestion.correctIndex;

    if (isCorrect) {
      sound.playMatch();
      const speedBonus = timeLeft * 10;
      const streakBonus = streak * 25;
      const questionScore = 100 + speedBonus + streakBonus;

      setScore((prev) => prev + questionScore);
      setCorrectAnswersCount((prev) => prev + 1);
      setStreak((prev) => {
        const next = prev + 1;
        if (next > maxStreak) setMaxStreak(next);
        return next;
      });
    } else {
      sound.playWrong();
      setStreak(0);
    }
  };

  const handleNextQuestion = () => {
    sound.playClick();
    if (currentIndex + 1 < roundQuestions.length) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswerSubmitted(false);
      setTimeLeft(QUESTION_TIME_LIMIT);
    } else {
      // Finish round
      finishRound();
    }
  };

  const finishRound = () => {
    setIsRoundFinished(true);
    sound.playWin();
    confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });

    saveScore({
      gameId: 'quiz',
      playerName: getPlayerName(),
      score: score,
      secondaryMetric: `${correctAnswersCount}/${roundQuestions.length} correct • Max streak: ${maxStreak}`,
    });
  };

  const currentQ = roundQuestions[currentIndex];

  if (!currentQ && !isRoundFinished) {
    return (
      <div className="text-center py-12 text-slate-400">
        Loading quiz questions...
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8 space-y-6">
      {/* Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-display">Cyber Quiz</h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold">
              Rapid Trivia
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Answer quickly for high-speed bonuses and maintain streaks
          </p>
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {['All', 'Gaming', 'Technology', 'Sci-Fi', 'Science'].map((cat) => (
            <button
              key={cat}
              id={`quiz-cat-${cat.toLowerCase()}`}
              onClick={() => {
                setSelectedCategory(cat);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Main Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Stats Column */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <span>Score &amp; Progress</span>
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="bg-slate-950 p-3 rounded-xl border border-amber-500/20">
                <span className="text-xs text-amber-400 font-bold block">Points</span>
                <span className="text-2xl font-black text-white font-display">{score}</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-400 font-medium block">Question</span>
                <span className="text-2xl font-black text-white font-display">
                  {isRoundFinished ? roundQuestions.length : currentIndex + 1} / {roundQuestions.length}
                </span>
              </div>
            </div>

            {/* Streak & Timer row */}
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Flame className={`w-4 h-4 ${streak > 0 ? 'text-amber-400 fill-amber-400' : 'text-slate-600'}`} />
                <span className="text-xs text-slate-300 font-semibold">
                  Streak: <strong className="text-amber-400 font-bold">{streak}x</strong>
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-slate-300">
                <Timer className={`w-4 h-4 ${timeLeft <= 5 ? 'text-rose-400 animate-pulse' : 'text-slate-400'}`} />
                <span className="font-mono font-bold">{timeLeft}s remaining</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-2 text-xs text-slate-400">
            <div className="flex items-center gap-1.5 text-slate-200 font-semibold">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Speed Bonus Engine</span>
            </div>
            <p>• Base points: <strong>+100 pts</strong> per correct answer.</p>
            <p>• Fast response: <strong>+{timeLeft * 10} pts</strong> time multiplier.</p>
            <p>• Streaks amplify every subsequent question score.</p>
          </div>
        </div>

        {/* Right Column: Question & Options Card */}
        <div className="lg:col-span-8">
          {isRoundFinished ? (
            /* Round Finished Results */
            <div className="bg-slate-900/95 border border-slate-800 rounded-3xl p-6 sm:p-8 text-center space-y-6 shadow-2xl animate-in zoom-in duration-200">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/20">
                <Award className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-3xl font-black text-white font-display">Quiz Complete!</h3>
                <p className="text-sm text-slate-300 mt-1">Here is your performance breakdown</p>
              </div>

              <div className="grid grid-cols-3 gap-3 max-w-md mx-auto">
                <div className="bg-slate-950 p-3.5 rounded-2xl border border-amber-500/30">
                  <span className="text-xs text-amber-400 block font-medium">Final Score</span>
                  <span className="text-2xl font-black text-white font-display">{score}</span>
                </div>
                <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
                  <span className="text-xs text-slate-400 block font-medium">Accuracy</span>
                  <span className="text-2xl font-black text-emerald-400 font-display">
                    {Math.round((correctAnswersCount / roundQuestions.length) * 100)}%
                  </span>
                </div>
                <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
                  <span className="text-xs text-slate-400 block font-medium">Max Streak</span>
                  <span className="text-2xl font-black text-amber-400 font-display">{maxStreak}x</span>
                </div>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  id="quiz-play-again-btn"
                  onClick={() => startNewRound(selectedCategory)}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-400 text-slate-950 font-bold text-sm hover:brightness-110 shadow-lg shadow-amber-500/25 transition-transform hover:scale-105 cursor-pointer"
                >
                  Play Another Round
                </button>
                <button
                  id="quiz-view-hall-btn"
                  onClick={onOpenLeaderboard}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-sm font-semibold cursor-pointer"
                >
                  Hall of Fame
                </button>
              </div>
            </div>
          ) : (
            /* Active Question Card */
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-6">
              {/* Question Category & Timer Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-800 text-amber-400 border border-slate-700">
                    {currentQ.category}
                  </span>
                  <span className="text-xs text-slate-400">
                    Question {currentIndex + 1} of {roundQuestions.length}
                  </span>
                </div>

                {/* Progress Time Bar */}
                <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className={`h-full transition-all duration-1000 ease-linear rounded-full ${
                      timeLeft <= 4
                        ? 'bg-rose-500'
                        : timeLeft <= 8
                        ? 'bg-amber-500'
                        : 'bg-emerald-400'
                    }`}
                    style={{ width: `${(timeLeft / QUESTION_TIME_LIMIT) * 100}%` }}
                  />
                </div>
              </div>

              {/* Question Text */}
              <h3 className="text-lg sm:text-xl font-bold text-white font-display leading-snug">
                {currentQ.question}
              </h3>

              {/* 4 Options */}
              <div className="space-y-2.5">
                {currentQ.options.map((option, idx) => {
                  const isSelected = selectedOption === idx;
                  const isCorrect = idx === currentQ.correctIndex;

                  let buttonStyles = 'bg-slate-950/80 border-slate-800 hover:bg-slate-800 hover:border-slate-700 text-slate-200';

                  if (isAnswerSubmitted) {
                    if (isCorrect) {
                      buttonStyles = 'bg-emerald-950/60 border-emerald-500 text-emerald-200 ring-2 ring-emerald-500/40';
                    } else if (isSelected) {
                      buttonStyles = 'bg-rose-950/60 border-rose-500 text-rose-200 ring-2 ring-rose-500/40';
                    } else {
                      buttonStyles = 'bg-slate-950/40 border-slate-800/40 text-slate-500 opacity-60';
                    }
                  }

                  return (
                    <button
                      key={idx}
                      id={`quiz-option-${idx}`}
                      onClick={() => handleSelectOption(idx)}
                      disabled={isAnswerSubmitted}
                      className={`w-full p-4 rounded-2xl border text-left font-medium text-sm transition-all duration-200 flex items-center justify-between gap-3 cursor-pointer ${buttonStyles}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-xs font-bold text-slate-400">
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <span>{option}</span>
                      </div>

                      {isAnswerSubmitted && isCorrect && (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                      )}
                      {isAnswerSubmitted && isSelected && !isCorrect && (
                        <XCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Explanation & Next Button (when answered) */}
              {isAnswerSubmitted && (
                <div className="pt-4 border-t border-slate-800 space-y-4 animate-in fade-in duration-200">
                  <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-300 flex items-start gap-2.5">
                    <HelpCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white block mb-0.5">Did you know?</strong>
                      {currentQ.explanation}
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      id="quiz-next-btn"
                      onClick={handleNextQuestion}
                      className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-400 text-slate-950 font-bold text-sm hover:brightness-110 shadow-lg shadow-amber-500/20 transition-transform hover:scale-105 cursor-pointer"
                    >
                      <span>
                        {currentIndex + 1 < roundQuestions.length ? 'Next Question' : 'View Results'}
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
