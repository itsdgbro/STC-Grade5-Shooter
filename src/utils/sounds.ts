// Sound synthesizer and Audio Manager using Web Audio API
class AudioManager {
  private ctx: AudioContext | null = null;
  public sfxMuted: boolean = false;
  public sfxVolume: number = 0.8;
  public musicMuted: boolean = false;
  public musicVolume: number = 0.5;

  private bgmTimer: number | null = null;
  private bgmGainNode: GainNode | null = null;
  private isBgmActive: boolean = false;
  private step: number = 0;

  constructor() {
    try {
      const savedSfxMuted = localStorage.getItem('game_sfx_muted');
      const savedMusicMuted = localStorage.getItem('game_music_muted');
      const savedSfxVol = localStorage.getItem('game_sfx_volume');
      const savedMusicVol = localStorage.getItem('game_music_volume');

      if (savedSfxMuted !== null) this.sfxMuted = savedSfxMuted === 'true';
      if (savedMusicMuted !== null) this.musicMuted = savedMusicMuted === 'true';
      if (savedSfxVol !== null) this.sfxVolume = parseFloat(savedSfxVol);
      if (savedMusicVol !== null) this.musicVolume = parseFloat(savedMusicVol);
    } catch {
      // Storage fallback
    }
  }

  // Backward compatibility alias for isMuted
  get isMuted(): boolean {
    return this.sfxMuted;
  }
  set isMuted(val: boolean) {
    this.sfxMuted = val;
  }

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setSFXMuted(muted: boolean) {
    this.sfxMuted = muted;
    try {
      localStorage.setItem('game_sfx_muted', String(muted));
    } catch {}
  }

  public setSFXVolume(vol: number) {
    this.sfxVolume = Math.max(0, Math.min(1, vol));
    try {
      localStorage.setItem('game_sfx_volume', String(this.sfxVolume));
    } catch {}
  }

  public setMusicMuted(muted: boolean) {
    this.musicMuted = muted;
    this.updateBgmGain();
    try {
      localStorage.setItem('game_music_muted', String(muted));
    } catch {}
  }

  public setMusicVolume(vol: number) {
    this.musicVolume = Math.max(0, Math.min(1, vol));
    this.updateBgmGain();
    try {
      localStorage.setItem('game_music_volume', String(this.musicVolume));
    } catch {}
  }

  private updateBgmGain() {
    if (this.bgmGainNode && this.ctx) {
      const targetGain = this.musicMuted ? 0 : this.musicVolume * 0.18;
      this.bgmGainNode.gain.setValueAtTime(targetGain, this.ctx.currentTime);
    }
  }

  public startBGM() {
    if (this.isBgmActive) return;
    this.isBgmActive = true;
    this.initCtx();
    if (!this.ctx) return;

    if (!this.bgmGainNode) {
      this.bgmGainNode = this.ctx.createGain();
      this.bgmGainNode.connect(this.ctx.destination);
    }
    this.updateBgmGain();

    // Gentle cheerful pentatonic cartoon melody loop (C4, D4, E4, G4, A4, C5)
    const melodyNotes = [
      261.63, 329.63, 392.00, 523.25,
      329.63, 392.00, 440.00, 392.00,
      293.66, 329.63, 392.00, 440.00,
      523.25, 440.00, 392.00, 329.63
    ];

    const bassNotes = [130.81, 164.81, 146.83, 174.61]; // C3, E3, D3, F3

    const playStep = () => {
      if (!this.isBgmActive || !this.ctx || !this.bgmGainNode) return;
      if (this.musicMuted || this.musicVolume <= 0) return;

      try {
        const now = this.ctx.currentTime;
        const noteFreq = melodyNotes[this.step % melodyNotes.length];

        // Soft marimba / chime melody note
        const osc = this.ctx.createOscillator();
        const noteGain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(noteFreq, now);

        noteGain.gain.setValueAtTime(0.35, now);
        noteGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        osc.connect(noteGain);
        noteGain.connect(this.bgmGainNode);
        osc.start(now);
        osc.stop(now + 0.35);

        // Soft bass accompaniment on quarter beats
        if (this.step % 4 === 0) {
          const bassFreq = bassNotes[Math.floor(this.step / 4) % bassNotes.length];
          const bassOsc = this.ctx.createOscillator();
          const bassGain = this.ctx.createGain();
          bassOsc.type = 'triangle';
          bassOsc.frequency.setValueAtTime(bassFreq, now);

          bassGain.gain.setValueAtTime(0.4, now);
          bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

          bassOsc.connect(bassGain);
          bassGain.connect(this.bgmGainNode);
          bassOsc.start(now);
          bassOsc.stop(now + 0.8);
        }

        this.step = (this.step + 1) % 64;
      } catch {}
    };

    this.bgmTimer = window.setInterval(playStep, 320);
  }

  public stopBGM() {
    this.isBgmActive = false;
    if (this.bgmTimer !== null) {
      clearInterval(this.bgmTimer);
      this.bgmTimer = null;
    }
  }

  playPop() {
    if (this.sfxMuted || this.sfxVolume <= 0) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(450, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(800, this.ctx.currentTime + 0.12);

      const baseVol = 0.3 * this.sfxVolume;
      gain.gain.setValueAtTime(baseVol, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.12);
    } catch {}
  }

  playCannonShoot() {
    if (this.sfxMuted || this.sfxVolume <= 0) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(260, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(60, this.ctx.currentTime + 0.2);

      const baseVol = 0.4 * this.sfxVolume;
      gain.gain.setValueAtTime(baseVol, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.2);
    } catch {}
  }

  playBallHit() {
    if (this.sfxMuted || this.sfxVolume <= 0) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(520, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 0.15);

      const baseVol = 0.3 * this.sfxVolume;
      gain.gain.setValueAtTime(baseVol, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.15);
    } catch {}
  }

  playCorrect() {
    if (this.sfxMuted || this.sfxVolume <= 0) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);

        const baseVol = 0.25 * this.sfxVolume;
        gain.gain.setValueAtTime(baseVol, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.25);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.25);
      });
    } catch {}
  }

  playGentleTryAgain() {
    if (this.sfxMuted || this.sfxVolume <= 0) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(240, this.ctx.currentTime + 0.2);

      const baseVol = 0.2 * this.sfxVolume;
      gain.gain.setValueAtTime(baseVol, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.2);
    } catch {}
  }
}

export const sfx = new AudioManager();
export const audioManager = sfx;
