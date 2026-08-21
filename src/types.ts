export type GameId = 'tictactoe' | 'snake' | 'memory' | 'quiz' | 'breakout' | 'puzzle2048';

export interface GameInfo {
  id: GameId;
  title: string;
  tagline: string;
  description: string;
  category: string;
  difficulty: 'Easy' | 'Medium' | 'Dynamic' | 'Challenging';
  players: string;
  icon: string;
  color: string;
  accentGradient: string;
  badge: string;
  controls: string[];
}

export interface ScoreEntry {
  id: string;
  gameId: GameId;
  playerName: string;
  score: number;
  secondaryMetric?: string; // e.g. "18 moves • 0:45", "Round 5/5", "Streak x8"
  date: string;
  rank?: number;
}

export interface PlayerStats {
  gamesPlayed: number;
  totalScore: number;
  tictactoeWins: number;
  snakeHighScore: number;
  memoryBestMoves: number;
  quizHighScore: number;
  breakoutHighScore: number;
  puzzle2048HighScore: number;
}

export type SoundTheme = 'arcade' | 'synth' | 'chime';

export interface SoundSettings {
  isMuted: boolean;
  masterVolume: number; // 0.0 to 1.0
  theme: SoundTheme;
  clicks: boolean;
  moves: boolean;
  events: boolean; // items, combos, merges, score bonuses
  victories: boolean;
  gameOvers: boolean;
}

export interface QuizQuestion {
  id: number;
  category: 'Gaming' | 'Technology' | 'Sci-Fi' | 'Science';
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

