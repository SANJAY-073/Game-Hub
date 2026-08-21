import React from 'react';
import { Gamepad2, Heart, Trophy, Sparkles } from 'lucide-react';
import { GameId } from '../types';
import { sound } from '../utils/sound';

interface FooterProps {
  onSelectGame: (id: GameId) => void;
  onOpenLeaderboard: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onSelectGame, onOpenLeaderboard }) => {
  return (
    <footer className="w-full border-t border-slate-800/80 bg-slate-950/90 mt-16 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Gamepad2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-base font-bold text-white font-display">
                Game<span className="text-indigo-400">Hub</span>
              </span>
              <p className="text-xs text-slate-500">Pure client-side responsive arcade games suite</p>
            </div>
          </div>

          {/* Quick links */}
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-400">
            <button
              id="footer-breakout-btn"
              onClick={() => {
                sound.playClick();
                onSelectGame('breakout');
              }}
              className="hover:text-pink-400 transition-colors cursor-pointer"
            >
              Neon Breakout
            </button>
            <button
              id="footer-2048-btn"
              onClick={() => {
                sound.playClick();
                onSelectGame('puzzle2048');
              }}
              className="hover:text-purple-400 transition-colors cursor-pointer"
            >
              Neon 2048
            </button>
            <button
              id="footer-snake-btn"
              onClick={() => {
                sound.playClick();
                onSelectGame('snake');
              }}
              className="hover:text-emerald-400 transition-colors cursor-pointer"
            >
              Neon Snake
            </button>
            <button
              id="footer-memory-btn"
              onClick={() => {
                sound.playClick();
                onSelectGame('memory');
              }}
              className="hover:text-indigo-400 transition-colors cursor-pointer"
            >
              Memory Match
            </button>
            <button
              id="footer-quiz-btn"
              onClick={() => {
                sound.playClick();
                onSelectGame('quiz');
              }}
              className="hover:text-amber-400 transition-colors cursor-pointer"
            >
              Cyber Quiz
            </button>
            <button
              id="footer-ttt-btn"
              onClick={() => {
                sound.playClick();
                onSelectGame('tictactoe');
              }}
              className="hover:text-cyan-400 transition-colors cursor-pointer"
            >
              Tic Tac Toe
            </button>
            <button
              id="footer-scores-btn"
              onClick={() => {
                sound.playClick();
                onOpenLeaderboard();
              }}
              className="text-amber-400 hover:text-amber-300 font-semibold transition-colors cursor-pointer flex items-center gap-1"
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>Leaderboards</span>
            </button>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-900 text-center text-xs text-slate-600">
          <p>© 2026 GameHub Arcade. Built with React &amp; Tailwind CSS.</p>
        </div>
      </div>
    </footer>
  );
};
