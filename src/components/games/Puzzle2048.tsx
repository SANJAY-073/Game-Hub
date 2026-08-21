import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  RotateCcw,
  Undo2,
  Trophy,
  Sparkles,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Flame,
  Award,
  Crown,
} from 'lucide-react';
import { sound } from '../../utils/sound';
import { saveScore, getPlayerName } from '../../utils/storage';

interface Puzzle2048Props {
  onOpenLeaderboard: () => void;
}

type Board = number[][];

const BOARD_SIZE = 4;

export const Puzzle2048: React.FC<Puzzle2048Props> = ({ onOpenLeaderboard }) => {
  const [board, setBoard] = useState<Board>(() => getInitialBoard());
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(() => {
    try {
      return parseInt(localStorage.getItem('gamehub_2048_best') || '0', 10);
    } catch {
      return 0;
    }
  });
  const [history, setHistory] = useState<{ board: Board; score: number }[]>([]);
  const [isGameOver, setIsGameOver] = useState(false);
  const [hasWon, setHasWon] = useState(false);
  const [keepPlaying, setKeepPlaying] = useState(false);
  const [highestTile, setHighestTile] = useState(2);

  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  function getInitialBoard(): Board {
    const empty: Board = Array(BOARD_SIZE)
      .fill(null)
      .map(() => Array(BOARD_SIZE).fill(0));
    addRandomTile(empty);
    addRandomTile(empty);
    return empty;
  }

  function addRandomTile(currentBoard: Board) {
    const emptyCells: { r: number; c: number }[] = [];
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (currentBoard[r][c] === 0) {
          emptyCells.push({ r, c });
        }
      }
    }
    if (emptyCells.length > 0) {
      const randCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
      currentBoard[randCell.r][randCell.c] = Math.random() < 0.9 ? 2 : 4;
    }
  }

  const restartGame = useCallback(() => {
    sound.playClick();
    const newBoard = getInitialBoard();
    setBoard(newBoard);
    setScore(0);
    setHistory([]);
    setIsGameOver(false);
    setHasWon(false);
    setKeepPlaying(false);
    setHighestTile(2);
  }, []);

  const handleUndo = () => {
    if (history.length === 0) return;
    sound.playClick();
    const prev = history[history.length - 1];
    setBoard(prev.board);
    setScore(prev.score);
    setHistory((prevH) => prevH.slice(0, -1));
    setIsGameOver(false);
  };

  const checkGameOver = (currentBoard: Board): boolean => {
    // Check for empty cell
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (currentBoard[r][c] === 0) return false;
      }
    }
    // Check horizontal merges
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE - 1; c++) {
        if (currentBoard[r][c] === currentBoard[r][c + 1]) return false;
      }
    }
    // Check vertical merges
    for (let c = 0; c < BOARD_SIZE; c++) {
      for (let r = 0; r < BOARD_SIZE - 1; r++) {
        if (currentBoard[r][c] === currentBoard[r + 1][c]) return false;
      }
    }
    return true;
  };

  const move = useCallback(
    (direction: 'left' | 'right' | 'up' | 'down') => {
      if (isGameOver && !keepPlaying) return;

      let moved = false;
      let gainedScore = 0;
      let maxMergeVal = 0;
      const newBoard = board.map((row) => [...row]);

      const slideRow = (row: number[]): number[] => {
        // Filter zeros
        const filtered = row.filter((val) => val !== 0);
        const result: number[] = [];

        for (let i = 0; i < filtered.length; i++) {
          if (i + 1 < filtered.length && filtered[i] === filtered[i + 1]) {
            const merged = filtered[i] * 2;
            result.push(merged);
            gainedScore += merged;
            if (merged > maxMergeVal) maxMergeVal = merged;
            i++; // skip next
          } else {
            result.push(filtered[i]);
          }
        }

        while (result.length < BOARD_SIZE) {
          result.push(0);
        }
        return result;
      };

      if (direction === 'left') {
        for (let r = 0; r < BOARD_SIZE; r++) {
          const original = newBoard[r];
          const updated = slideRow(original);
          if (original.some((val, idx) => val !== updated[idx])) {
            moved = true;
          }
          newBoard[r] = updated;
        }
      } else if (direction === 'right') {
        for (let r = 0; r < BOARD_SIZE; r++) {
          const original = [...newBoard[r]].reverse();
          const updated = slideRow(original).reverse();
          if (newBoard[r].some((val, idx) => val !== updated[idx])) {
            moved = true;
          }
          newBoard[r] = updated;
        }
      } else if (direction === 'up') {
        for (let c = 0; c < BOARD_SIZE; c++) {
          const col = [newBoard[0][c], newBoard[1][c], newBoard[2][c], newBoard[3][c]];
          const updated = slideRow(col);
          if (col.some((val, idx) => val !== updated[idx])) {
            moved = true;
          }
          for (let r = 0; r < BOARD_SIZE; r++) {
            newBoard[r][c] = updated[r];
          }
        }
      } else if (direction === 'down') {
        for (let c = 0; c < BOARD_SIZE; c++) {
          const col = [newBoard[3][c], newBoard[2][c], newBoard[1][c], newBoard[0][c]];
          const updated = slideRow(col).reverse();
          if (
            [newBoard[0][c], newBoard[1][c], newBoard[2][c], newBoard[3][c]].some(
              (val, idx) => val !== updated[idx]
            )
          ) {
            moved = true;
          }
          for (let r = 0; r < BOARD_SIZE; r++) {
            newBoard[r][c] = updated[r];
          }
        }
      }

      if (moved) {
        // Save current for undo (keep max 5 undos)
        setHistory((prev) => [...prev.slice(-4), { board, score }]);

        // Play audio cue
        if (maxMergeVal > 0) {
          sound.playMerge(maxMergeVal);
        } else {
          sound.playSlide();
        }

        // Add new random tile
        addRandomTile(newBoard);
        setBoard(newBoard);

        const newScore = score + gainedScore;
        setScore(newScore);
        if (newScore > bestScore) {
          setBestScore(newScore);
          try {
            localStorage.setItem('gamehub_2048_best', newScore.toString());
          } catch {
            // ignore
          }
        }

        // Calculate highest tile
        let currentMax = 0;
        newBoard.forEach((row) =>
          row.forEach((v) => {
            if (v > currentMax) currentMax = v;
          })
        );
        setHighestTile(currentMax);

        // Check 2048 Win condition
        if (currentMax >= 2048 && !hasWon && !keepPlaying) {
          setHasWon(true);
          sound.playWin();
          saveScore({
            gameId: 'puzzle2048',
            playerName: getPlayerName(),
            score: newScore,
            secondaryMetric: `Reached 2048 Tile! (${newScore} pts)`,
          });
        }

        // Check Game Over
        if (checkGameOver(newBoard)) {
          setIsGameOver(true);
          sound.playGameOver();
          saveScore({
            gameId: 'puzzle2048',
            playerName: getPlayerName(),
            score: newScore,
            secondaryMetric: `Highest: ${currentMax} • ${newScore} pts`,
          });
        }
      }
    },
    [board, score, bestScore, isGameOver, hasWon, keepPlaying]
  );

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'KeyA', 'KeyD', 'KeyW', 'KeyS'].includes(e.code)) {
        e.preventDefault();
        if (e.code === 'ArrowLeft' || e.code === 'KeyA') move('left');
        if (e.code === 'ArrowRight' || e.code === 'KeyD') move('right');
        if (e.code === 'ArrowUp' || e.code === 'KeyW') move('up');
        if (e.code === 'ArrowDown' || e.code === 'KeyS') move('down');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [move]);

  // Touch Swipe navigation
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    if (Math.max(absDx, absDy) > 25) {
      if (absDx > absDy) {
        if (dx > 0) move('right');
        else move('left');
      } else {
        if (dy > 0) move('down');
        else move('up');
      }
    }
    touchStartRef.current = null;
  };

  // Helper for dynamic tile colors
  const getTileStyle = (val: number) => {
    switch (val) {
      case 2:
        return 'bg-cyan-500/20 text-cyan-200 border-cyan-500/40 shadow-cyan-500/10';
      case 4:
        return 'bg-teal-500/25 text-teal-100 border-teal-500/40 shadow-teal-500/15';
      case 8:
        return 'bg-indigo-600/40 text-indigo-100 border-indigo-500/50 shadow-indigo-500/20';
      case 16:
        return 'bg-violet-600/50 text-white border-violet-500/60 shadow-violet-500/25';
      case 32:
        return 'bg-purple-600/60 text-white border-purple-500/60 shadow-purple-500/30';
      case 64:
        return 'bg-pink-600/70 text-white border-pink-500/70 shadow-pink-500/35';
      case 128:
        return 'bg-rose-600 text-white border-rose-400 shadow-rose-500/40 font-bold';
      case 256:
        return 'bg-amber-600 text-white border-amber-400 shadow-amber-500/40 font-bold';
      case 512:
        return 'bg-yellow-500 text-slate-950 border-yellow-300 shadow-yellow-500/50 font-black';
      case 1024:
        return 'bg-gradient-to-tr from-amber-400 to-yellow-200 text-slate-950 border-amber-200 shadow-yellow-400/60 font-black';
      case 2048:
        return 'bg-gradient-to-tr from-yellow-400 via-amber-300 to-yellow-100 text-slate-950 border-yellow-100 shadow-amber-400/80 font-black animate-pulse';
      default:
        return 'bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 text-white border-white/60 font-black';
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Game Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 bg-slate-900/60 p-4 rounded-2xl border border-slate-800 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-purple-500 to-indigo-500 p-0.5 shadow-lg shadow-purple-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-purple-400" />
            </div>
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white font-display flex items-center gap-2">
              Neon 2048
              <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                Max: {highestTile}
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Slide numbered tiles, merge matching pairs, and unleash the legendary 2048 neon crown!
            </p>
          </div>
        </div>

        {/* Scores & Actions */}
        <div className="flex items-center gap-3">
          <div className="bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-center min-w-[70px]">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Score</span>
            <span className="text-base font-bold font-mono text-purple-400">{score}</span>
          </div>

          <div className="bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-center min-w-[70px]">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Best</span>
            <span className="text-base font-bold font-mono text-amber-400">{bestScore}</span>
          </div>

          <button
            onClick={() => {
              sound.playClick();
              onOpenLeaderboard();
            }}
            className="p-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 transition-colors cursor-pointer"
            title="View 2048 Leaderboard"
          >
            <Trophy className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Control Buttons Bar */}
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <button
            id="puzzle-restart-btn"
            onClick={restartGame}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>New Grid</span>
          </button>
          <button
            id="puzzle-undo-btn"
            onClick={handleUndo}
            disabled={history.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-40 disabled:pointer-events-none text-xs font-semibold transition-colors cursor-pointer"
          >
            <Undo2 className="w-3.5 h-3.5" />
            <span>Undo ({history.length})</span>
          </button>
        </div>

        <div className="text-xs text-slate-400 flex items-center gap-1">
          <span>Highest:</span>
          <span className="font-bold text-amber-400 font-mono">{highestTile}</span>
        </div>
      </div>

      {/* 4x4 Sliding Game Grid Container */}
      <div className="relative flex justify-center">
        <div
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="relative w-full max-w-[420px] aspect-square bg-slate-950 p-3 rounded-2xl border-2 border-slate-800 shadow-2xl touch-none select-none"
        >
          {/* Background Grid Cells */}
          <div className="grid grid-cols-4 grid-rows-4 gap-2.5 w-full h-full">
            {board.map((row, rIdx) =>
              row.map((val, cIdx) => (
                <div
                  key={`cell-${rIdx}-${cIdx}`}
                  className="relative rounded-xl bg-slate-900/80 border border-slate-800/80 flex items-center justify-center overflow-hidden"
                >
                  {val > 0 && (
                    <motion.div
                      layout
                      initial={{ scale: 0.6, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: 'spring', damping: 20, stiffness: 350 }}
                      className={`w-full h-full rounded-xl flex items-center justify-center border shadow-lg ${getTileStyle(
                        val
                      )}`}
                    >
                      <span
                        className={`font-mono leading-none ${
                          val >= 1024 ? 'text-lg sm:text-xl' : val >= 128 ? 'text-xl sm:text-2xl' : 'text-2xl sm:text-3xl font-bold'
                        }`}
                      >
                        {val}
                      </span>
                    </motion.div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Win 2048 Modal */}
          {hasWon && !keepPlaying && (
            <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md rounded-2xl flex flex-col items-center justify-center p-6 text-center animate-fade-in z-20">
              <div className="w-16 h-16 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center mb-3 text-amber-400 animate-bounce">
                <Crown className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-1">You Created 2048!</h2>
              <p className="text-xs text-amber-300 mb-4">Legendary achievement unlocked.</p>
              <div className="bg-slate-900 px-6 py-2.5 rounded-xl border border-slate-800 mb-6 font-mono text-lg font-bold text-white">
                Score: {score}
              </div>
              <div className="flex gap-3">
                <button
                  id="puzzle-keep-playing-btn"
                  onClick={() => {
                    sound.playClick();
                    setKeepPlaying(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-colors cursor-pointer border border-slate-700"
                >
                  Keep Playing
                </button>
                <button
                  id="puzzle-win-restart-btn"
                  onClick={restartGame}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-transform hover:scale-105 active:scale-95 shadow-lg shadow-amber-500/30 cursor-pointer"
                >
                  New Game
                </button>
              </div>
            </div>
          )}

          {/* Game Over Modal */}
          {isGameOver && (
            <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md rounded-2xl flex flex-col items-center justify-center p-6 text-center z-20">
              <div className="w-14 h-14 rounded-full bg-rose-500/20 border border-rose-500/30 flex items-center justify-center mb-3 text-rose-400">
                <Award className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-bold text-white mb-1">No Moves Left!</h2>
              <p className="text-xs text-slate-400 mb-4">You reached tile {highestTile}</p>
              <div className="bg-slate-900 px-6 py-2 rounded-xl border border-slate-800 mb-5 font-mono text-lg font-bold text-purple-400">
                Score: {score}
              </div>
              <div className="flex gap-3">
                {history.length > 0 && (
                  <button
                    onClick={handleUndo}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs cursor-pointer border border-slate-700 flex items-center gap-1.5"
                  >
                    <Undo2 className="w-3.5 h-3.5" />
                    Undo Move
                  </button>
                )}
                <button
                  id="puzzle-retry-btn"
                  onClick={restartGame}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-transform hover:scale-105 active:scale-95 shadow-lg shadow-purple-500/30 cursor-pointer flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Try Again
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* On-Screen Mobile D-Pad */}
      <div className="mt-6 flex flex-col items-center gap-1.5 sm:hidden">
        <button
          onClick={() => move('up')}
          className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-300 active:bg-purple-600 active:text-white"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-3">
          <button
            onClick={() => move('left')}
            className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-300 active:bg-purple-600 active:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => move('down')}
            className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-300 active:bg-purple-600 active:text-white"
          >
            <ArrowDown className="w-5 h-5" />
          </button>
          <button
            onClick={() => move('right')}
            className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-300 active:bg-purple-600 active:text-white"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Keyboard guide for desktop */}
      <div className="mt-4 hidden sm:flex items-center justify-center gap-4 text-xs text-slate-400">
        <span className="bg-slate-900 px-2 py-1 rounded border border-slate-800 font-mono text-slate-300">
          Arrow Keys / WASD
        </span>
        <span>Slide & Merge Grid Tiles</span>
      </div>
    </div>
  );
};
