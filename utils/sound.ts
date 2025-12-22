export class SoundManager {
  private context: AudioContext | null = null;
  private buffers: Map<string, AudioBuffer> = new Map();
  private muted: boolean = false;
  private masterGain: GainNode | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.context = new AudioContextClass();
        this.masterGain = this.context.createGain();
        this.masterGain.connect(this.context.destination);
        // Compressor to glue sounds together and prevent clipping
        const compressor = this.context.createDynamicsCompressor();
        compressor.threshold.value = -24;
        compressor.knee.value = 30;
        compressor.ratio.value = 12;
        compressor.attack.value = 0.003;
        compressor.release.value = 0.25;
        
        this.masterGain.disconnect();
        this.masterGain.connect(compressor);
        compressor.connect(this.context.destination);
      }
    }
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
    if (this.context) {
      if (muted) {
        this.context.suspend();
      } else {
        this.context.resume();
      }
    }
  }

  resume() {
    if (this.context?.state === 'suspended') {
      this.context.resume();
    }
  }

  private createNoiseBuffer(): AudioBuffer {
    if (!this.context) throw new Error("No context");
    const bufferSize = this.context.sampleRate * 2; // 2 seconds
    const buffer = this.context.createBuffer(1, bufferSize, this.context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  playLaunch() {
    if (this.muted || !this.context || !this.masterGain) return;

    if (this.buffers.has('launch')) {
      this.playBuffer('launch', 0.8 + Math.random() * 0.4, 0.3);
    } else {
      // Improved Synthetic Launch: "Whoosh"
      const t = this.context.currentTime;
      const osc = this.context.createOscillator();
      const gain = this.context.createGain();
      
      // Noise layer for air resistance sound
      const noise = this.context.createBufferSource();
      noise.buffer = this.createNoiseBuffer();
      const noiseGain = this.context.createGain();
      const noiseFilter = this.context.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.Q.value = 1;

      osc.connect(gain);
      gain.connect(this.masterGain);

      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(this.masterGain);

      // Pitch Sweep
      osc.frequency.setValueAtTime(150, t);
      osc.frequency.exponentialRampToValueAtTime(600, t + 0.5);
      
      // Filter Sweep
      noiseFilter.frequency.setValueAtTime(400, t);
      noiseFilter.frequency.exponentialRampToValueAtTime(1200, t + 0.5);

      // Volume Envelope
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.1, t + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);

      noiseGain.gain.setValueAtTime(0, t);
      noiseGain.gain.linearRampToValueAtTime(0.05, t + 0.1);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);

      osc.start(t);
      osc.stop(t + 0.5);
      noise.start(t);
      noise.stop(t + 0.5);
    }
  }

  playExplosion(intensity: number = 1) {
    if (this.muted || !this.context || !this.masterGain) return;

    if (this.buffers.has('explode')) {
      const rate = 1.2 - (intensity * 0.4) + (Math.random() * 0.2 - 0.1);
      this.playBuffer('explode', rate, 0.5 * intensity);
    } else {
      // Improved Realistic Explosion
      const t = this.context.currentTime;
      
      // 1. The "Thud" (Low frequency impact)
      const osc = this.context.createOscillator();
      const oscGain = this.context.createGain();
      osc.connect(oscGain);
      oscGain.connect(this.masterGain);
      
      osc.frequency.setValueAtTime(120, t);
      osc.frequency.exponentialRampToValueAtTime(40, t + 0.15);
      
      oscGain.gain.setValueAtTime(0.8 * intensity, t);
      oscGain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);

      osc.start(t);
      osc.stop(t + 0.2);

      // 2. The "Crack" (High impact noise)
      const crack = this.context.createBufferSource();
      crack.buffer = this.createNoiseBuffer();
      const crackFilter = this.context.createBiquadFilter();
      crackFilter.type = 'lowpass';
      crackFilter.frequency.value = 3000;
      const crackGain = this.context.createGain();
      
      crack.connect(crackFilter);
      crackFilter.connect(crackGain);
      crackGain.connect(this.masterGain);

      crackGain.gain.setValueAtTime(0.5 * intensity, t);
      crackGain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
      
      crack.start(t);
      crack.stop(t + 0.1);

      // 3. The "Rumble" (Long decay low noise)
      const rumble = this.context.createBufferSource();
      rumble.buffer = this.createNoiseBuffer();
      const rumbleFilter = this.context.createBiquadFilter();
      rumbleFilter.type = 'lowpass';
      const rumbleGain = this.context.createGain();

      rumble.connect(rumbleFilter);
      rumbleFilter.connect(rumbleGain);
      rumbleGain.connect(this.masterGain);

      rumbleFilter.frequency.setValueAtTime(800, t);
      rumbleFilter.frequency.exponentialRampToValueAtTime(50, t + 1.5);

      rumbleGain.gain.setValueAtTime(0.4 * intensity, t);
      rumbleGain.gain.exponentialRampToValueAtTime(0.001, t + 2.0);

      rumble.start(t);
      rumble.stop(t + 2.0);
    }
  }

  playCrackle() {
    if (this.muted || !this.context || !this.masterGain) return;

    if (this.buffers.has('crackle')) {
      this.playBuffer('crackle', 1, 0.2);
    } else {
      // Synthetic Crackle: Randomized high-pass pops
      const t = this.context.currentTime;
      const count = 4 + Math.floor(Math.random() * 4);
      
      for (let i = 0; i < count; i++) {
        const offset = Math.random() * 0.4;
        
        const noise = this.context.createBufferSource();
        noise.buffer = this.createNoiseBuffer();
        
        const filter = this.context.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 1000 + Math.random() * 1000;
        
        const gain = this.context.createGain();
        gain.gain.setValueAtTime(0.05, t + offset);
        gain.gain.exponentialRampToValueAtTime(0.001, t + offset + 0.05);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        
        noise.start(t + offset);
        noise.stop(t + offset + 0.05);
      }
    }
  }

  private playBuffer(key: string, rate: number, vol: number) {
    if (!this.context || !this.masterGain) return;
    const source = this.context.createBufferSource();
    source.buffer = this.buffers.get(key)!;
    source.playbackRate.value = rate;

    const gain = this.context.createGain();
    gain.gain.value = vol;

    source.connect(gain);
    gain.connect(this.masterGain);
    source.start(0);
  }
}

export const soundManager = new SoundManager();