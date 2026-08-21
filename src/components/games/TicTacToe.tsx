import React, { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { RotateCcw, Trophy, Users, Bot, Award, Sparkles, Zap } from 'lucide-react';
import { sound } from '../../utils/sound';
import { saveScore, getPlayerName } from '../../utils/storage';

type Player = 'X' | 'O';
type Board = (Player | null)[];
type Difficulty = 'easy' | 'medium' | 'unbeatable';
type GameMode = 'ai' | 'pvp';

const WINNING_COMBINATIONS = [
  [0, 1, 2], // rows
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6], // cols
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8], // diags
  [2, 4, 6],
];

export const TicTacToe: React.FC<{ onOpenLeaderboard: () => void }> = ({ onOpenLeaderboard }) => {
  const [board, setBoard] = useState<Board>(Array(9).fill(null));
  const [turn, setTurn] = useState<Player>('X');
  const [winner, setWinner] = useState<Player | 'Draw' | null>(null);
  const [winningLine, setWinningLine] = useState<number[] | null>(null);
  const [mode, setMode] = useState<GameMode>('ai');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [scores, setScores] = useState({ xWins: 0, oWins: 0, draws: 0 });
  const [consecutiveWins, setConsecutiveWins] = useState(0);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [theme, setTheme] = useState<'cyber' | 'classic' | 'gems'>('cyber');

  // Check victory condition
  const checkWinner = useCallback((currentBoard: Board) => {
    for (const combination of WINNING_COMBINATIONS) {
      const [a, b, c] = combination;
      if (
        currentBoard[a] &&
        currentBoard[a] === currentBoard[b] &&
        currentBoard[a] === currentBoard[c]
      ) {
        return { winner: currentBoard[a], line: combination };
      }
    }
    if (currentBoard.every((cell) => cell !== null)) {
      return { winner: 'Draw' as const, line: null };
    }
    return null;
  }, []);

  // Minimax Algorithm for unbeatable AI
  const minimax = useCallback((newBoard: Board, player: Player): { score: number; index?: number } => {
    const availSpots = newBoard
      .map((val, idx) => (val === null ? idx : null))
      .filter((val): val is number => val !== null);

    const winResult = checkWinner(newBoard);
    if (winResult) {
      if (winResult.winner === 'O') return { score: 10 };
      if (winResult.winner === 'X') return { score: -10 };
      if (winResult.winner === 'Draw') return { score: 0 };
    }

    const moves: { index: number; score: number }[] = [];

    for (let i = 0; i < availSpots.length; i++) {
      const move: { index: number; score: number } = { index: availSpots[i], score: 0 };
      newBoard[availSpots[i]] = player;

      if (player === 'O') {
        const result = minimax(newBoard, 'X');
        move.score = result.score;
      } else {
        const result = minimax(newBoard, 'O');
        move.score = result.score;
      }

      newBoard[availSpots[i]] = null;
      moves.push(move);
    }

    let bestMove = 0;
    if (player === 'O') {
      let bestScore = -10000;
      for (let i = 0; i < moves.length; i++) {
        if (moves[i].score > bestScore) {
          bestScore = moves[i].score;
          bestMove = i;
        }
      }
    } else {
      let bestScore = 10000;
      for (let i = 0; i < moves.length; i++) {
        if (moves[i].score < bestScore) {
          bestScore = moves[i].score;
          bestMove = i;
        }
      }
    }

    return moves[bestMove] || { score: 0 };
  }, [checkWinner]);

  // AI Move Engine
  const makeAiMove = useCallback((currentBoard: Board) => {
    const emptyIndices = currentBoard
      .map((val, idx) => (val === null ? idx : null))
      .filter((val): val is number => val !== null);

    if (emptyIndices.length === 0) return;

    let targetIndex: number;

    if (difficulty === 'easy') {
      targetIndex = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
    } else if (difficulty === 'medium') {
      // 70% minimax, 30% random
      if (Math.random() < 0.7) {
        targetIndex = minimax([...currentBoard], 'O').index ?? emptyIndices[0];
      } else {
        targetIndex = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
      }
    } else {
      // Unbeatable minimax
      targetIndex = minimax([...currentBoard], 'O').index ?? emptyIndices[0];
    }

    const nextBoard = [...currentBoard];
    nextBoard[targetIndex] = 'O';
    sound.playMove();
    setBoard(nextBoard);
    setTurn('X');
    setIsAiThinking(false);

    const res = checkWinner(nextBoard);
    if (res) {
      handleGameOver(res.winner, res.line);
    }
  }, [difficulty, minimax, checkWinner]);

  const handleGameOver = (winState: Player | 'Draw', line: number[] | null) => {
    setWinner(winState);
    setWinningLine(line);

    if (winState === 'X') {
      sound.playWin();
      confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
      setScores((prev) => ({ ...prev, xWins: prev.xWins + 1 }));
      setConsecutiveWins((prev) => {
        const newStreak = prev + 1;
        // If playing vs Hard/Unbeatable AI, register to leaderboard
        if (mode === 'ai' && (difficulty === 'unbeatable' || difficulty === 'medium')) {
          saveScore({
            gameId: 'tictactoe',
            playerName: getPlayerName(),
            score: newStreak,
            secondaryMetric: `${newStreak} Wins streak (${difficulty.toUpperCase()} AI)`,
          });
        }
        return newStreak;
      });
    } else if (winState === 'O') {
      sound.playGameOver();
      setScores((prev) => ({ ...prev, oWins: prev.oWins + 1 }));
      setConsecutiveWins(0);
    } else if (winState === 'Draw') {
      sound.playWrong();
      setScores((prev) => ({ ...prev, draws: prev.draws + 1 }));
    }
  };

  const handleCellClick = (index: number) => {
    if (board[index] || winner || (mode === 'ai' && turn === 'O') || isAiThinking) {
      return;
    }

    const nextBoard = [...board];
    nextBoard[index] = turn;
    sound.playClick();
    setBoard(nextBoard);

    const res = checkWinner(nextBoard);
    if (res) {
      handleGameOver(res.winner, res.line);
      return;
    }

    if (mode === 'ai') {
      setTurn('O');
      setIsAiThinking(true);
      setTimeout(() => {
        makeAiMove(nextBoard);
      }, 400);
    } else {
      setTurn(turn === 'X' ? 'O' : 'X');
    }
  };

  const resetGame = (fullReset = false) => {
    sound.playClick();
    setBoard(Array(9).fill(null));
    setTurn('X');
    setWinner(null);
    setWinningLine(null);
    setIsAiThinking(false);
    if (fullReset) {
      setScores({ xWins: 0, oWins: 0, draws: 0 });
      setConsecutiveWins(0);
    }
  };

  const getSymbolRender = (val: Player | null) => {
    if (!val) return null;

    if (theme === 'cyber') {
      return val === 'X' ? (
        <span className="text-cyan-400 drop-shadow-[0_0_12px_rgba(34,211,238,0.7)] font-black text-5xl sm:text-6xl">
          ✕
        </span>
      ) : (
        <span className="text-rose-400 drop-shadow-[0_0_12px_rgba(251,113,133,0.7)] font-black text-5xl sm:text-6xl">
          ◯
        </span>
      );
    }

    if (theme === 'gems') {
      return val === 'X' ? (
        <span className="text-amber-400 text-5xl sm:text-6xl font-black">◆</span>
      ) : (
        <span className="text-emerald-400 text-5xl sm:text-6xl font-black">●</span>
      );
    }

    // Classic
    return val === 'X' ? (
      <span className="text-blue-500 font-black text-5xl sm:text-6xl">X</span>
    ) : (
      <span className="text-red-500 font-black text-5xl sm:text-6xl">O</span>
    );
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8 space-y-6">
      {/* Top Header Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-display">Tic Tac Toe</h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-semibold">
              {mode === 'ai' ? `vs AI (${difficulty})` : '2 Players Local'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Challenge smart AI logic or play local pass-and-play with a friend
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center">
            <button
              id="mode-ai-btn"
              onClick={() => {
                setMode('ai');
                resetGame();
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                mode === 'ai' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Bot className="w-3.5 h-3.5" />
              <span>vs AI</span>
            </button>
            <button
              id="mode-pvp-btn"
              onClick={() => {
                setMode('pvp');
                resetGame();
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                mode === 'pvp' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>2 Players</span>
            </button>
          </div>

          <button
            id="ttt-reset-btn"
            onClick={() => resetGame()}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-semibold transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restart</span>
          </button>
        </div>
      </div>

      {/* Main Play Area */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Left Column: Scoreboard & Settings */}
        <div className="md:col-span-4 space-y-4">
          {/* Match Scoreboard */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <span>Current Match</span>
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-slate-950 p-2.5 rounded-xl border border-cyan-500/20">
                <span className="text-xs text-cyan-400 font-bold block">Player X</span>
                <span className="text-xl font-extrabold text-white font-display">{scores.xWins}</span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-400 font-medium block">Draws</span>
                <span className="text-xl font-extrabold text-slate-300 font-display">{scores.draws}</span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-xl border border-rose-500/20">
                <span className="text-xs text-rose-400 font-bold block">
                  {mode === 'ai' ? 'AI (O)' : 'Player O'}
                </span>
                <span className="text-xl font-extrabold text-white font-display">{scores.oWins}</span>
              </div>
            </div>

            {consecutiveWins > 0 && mode === 'ai' && (
              <div className="flex items-center justify-between px-3 py-2 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs font-semibold text-amber-300">
                <span className="flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  Win Streak:
                </span>
                <span className="text-amber-200 font-bold">{consecutiveWins} In a Row</span>
              </div>
            )}
          </div>

          {/* AI Difficulty Selector (when in AI mode) */}
          {mode === 'ai' && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-2.5">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                AI Difficulty
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                {(['easy', 'medium', 'unbeatable'] as Difficulty[]).map((d) => (
                  <button
                    key={d}
                    id={`diff-btn-${d}`}
                    onClick={() => {
                      sound.playClick();
                      setDifficulty(d);
                      resetGame();
                    }}
                    className={`py-1.5 px-2 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
                      difficulty === d
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-slate-950 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Theme Chooser */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-2.5">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Visual Theme
            </span>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: 'cyber', label: 'Neon Cyber' },
                { id: 'classic', label: 'Classic' },
                { id: 'gems', label: 'Gems' },
              ].map((t) => (
                <button
                  key={t.id}
                  id={`theme-btn-${t.id}`}
                  onClick={() => {
                    sound.playClick();
                    setTheme(t.id as 'cyber' | 'classic' | 'gems');
                  }}
                  className={`py-1.5 px-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    theme === t.id
                      ? 'bg-cyan-600 text-white shadow-sm'
                      : 'bg-slate-950 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Center/Right Column: Interactive 3x3 Board */}
        <div className="md:col-span-8 flex flex-col items-center">
          {/* Turn / Game status banner */}
          <div className="w-full max-w-sm mb-4 px-4 py-2.5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span className="text-slate-400 text-xs font-medium">Status:</span>
              {winner ? (
                <span className="font-bold text-amber-300 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  {winner === 'Draw'
                    ? "It's a Draw!"
                    : `${winner === 'X' ? 'Player X' : mode === 'ai' ? 'AI (O)' : 'Player O'} Won!`}
                </span>
              ) : isAiThinking ? (
                <span className="font-bold text-indigo-400 animate-pulse">AI is calculating...</span>
              ) : (
                <span className="font-bold text-white flex items-center gap-1.5">
                  Turn:{' '}
                  <span className={turn === 'X' ? 'text-cyan-400' : 'text-rose-400'}>
                    {turn === 'X' ? 'Player X' : mode === 'ai' ? 'AI (O)' : 'Player O'}
                  </span>
                </span>
              )}
            </div>

            <button
              id="ttt-new-round-btn"
              onClick={() => resetGame()}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer underline underline-offset-2"
            >
              New Round
            </button>
          </div>

          {/* 3x3 Grid */}
          <div className="relative w-full max-w-sm aspect-square bg-slate-950/80 p-3.5 rounded-3xl border-2 border-slate-800 shadow-2xl grid grid-cols-3 gap-3">
            {board.map((val, idx) => {
              const isWinningCell = winningLine?.includes(idx);

              return (
                <button
                  key={idx}
                  id={`ttt-cell-${idx}`}
                  onClick={() => handleCellClick(idx)}
                  disabled={!!val || !!winner || isAiThinking}
                  className={`relative flex items-center justify-center rounded-2xl transition-all duration-200 select-none cursor-pointer ${
                    val ? 'bg-slate-900/90' : 'bg-slate-900/40 hover:bg-slate-900/80 hover:scale-[1.02]'
                  } ${
                    isWinningCell
                      ? 'ring-4 ring-amber-400 bg-amber-500/20 shadow-lg shadow-amber-500/30'
                      : 'border border-slate-800'
                  }`}
                  aria-label={`Cell ${idx + 1}`}
                >
                  {getSymbolRender(val)}
                </button>
              );
            })}
          </div>

          {/* Quick Hall of Fame link */}
          <div className="mt-4 text-center">
            <button
              id="ttt-leaderboard-btn"
              onClick={onOpenLeaderboard}
              className="text-xs text-slate-400 hover:text-amber-300 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>Check Hall of Fame Win Streaks</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
