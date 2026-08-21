// Sound synthesis utility using Web Audio API for arcade sound effects & full sound manager
import { SoundSettings, SoundTheme } from '../types';

const SOUND_SETTINGS_KEY = 'gamehub_sound_settings_v1';

const DEFAULT_SETTINGS: SoundSettings = {
  isMuted: false,
  masterVolume: 0.7,
  theme: 'arcade',
  clicks: true,
  moves: true,
  events: true,
  victories: true,
  gameOvers: true,
};

type Listener = (settings: SoundSettings) => void;

class SoundController {
  private ctx: AudioContext | null = null;
  private settings: SoundSettings = DEFAULT_SETTINGS;
  private listeners: Set<Listener> = new Set();

  constructor() {
    this.loadSettings();
  }

  private loadSettings() {
    try {
      const saved = localStorage.getItem(SOUND_SETTINGS_KEY);
      if (saved) {
        this.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      }
    } catch {
      this.settings = { ...DEFAULT_SETTINGS };
    }
  }

  private persistSettings() {
    try {
      localStorage.setItem(SOUND_SETTINGS_KEY, JSON.stringify(this.settings));
      // Trigger storage event for multi-tab sync
      window.dispatchEvent(new Event('storage'));
    } catch {
      // ignore
    }
    this.notifyListeners();
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.settings);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners() {
    this.listeners.forEach((fn) => fn(this.settings));
  }

  public getSettings(): SoundSettings {
    return { ...this.settings };
  }

  public updateSettings(partial: Partial<SoundSettings>) {
    this.settings = { ...this.settings, ...partial };
    this.persistSettings();
  }

  public isMuted(): boolean {
    return this.settings.isMuted;
  }

  public toggleMute(): boolean {
    this.settings.isMuted = !this.settings.isMuted;
    this.persistSettings();
    return this.settings.isMuted;
  }

  public setVolume(volume: number) {
    const clamped = Math.max(0, Math.min(1, volume));
    this.settings.masterVolume = clamped;
    this.persistSettings();
  }

  public setTheme(theme: SoundTheme) {
    this.settings.theme = theme;
    this.persistSettings();
  }

  private initCtx(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  private getEffectiveGain(baseGain: number = 0.15): number {
    return baseGain * this.settings.masterVolume;
  }

  // --- AUDIO CUES ---

  /** UI Button Click Sound */
  public playClick() {
    if (this.settings.isMuted || !this.settings.clicks) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const now = ctx.currentTime;
    const effGain = this.getEffectiveGain(0.12);

    if (this.settings.theme === 'synth') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(540, now);
      osc.frequency.exponentialRampToValueAtTime(320, now + 0.04);
    } else if (this.settings.theme === 'chime') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(440, now + 0.05);
    } else {
      // arcade
      osc.type = 'square';
      osc.frequency.setValueAtTime(640, now);
      osc.frequency.exponentialRampToValueAtTime(280, now + 0.04);
    }

    gain.gain.setValueAtTime(effGain, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.05);
  }

  /** Grid/Game Move Sound (TicTacToe, Snake turn, etc.) */
  public playMove() {
    if (this.settings.isMuted || !this.settings.moves) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const effGain = this.getEffectiveGain(0.15);

    if (this.settings.theme === 'synth') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(330, now);
      osc.frequency.exponentialRampToValueAtTime(660, now + 0.07);
    } else if (this.settings.theme === 'chime') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.exponentialRampToValueAtTime(1046.5, now + 0.06);
    } else {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);
    }

    gain.gain.setValueAtTime(effGain, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.08);
  }

  /** Slide sound for 2048 / movements */
  public playSlide() {
    if (this.settings.isMuted || !this.settings.moves) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const effGain = this.getEffectiveGain(0.1);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(260, now);
    osc.frequency.linearRampToValueAtTime(420, now + 0.06);

    gain.gain.setValueAtTime(effGain, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.06);
  }

  /** Eat Fruit / Collect item */
  public playEat() {
    if (this.settings.isMuted || !this.settings.events) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const effGain = this.getEffectiveGain(0.18);

    osc.type = this.settings.theme === 'arcade' ? 'square' : 'sine';
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.exponentialRampToValueAtTime(1040, now + 0.1);

    gain.gain.setValueAtTime(effGain, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.1);
  }

  /** Bonus or Rare Orb */
  public playBonus() {
    if (this.settings.isMuted || !this.settings.events) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const notes = [587.33, 739.99, 880, 1174.66];
    const effGain = this.getEffectiveGain(0.14);

    notes.forEach((freq, i) => {
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const start = ctx.currentTime + i * 0.05;
      osc.type = this.settings.theme === 'arcade' ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(effGain, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.09);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.09);
    });
  }

  /** Card Flip */
  public playCardFlip() {
    if (this.settings.isMuted || !this.settings.moves) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const effGain = this.getEffectiveGain(0.12);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.linearRampToValueAtTime(480, now + 0.05);

    gain.gain.setValueAtTime(effGain, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.05);
  }

  /** Match / Successful pairing / Correct quiz answer */
  public playMatch() {
    if (this.settings.isMuted || !this.settings.events) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const notes = [440, 554.37, 659.25];
    const effGain = this.getEffectiveGain(0.16);

    notes.forEach((freq, idx) => {
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const start = ctx.currentTime + idx * 0.06;
      osc.type = this.settings.theme === 'arcade' ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(effGain, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.12);
    });
  }

  /** 2048 Numeric Merge sound (scales pitch with tile value) */
  public playMerge(tileValue: number = 4) {
    if (this.settings.isMuted || !this.settings.events) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const baseFreq = 300 + Math.min(Math.log2(tileValue || 2) * 65, 800);
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const effGain = this.getEffectiveGain(0.18);

    osc.type = this.settings.theme === 'arcade' ? 'triangle' : 'sine';
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, now + 0.08);

    gain.gain.setValueAtTime(effGain, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.09);
  }

  /** Breakout Paddle Bounce */
  public playPaddleHit() {
    if (this.settings.isMuted || !this.settings.moves) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const effGain = this.getEffectiveGain(0.15);

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(380, now);
    osc.frequency.exponentialRampToValueAtTime(540, now + 0.05);

    gain.gain.setValueAtTime(effGain, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.05);
  }

  /** Breakout Brick Hit / Shatter */
  public playBrickHit(isHard: boolean = false) {
    if (this.settings.isMuted || !this.settings.events) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const effGain = this.getEffectiveGain(isHard ? 0.2 : 0.16);

    osc.type = this.settings.theme === 'arcade' ? 'square' : 'sawtooth';
    osc.frequency.setValueAtTime(isHard ? 480 : 720, now);
    osc.frequency.exponentialRampToValueAtTime(isHard ? 240 : 360, now + 0.07);

    gain.gain.setValueAtTime(effGain, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.07);
  }

  /** Power Up item caught */
  public playPowerUp() {
    if (this.settings.isMuted || !this.settings.events) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const freqs = [350, 440, 580, 880];
    const effGain = this.getEffectiveGain(0.18);

    freqs.forEach((f, i) => {
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const start = ctx.currentTime + i * 0.04;
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, start);

      gain.gain.setValueAtTime(effGain, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.08);
    });
  }

  /** Laser Blaster shot */
  public playLaser() {
    if (this.settings.isMuted || !this.settings.events) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const effGain = this.getEffectiveGain(0.14);

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(990, now);
    osc.frequency.exponentialRampToValueAtTime(180, now + 0.09);

    gain.gain.setValueAtTime(effGain, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.09);
  }

  /** Wrong Answer / Failure cue */
  public playWrong() {
    if (this.settings.isMuted || !this.settings.events) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const effGain = this.getEffectiveGain(0.15);

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(130, now + 0.18);

    gain.gain.setValueAtTime(effGain, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.18);
  }

  /** Game Win Fanfare */
  public playWin() {
    if (this.settings.isMuted || !this.settings.victories) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.5];
    const effGain = this.getEffectiveGain(0.2);

    notes.forEach((freq, idx) => {
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const start = ctx.currentTime + idx * 0.09;
      osc.type = this.settings.theme === 'arcade' ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(effGain, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.28);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.28);
    });
  }

  /** Game Over chord */
  public playGameOver() {
    if (this.settings.isMuted || !this.settings.gameOvers) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const notes = [392.0, 349.23, 311.13, 261.63];
    const effGain = this.getEffectiveGain(0.18);

    notes.forEach((freq, idx) => {
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const start = ctx.currentTime + idx * 0.11;
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(effGain, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.22);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.22);
    });
  }
}

export const sound = new SoundController();
