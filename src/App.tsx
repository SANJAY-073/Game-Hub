/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { GameId } from './types';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { LeaderboardModal } from './components/LeaderboardModal';
import { SoundManagerModal } from './components/SoundManagerModal';
import { Footer } from './components/Footer';

// Games
import { SnakeGame } from './components/games/SnakeGame';
import { BreakoutGame } from './components/games/BreakoutGame';
import { Puzzle2048 } from './components/games/Puzzle2048';
import { MemoryMatch } from './components/games/MemoryMatch';
import { QuizGame } from './components/games/QuizGame';
import { TicTacToe } from './components/games/TicTacToe';

export default function App() {
  const [activeGame, setActiveGame] = useState<GameId | null>(null);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [isSoundManagerOpen, setIsSoundManagerOpen] = useState(false);
  const [leaderboardFilter, setLeaderboardFilter] = useState<GameId | 'all'>('all');

  const handleSelectGame = (gameId: GameId) => {
    setActiveGame(gameId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateHome = () => {
    setActiveGame(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenLeaderboard = (gameFilter: GameId | 'all' = 'all') => {
    setLeaderboardFilter(gameFilter);
    setIsLeaderboardOpen(true);
  };

  const handleOpenSoundManager = () => {
    setIsSoundManagerOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        activeGame={activeGame}
        onNavigateHome={handleNavigateHome}
        onOpenLeaderboard={() => handleOpenLeaderboard('all')}
        onOpenSoundManager={handleOpenSoundManager}
      />

      {/* Main Content Area with Motion Transitions */}
      <main className="flex-1 w-full relative">
        <AnimatePresence mode="wait">
          {!activeGame ? (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.24, ease: 'easeOut' }}
            >
              <Dashboard
                onSelectGame={handleSelectGame}
                onOpenLeaderboardWithGame={(id) => handleOpenLeaderboard(id)}
                onOpenSoundManager={handleOpenSoundManager}
              />
            </motion.div>
          ) : (
            <motion.div
              key={activeGame}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
            >
              {activeGame === 'breakout' && (
                <BreakoutGame onOpenLeaderboard={() => handleOpenLeaderboard('breakout')} />
              )}
              {activeGame === 'puzzle2048' && (
                <Puzzle2048 onOpenLeaderboard={() => handleOpenLeaderboard('puzzle2048')} />
              )}
              {activeGame === 'snake' && (
                <SnakeGame onOpenLeaderboard={() => handleOpenLeaderboard('snake')} />
              )}
              {activeGame === 'memory' && (
                <MemoryMatch onOpenLeaderboard={() => handleOpenLeaderboard('memory')} />
              )}
              {activeGame === 'quiz' && (
                <QuizGame onOpenLeaderboard={() => handleOpenLeaderboard('quiz')} />
              )}
              {activeGame === 'tictactoe' && (
                <TicTacToe onOpenLeaderboard={() => handleOpenLeaderboard('tictactoe')} />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Leaderboard Modal */}
      <LeaderboardModal
        isOpen={isLeaderboardOpen}
        onClose={() => setIsLeaderboardOpen(false)}
        initialGameFilter={leaderboardFilter}
      />

      {/* Sound Effects Manager Modal */}
      <SoundManagerModal
        isOpen={isSoundManagerOpen}
        onClose={() => setIsSoundManagerOpen(false)}
      />

      {/* Footer */}
      <Footer
        onSelectGame={handleSelectGame}
        onOpenLeaderboard={() => handleOpenLeaderboard('all')}
      />
    </div>
  );
}
