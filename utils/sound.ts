export class SoundManager {
  private context: AudioContext | null = null;
  private buffers: Map<string, AudioBuffer> = new Map();
  private muted: boolean = false;
  private noiseBuffer: AudioBuffer | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.context = new AudioContextClass();
        this.generateNoiseBuffer();
      }
    }
  }

  // Generate white noise buffer for synthetic explosions
  private generateNoiseBuffer() {
    if (!this.context) return;
    const bufferSize = this.context.sampleRate * 2; // 2 seconds
    const buffer = this.context.createBuffer(1, bufferSize, this.context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    this.noiseBuffer = buffer;
  }

  async init() {
    if (!this.context) return;
    
    // Attempt to load files. If they fail (404), we just won't have the buffer 
    // and will fall back to synth in the play methods.
    const sounds = [
      { key: 'launch', url: '/sounds/launch.mp3' },
      { key: 'explode', url: '/sounds/explode.mp3' },
      { key: 'crackle', url: '/sounds/crackle.mp3' }
    ];

    await Promise.all(sounds.map(async (sound) => {
      try {
        const res = await fetch(sound.url);
        if (res.ok) {
          const arrayBuffer = await res.arrayBuffer();
          const audioBuffer = await this.context!.decodeAudioData(arrayBuffer);
          this.buffers.set(sound.key, audioBuffer);
        }
      } catch (e) {
        // Silent failure: standard behavior if files aren't present
      }
    }));
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    if (!muted && this.context?.state === 'suspended') {
      this.context.resume();
    }
  }

  resume() {
    if (this.context?.state === 'suspended') {
      this.context.resume();
    }
  }

  playLaunch() {
    if (this.muted || !this.context) return;

    if (this.buffers.has('launch')) {
      this.playBuffer('launch', 0.8 + Math.random() * 0.4, 0.3);
    } else {
      // Synthetic Launch: Whistle up
      const t = this.context.currentTime;
      const osc = this.context.createOscillator();
      const gain = this.context.createGain();

      osc.connect(gain);
      gain.connect(this.context.destination);

      osc.frequency.setValueAtTime(200, t);
      osc.frequency.exponentialRampToValueAtTime(800, t + 0.3);
      
      gain.gain.setValueAtTime(0.1, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);

      osc.start(t);
      osc.stop(t + 0.3);
    }
  }

  playExplosion(intensity: number = 1) {
    if (this.muted || !this.context) return;

    if (this.buffers.has('explode')) {
      // Vary playback rate for size: larger = lower pitch
      const rate = 1.2 - (intensity * 0.4) + (Math.random() * 0.2 - 0.1);
      this.playBuffer('explode', rate, 0.5 * intensity);
    } else {
      // Synthetic Explosion: Filtered Noise
      const t = this.context.currentTime;
      const noise = this.context.createBufferSource();
      noise.buffer = this.noiseBuffer;
      
      const filter = this.context.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, t);
      filter.frequency.exponentialRampToValueAtTime(10, t + 1);

      const gain = this.context.createGain();
      gain.gain.setValueAtTime(0.3 * intensity, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.8);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.context.destination);

      noise.start(t);
      noise.stop(t + 1);
    }
  }

  playCrackle() {
    if (this.muted || !this.context) return;

    if (this.buffers.has('crackle')) {
      this.playBuffer('crackle', 1, 0.2);
    } else {
      // Synthetic Crackle: Short high freq bursts
      const t = this.context.currentTime;
      // We'll create a few random pops
      for (let i = 0; i < 5; i++) {
        const offset = Math.random() * 0.5;
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();
        osc.type = 'square';
        osc.connect(gain);
        gain.connect(this.context.destination);
        
        osc.frequency.setValueAtTime(800 + Math.random() * 400, t + offset);
        gain.gain.setValueAtTime(0.05, t + offset);
        gain.gain.exponentialRampToValueAtTime(0.001, t + offset + 0.05);
        
        osc.start(t + offset);
        osc.stop(t + offset + 0.05);
      }
    }
  }

  private playBuffer(key: string, rate: number, vol: number) {
    if (!this.context) return;
    const source = this.context.createBufferSource();
    source.buffer = this.buffers.get(key)!;
    source.playbackRate.value = rate;

    const gain = this.context.createGain();
    gain.gain.value = vol;

    source.connect(gain);
    gain.connect(this.context.destination);
    source.start(0);
  }
}

export const soundManager = new SoundManager();