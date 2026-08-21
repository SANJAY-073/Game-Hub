import React, { useState } from 'react';
import {
  Gamepad2,
  Sparkles,
  Trophy,
  Flame,
  Zap,
  Play,
  Grid,
  HelpCircle,
  LayoutGrid,
  ChevronRight,
  ShieldCheck,
  Smartphone,
  Volume2,
  Layers,
  Sliders,
} from 'lucide-react';
import { GameId, GameInfo } from '../types';
import { GAMES_CATALOG } from '../data/games';
import { sound } from '../utils/sound';
import { getPlayerStats, getScoresForGame } from '../utils/storage';

interface DashboardProps {
  onSelectGame: (gameId: GameId) => void;
  onOpenLeaderboardWithGame: (gameId: GameId) => void;
  onOpenSoundManager?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  onSelectGame,
  onOpenLeaderboardWithGame,
  onOpenSoundManager,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const stats = getPlayerStats();

  const categories = ['All', 'Arcade / Reflex', 'Puzzle / Brain', 'Trivia / Knowledge', 'Strategy / Board'];

  const filteredGames = selectedCategory === 'All'
    ? GAMES_CATALOG
    : GAMES_CATALOG.filter((g) => g.category === selectedCategory);

  const getGameIcon = (id: GameId) => {
    switch (id) {
      case 'snake':
        return <Sparkles className="w-6 h-6 text-emerald-400" />;
      case 'breakout':
        return <Zap className="w-6 h-6 text-pink-400" />;
      case 'puzzle2048':
        return <Layers className="w-6 h-6 text-purple-400" />;
      case 'memory':
        return <Grid className="w-6 h-6 text-indigo-400" />;
      case 'quiz':
        return <HelpCircle className="w-6 h-6 text-amber-400" />;
      case 'tictactoe':
        return <LayoutGrid className="w-6 h-6 text-cyan-400" />;
    }
  };

  const getGameHighScore = (id: GameId) => {
    const scores = getScoresForGame(id);
    if (scores.length > 0) {
      return scores[0].score;
    }
    return null;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-10">
      {/* Hero Welcome Banner */}
      <div className="relative rounded-3xl overflow-hidden border border-indigo-500/20 bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-950 p-6 sm:p-10 shadow-2xl shadow-indigo-950/50">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-12 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-8 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Instant Play • Zero Load Times • Local High Scores</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white font-display leading-[1.15]">
              Play, Challenge &amp; Master the{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-cyan-300 to-emerald-300">
                GameHub Arcade
              </span>
            </h1>

            <p className="text-slate-300 text-sm sm:text-base max-w-2xl leading-relaxed">
              Explore our collection of handcrafted arcade mini-games. Shatter neon barriers in Breakout, fuse numbers in 2048, guide the glowing Snake, test recall in Memory Match, race the clock in Cyber Quiz, and duel smart AI in Tic Tac Toe.
            </p>
          </div>

          {/* Quick Stats Grid */}
          <div className="lg:col-span-4 bg-slate-950/60 backdrop-blur-md rounded-2xl border border-slate-800/80 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Your Career Stats</span>
              <Trophy className="w-4 h-4 text-amber-400" />
            </div>

            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 block">Total Plays</span>
                <span className="text-base font-bold text-white font-display">{stats.gamesPlayed}</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
                <span className="text-[10px] text-pink-400 block">Breakout</span>
                <span className="text-base font-bold text-pink-300 font-display">
                  {stats.breakoutHighScore ? `${stats.breakoutHighScore}` : '—'}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
                <span className="text-[10px] text-purple-400 block">2048 Best</span>
                <span className="text-base font-bold text-purple-300 font-display">
                  {stats.puzzle2048HighScore ? `${stats.puzzle2048HighScore}` : '—'}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
                <span className="text-[10px] text-emerald-400 block">Snake</span>
                <span className="text-base font-bold text-emerald-300 font-display">
                  {stats.snakeHighScore ? `${stats.snakeHighScore}` : '—'}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
                <span className="text-[10px] text-amber-400 block">Quiz Best</span>
                <span className="text-base font-bold text-amber-300 font-display">
                  {stats.quizHighScore ? `${stats.quizHighScore}` : '—'}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
                <span className="text-[10px] text-cyan-400 block">TTT Wins</span>
                <span className="text-base font-bold text-cyan-300 font-display">{stats.tictactoeWins}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Categories Filter Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-white font-display">Arcade Showcase</h2>
          <p className="text-xs text-slate-400">Select a game below to start playing immediately</p>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {categories.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                id={`cat-filter-${cat.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                onClick={() => {
                  sound.playClick();
                  setSelectedCategory(cat);
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Game Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
        {filteredGames.map((game) => {
          const highScore = getGameHighScore(game.id);

          return (
            <div
              key={game.id}
              id={`game-card-${game.id}`}
              className="group relative bg-slate-900/90 rounded-3xl border border-slate-800 hover:border-indigo-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-950/60 hover:-translate-y-1 flex flex-col justify-between overflow-hidden"
            >
              {/* Top Accent Gradient Line */}
              <div className={`h-1.5 w-full bg-gradient-to-r ${game.accentGradient}`} />

              <div className="p-6 sm:p-7 space-y-5 flex-1">
                {/* Header Row */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-13 h-13 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center p-3 shadow-inner group-hover:scale-105 transition-transform">
                      {getGameIcon(game.id)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-bold text-white font-display group-hover:text-indigo-300 transition-colors">
                          {game.title}
                        </h3>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                          {game.badge}
                        </span>
                      </div>
                      <span className="text-xs text-slate-400 font-medium">{game.category}</span>
                    </div>
                  </div>

                  {/* Difficulty Tag */}
                  <span className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700/60">
                    {game.difficulty}
                  </span>
                </div>

                {/* Description */}
                <p className="text-slate-300 text-sm leading-relaxed">{game.description}</p>

                {/* Controls & Features */}
                <div className="space-y-2 pt-2 border-t border-slate-800/60">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Supported Controls:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {game.controls.map((ctrl) => (
                      <span
                        key={ctrl}
                        className="text-[11px] px-2.5 py-0.5 rounded-md bg-slate-950 text-slate-400 border border-slate-800/80 font-mono"
                      >
                        {ctrl}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bottom Card Footer */}
              <div className="px-6 py-4 bg-slate-950/70 border-t border-slate-800/80 flex items-center justify-between gap-3">
                <button
                  id={`view-scores-${game.id}`}
                  onClick={() => {
                    sound.playClick();
                    onOpenLeaderboardWithGame(game.id);
                  }}
                  className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 font-medium transition-colors cursor-pointer"
                >
                  <Trophy className="w-3.5 h-3.5" />
                  <span>
                    Top Score: {highScore !== null ? `${highScore.toLocaleString()} pts` : 'None yet'}
                  </span>
                </button>

                <button
                  id={`play-game-${game.id}`}
                  onClick={() => {
                    sound.playClick();
                    onSelectGame(game.id);
                  }}
                  className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-slate-950 bg-gradient-to-r ${game.accentGradient} hover:brightness-110 shadow-lg shadow-indigo-900/30 transition-all hover:scale-105 active:scale-95 cursor-pointer`}
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Play Game</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Feature Highlights Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-slate-800">
        <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/60 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 flex-shrink-0">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Mobile Ready</h4>
            <p className="text-xs text-slate-400">Touch D-Pads, swipes and responsive layouts</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/60 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 flex-shrink-0">
            <Volume2 className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Synthesized Audio</h4>
            <p className="text-xs text-slate-400">Real-time retro arcade sound effects</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/60 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 flex-shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Instant Local Save</h4>
            <p className="text-xs text-slate-400">Zero backend needed, safe local browser storage</p>
          </div>
        </div>
      </div>
    </div>
  );
};
