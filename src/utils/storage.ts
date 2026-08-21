import { GameId, ScoreEntry, PlayerStats } from '../types';

const LEADERBOARD_KEY = 'gamehub_leaderboard_v1';
const STATS_KEY = 'gamehub_stats_v1';
const PLAYER_NAME_KEY = 'gamehub_player_name';

const INITIAL_SCORES: ScoreEntry[] = [
  { id: '1', gameId: 'snake', playerName: 'PixelViper', score: 380, secondaryMetric: 'Length: 42', date: '2026-08-18' },
  { id: '2', gameId: 'snake', playerName: 'RetroKing', score: 260, secondaryMetric: 'Length: 31', date: '2026-08-17' },
  { id: '3', gameId: 'snake', playerName: 'SpeedyDave', score: 190, secondaryMetric: 'Length: 22', date: '2026-08-19' },

  { id: '4', gameId: 'breakout', playerName: 'LaserPaddle', score: 2450, secondaryMetric: 'Stage 4 Complete', date: '2026-08-18' },
  { id: '5', gameId: 'breakout', playerName: 'BrickBuster', score: 1820, secondaryMetric: 'Stage 3 • Combo x12', date: '2026-08-17' },
  { id: '6', gameId: 'breakout', playerName: 'NeonVibe', score: 1250, secondaryMetric: 'Stage 2 Complete', date: '2026-08-19' },

  { id: '7', gameId: 'puzzle2048', playerName: 'GridAlchemist', score: 24860, secondaryMetric: 'Tile 2048 Created', date: '2026-08-18' },
  { id: '8', gameId: 'puzzle2048', playerName: 'MatrixSlider', score: 16420, secondaryMetric: 'Highest: 1024', date: '2026-08-17' },
  { id: '9', gameId: 'puzzle2048', playerName: 'CyberFusion', score: 8740, secondaryMetric: 'Highest: 512', date: '2026-08-19' },

  { id: '10', gameId: 'memory', playerName: 'MindMaster', score: 980, secondaryMetric: '14 moves • 0:28', date: '2026-08-18' },
  { id: '11', gameId: 'memory', playerName: 'NeuroNinja', score: 850, secondaryMetric: '18 moves • 0:35', date: '2026-08-17' },
  { id: '12', gameId: 'memory', playerName: 'FlashCard', score: 720, secondaryMetric: '22 moves • 0:42', date: '2026-08-19' },

  { id: '13', gameId: 'quiz', playerName: 'TriviaMaster', score: 1450, secondaryMetric: '10/10 • Streak x10', date: '2026-08-18' },
  { id: '14', gameId: 'quiz', playerName: 'CyberScholar', score: 1280, secondaryMetric: '9/10 • Streak x7', date: '2026-08-16' },
  { id: '15', gameId: 'quiz', playerName: 'Brainiac99', score: 1100, secondaryMetric: '8/10 • Streak x5', date: '2026-08-19' },

  { id: '16', gameId: 'tictactoe', playerName: 'GridGrandmaster', score: 12, secondaryMetric: '12 Wins vs Hard AI', date: '2026-08-18' },
  { id: '17', gameId: 'tictactoe', playerName: 'TacticsGod', score: 8, secondaryMetric: '8 Wins vs Hard AI', date: '2026-08-17' },
  { id: '18', gameId: 'tictactoe', playerName: 'ZeroLoss', score: 5, secondaryMetric: '5 Wins vs Hard AI', date: '2026-08-19' },
];

export function getLeaderboard(): ScoreEntry[] {
  try {
    const raw = localStorage.getItem(LEADERBOARD_KEY);
    if (!raw) {
      localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(INITIAL_SCORES));
      return INITIAL_SCORES;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_SCORES;
  }
}

export function saveScore(entry: Omit<ScoreEntry, 'id' | 'date'>): ScoreEntry {
  const current = getLeaderboard();
  const newEntry: ScoreEntry = {
    ...entry,
    id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    date: new Date().toISOString().split('T')[0],
  };

  const updated = [...current, newEntry];
  try {
    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(updated));
  } catch {
    // ignore
  }

  updatePlayerStats(entry.gameId, entry.score);
  return newEntry;
}

export function getScoresForGame(gameId: GameId): ScoreEntry[] {
  const all = getLeaderboard();
  return all
    .filter((item) => item.gameId === gameId)
    .sort((a, b) => b.score - a.score)
    .map((item, index) => ({ ...item, rank: index + 1 }));
}

export function clearLeaderboard(): void {
  try {
    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify([]));
  } catch {
    // ignore
  }
}

export function getPlayerName(): string {
  try {
    return localStorage.getItem(PLAYER_NAME_KEY) || 'Player 1';
  } catch {
    return 'Player 1';
  }
}

export function setPlayerName(name: string): void {
  try {
    localStorage.setItem(PLAYER_NAME_KEY, name.trim() || 'Player 1');
  } catch {
    // ignore
  }
}

export function getPlayerStats(): PlayerStats {
  const defaultStats: PlayerStats = {
    gamesPlayed: 0,
    totalScore: 0,
    tictactoeWins: 0,
    snakeHighScore: 0,
    memoryBestMoves: 0,
    quizHighScore: 0,
    breakoutHighScore: 0,
    puzzle2048HighScore: 0,
  };

  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (!raw) return defaultStats;
    return { ...defaultStats, ...JSON.parse(raw) };
  } catch {
    return defaultStats;
  }
}

function updatePlayerStats(gameId: GameId, score: number) {
  const stats = getPlayerStats();
  stats.gamesPlayed += 1;
  stats.totalScore += score;

  if (gameId === 'snake' && score > stats.snakeHighScore) {
    stats.snakeHighScore = score;
  } else if (gameId === 'quiz' && score > stats.quizHighScore) {
    stats.quizHighScore = score;
  } else if (gameId === 'breakout' && score > stats.breakoutHighScore) {
    stats.breakoutHighScore = score;
  } else if (gameId === 'puzzle2048' && score > stats.puzzle2048HighScore) {
    stats.puzzle2048HighScore = score;
  } else if (gameId === 'tictactoe') {
    stats.tictactoeWins += 1;
  }

  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch {
    // ignore
  }
}
