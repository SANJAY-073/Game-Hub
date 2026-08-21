import React, { useState, useEffect } from 'react';
import { Gamepad2, Trophy, Volume2, VolumeX, ArrowLeft, Sparkles, User, Check, Sliders } from 'lucide-react';
import { GameId, PlayerStats } from '../types';
import { sound } from '../utils/sound';
import { getPlayerName, setPlayerName as savePlayerName, getPlayerStats } from '../utils/storage';

interface NavbarProps {
  activeGame: GameId | null;
  onNavigateHome: () => void;
  onOpenLeaderboard: () => void;
  onOpenSoundManager: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeGame,
  onNavigateHome,
  onOpenLeaderboard,
  onOpenSoundManager,
}) => {
  const [isMuted, setIsMuted] = useState(sound.isMuted());
  const [playerName, setPlayerNameState] = useState(getPlayerName());
  const [isEditingName, setIsEditingName] = useState(false);
  const [stats, setStats] = useState<PlayerStats>(getPlayerStats());

  useEffect(() => {
    const unsub = sound.subscribe((s) => {
      setIsMuted(s.isMuted);
    });
    const handleUpdate = () => {
      setStats(getPlayerStats());
    };
    window.addEventListener('storage', handleUpdate);
    return () => {
      unsub();
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const handleToggleSound = () => {
    const newMuted = sound.toggleMute();
    setIsMuted(newMuted);
    if (!newMuted) {
      sound.playClick();
    }
  };

  const handleSaveName = () => {
    if (playerName.trim()) {
      savePlayerName(playerName.trim());
      setIsEditingName(false);
      sound.playClick();
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/85 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Brand or Back Button */}
        <div className="flex items-center gap-3">
          {activeGame ? (
            <button
              id="nav-back-button"
              onClick={() => {
                sound.playClick();
                onNavigateHome();
              }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700/60 transition-colors text-sm font-medium cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 text-indigo-400" />
              <span>Back to Hub</span>
            </button>
          ) : (
            <div
              onClick={onNavigateHome}
              className="flex items-center gap-2.5 cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-0.5 shadow-lg shadow-indigo-500/25 group-hover:shadow-indigo-500/40 transition-shadow">
                <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                  <Gamepad2 className="w-5 h-5 text-indigo-400 group-hover:scale-110 transition-transform" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xl font-bold tracking-tight text-white font-display">
                    Game<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-300">Hub</span>
                  </span>
                  <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded uppercase tracking-wider">
                    Arcade
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Center/Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Player Name Tag */}
          <div className="hidden sm:flex items-center">
            {isEditingName ? (
              <div className="flex items-center gap-1.5 bg-slate-900 px-2 py-1 rounded-xl border border-indigo-500/50">
                <input
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerNameState(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                  maxLength={15}
                  className="bg-transparent text-xs text-white px-1.5 py-0.5 outline-none w-28 font-medium"
                  autoFocus
                />
                <button
                  id="save-name-btn"
                  onClick={handleSaveName}
                  className="p-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                id="edit-name-btn"
                onClick={() => setIsEditingName(true)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="Click to edit your player handle"
              >
                <User className="w-3.5 h-3.5 text-indigo-400" />
                <span className="font-semibold text-slate-200">{playerName}</span>
                <span className="text-[10px] text-slate-400 px-1 py-0.2 bg-slate-800 rounded">
                  {stats.gamesPlayed} plays
                </span>
              </button>
            )}
          </div>

          {/* Leaderboard Button */}
          <button
            id="nav-leaderboard-btn"
            onClick={() => {
              sound.playClick();
              onOpenLeaderboard();
            }}
            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition-all hover:scale-[1.02] active:scale-[0.98] text-xs sm:text-sm font-medium cursor-pointer shadow-sm shadow-amber-500/10"
          >
            <Trophy className="w-4 h-4 text-amber-400" />
            <span className="hidden xs:inline">Leaderboard</span>
            <span className="xs:hidden">Scores</span>
          </button>

          {/* Sound FX Settings Manager */}
          <button
            id="nav-sound-manager-btn"
            onClick={() => {
              sound.playClick();
              onOpenSoundManager();
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 transition-all hover:scale-[1.02] text-xs font-medium cursor-pointer"
            title="Open Sound Effects Manager (Volume, Audio Themes & Cues)"
          >
            <Sliders className="w-4 h-4 text-indigo-400" />
            <span className="hidden md:inline">Audio FX</span>
          </button>

          {/* Sound Quick Mute Toggle */}
          <button
            id="nav-sound-toggle-btn"
            onClick={handleToggleSound}
            className={`p-2 rounded-xl border transition-all cursor-pointer ${
              isMuted
                ? 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
                : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/20 hover:text-indigo-200'
            }`}
            title={isMuted ? 'Unmute Audio FX' : 'Mute Audio FX'}
            aria-label="Toggle Sound Effects"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
};
