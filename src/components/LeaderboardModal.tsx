import React, { useState, useMemo } from 'react';
import { Trophy, Medal, X, Trash2, Sparkles, Flame, Calendar, Award } from 'lucide-react';
import { GameId, ScoreEntry } from '../types';
import { getLeaderboard, clearLeaderboard } from '../utils/storage';
import { sound } from '../utils/sound';

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialGameFilter?: GameId | 'all';
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  isOpen,
  onClose,
  initialGameFilter = 'all',
}) => {
  const [selectedFilter, setSelectedFilter] = useState<GameId | 'all'>(initialGameFilter);
  const [scores, setScores] = useState<ScoreEntry[]>(() => getLeaderboard());
  const [confirmClear, setConfirmClear] = useState(false);

  // Sync state when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setScores(getLeaderboard());
      setSelectedFilter(initialGameFilter);
      setConfirmClear(false);
    }
  }, [isOpen, initialGameFilter]);

  const filteredScores = useMemo(() => {
    let list = [...scores];
    if (selectedFilter !== 'all') {
      list = list.filter((s) => s.gameId === selectedFilter);
    }
    // Sort descending by score
    return list.sort((a, b) => b.score - a.score);
  }, [scores, selectedFilter]);

  if (!isOpen) return null;

  const handleClear = () => {
    clearLeaderboard();
    setScores([]);
    setConfirmClear(false);
    sound.playWrong();
  };

  const getGameLabel = (id: GameId) => {
    switch (id) {
      case 'snake':
        return 'Neon Snake';
      case 'breakout':
        return 'Neon Breakout';
      case 'puzzle2048':
        return 'Neon 2048';
      case 'memory':
        return 'Memory Match';
      case 'quiz':
        return 'Cyber Quiz';
      case 'tictactoe':
        return 'Tic Tac Toe';
    }
  };

  const getGameBadgeColor = (id: GameId) => {
    switch (id) {
      case 'snake':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'breakout':
        return 'bg-pink-500/10 text-pink-400 border-pink-500/20';
      case 'puzzle2048':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'memory':
        return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
      case 'quiz':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'tictactoe':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        id="leaderboard-modal"
        className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white font-display flex items-center gap-2">
                Arcade Hall of Fame
                <Sparkles className="w-4 h-4 text-amber-400" />
              </h2>
              <p className="text-xs text-slate-400">Local high scores across all GameHub mini-games</p>
            </div>
          </div>
          <button
            id="close-leaderboard-btn"
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Pills */}
        <div className="px-5 py-3 border-b border-slate-800 bg-slate-950/40 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {[
            { id: 'all', label: 'All Games' },
            { id: 'snake', label: 'Snake' },
            { id: 'breakout', label: 'Breakout' },
            { id: 'puzzle2048', label: '2048' },
            { id: 'memory', label: 'Memory Match' },
            { id: 'quiz', label: 'Quiz' },
            { id: 'tictactoe', label: 'Tic Tac Toe' },
          ].map((tab) => {
            const isActive = selectedFilter === tab.id;
            return (
              <button
                key={tab.id}
                id={`leaderboard-filter-${tab.id}`}
                onClick={() => {
                  sound.playClick();
                  setSelectedFilter(tab.id as GameId | 'all');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                    : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Leaderboard Table / List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-2.5">
          {filteredScores.length === 0 ? (
            <div className="py-12 text-center text-slate-500 space-y-2">
              <Award className="w-12 h-12 mx-auto text-slate-600" />
              <p className="text-sm font-medium text-slate-400">No records found for this category yet.</p>
              <p className="text-xs text-slate-500">Play a round to etch your name in the hall of fame!</p>
            </div>
          ) : (
            filteredScores.map((entry, index) => {
              const rank = index + 1;
              const isFirst = rank === 1;
              const isSecond = rank === 2;
              const isThird = rank === 3;

              return (
                <div
                  key={entry.id}
                  id={`score-row-${entry.id}`}
                  className={`flex items-center justify-between p-3 sm:p-3.5 rounded-xl border transition-all ${
                    isFirst
                      ? 'bg-gradient-to-r from-amber-500/10 via-slate-900 to-slate-900 border-amber-500/30'
                      : isSecond
                      ? 'bg-gradient-to-r from-slate-400/10 via-slate-900 to-slate-900 border-slate-400/30'
                      : isThird
                      ? 'bg-gradient-to-r from-amber-700/10 via-slate-900 to-slate-900 border-amber-700/30'
                      : 'bg-slate-900/60 hover:bg-slate-900 border-slate-800/80'
                  }`}
                >
                  {/* Left: Rank & Player */}
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                    <div className="w-8 flex items-center justify-center flex-shrink-0">
                      {isFirst ? (
                        <div className="w-7 h-7 rounded-full bg-amber-500/20 border border-amber-500 flex items-center justify-center text-amber-400 font-bold text-xs shadow-md shadow-amber-500/20">
                          1
                        </div>
                      ) : isSecond ? (
                        <div className="w-7 h-7 rounded-full bg-slate-400/20 border border-slate-400 flex items-center justify-center text-slate-300 font-bold text-xs">
                          2
                        </div>
                      ) : isThird ? (
                        <div className="w-7 h-7 rounded-full bg-amber-700/20 border border-amber-700 flex items-center justify-center text-amber-600 font-bold text-xs">
                          3
                        </div>
                      ) : (
                        <span className="text-slate-500 font-semibold text-xs">#{rank}</span>
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm truncate">{entry.playerName}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded border ${getGameBadgeColor(entry.gameId)}`}>
                          {getGameLabel(entry.gameId)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                        {entry.secondaryMetric && <span>{entry.secondaryMetric}</span>}
                        {entry.secondaryMetric && <span>•</span>}
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-500" />
                          {entry.date}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Score */}
                  <div className="text-right flex-shrink-0 pl-2">
                    <div className="text-base sm:text-lg font-extrabold text-white font-display">
                      {entry.score.toLocaleString()}
                      <span className="text-[11px] font-normal text-slate-400 ml-1">
                        {entry.gameId === 'tictactoe' ? 'wins' : 'pts'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer with Clear Options */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
          <div>
            <span>Scores stored locally in browser</span>
          </div>

          <div>
            {confirmClear ? (
              <div className="flex items-center gap-2">
                <span className="text-rose-400 text-xs font-semibold">Clear all?</span>
                <button
                  id="confirm-clear-btn"
                  onClick={handleClear}
                  className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-medium cursor-pointer"
                >
                  Yes, reset
                </button>
                <button
                  id="cancel-clear-btn"
                  onClick={() => setConfirmClear(false)}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                id="init-clear-btn"
                onClick={() => setConfirmClear(true)}
                className="flex items-center gap-1.5 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Reset Leaderboard</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
