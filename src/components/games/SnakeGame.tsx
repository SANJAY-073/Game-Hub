import React, { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  Play,
  Pause,
  RotateCcw,
  Trophy,
  Flame,
  Sparkles,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Shield,
  Zap,
} from 'lucide-react';
import { sound } from '../../utils/sound';
import { saveScore, getPlayerName, getScoresForGame } from '../../utils/storage';

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
interface Point {
  x: number;
  y: number;
}

const GRID_SIZE = 20; // 20x20 grid

export const SnakeGame: React.FC<{ onOpenLeaderboard: () => void }> = ({ onOpenLeaderboard }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Game state
  const [snake, setSnake] = useState<Point[]>([
    { x: 10, y: 10 },
    { x: 10, y: 11 },
    { x: 10, y: 12 },
  ]);
  const [direction, setDirection] = useState<Direction>('UP');
  const [food, setFood] = useState<Point>({ x: 5, y: 5 });
  const [goldenFood, setGoldenFood] = useState<Point | null>(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    const scores = getScoresForGame('snake');
    return scores.length > 0 ? scores[0].score : 0;
  });
  const [isGameOver, setIsGameOver] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speedMode, setSpeedMode] = useState<'easy' | 'normal' | 'turbo'>('normal');
  const [wrapWalls, setWrapWalls] = useState(false);

  // Refs for loop
  const directionRef = useRef<Direction>(direction);
  const nextDirectionRef = useRef<Direction>(direction);
  const snakeRef = useRef<Point[]>(snake);
  const isPlayingRef = useRef<boolean>(isPlaying);
  const isGameOverRef = useRef<boolean>(isGameOver);
  const foodRef = useRef<Point>(food);
  const goldenFoodRef = useRef<Point | null>(goldenFood);
  const scoreRef = useRef<number>(score);
  const goldenTimerRef = useRef<number | null>(null);

  directionRef.current = direction;
  snakeRef.current = snake;
  isPlayingRef.current = isPlaying;
  isGameOverRef.current = isGameOver;
  foodRef.current = food;
  goldenFoodRef.current = goldenFood;
  scoreRef.current = score;

  const getSpeedInterval = () => {
    switch (speedMode) {
      case 'easy':
        return 130;
      case 'normal':
        return 95;
      case 'turbo':
        return 65;
    }
  };

  // Generate random coordinate not on snake
  const getRandomCoord = useCallback((currentSnake: Point[]): Point => {
    let newCoord: Point;
    let isOnSnake: boolean;
    do {
      newCoord = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
      isOnSnake = currentSnake.some((segment) => segment.x === newCoord.x && segment.y === newCoord.y);
    } while (isOnSnake);
    return newCoord;
  }, []);

  // Spawn Golden Food occasionally
  const trySpawnGoldenFood = useCallback(() => {
    if (Math.random() < 0.25 && !goldenFoodRef.current) {
      const coord = getRandomCoord(snakeRef.current);
      setGoldenFood(coord);
      goldenFoodRef.current = coord;

      // Despawn after 8 seconds if not eaten
      if (goldenTimerRef.current) window.clearTimeout(goldenTimerRef.current);
      goldenTimerRef.current = window.setTimeout(() => {
        setGoldenFood(null);
        goldenFoodRef.current = null;
      }, 8000);
    }
  }, [getRandomCoord]);

  // Start game
  const startGame = () => {
    sound.playClick();
    const initialSnake: Point[] = [
      { x: 10, y: 10 },
      { x: 10, y: 11 },
      { x: 10, y: 12 },
    ];
    setSnake(initialSnake);
    snakeRef.current = initialSnake;
    setDirection('UP');
    directionRef.current = 'UP';
    nextDirectionRef.current = 'UP';
    const newFood = getRandomCoord(initialSnake);
    setFood(newFood);
    foodRef.current = newFood;
    setGoldenFood(null);
    goldenFoodRef.current = null;
    setScore(0);
    scoreRef.current = 0;
    setIsGameOver(false);
    isGameOverRef.current = false;
    setIsPlaying(true);
    isPlayingRef.current = true;
  };

  const togglePause = () => {
    sound.playClick();
    setIsPlaying((prev) => !prev);
  };

  const handleGameOver = () => {
    sound.playGameOver();
    setIsPlaying(false);
    isPlayingRef.current = false;
    setIsGameOver(true);
    isGameOverRef.current = true;

    const finalScore = scoreRef.current;
    if (finalScore > highScore) {
      setHighScore(finalScore);
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
    }

    if (finalScore > 0) {
      saveScore({
        gameId: 'snake',
        playerName: getPlayerName(),
        score: finalScore,
        secondaryMetric: `Length: ${snakeRef.current.length} • Speed: ${speedMode.toUpperCase()}`,
      });
    }
  };

  // Change direction safely
  const changeDirection = useCallback((newDir: Direction) => {
    const currentDir = directionRef.current;
    const isOpposite =
      (newDir === 'UP' && currentDir === 'DOWN') ||
      (newDir === 'DOWN' && currentDir === 'UP') ||
      (newDir === 'LEFT' && currentDir === 'RIGHT') ||
      (newDir === 'RIGHT' && currentDir === 'LEFT');

    if (!isOpposite) {
      nextDirectionRef.current = newDir;
    }
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'KeyW'].includes(e.code)) {
        e.preventDefault();
        changeDirection('UP');
      } else if (['ArrowDown', 'KeyS'].includes(e.code)) {
        e.preventDefault();
        changeDirection('DOWN');
      } else if (['ArrowLeft', 'KeyA'].includes(e.code)) {
        e.preventDefault();
        changeDirection('LEFT');
      } else if (['ArrowRight', 'KeyD'].includes(e.code)) {
        e.preventDefault();
        changeDirection('RIGHT');
      } else if (e.code === 'Space') {
        e.preventDefault();
        if (isGameOverRef.current) {
          startGame();
        } else {
          togglePause();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [changeDirection]);

  // Touch Swipe on Canvas
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

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

    if (Math.max(absDx, absDy) > 20) {
      if (absDx > absDy) {
        changeDirection(dx > 0 ? 'RIGHT' : 'LEFT');
      } else {
        changeDirection(dy > 0 ? 'DOWN' : 'UP');
      }
    }
    touchStartRef.current = null;
  };

  // Main Game Loop Step
  useEffect(() => {
    if (!isPlaying || isGameOver) return;

    const intervalId = setInterval(() => {
      const currentSnake = [...snakeRef.current];
      const head = { ...currentSnake[0] };
      const currentDir = nextDirectionRef.current;
      setDirection(currentDir);
      directionRef.current = currentDir;

      // Update head position
      if (currentDir === 'UP') head.y -= 1;
      else if (currentDir === 'DOWN') head.y += 1;
      else if (currentDir === 'LEFT') head.x -= 1;
      else if (currentDir === 'RIGHT') head.x += 1;

      // Wall collision or wrap
      if (wrapWalls) {
        if (head.x < 0) head.x = GRID_SIZE - 1;
        else if (head.x >= GRID_SIZE) head.x = 0;
        if (head.y < 0) head.y = GRID_SIZE - 1;
        else if (head.y >= GRID_SIZE) head.y = 0;
      } else {
        if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
          handleGameOver();
          return;
        }
      }

      // Self collision
      const hasSelfCollision = currentSnake.slice(0, -1).some(
        (seg) => seg.x === head.x && seg.y === head.y
      );
      if (hasSelfCollision) {
        handleGameOver();
        return;
      }

      currentSnake.unshift(head);

      // Check food collision
      const currentFood = foodRef.current;
      const currentGolden = goldenFoodRef.current;

      if (head.x === currentFood.x && head.y === currentFood.y) {
        sound.playEat();
        const nextScore = scoreRef.current + 10;
        setScore(nextScore);
        scoreRef.current = nextScore;
        const newFood = getRandomCoord(currentSnake);
        setFood(newFood);
        foodRef.current = newFood;
        trySpawnGoldenFood();
      } else if (currentGolden && head.x === currentGolden.x && head.y === currentGolden.y) {
        sound.playBonus();
        const nextScore = scoreRef.current + 35;
        setScore(nextScore);
        scoreRef.current = nextScore;
        setGoldenFood(null);
        goldenFoodRef.current = null;
      } else {
        currentSnake.pop();
      }

      setSnake(currentSnake);
      snakeRef.current = currentSnake;
    }, getSpeedInterval());

    return () => clearInterval(intervalId);
  }, [isPlaying, isGameOver, speedMode, wrapWalls, getRandomCoord, trySpawnGoldenFood]);

  // Canvas Renderer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const cellSize = width / GRID_SIZE;

    // Clear background
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, width, height);

    // Draw Subtle Grid
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= GRID_SIZE; i++) {
      ctx.beginPath();
      ctx.moveTo(i * cellSize, 0);
      ctx.lineTo(i * cellSize, height);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, i * cellSize);
      ctx.lineTo(width, i * cellSize);
      ctx.stroke();
    }

    // Draw Regular Food (Pulsing Apple)
    ctx.save();
    const foodX = food.x * cellSize + cellSize / 2;
    const foodY = food.y * cellSize + cellSize / 2;
    ctx.shadowColor = '#10b981';
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(foodX, foodY, cellSize * 0.38, 0, Math.PI * 2);
    ctx.fill();

    // Food highlight
    ctx.fillStyle = '#6ee7b7';
    ctx.beginPath();
    ctx.arc(foodX - cellSize * 0.1, foodY - cellSize * 0.1, cellSize * 0.12, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Draw Golden Food (if active)
    if (goldenFood) {
      ctx.save();
      const goldX = goldenFood.x * cellSize + cellSize / 2;
      const goldY = goldenFood.y * cellSize + cellSize / 2;
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 16;
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(goldX, goldY, cellSize * 0.44, 0, Math.PI * 2);
      ctx.fill();

      // Sparkle inner
      ctx.fillStyle = '#fef3c7';
      ctx.beginPath();
      ctx.arc(goldX, goldY, cellSize * 0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Draw Snake
    snake.forEach((segment, index) => {
      const isHead = index === 0;
      const segX = segment.x * cellSize;
      const segY = segment.y * cellSize;
      const radius = isHead ? cellSize * 0.3 : cellSize * 0.2;

      ctx.save();
      if (isHead) {
        ctx.fillStyle = '#34d399';
        ctx.shadowColor = '#10b981';
        ctx.shadowBlur = 12;
      } else {
        const ratio = index / snake.length;
        ctx.fillStyle = `rgb(16, ${Math.floor(185 - ratio * 60)}, ${Math.floor(129 + ratio * 40)})`;
      }

      // Draw rounded segment box
      ctx.beginPath();
      ctx.roundRect(segX + 1.5, segY + 1.5, cellSize - 3, cellSize - 3, radius);
      ctx.fill();

      // Draw Snake Eyes on Head
      if (isHead) {
        ctx.fillStyle = '#022c22';
        const eyeOffset = cellSize * 0.26;
        let eye1 = { x: segX + eyeOffset, y: segY + eyeOffset };
        let eye2 = { x: segX + cellSize - eyeOffset, y: segY + eyeOffset };

        if (direction === 'DOWN') {
          eye1 = { x: segX + eyeOffset, y: segY + cellSize - eyeOffset };
          eye2 = { x: segX + cellSize - eyeOffset, y: segY + cellSize - eyeOffset };
        } else if (direction === 'LEFT') {
          eye1 = { x: segX + eyeOffset, y: segY + eyeOffset };
          eye2 = { x: segX + eyeOffset, y: segY + cellSize - eyeOffset };
        } else if (direction === 'RIGHT') {
          eye1 = { x: segX + cellSize - eyeOffset, y: segY + eyeOffset };
          eye2 = { x: segX + cellSize - eyeOffset, y: segY + cellSize - eyeOffset };
        }

        ctx.beginPath();
        ctx.arc(eye1.x, eye1.y, cellSize * 0.08, 0, Math.PI * 2);
        ctx.arc(eye2.x, eye2.y, cellSize * 0.08, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    });
  }, [snake, food, goldenFood, direction]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8 space-y-6">
      {/* Header bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-display">Neon Snake</h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
              Canvas 60fps
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Maneuver the neon serpent, hunt golden fruit, and dodge collisions
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {!isPlaying && !isGameOver ? (
            <button
              id="snake-start-btn"
              onClick={startGame}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:brightness-110 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 transition-transform hover:scale-105 active:scale-95 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Start Game</span>
            </button>
          ) : (
            <button
              id="snake-pause-btn"
              onClick={togglePause}
              disabled={isGameOver}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold cursor-pointer"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span>{isPlaying ? 'Pause' : 'Resume'}</span>
            </button>
          )}

          <button
            id="snake-restart-btn"
            onClick={startGame}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-semibold transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Main Play Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Stats & Options */}
        <div className="lg:col-span-4 space-y-4">
          {/* Scoreboard */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <span>Scoreboard</span>
              <Flame className="w-3.5 h-3.5 text-emerald-400" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-950 p-3 rounded-xl border border-emerald-500/30">
                <span className="text-xs text-emerald-400 font-bold block">Current Score</span>
                <span className="text-2xl font-black text-white font-display">{score}</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-amber-500/20">
                <span className="text-xs text-amber-400 font-bold block">High Score</span>
                <span className="text-2xl font-black text-amber-300 font-display">{highScore}</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
              <span>Snake Length: <strong className="text-white">{snake.length}</strong></span>
              {goldenFood && (
                <span className="text-amber-400 font-bold animate-pulse flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Golden Fruit Active! (+35)
                </span>
              )}
            </div>
          </div>

          {/* Speed Selector */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-2.5">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Speed Mode
            </span>
            <div className="grid grid-cols-3 gap-1.5">
              {(['easy', 'normal', 'turbo'] as const).map((s) => (
                <button
                  key={s}
                  id={`snake-speed-${s}`}
                  onClick={() => {
                    sound.playClick();
                    setSpeedMode(s);
                  }}
                  disabled={isPlaying}
                  className={`py-1.5 px-2 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
                    speedMode === s
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-slate-950 text-slate-400 hover:text-slate-200'
                  } ${isPlaying ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Walls Option */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-white block">Portal Wall Wrap</span>
              <span className="text-[11px] text-slate-400">Pass through borders</span>
            </div>
            <button
              id="snake-wall-wrap-btn"
              onClick={() => {
                sound.playClick();
                setWrapWalls((prev) => !prev);
              }}
              disabled={isPlaying}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                wrapWalls ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'
              } ${isPlaying ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {wrapWalls ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>

        {/* Center Canvas */}
        <div className="lg:col-span-8 flex flex-col items-center">
          <div className="relative w-full max-w-md aspect-square rounded-3xl overflow-hidden border-2 border-slate-800 shadow-2xl bg-slate-950">
            <canvas
              ref={canvasRef}
              width={400}
              height={400}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              className="w-full h-full block cursor-pointer select-none touch-none"
            />

            {/* Start / Game Over Overlay */}
            {!isPlaying && (
              <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
                {isGameOver ? (
                  <div className="space-y-4 animate-in zoom-in duration-200">
                    <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
                      <Flame className="w-7 h-7" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-white font-display">Game Over!</h3>
                      <p className="text-sm text-slate-300 mt-1">
                        Final Score: <span className="font-bold text-emerald-400">{score} pts</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-3 justify-center pt-2">
                      <button
                        id="snake-play-again-btn"
                        onClick={startGame}
                        className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold text-sm hover:brightness-110 shadow-lg shadow-emerald-500/25 transition-transform hover:scale-105 cursor-pointer"
                      >
                        Play Again
                      </button>
                      <button
                        id="snake-view-hall-btn"
                        onClick={onOpenLeaderboard}
                        className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-sm font-semibold cursor-pointer"
                      >
                        Hall of Fame
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                      <Sparkles className="w-7 h-7" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-white font-display">Ready to Slither?</h3>
                      <p className="text-xs text-slate-400 mt-1 max-w-xs">
                        Use Arrow Keys, WASD, or the on-screen D-Pad below to steer
                      </p>
                    </div>
                    <button
                      id="snake-launch-btn"
                      onClick={startGame}
                      className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold text-sm hover:brightness-110 shadow-lg shadow-emerald-500/25 transition-transform hover:scale-105 cursor-pointer"
                    >
                      Start Game (Space)
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* On-Screen Mobile D-Pad */}
          <div className="mt-4 flex flex-col items-center gap-1.5 select-none">
            <button
              id="dpad-up"
              onClick={() => changeDirection('UP')}
              className="w-13 h-12 rounded-xl bg-slate-900 hover:bg-slate-800 active:bg-emerald-600 active:text-white border border-slate-700 flex items-center justify-center text-slate-300 transition-colors shadow-md cursor-pointer"
              aria-label="Up"
            >
              <ArrowUp className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-1.5">
              <button
                id="dpad-left"
                onClick={() => changeDirection('LEFT')}
                className="w-13 h-12 rounded-xl bg-slate-900 hover:bg-slate-800 active:bg-emerald-600 active:text-white border border-slate-700 flex items-center justify-center text-slate-300 transition-colors shadow-md cursor-pointer"
                aria-label="Left"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <button
                id="dpad-down"
                onClick={() => changeDirection('DOWN')}
                className="w-13 h-12 rounded-xl bg-slate-900 hover:bg-slate-800 active:bg-emerald-600 active:text-white border border-slate-700 flex items-center justify-center text-slate-300 transition-colors shadow-md cursor-pointer"
                aria-label="Down"
              >
                <ArrowDown className="w-6 h-6" />
              </button>
              <button
                id="dpad-right"
                onClick={() => changeDirection('RIGHT')}
                className="w-13 h-12 rounded-xl bg-slate-900 hover:bg-slate-800 active:bg-emerald-600 active:text-white border border-slate-700 flex items-center justify-center text-slate-300 transition-colors shadow-md cursor-pointer"
                aria-label="Right"
              >
                <ArrowRight className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
