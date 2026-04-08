// Avatar and color utilities for user personalization

export const AVATAR_OPTIONS = [
  "🧑‍💻", "👩‍💻", "🧑‍💼", "👩‍💼", "🧑‍🎓", "👩‍🎓",
  "🧑‍🔬", "👩‍🔬", "🧑‍🎨", "👩‍🎨", "🧑‍🏫", "👩‍🏫",
  "🦸‍♂️", "🦸‍♀️", "🥷", "🧙‍♂️", "🧙‍♀️", "🧞‍♂️", "🧞‍♀️",
  "🐱", "🐶", "🐺", "🦊", "🐼", "🐨", "🐸", "🦄", "🐉", "🔥",
  "⚡", "🌟", "💎", "🎯", "🚀", "🎮", "🎨", "🎭", "🎪", "🎲"
];

export const COLOR_OPTIONS = [
  { name: "Purple", value: "#8B5CF6", bg: "bg-purple-500/20", border: "border-purple-500/50", text: "text-purple-400" },
  { name: "Blue", value: "#3B82F6", bg: "bg-blue-500/20", border: "border-blue-500/50", text: "text-blue-400" },
  { name: "Cyan", value: "#06B6D4", bg: "bg-cyan-500/20", border: "border-cyan-500/50", text: "text-cyan-400" },
  { name: "Emerald", value: "#10B981", bg: "bg-emerald-500/20", border: "border-emerald-500/50", text: "text-emerald-400" },
  { name: "Green", value: "#22C55E", bg: "bg-green-500/20", border: "border-green-500/50", text: "text-green-400" },
  { name: "Lime", value: "#84CC16", bg: "bg-lime-500/20", border: "border-lime-500/50", text: "text-lime-400" },
  { name: "Yellow", value: "#EAB308", bg: "bg-yellow-500/20", border: "border-yellow-500/50", text: "text-yellow-400" },
  { name: "Orange", value: "#F97316", bg: "bg-orange-500/20", border: "border-orange-500/50", text: "text-orange-400" },
  { name: "Red", value: "#EF4444", bg: "bg-red-500/20", border: "border-red-500/50", text: "text-red-400" },
  { name: "Pink", value: "#EC4899", bg: "bg-pink-500/20", border: "border-pink-500/50", text: "text-pink-400" },
  { name: "Rose", value: "#F43F5E", bg: "bg-rose-500/20", border: "border-rose-500/50", text: "text-rose-400" },
  { name: "Indigo", value: "#6366F1", bg: "bg-indigo-500/20", border: "border-indigo-500/50", text: "text-indigo-400" },
];

export const getRandomAvatar = (): string => {
  return AVATAR_OPTIONS[Math.floor(Math.random() * AVATAR_OPTIONS.length)];
};

export const getRandomColor = (): string => {
  return COLOR_OPTIONS[Math.floor(Math.random() * COLOR_OPTIONS.length)].value;
};

export const getColorClasses = (colorValue: string) => {
  const color = COLOR_OPTIONS.find(c => c.value === colorValue);
  return color || COLOR_OPTIONS[0]; // fallback to purple
};

// Sound utilities
export class SoundManager {
  private static instance: SoundManager;
  private soundEnabled: boolean = false;
  private audioContext: AudioContext | null = null;

  private constructor() {
    // Load sound preference from localStorage
    this.soundEnabled = localStorage.getItem('estimateSoundEnabled') === 'true';
  }

  static getInstance(): SoundManager {
    if (!SoundManager.instance) {
      SoundManager.instance = new SoundManager();
    }
    return SoundManager.instance;
  }

  private async initAudioContext() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }
    }
  }

  async playNotificationSound() {
    if (!this.soundEnabled) return;

    try {
      await this.initAudioContext();
      if (!this.audioContext) return;

      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(400, this.audioContext.currentTime + 0.1);

      gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);

      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + 0.1);
    } catch (error) {
      console.log('Sound playback failed:', error);
    }
  }

  async playSuccessSound() {
    if (!this.soundEnabled) return;

    try {
      await this.initAudioContext();
      if (!this.audioContext) return;

      // Play a nice chord progression
      const frequencies = [523.25, 659.25, 783.99]; // C5, E5, G5
      const duration = 0.4;

      frequencies.forEach((freq, index) => {
        const oscillator = this.audioContext!.createOscillator();
        const gainNode = this.audioContext!.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext!.destination);

        oscillator.frequency.setValueAtTime(freq, this.audioContext!.currentTime);
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0, this.audioContext!.currentTime + index * 0.1);
        gainNode.gain.linearRampToValueAtTime(0.2, this.audioContext!.currentTime + index * 0.1 + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext!.currentTime + duration);

        oscillator.start(this.audioContext!.currentTime + index * 0.1);
        oscillator.stop(this.audioContext!.currentTime + duration);
      });
    } catch (error) {
      console.log('Success sound playback failed:', error);
    }
  }

  toggleSound(): boolean {
    this.soundEnabled = !this.soundEnabled;
    localStorage.setItem('estimateSoundEnabled', this.soundEnabled.toString());
    return this.soundEnabled;
  }

  isSoundEnabled(): boolean {
    return this.soundEnabled;
  }
}