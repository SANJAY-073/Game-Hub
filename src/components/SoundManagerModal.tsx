import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Volume2,
  VolumeX,
  Sliders,
  Sparkles,
  Play,
  Check,
  X,
  Layers,
  MousePointer,
  RotateCcw,
  Zap,
  Trophy,
  Skull,
} from 'lucide-react';
import { sound } from '../utils/sound';
import { SoundSettings, SoundTheme } from '../types';

interface SoundManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SoundManagerModal: React.FC<SoundManagerModalProps> = ({ isOpen, onClose }) => {
  const [settings, setSettings] = useState<SoundSettings>(sound.getSettings());

  useEffect(() => {
    const unsub = sound.subscribe((newSettings) => {
      setSettings(newSettings);
    });
    return unsub;
  }, []);

  if (!isOpen) return null;

  const handleToggleMute = () => {
    const newMuted = sound.toggleMute();
    if (!newMuted) {
      sound.playClick();
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    sound.setVolume(val);
  };

  const handleThemeChange = (theme: SoundTheme) => {
    sound.setTheme(theme);
    sound.playClick();
  };

  const handleToggleCue = (cue: keyof Omit<SoundSettings, 'isMuted' | 'masterVolume' | 'theme'>) => {
    const nextVal = !settings[cue];
    sound.updateSettings({ [cue]: nextVal });
    sound.playClick();
  };

  const themes: { id: SoundTheme; name: string; desc: string; icon: string }[] = [
    {
      id: 'arcade',
      name: 'Retro 8-Bit',
      desc: 'Punchy square waves & classic arcade bleeps',
      icon: '👾',
    },
    {
      id: 'synth',
      name: 'Cyber Synth',
      desc: 'Sawtooth electronic sweeps & resonant notes',
      icon: '⚡',
    },
    {
      id: 'chime',
      name: 'Crystal Chimes',
      desc: 'Harmonic pure sine bells & smooth tones',
      icon: '🔔',
    },
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 overflow-hidden my-8"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  Sound Effects Manager
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    Web Audio
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Manage audio synthesis, volume, themes, and interactive cues
                </p>
              </div>
            </div>

            <button
              id="sound-modal-close-btn"
              onClick={() => {
                sound.playClick();
                onClose();
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-6 pt-5">
            {/* Master Control: Mute & Volume */}
            <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-800/80 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <button
                    id="sound-modal-mute-toggle"
                    onClick={handleToggleMute}
                    className={`p-2 rounded-xl border transition-all cursor-pointer ${
                      settings.isMuted
                        ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                        : 'bg-indigo-500/20 border-indigo-500/30 text-indigo-300'
                    }`}
                  >
                    {settings.isMuted ? (
                      <VolumeX className="w-5 h-5" />
                    ) : (
                      <Volume2 className="w-5 h-5" />
                    )}
                  </button>
                  <div>
                    <div className="text-sm font-semibold text-slate-200">Master Sound</div>
                    <div className="text-xs text-slate-400">
                      {settings.isMuted ? 'Muted (Silent)' : `Active at ${Math.round(settings.masterVolume * 100)}% Volume`}
                    </div>
                  </div>
                </div>

                <button
                  id="sound-modal-quick-mute-btn"
                  onClick={handleToggleMute}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer border ${
                    settings.isMuted
                      ? 'bg-rose-500/20 border-rose-500/40 text-rose-300 hover:bg-rose-500/30'
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                  }`}
                >
                  {settings.isMuted ? 'Unmute All' : 'Mute All'}
                </button>
              </div>

              {/* Volume Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-slate-400 font-medium">
                  <span>Output Volume</span>
                  <span className="text-indigo-400 font-mono">
                    {Math.round(settings.masterVolume * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={settings.masterVolume}
                  onChange={handleVolumeChange}
                  disabled={settings.isMuted}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 disabled:opacity-40"
                />
              </div>
            </div>

            {/* Sound Themes */}
            <div>
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">
                Synthesizer Sound Theme
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                {themes.map((t) => {
                  const isSelected = settings.theme === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => handleThemeChange(t.id)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between relative ${
                        isSelected
                          ? 'bg-indigo-500/15 border-indigo-500 text-white ring-1 ring-indigo-500/30'
                          : 'bg-slate-950/40 border-slate-800 hover:border-slate-700 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xl">{t.icon}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-200">{t.name}</div>
                        <div className="text-[10px] text-slate-400 line-clamp-2 mt-0.5">{t.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Granular Audio Cues Toggles */}
            <div>
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2.5">
                Audio Cues & Triggers
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {/* Button Clicks */}
                <button
                  onClick={() => handleToggleCue('clicks')}
                  className={`flex items-center justify-between p-2.5 rounded-xl border text-left transition-colors cursor-pointer ${
                    settings.clicks
                      ? 'bg-slate-800/80 border-indigo-500/30 text-white'
                      : 'bg-slate-950/40 border-slate-800/60 text-slate-500'
                  }`}
                >
                  <div className="flex items-center gap-2 text-xs">
                    <MousePointer className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Button & UI Clicks</span>
                  </div>
                  <div
                    className={`w-4 h-4 rounded flex items-center justify-center border ${
                      settings.clicks
                        ? 'bg-indigo-600 border-indigo-500 text-white'
                        : 'border-slate-700'
                    }`}
                  >
                    {settings.clicks && <Check className="w-3 h-3" />}
                  </div>
                </button>

                {/* Game Moves */}
                <button
                  onClick={() => handleToggleCue('moves')}
                  className={`flex items-center justify-between p-2.5 rounded-xl border text-left transition-colors cursor-pointer ${
                    settings.moves
                      ? 'bg-slate-800/80 border-indigo-500/30 text-white'
                      : 'bg-slate-950/40 border-slate-800/60 text-slate-500'
                  }`}
                >
                  <div className="flex items-center gap-2 text-xs">
                    <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Game Moves & Turns</span>
                  </div>
                  <div
                    className={`w-4 h-4 rounded flex items-center justify-center border ${
                      settings.moves
                        ? 'bg-indigo-600 border-indigo-500 text-white'
                        : 'border-slate-700'
                    }`}
                  >
                    {settings.moves && <Check className="w-3 h-3" />}
                  </div>
                </button>

                {/* Events / Items / Combos */}
                <button
                  onClick={() => handleToggleCue('events')}
                  className={`flex items-center justify-between p-2.5 rounded-xl border text-left transition-colors cursor-pointer ${
                    settings.events
                      ? 'bg-slate-800/80 border-indigo-500/30 text-white'
                      : 'bg-slate-950/40 border-slate-800/60 text-slate-500'
                  }`}
                >
                  <div className="flex items-center gap-2 text-xs">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Combos, Orbs & Hits</span>
                  </div>
                  <div
                    className={`w-4 h-4 rounded flex items-center justify-center border ${
                      settings.events
                        ? 'bg-indigo-600 border-indigo-500 text-white'
                        : 'border-slate-700'
                    }`}
                  >
                    {settings.events && <Check className="w-3 h-3" />}
                  </div>
                </button>

                {/* Win Fanfares */}
                <button
                  onClick={() => handleToggleCue('victories')}
                  className={`flex items-center justify-between p-2.5 rounded-xl border text-left transition-colors cursor-pointer ${
                    settings.victories
                      ? 'bg-slate-800/80 border-indigo-500/30 text-white'
                      : 'bg-slate-950/40 border-slate-800/60 text-slate-500'
                  }`}
                >
                  <div className="flex items-center gap-2 text-xs">
                    <Trophy className="w-3.5 h-3.5 text-amber-400" />
                    <span>Victory Fanfares</span>
                  </div>
                  <div
                    className={`w-4 h-4 rounded flex items-center justify-center border ${
                      settings.victories
                        ? 'bg-indigo-600 border-indigo-500 text-white'
                        : 'border-slate-700'
                    }`}
                  >
                    {settings.victories && <Check className="w-3 h-3" />}
                  </div>
                </button>

                {/* Game Over */}
                <button
                  onClick={() => handleToggleCue('gameOvers')}
                  className={`flex items-center justify-between p-2.5 rounded-xl border text-left transition-colors cursor-pointer sm:col-span-2 ${
                    settings.gameOvers
                      ? 'bg-slate-800/80 border-indigo-500/30 text-white'
                      : 'bg-slate-950/40 border-slate-800/60 text-slate-500'
                  }`}
                >
                  <div className="flex items-center gap-2 text-xs">
                    <Skull className="w-3.5 h-3.5 text-rose-400" />
                    <span>Defeat & Game Over Cues</span>
                  </div>
                  <div
                    className={`w-4 h-4 rounded flex items-center justify-center border ${
                      settings.gameOvers
                        ? 'bg-indigo-600 border-indigo-500 text-white'
                        : 'border-slate-700'
                    }`}
                  >
                    {settings.gameOvers && <Check className="w-3 h-3" />}
                  </div>
                </button>
              </div>
            </div>

            {/* Sound Cue Testing Station */}
            <div className="bg-slate-950/40 rounded-xl p-4 border border-slate-800 space-y-2.5">
              <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                Live Sound Cue Tester
              </div>
              <p className="text-[11px] text-slate-400">
                Click below to test synthesizers with the selected theme and volume:
              </p>

              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  onClick={() => sound.playClick()}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors cursor-pointer inline-flex items-center gap-1.5 border border-slate-700/50"
                >
                  <Play className="w-3 h-3 text-indigo-400" />
                  Click Cue
                </button>
                <button
                  onClick={() => sound.playMove()}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors cursor-pointer inline-flex items-center gap-1.5 border border-slate-700/50"
                >
                  <Play className="w-3 h-3 text-cyan-400" />
                  Move Cue
                </button>
                <button
                  onClick={() => sound.playEat()}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors cursor-pointer inline-flex items-center gap-1.5 border border-slate-700/50"
                >
                  <Play className="w-3 h-3 text-emerald-400" />
                  Collect / Eat
                </button>
                <button
                  onClick={() => sound.playMerge(64)}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors cursor-pointer inline-flex items-center gap-1.5 border border-slate-700/50"
                >
                  <Play className="w-3 h-3 text-purple-400" />
                  2048 Merge
                </button>
                <button
                  onClick={() => sound.playPaddleHit()}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors cursor-pointer inline-flex items-center gap-1.5 border border-slate-700/50"
                >
                  <Play className="w-3 h-3 text-pink-400" />
                  Paddle Hit
                </button>
                <button
                  onClick={() => sound.playWin()}
                  className="px-2.5 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 text-xs font-medium transition-colors cursor-pointer inline-flex items-center gap-1.5 border border-amber-500/30"
                >
                  <Play className="w-3 h-3 text-amber-400" />
                  Win Fanfare
                </button>
                <button
                  onClick={() => sound.playGameOver()}
                  className="px-2.5 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 text-xs font-medium transition-colors cursor-pointer inline-flex items-center gap-1.5 border border-rose-500/30"
                >
                  <Play className="w-3 h-3 text-rose-400" />
                  Game Over
                </button>
              </div>
            </div>
          </div>

          {/* Footer actions */}
          <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-end">
            <button
              id="sound-modal-done-btn"
              onClick={() => {
                sound.playClick();
                onClose();
              }}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs sm:text-sm transition-colors cursor-pointer shadow-lg shadow-indigo-600/30"
            >
              Done & Save
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
