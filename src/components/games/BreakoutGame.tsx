import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Trophy,
  Volume2,
  VolumeX,
  Sparkles,
  Heart,
  Zap,
  ArrowLeft,
  ChevronRight,
  Shield,
  Layers,
} from 'lucide-react';
import { sound } from '../../utils/sound';
import { saveScore, getPlayerName } from '../../utils/storage';

interface BreakoutGameProps {
  onOpenLeaderboard: () => void;
}

interface Brick {
  x: number;
  y: number;
  w: number;
  h: number;
  hits: number;
  maxHits: number;
  color: string;
  points: number;
  powerUp?: 'multiball' | 'laser' | 'wide' | 'fireball' | 'life';
}

interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  isFireball?: boolean;
}

interface PowerUpItem {
  x: number;
  y: number;
  type: 'multiball' | 'laser' | 'wide' | 'fireball' | 'life';
  vy: number;
  color: string;
  symbol: string;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  alpha: number;
  size: number;
  life: number;
}

interface Laser {
  x: number;
  y: number;
  vy: number;
}

export const BreakoutGame: React.FC<BreakoutGameProps> = ({ onOpenLeaderboard }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Game State
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [lives, setLives] = useState(3);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isLevelCleared, setIsLevelCleared] = useState(false);
  const [activePowerUp, setActivePowerUp] = useState<string | null>(null);
  const [powerUpTimeLeft, setPowerUpTimeLeft] = useState(0);
  const [combo, setCombo] = useState(0);

  // Mutable Game Refs for 60fps engine
  const gameStateRef = useRef({
    paddle: { x: 250, y: 550, w: 90, h: 12, speed: 8, targetW: 90 },
    balls: [] as Ball[],
    bricks: [] as Brick[],
    powerUps: [] as PowerUpItem[],
    lasers: [] as Laser[],
    particles: [] as Particle[],
    keys: { ArrowLeft: false, ArrowRight: false, KeyA: false, KeyD: false, Space: false },
    score: 0,
    lives: 3,
    level: 1,
    isPlaying: false,
    isPaused: false,
    combo: 0,
    hasLaser: false,
    laserCooldown: 0,
  });

  const animFrameRef = useRef<number | null>(null);

  // Initialize Brick Layout for a level
  const generateBricks = useCallback((lvl: number): Brick[] => {
    const bricks: Brick[] = [];
    const rows = 4 + Math.min(lvl, 4);
    const cols = 8;
    const brickW = 60;
    const brickH = 20;
    const padding = 10;
    const offsetX = 35;
    const offsetY = 60;

    const rowColors = [
      { color: '#f43f5e', points: 50 }, // Rose
      { color: '#fb923c', points: 40 }, // Orange
      { color: '#facc15', points: 30 }, // Yellow
      { color: '#4ade80', points: 20 }, // Green
      { color: '#38bdf8', points: 15 }, // Cyan
      { color: '#818cf8', points: 10 }, // Indigo
      { color: '#c084fc', points: 25 }, // Purple
    ];

    const powerTypes: ('multiball' | 'laser' | 'wide' | 'fireball' | 'life')[] = [
      'multiball',
      'laser',
      'wide',
      'fireball',
      'life',
    ];

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        // Create interesting level patterns
        if (lvl === 2 && (r + c) % 2 === 1) continue; // Checkerboard
        if (lvl === 3 && (c === 0 || c === cols - 1) && r > 2) continue; // Castle
        if (lvl >= 4 && (r === 2 || r === 3) && (c === 3 || c === 4)) {
          // Special armored core
          bricks.push({
            x: offsetX + c * (brickW + padding),
            y: offsetY + r * (brickH + padding),
            w: brickW,
            h: brickH,
            hits: 0,
            maxHits: 3,
            color: '#f59e0b',
            points: 100,
            powerUp: 'fireball',
          });
          continue;
        }

        const colorObj = rowColors[r % rowColors.length];
        const isArmored = lvl >= 2 && r === 0;
        const hasPowerUp = Math.random() < 0.22;
        const pType = hasPowerUp ? powerTypes[Math.floor(Math.random() * powerTypes.length)] : undefined;

        bricks.push({
          x: offsetX + c * (brickW + padding),
          y: offsetY + r * (brickH + padding),
          w: brickW,
          h: brickH,
          hits: 0,
          maxHits: isArmored ? 2 : 1,
          color: isArmored ? '#eab308' : colorObj.color,
          points: isArmored ? colorObj.points * 2 : colorObj.points,
          powerUp: pType,
        });
      }
    }
    return bricks;
  }, []);

  // Spawn initial ball on paddle
  const resetBallAndPaddle = useCallback(() => {
    const s = gameStateRef.current;
    s.paddle.w = 90;
    s.paddle.targetW = 90;
    s.paddle.x = 300 - s.paddle.w / 2;
    s.hasLaser = false;
    s.balls = [
      {
        x: 300,
        y: s.paddle.y - 12,
        vx: (Math.random() * 2 - 1) * 3,
        vy: -5.5,
        radius: 6,
      },
    ];
    s.powerUps = [];
    s.lasers = [];
  }, []);

  // Start game session
  const startGame = useCallback(
    (startLvl = 1) => {
      sound.playClick();
      const s = gameStateRef.current;
      s.score = startLvl === 1 ? 0 : s.score;
      s.lives = 3;
      s.level = startLvl;
      s.isPlaying = true;
      s.isPaused = false;
      s.combo = 0;
      s.bricks = generateBricks(startLvl);
      resetBallAndPaddle();

      setScore(s.score);
      setLives(s.lives);
      setLevel(s.level);
      setIsPlaying(true);
      setIsPaused(false);
      setIsGameOver(false);
      setIsLevelCleared(false);
      setActivePowerUp(null);
      setCombo(0);
    },
    [generateBricks, resetBallAndPaddle]
  );

  // Spawn explosion particles
  const spawnParticles = (x: number, y: number, color: string, count = 12) => {
    const s = gameStateRef.current;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 4 + 1;
      s.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        alpha: 1,
        size: Math.random() * 3 + 2,
        life: 1,
      });
    }
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'ArrowRight', 'KeyA', 'KeyD', 'Space'].includes(e.code)) {
        if (e.code === 'Space') e.preventDefault();
        const s = gameStateRef.current;
        if (e.code === 'ArrowLeft' || e.code === 'KeyA') s.keys.ArrowLeft = true;
        if (e.code === 'ArrowRight' || e.code === 'KeyD') s.keys.ArrowRight = true;
        if (e.code === 'Space') {
          s.keys.Space = true;
          // Fire lasers if active
          if (s.hasLaser && s.laserCooldown <= 0) {
            sound.playLaser();
            s.lasers.push({ x: s.paddle.x + 8, y: s.paddle.y - 4, vy: -9 });
            s.lasers.push({ x: s.paddle.x + s.paddle.w - 8, y: s.paddle.y - 4, vy: -9 });
            s.laserCooldown = 15;
          }
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const s = gameStateRef.current;
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') s.keys.ArrowLeft = false;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') s.keys.ArrowRight = false;
      if (e.code === 'Space') s.keys.Space = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Mouse & Touch controls on canvas
  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !gameStateRef.current.isPlaying || gameStateRef.current.isPaused)
      return;
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = 600 / rect.width;
    const mouseX = (e.clientX - rect.left) * scaleX;
    const p = gameStateRef.current.paddle;
    p.x = Math.max(0, Math.min(600 - p.w, mouseX - p.w / 2));
  };

  const handleCanvasTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !gameStateRef.current.isPlaying || gameStateRef.current.isPaused)
      return;
    const touch = e.touches[0];
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = 600 / rect.width;
    const touchX = (touch.clientX - rect.left) * scaleX;
    const p = gameStateRef.current.paddle;
    p.x = Math.max(0, Math.min(600 - p.w, touchX - p.w / 2));
  };

  // Main 60fps Game Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let lastTime = performance.now();

    const loop = (currentTime: number) => {
      const s = gameStateRef.current;

      // Handle Key movement
      if (s.isPlaying && !s.isPaused) {
        if (s.keys.ArrowLeft) s.paddle.x -= s.paddle.speed;
        if (s.keys.ArrowRight) s.paddle.x += s.paddle.speed;
        s.paddle.x = Math.max(0, Math.min(600 - s.paddle.w, s.paddle.x));

        if (s.laserCooldown > 0) s.laserCooldown--;

        // Update Lasers
        for (let i = s.lasers.length - 1; i >= 0; i--) {
          const l = s.lasers[i];
          l.y += l.vy;
          if (l.y < 0) {
            s.lasers.splice(i, 1);
            continue;
          }

          // Check laser brick hit
          for (let bIdx = s.bricks.length - 1; bIdx >= 0; bIdx--) {
            const b = s.bricks[bIdx];
            if (l.x > b.x && l.x < b.x + b.w && l.y > b.y && l.y < b.y + b.h) {
              s.lasers.splice(i, 1);
              b.hits++;
              sound.playBrickHit(b.hits < b.maxHits);
              spawnParticles(b.x + b.w / 2, b.y + b.h / 2, b.color, 6);

              if (b.hits >= b.maxHits) {
                s.score += b.points;
                setScore(s.score);
                if (b.powerUp) {
                  s.powerUps.push({
                    x: b.x + b.w / 2,
                    y: b.y + b.h / 2,
                    type: b.powerUp,
                    vy: 2.2,
                    color: '#38bdf8',
                    symbol: b.powerUp === 'multiball' ? '●●' : b.powerUp === 'laser' ? '⚡' : '★',
                  });
                }
                s.bricks.splice(bIdx, 1);
              }
              break;
            }
          }
        }

        // Update Powerups falling
        for (let i = s.powerUps.length - 1; i >= 0; i--) {
          const p = s.powerUps[i];
          p.y += p.vy;

          // Check catch by paddle
          if (
            p.y + 10 >= s.paddle.y &&
            p.y - 10 <= s.paddle.y + s.paddle.h &&
            p.x >= s.paddle.x &&
            p.x <= s.paddle.x + s.paddle.w
          ) {
            sound.playPowerUp();
            setActivePowerUp(p.type);
            setPowerUpTimeLeft(12);

            if (p.type === 'multiball') {
              const currentBall = s.balls[0] || { x: 300, y: 400, vx: 3, vy: -5, radius: 6 };
              s.balls.push(
                {
                  x: currentBall.x,
                  y: currentBall.y,
                  vx: currentBall.vx * 0.8 - 2,
                  vy: -Math.abs(currentBall.vy),
                  radius: 6,
                },
                {
                  x: currentBall.x,
                  y: currentBall.y,
                  vx: currentBall.vx * 0.8 + 2,
                  vy: -Math.abs(currentBall.vy),
                  radius: 6,
                }
              );
            } else if (p.type === 'wide') {
              s.paddle.w = 140;
            } else if (p.type === 'laser') {
              s.hasLaser = true;
            } else if (p.type === 'fireball') {
              s.balls.forEach((b) => (b.isFireball = true));
            } else if (p.type === 'life') {
              s.lives = Math.min(5, s.lives + 1);
              setLives(s.lives);
            }

            s.powerUps.splice(i, 1);
            continue;
          }

          if (p.y > 600) {
            s.powerUps.splice(i, 1);
          }
        }

        // Update Balls
        for (let bIdx = s.balls.length - 1; bIdx >= 0; bIdx--) {
          const ball = s.balls[bIdx];
          ball.x += ball.vx;
          ball.y += ball.vy;

          // Wall collision
          if (ball.x - ball.radius <= 0) {
            ball.x = ball.radius;
            ball.vx = Math.abs(ball.vx);
            sound.playMove();
          } else if (ball.x + ball.radius >= 600) {
            ball.x = 600 - ball.radius;
            ball.vx = -Math.abs(ball.vx);
            sound.playMove();
          }

          if (ball.y - ball.radius <= 0) {
            ball.y = ball.radius;
            ball.vy = Math.abs(ball.vy);
            sound.playMove();
          }

          // Paddle collision
          if (
            ball.y + ball.radius >= s.paddle.y &&
            ball.y - ball.radius <= s.paddle.y + s.paddle.h &&
            ball.x >= s.paddle.x &&
            ball.x <= s.paddle.x + s.paddle.w &&
            ball.vy > 0
          ) {
            sound.playPaddleHit();
            s.combo = 0;
            setCombo(0);

            // Angle depends on where it hits the paddle
            const hitPos = (ball.x - (s.paddle.x + s.paddle.w / 2)) / (s.paddle.w / 2);
            const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
            const maxAngle = (75 * Math.PI) / 180;
            const newAngle = hitPos * maxAngle;

            ball.vx = speed * Math.sin(newAngle);
            ball.vy = -Math.abs(speed * Math.cos(newAngle));

            // Slight speed bump
            if (speed < 9) {
              ball.vx *= 1.02;
              ball.vy *= 1.02;
            }

            spawnParticles(ball.x, s.paddle.y, '#38bdf8', 4);
          }

          // Brick collision
          for (let i = s.bricks.length - 1; i >= 0; i--) {
            const b = s.bricks[i];
            if (
              ball.x + ball.radius >= b.x &&
              ball.x - ball.radius <= b.x + b.w &&
              ball.y + ball.radius >= b.y &&
              ball.y - ball.radius <= b.y + b.h
            ) {
              b.hits++;
              sound.playBrickHit(b.hits < b.maxHits);
              spawnParticles(ball.x, ball.y, b.color, 8);

              // Score calculation with combo
              s.combo++;
              const pts = b.points * (1 + Math.min(s.combo, 10) * 0.1);
              s.score += Math.round(pts);
              setScore(s.score);
              setCombo(s.combo);

              if (b.hits >= b.maxHits) {
                // Drop powerup
                if (b.powerUp) {
                  s.powerUps.push({
                    x: b.x + b.w / 2,
                    y: b.y + b.h / 2,
                    type: b.powerUp,
                    vy: 2.2,
                    color: '#38bdf8',
                    symbol: '★',
                  });
                }
                s.bricks.splice(i, 1);
              }

              // Fireball does not bounce, passes through!
              if (!ball.isFireball) {
                // Determine bounce side
                const overlapLeft = ball.x + ball.radius - b.x;
                const overlapRight = b.x + b.w - (ball.x - ball.radius);
                const overlapTop = ball.y + ball.radius - b.y;
                const overlapBottom = b.y + b.h - (ball.y - ball.radius);

                const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);
                if (minOverlap === overlapLeft || minOverlap === overlapRight) {
                  ball.vx = -ball.vx;
                } else {
                  ball.vy = -ball.vy;
                }
              }
              break;
            }
          }

          // Ball fell below canvas
          if (ball.y - ball.radius > 600) {
            s.balls.splice(bIdx, 1);
          }
        }

        // Check if all balls lost
        if (s.balls.length === 0) {
          s.lives--;
          setLives(s.lives);
          sound.playGameOver();

          if (s.lives <= 0) {
            s.isPlaying = false;
            setIsPlaying(false);
            setIsGameOver(true);
            saveScore({
              gameId: 'breakout',
              playerName: getPlayerName(),
              score: s.score,
              secondaryMetric: `Level ${s.level} • ${s.score} pts`,
            });
          } else {
            resetBallAndPaddle();
          }
        }

        // Check Level Clear
        if (s.bricks.length === 0 && s.isPlaying) {
          s.isPlaying = false;
          setIsPlaying(false);
          setIsLevelCleared(true);
          sound.playWin();
          saveScore({
            gameId: 'breakout',
            playerName: getPlayerName(),
            score: s.score + 500 * s.level,
            secondaryMetric: `Stage ${s.level} Complete!`,
          });
        }
      }

      // Render Loop
      ctx.fillStyle = '#020617';
      ctx.fillRect(0, 0, 600, 600);

      // Grid background effect
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1;
      for (let x = 0; x < 600; x += 30) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 600);
        ctx.stroke();
      }
      for (let y = 0; y < 600; y += 30) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(600, y);
        ctx.stroke();
      }

      // Draw Bricks with neon glow
      s.bricks.forEach((b) => {
        ctx.fillStyle = b.color;
        ctx.shadowColor = b.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.roundRect(b.x, b.y, b.w, b.h, 4);
        ctx.fill();

        // Inner highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.fillRect(b.x + 2, b.y + 2, b.w - 4, 3);

        // Power-up indicator badge
        if (b.powerUp) {
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(b.x + b.w / 2, b.y + b.h / 2, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
      });
      ctx.shadowBlur = 0;

      // Draw Falling Power-ups
      s.powerUps.forEach((p) => {
        ctx.fillStyle = '#06b6d4';
        ctx.shadowColor = '#06b6d4';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 9px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(p.type === 'multiball' ? '3x' : p.type === 'laser' ? '⚡' : '★', p.x, p.y);
      });
      ctx.shadowBlur = 0;

      // Draw Lasers
      ctx.fillStyle = '#38bdf8';
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 8;
      s.lasers.forEach((l) => {
        ctx.fillRect(l.x - 1.5, l.y, 3, 12);
      });
      ctx.shadowBlur = 0;

      // Draw Paddle
      const padGrad = ctx.createLinearGradient(
        s.paddle.x,
        s.paddle.y,
        s.paddle.x + s.paddle.w,
        s.paddle.y
      );
      padGrad.addColorStop(0, '#06b6d4');
      padGrad.addColorStop(0.5, '#6366f1');
      padGrad.addColorStop(1, '#a855f7');

      ctx.fillStyle = padGrad;
      ctx.shadowColor = '#6366f1';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.roundRect(s.paddle.x, s.paddle.y, s.paddle.w, s.paddle.h, 6);
      ctx.fill();

      // Laser emitters on paddle
      if (s.hasLaser) {
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(s.paddle.x + 4, s.paddle.y - 3, 4, 3);
        ctx.fillRect(s.paddle.x + s.paddle.w - 8, s.paddle.y - 3, 4, 3);
      }
      ctx.shadowBlur = 0;

      // Draw Balls
      s.balls.forEach((ball) => {
        ctx.fillStyle = ball.isFireball ? '#f43f5e' : '#38bdf8';
        ctx.shadowColor = ball.isFireball ? '#f43f5e' : '#38bdf8';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.shadowBlur = 0;

      // Draw & Update Particles
      for (let i = s.particles.length - 1; i >= 0; i--) {
        const pt = s.particles[i];
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.life -= 0.025;
        pt.alpha = Math.max(0, pt.life);

        if (pt.life <= 0) {
          s.particles.splice(i, 1);
          continue;
        }

        ctx.fillStyle = pt.color;
        ctx.globalAlpha = pt.alpha;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1.0;

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  const handleNextLevel = () => {
    sound.playClick();
    startGame(level + 1);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Game Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 bg-slate-900/60 p-4 rounded-2xl border border-slate-800 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-pink-500 to-rose-400 p-0.5 shadow-lg shadow-pink-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Zap className="w-6 h-6 text-pink-400" />
            </div>
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white font-display flex items-center gap-2">
              Neon Breakout
              <span className="text-xs px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30">
                Stage {level}
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Shatter glowing neon bricks, catch power-ups, and trigger explosive multi-ball combos!
            </p>
          </div>
        </div>

        {/* Live Score & Hearts */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-400 mr-1">Lives:</span>
            {Array.from({ length: 5 }).map((_, idx) => (
              <Heart
                key={idx}
                className={`w-4 h-4 ${
                  idx < lives ? 'text-rose-500 fill-rose-500' : 'text-slate-800'
                }`}
              />
            ))}
          </div>

          <div className="bg-slate-950 px-4 py-1.5 rounded-xl border border-slate-800 text-right">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Score</span>
            <span className="text-lg font-bold font-mono text-pink-400">{score}</span>
          </div>

          <button
            onClick={() => {
              sound.playClick();
              onOpenLeaderboard();
            }}
            className="p-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 transition-colors cursor-pointer"
            title="View Breakout Leaderboard"
          >
            <Trophy className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Canvas Stage */}
      <div className="relative flex justify-center items-center">
        <div className="relative rounded-2xl overflow-hidden border-2 border-slate-800 shadow-2xl bg-slate-950 w-full max-w-[600px] aspect-square">
          <canvas
            ref={canvasRef}
            width={600}
            height={600}
            onMouseMove={handleCanvasMouseMove}
            onTouchMove={handleCanvasTouchMove}
            className="w-full h-full cursor-none block"
          />

          {/* Combo Floating Badge */}
          {combo > 1 && (
            <div className="absolute top-4 right-4 bg-pink-500/20 text-pink-300 border border-pink-500/40 px-3 py-1 rounded-full text-xs font-bold font-mono animate-pulse">
              Combo x{combo}!
            </div>
          )}

          {/* Active Powerup indicator */}
          {activePowerUp && (
            <div className="absolute top-4 left-4 bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span className="capitalize">{activePowerUp} Mode Active</span>
            </div>
          )}

          {/* Start / Intro Overlay */}
          {!isPlaying && !isGameOver && !isLevelCleared && (
            <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
              <div className="w-16 h-16 rounded-2xl bg-pink-500/20 border border-pink-500/30 flex items-center justify-center mb-4 text-pink-400">
                <Zap className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Ready to Break Out?</h2>
              <p className="text-xs text-slate-400 max-w-sm mb-6">
                Move paddle with Mouse, Touch, or Arrow Keys. Press Spacebar to shoot lasers when
                equipped!
              </p>
              <button
                id="breakout-start-btn"
                onClick={() => startGame(1)}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-pink-600 to-rose-500 hover:from-pink-500 hover:to-rose-400 text-white font-bold text-sm transition-all hover:scale-105 active:scale-95 shadow-lg shadow-pink-500/30 cursor-pointer flex items-center gap-2"
              >
                <Play className="w-4 h-4 fill-white" />
                Launch Ball (Start Game)
              </button>
            </div>
          )}

          {/* Level Cleared Overlay */}
          {isLevelCleared && (
            <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-fade-in">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mb-4 text-emerald-400 animate-bounce">
                <Trophy className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-1">Stage {level} Cleared!</h2>
              <p className="text-sm text-emerald-400 font-medium mb-4">+500 Stage Clear Bonus</p>
              <div className="bg-slate-900 px-6 py-3 rounded-xl border border-slate-800 mb-6 font-mono text-xl font-bold text-white">
                Score: {score}
              </div>
              <button
                id="breakout-next-stage-btn"
                onClick={handleNextLevel}
                className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition-all hover:scale-105 active:scale-95 shadow-lg shadow-emerald-500/30 cursor-pointer flex items-center gap-2"
              >
                <span>Next Stage</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Game Over Overlay */}
          {isGameOver && (
            <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-rose-500/20 border border-rose-500/30 flex items-center justify-center mb-4 text-rose-400">
                <Shield className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-1">Out of Balls!</h2>
              <p className="text-xs text-slate-400 mb-4">You reached Stage {level}</p>
              <div className="bg-slate-900 px-6 py-3 rounded-xl border border-slate-800 mb-6">
                <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">
                  Final Score
                </div>
                <div className="text-2xl font-bold font-mono text-pink-400">{score}</div>
              </div>
              <div className="flex gap-3">
                <button
                  id="breakout-retry-btn"
                  onClick={() => startGame(1)}
                  className="px-5 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-bold text-sm transition-all hover:scale-105 active:scale-95 shadow-lg shadow-pink-500/30 cursor-pointer flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  Play Again
                </button>
                <button
                  id="breakout-scores-btn"
                  onClick={() => {
                    sound.playClick();
                    onOpenLeaderboard();
                  }}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm transition-colors cursor-pointer border border-slate-700"
                >
                  Leaderboard
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Control info & helper */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400 max-w-[600px] mx-auto">
        <div className="flex items-center gap-3">
          <span className="bg-slate-900 px-2 py-1 rounded border border-slate-800 font-mono text-slate-300">
            Mouse / Touch
          </span>
          <span>Glide Paddle</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="bg-slate-900 px-2 py-1 rounded border border-slate-800 font-mono text-slate-300">
            Spacebar
          </span>
          <span>Laser Blast</span>
        </div>
      </div>
    </div>
  );
};
