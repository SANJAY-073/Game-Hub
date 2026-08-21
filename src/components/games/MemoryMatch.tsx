import React, { useState, useEffect, useCallback, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  RotateCcw,
  Trophy,
  Timer,
  Sparkles,
  Flame,
  Award,
  Star,
  Gamepad2,
  Ghost,
  Sword,
  Shield,
  Crown,
  Rocket,
  Dices,
  Heart,
  Zap,
  Radio,
  Eye,
  CheckCircle2,
} from 'lucide-react';
import { sound } from '../../utils/sound';
import { saveScore, getPlayerName } from '../../utils/storage';

interface CardItem {
  id: number;
  pairId: number;
  iconName: string;
  isFlipped: boolean;
  isMatched: boolean;
}

const ICON_REGISTRY: Record<string, React.ReactNode> = {
  gamepad: <Gamepad2 className="w-7 h-7 sm:w-8 sm:h-8 text-indigo-400" />,
  ghost: <Ghost className="w-7 h-7 sm:w-8 sm:h-8 text-rose-400" />,
  sword: <Sword className="w-7 h-7 sm:w-8 sm:h-8 text-amber-400" />,
  shield: <Shield className="w-7 h-7 sm:w-8 sm:h-8 text-emerald-400" />,
  crown: <Crown className="w-7 h-7 sm:w-8 sm:h-8 text-yellow-300" />,
  rocket: <Rocket className="w-7 h-7 sm:w-8 sm:h-8 text-cyan-400" />,
  dice: <Dices className="w-7 h-7 sm:w-8 sm:h-8 text-purple-400" />,
  heart: <Heart className="w-7 h-7 sm:w-8 sm:h-8 text-pink-400" />,
  zap: <Zap className="w-7 h-7 sm:w-8 sm:h-8 text-amber-300" />,
  radio: <Radio className="w-7 h-7 sm:w-8 sm:h-8 text-teal-400" />,
};

const ALL_ICONS = ['gamepad', 'ghost', 'sword', 'shield', 'crown', 'rocket', 'dice', 'heart', 'zap', 'radio'];

type GridDifficulty = 'easy' | 'medium' | 'hard';

export const MemoryMatch: React.FC<{ onOpenLeaderboard: () => void }> = ({ onOpenLeaderboard }) => {
  const [difficulty, setDifficulty] = useState<GridDifficulty>('medium');
  const [cards, setCards] = useState<CardItem[]>([]);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [streak, setStreak] = useState(0);
  const [matchedPairs, setMatchedPairs] = useState(0);
  const [totalPairs, setTotalPairs] = useState(8);
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [isWon, setIsWon] = useState(false);
  const [calculatedScore, setCalculatedScore] = useState(0);
  const [stars, setStars] = useState(3);

  const timerRef = useRef<number | null>(null);

  // Initialize cards
  const initializeGame = useCallback((diff: GridDifficulty) => {
    let pairCount = 8;
    if (diff === 'easy') pairCount = 6; // 12 cards
    else if (diff === 'hard') pairCount = 10; // 20 cards

    setTotalPairs(pairCount);
    const selectedIcons = ALL_ICONS.slice(0, pairCount);

    const deck: CardItem[] = [];
    let idCounter = 1;

    selectedIcons.forEach((iconName, pairIdx) => {
      // Add two matching cards
      deck.push({
        id: idCounter++,
        pairId: pairIdx,
        iconName,
        isFlipped: false,
        isMatched: false,
      });
      deck.push({
        id: idCounter++,
        pairId: pairIdx,
        iconName,
        isFlipped: false,
        isMatched: false,
      });
    });

    // Shuffle deck (Fisher-Yates)
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    setCards(deck);
    setFlippedIndices([]);
    setMoves(0);
    setStreak(0);
    setMatchedPairs(0);
    setSeconds(0);
    setIsActive(false);
    setIsWon(false);
    setCalculatedScore(0);
    setStars(3);

    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  useEffect(() => {
    initializeGame(difficulty);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [difficulty, initializeGame]);

  // Timer runner
  useEffect(() => {
    if (isActive && !isWon) {
      timerRef.current = window.setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, isWon]);

  // Handle Card Click
  const handleCardClick = (index: number) => {
    if (cards[index].isFlipped || cards[index].isMatched || flippedIndices.length >= 2 || isWon) {
      return;
    }

    // Start timer on first move
    if (!isActive) {
      setIsActive(true);
    }

    sound.playCardFlip();

    const newCards = [...cards];
    newCards[index].isFlipped = true;
    setCards(newCards);

    const newFlipped = [...flippedIndices, index];
    setFlippedIndices(newFlipped);

    if (newFlipped.length === 2) {
      setMoves((prev) => prev + 1);
      const [firstIdx, secondIdx] = newFlipped;
      const firstCard = newCards[firstIdx];
      const secondCard = newCards[secondIdx];

      if (firstCard.pairId === secondCard.pairId) {
        // MATCH!
        setTimeout(() => {
          sound.playMatch();
          setCards((prev) => {
            const updated = [...prev];
            updated[firstIdx].isMatched = true;
            updated[secondIdx].isMatched = true;
            return updated;
          });
          setFlippedIndices([]);
          setStreak((prev) => prev + 1);
          setMatchedPairs((prev) => {
            const newCount = prev + 1;
            if (newCount === totalPairs) {
              handleGameVictory(moves + 1, seconds);
            }
            return newCount;
          });
        }, 350);
      } else {
        // WRONG MATCH
        setTimeout(() => {
          sound.playWrong();
          setCards((prev) => {
            const updated = [...prev];
            updated[firstIdx].isFlipped = false;
            updated[secondIdx].isFlipped = false;
            return updated;
          });
          setFlippedIndices([]);
          setStreak(0);
        }, 850);
      }
    }
  };

  const handleGameVictory = (totalMoves: number, totalSeconds: number) => {
    setIsWon(true);
    setIsActive(false);
    sound.playWin();
    confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });

    // Calculate score based on difficulty, moves efficiency & speed
    const baseScore = totalPairs * 120;
    const movePenalty = Math.max(0, (totalMoves - totalPairs) * 15);
    const timePenalty = Math.floor(totalSeconds * 2);
    const finalScore = Math.max(100, baseScore - movePenalty - timePenalty + streak * 50);

    let starRating = 3;
    if (totalMoves > totalPairs * 2) starRating = 2;
    if (totalMoves > totalPairs * 2.8) starRating = 1;

    setStars(starRating);
    setCalculatedScore(finalScore);

    const min = Math.floor(totalSeconds / 60);
    const sec = totalSeconds % 60;
    const timeFormatted = `${min}:${sec < 10 ? '0' : ''}${sec}`;

    saveScore({
      gameId: 'memory',
      playerName: getPlayerName(),
      score: finalScore,
      secondaryMetric: `${totalMoves} moves • ${timeFormatted} (${difficulty.toUpperCase()})`,
    });
  };

  const formatTime = (totalSeconds: number) => {
    const min = Math.floor(totalSeconds / 60);
    const sec = totalSeconds % 60;
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
  };

  const getGridColsClass = () => {
    if (difficulty === 'easy') return 'grid-cols-3 sm:grid-cols-4';
    if (difficulty === 'medium') return 'grid-cols-4';
    return 'grid-cols-4 sm:grid-cols-5';
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8 space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-display">Memory Match</h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-semibold capitalize">
              {difficulty} ({totalPairs * 2} cards)
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Flip cards to reveal matching pairs. Form combos for higher scores!
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Difficulty selection */}
          <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center">
            {(['easy', 'medium', 'hard'] as GridDifficulty[]).map((d) => (
              <button
                key={d}
                id={`memory-diff-${d}`}
                onClick={() => {
                  sound.playClick();
                  setDifficulty(d);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
                  difficulty === d ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                {d}
              </button>
            ))}
          </div>

          <button
            id="memory-restart-btn"
            onClick={() => {
              sound.playClick();
              initializeGame(difficulty);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-semibold transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restart</span>
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Game Stats */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <span>Session Stats</span>
              <Timer className="w-3.5 h-3.5 text-indigo-400" />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-400 font-medium block">Moves</span>
                <span className="text-2xl font-black text-white font-display">{moves}</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-400 font-medium block">Time</span>
                <span className="text-2xl font-black text-white font-display font-mono">
                  {formatTime(seconds)}
                </span>
              </div>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 block">Matched Pairs</span>
                <span className="text-lg font-bold text-indigo-300">
                  {matchedPairs} / {totalPairs}
                </span>
              </div>

              {streak > 1 && (
                <div className="flex items-center gap-1 text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20 text-xs font-bold animate-bounce">
                  <Flame className="w-3.5 h-3.5 fill-current" />
                  <span>{streak}x Combo!</span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-2 text-xs text-slate-400">
            <div className="flex items-center gap-2 text-slate-200 font-semibold">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>Scoring Rules</span>
            </div>
            <p>• Complete the board with fewer moves to earn 3 Stars.</p>
            <p>• Fast matching generates combo multipliers and bonus points.</p>
          </div>
        </div>

        {/* Right Column: Card Grid */}
        <div className="lg:col-span-8 flex flex-col items-center">
          <div className="w-full relative">
            {/* Victory Modal Overlay */}
            {isWon && (
              <div className="absolute inset-0 z-20 bg-slate-950/85 backdrop-blur-md rounded-3xl border border-indigo-500/30 flex flex-col items-center justify-center p-6 text-center animate-in zoom-in duration-200">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-3 shadow-lg shadow-amber-500/20">
                  <Award className="w-8 h-8" />
                </div>

                <h3 className="text-3xl font-black text-white font-display">Puzzle Solved!</h3>
                <p className="text-sm text-slate-300 mt-1">Excellent memory recall!</p>

                {/* Stars Rating */}
                <div className="flex items-center gap-2 my-4">
                  {[1, 2, 3].map((starIdx) => (
                    <Star
                      key={starIdx}
                      className={`w-8 h-8 ${
                        starIdx <= stars
                          ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]'
                          : 'text-slate-700'
                      }`}
                    />
                  ))}
                </div>

                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 mb-5 w-full max-w-xs grid grid-cols-3 gap-2 text-center text-xs">
                  <div>
                    <span className="text-slate-400 block">Score</span>
                    <span className="text-base font-bold text-indigo-400 font-display">
                      {calculatedScore}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Moves</span>
                    <span className="text-base font-bold text-white font-display">{moves}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Time</span>
                    <span className="text-base font-bold text-white font-display">
                      {formatTime(seconds)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    id="memory-play-again-btn"
                    onClick={() => initializeGame(difficulty)}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-400 text-slate-950 font-bold text-sm hover:brightness-110 shadow-lg shadow-indigo-500/25 transition-transform hover:scale-105 cursor-pointer"
                  >
                    Play Again
                  </button>
                  <button
                    id="memory-hall-btn"
                    onClick={onOpenLeaderboard}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-sm font-semibold cursor-pointer"
                  >
                    Hall of Fame
                  </button>
                </div>
              </div>
            )}

            {/* Cards Grid */}
            <div className={`grid ${getGridColsClass()} gap-2.5 sm:gap-3.5 p-3.5 sm:p-5 bg-slate-950/80 rounded-3xl border border-slate-800 shadow-2xl`}>
              {cards.map((card, index) => {
                const isRevealed = card.isFlipped || card.isMatched;

                return (
                  <div
                    key={card.id}
                    id={`memory-card-${index}`}
                    onClick={() => handleCardClick(index)}
                    className="perspective-1000 aspect-square cursor-pointer select-none"
                  >
                    <div
                      className={`relative w-full h-full duration-300 transform-style-3d rounded-2xl transition-transform ${
                        isRevealed ? 'rotate-y-180' : 'hover:scale-[1.03]'
                      }`}
                    >
                      {/* Card Back (Hidden state) */}
                      <div className="absolute inset-0 w-full h-full bg-slate-900 border-2 border-slate-800 rounded-2xl flex items-center justify-center backface-hidden shadow-md shadow-slate-950/50 hover:border-indigo-500/40 transition-colors">
                        <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                          <Eye className="w-4 h-4 opacity-40" />
                        </div>
                      </div>

                      {/* Card Front (Revealed state) */}
                      <div
                        className={`absolute inset-0 w-full h-full rounded-2xl rotate-y-180 flex items-center justify-center backface-hidden border-2 shadow-lg transition-all ${
                          card.isMatched
                            ? 'bg-emerald-950/40 border-emerald-500/60 shadow-emerald-950/50 ring-2 ring-emerald-500/30'
                            : 'bg-slate-900 border-indigo-500/60 shadow-indigo-950/50'
                        }`}
                      >
                        {card.isMatched && (
                          <div className="absolute top-1.5 right-1.5 text-emerald-400">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </div>
                        )}
                        {ICON_REGISTRY[card.iconName] || <Sparkles className="w-7 h-7 text-indigo-400" />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
