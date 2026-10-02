/**
 * Procedural Web Audio Engine & SFX Synthesizer
 * Generates realistic dynamic engine sounds, tire screeches, turbo hisses,
 * collisions, nitro thrust, and UI audio without external audio files.
 */
export class SoundSystem {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private masterGain: GainNode | null = null;
  private engineGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;

  // Engine synthesizers
  private engineOsc1: OscillatorNode | null = null;
  private engineOsc2: OscillatorNode | null = null;
  private engineSubOsc: OscillatorNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;
  private isEngineRunning: boolean = false;

  // Tire screech synthesizers
  private screechGain: GainNode | null = null;
  private screechFilter: BiquadFilterNode | null = null;
  private screechSource: AudioBufferSourceNode | null = null;

  // Nitro synthesizers
  private nitroGain: GainNode | null = null;
  private nitroFilter: BiquadFilterNode | null = null;

  private prevThrottle: number = 0;
  private lastBovTime: number = 0;

  constructor() {
    // AudioContext will be initialized on first user click
  }

  public init() {
    if (this.ctx && this.ctx.state !== 'closed') {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return;
    }

    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      // Master output
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.8, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // Category Gains
      this.engineGain = this.ctx.createGain();
      this.engineGain.gain.setValueAtTime(0.6, this.ctx.currentTime);
      this.engineGain.connect(this.masterGain);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      this.setupScreechNode();
      this.setupNitroNode();
    } catch {
      // Audio not supported or blocked
    }
  }

  public startEngine(basePitch: number = 1.0) {
    if (!this.ctx || this.isEngineRunning) return;

    try {
      this.isEngineRunning = true;
      const t = this.ctx.currentTime;

      // Filter for engine body resonance
      this.engineFilter = this.ctx.createBiquadFilter();
      this.engineFilter.type = 'lowpass';
      this.engineFilter.frequency.setValueAtTime(650, t);
      this.engineFilter.Q.setValueAtTime(3.0, t);
      this.engineFilter.connect(this.engineGain!);

      // Primary cylinder oscillation (sawtooth)
      this.engineOsc1 = this.ctx.createOscillator();
      this.engineOsc1.type = 'sawtooth';
      this.engineOsc1.frequency.setValueAtTime(55 * basePitch, t);
      this.engineOsc1.connect(this.engineFilter);
      this.engineOsc1.start();

      // Secondary oscillation (square wave for cylinder rasp)
      this.engineOsc2 = this.ctx.createOscillator();
      this.engineOsc2.type = 'triangle';
      this.engineOsc2.frequency.setValueAtTime(110 * basePitch, t);
      this.engineOsc2.connect(this.engineFilter);
      this.engineOsc2.start();

      // Deep sub rumble
      this.engineSubOsc = this.ctx.createOscillator();
      this.engineSubOsc.type = 'sine';
      this.engineSubOsc.frequency.setValueAtTime(28 * basePitch, t);
      this.engineSubOsc.connect(this.engineFilter);
      this.engineSubOsc.start();
    } catch {
      this.isEngineRunning = false;
    }
  }

  public stopEngine() {
    if (!this.isEngineRunning) return;
    try {
      if (this.engineOsc1) {
        this.engineOsc1.stop();
        this.engineOsc1.disconnect();
      }
      if (this.engineOsc2) {
        this.engineOsc2.stop();
        this.engineOsc2.disconnect();
      }
      if (this.engineSubOsc) {
        this.engineSubOsc.stop();
        this.engineSubOsc.disconnect();
      }
    } catch {
      // cleanup safe
    }
    this.isEngineRunning = false;
  }

  public updateEngineSound(rpmNormalized: number, throttle: number, basePitch: number = 1.0, isEV: boolean = false) {
    if (!this.ctx || !this.isEngineRunning || !this.engineOsc1 || !this.engineFilter) return;

    const t = this.ctx.currentTime;
    const clampedRpm = Math.max(0.1, Math.min(1.0, rpmNormalized));

    if (isEV) {
      // Futuristic EV high-frequency motor whine
      const evFreq = 220 + clampedRpm * 1400;
      this.engineOsc1.frequency.setTargetAtTime(evFreq, t, 0.05);
      if (this.engineOsc2) {
        this.engineOsc2.frequency.setTargetAtTime(evFreq * 1.5, t, 0.05);
      }
      this.engineFilter.frequency.setTargetAtTime(1200 + clampedRpm * 4000, t, 0.05);
      return;
    }

    // Standard combustion engine RPM mapping
    const baseFreq = (45 + clampedRpm * 180) * basePitch;
    this.engineOsc1.frequency.setTargetAtTime(baseFreq, t, 0.04);

    if (this.engineOsc2) {
      this.engineOsc2.frequency.setTargetAtTime(baseFreq * 2, t, 0.04);
    }
    if (this.engineSubOsc) {
      this.engineSubOsc.frequency.setTargetAtTime(baseFreq * 0.5, t, 0.04);
    }

    // Throttle opens the filter for a louder, brighter intake roar
    const cutoff = 400 + clampedRpm * 1800 + throttle * 1200;
    this.engineFilter.frequency.setTargetAtTime(cutoff, t, 0.05);

    // Check for turbo blow-off valve sound when suddenly releasing gas at high RPM
    if (this.prevThrottle > 0.7 && throttle < 0.2 && clampedRpm > 0.6) {
      const now = performance.now();
      if (now - this.lastBovTime > 1200) {
        this.lastBovTime = now;
        this.playBlowOffValve();
      }
    }
    this.prevThrottle = throttle;
  }

  private setupScreechNode() {
    if (!this.ctx || !this.sfxGain) return;
    try {
      // White noise buffer for tire friction
      const bufferSize = this.ctx.sampleRate * 2;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      this.screechSource = this.ctx.createBufferSource();
      this.screechSource.buffer = noiseBuffer;
      this.screechSource.loop = true;

      this.screechFilter = this.ctx.createBiquadFilter();
      this.screechFilter.type = 'bandpass';
      this.screechFilter.frequency.setValueAtTime(1200, this.ctx.currentTime);
      this.screechFilter.Q.setValueAtTime(5, this.ctx.currentTime);

      this.screechGain = this.ctx.createGain();
      this.screechGain.gain.setValueAtTime(0, this.ctx.currentTime);

      this.screechSource.connect(this.screechFilter);
      this.screechFilter.connect(this.screechGain);
      this.screechGain.connect(this.sfxGain);

      this.screechSource.start();
    } catch {
      // fall back gracefully
    }
  }

  public updateTireScreech(slipAmount: number) {
    if (!this.screechGain || !this.ctx) return;
    const targetGain = Math.min(0.5, Math.max(0, (slipAmount - 0.25) * 1.2));
    this.screechGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.05);

    if (this.screechFilter && targetGain > 0.05) {
      const freq = 900 + slipAmount * 1100;
      this.screechFilter.frequency.setTargetAtTime(freq, this.ctx.currentTime, 0.05);
    }
  }

  private setupNitroNode() {
    if (!this.ctx || !this.sfxGain) return;
    try {
      const bufferSize = this.ctx.sampleRate * 2;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const nitroSource = this.ctx.createBufferSource();
      nitroSource.buffer = noiseBuffer;
      nitroSource.loop = true;

      this.nitroFilter = this.ctx.createBiquadFilter();
      this.nitroFilter.type = 'lowpass';
      this.nitroFilter.frequency.setValueAtTime(800, this.ctx.currentTime);

      this.nitroGain = this.ctx.createGain();
      this.nitroGain.gain.setValueAtTime(0, this.ctx.currentTime);

      nitroSource.connect(this.nitroFilter);
      this.nitroFilter.connect(this.nitroGain);
      this.nitroGain.connect(this.sfxGain);

      nitroSource.start();
    } catch {
      // safe fallback
    }
  }

  public setNitroSound(active: boolean) {
    if (!this.nitroGain || !this.ctx) return;
    const target = active ? 0.45 : 0;
    this.nitroGain.gain.setTargetAtTime(target, this.ctx.currentTime, 0.08);
  }

  public playJumpSound() {
    if (!this.ctx || !this.sfxGain) return;
    try {
      const t = this.ctx.currentTime;
      // Pneumatic hydraulic whoosh
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(180, t);
      osc.frequency.exponentialRampToValueAtTime(520, t + 0.18);

      gain.gain.setValueAtTime(0.45, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + 0.25);
    } catch {
      // safe fallback
    }
  }

  public playBlowOffValve() {
    if (!this.ctx || !this.sfxGain) return;
    try {
      const t = this.ctx.currentTime;
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.4);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.08));
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(1800, t);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      noise.start();
    } catch {
      // safe
    }
  }

  public playCrash(intensity: number = 1.0) {
    if (!this.ctx || !this.sfxGain) return;
    try {
      const t = this.ctx.currentTime;
      // Low punch impact
      const osc = this.ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(160, t);
      osc.frequency.exponentialRampToValueAtTime(30, t + 0.3);

      const oscGain = this.ctx.createGain();
      oscGain.gain.setValueAtTime(Math.min(0.8, 0.4 * intensity), t);
      oscGain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);

      osc.connect(oscGain);
      oscGain.connect(this.sfxGain);

      osc.start();
      osc.stop(t + 0.35);

      // Metal scrape burst
      const bufSize = Math.floor(this.ctx.sampleRate * 0.35);
      const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < bufSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.1));
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buf;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(600, t);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(Math.min(0.6, 0.3 * intensity), t);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.35);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.sfxGain);

      noise.start();
    } catch {
      // safe
    }
  }

  public playCountdownBeep(isGo: boolean = false) {
    if (!this.ctx || !this.sfxGain) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = isGo ? 'sawtooth' : 'sine';
      osc.frequency.setValueAtTime(isGo ? 880 : 440, t);

      gain.gain.setValueAtTime(0.4, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + (isGo ? 0.6 : 0.25));

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start();
      osc.stop(t + (isGo ? 0.65 : 0.3));
    } catch {
      // safe
    }
  }

  public playVictoryFanfare() {
    if (!this.ctx || !this.sfxGain) return;
    try {
      const notes = [440, 554, 659, 880];
      notes.forEach((freq, idx) => {
        const t = this.ctx!.currentTime + idx * 0.12;
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t);

        gain.gain.setValueAtTime(0.3, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

        osc.connect(gain);
        gain.connect(this.sfxGain!);

        osc.start(t);
        osc.stop(t + 0.45);
      });
    } catch {
      // safe
    }
  }

  public playClick() {
    if (!this.ctx || !this.sfxGain) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, t);
      osc.frequency.exponentialRampToValueAtTime(400, t + 0.05);

      gain.gain.setValueAtTime(0.15, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start();
      osc.stop(t + 0.06);
    } catch {
      // safe
    }
  }

  public setVolumes(master: number, engine: number, sfx: number) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    if (this.masterGain) this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : master, t, 0.05);
    if (this.engineGain) this.engineGain.gain.setTargetAtTime(engine, t, 0.05);
    if (this.sfxGain) this.sfxGain.gain.setTargetAtTime(sfx, t, 0.05);
  }

  public toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : 0.8, this.ctx.currentTime, 0.05);
    }
    return this.isMuted;
  }
}

export const soundEngine = new SoundSystem();
