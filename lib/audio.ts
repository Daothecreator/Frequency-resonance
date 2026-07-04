export class BowlSynthesizer {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private bowlNodes: any[] = [];
  private isPlaying = false;
  private currentFreq = 432;
  
  // Background Noise Nodes
  private noiseNodes: any[] = [];
  private noiseGain: GainNode | null = null;
  private heartbeatTimeout: NodeJS.Timeout | null = null;
  private noiseType: 'none' | 'rain' | 'ocean' | 'womb' = 'none';

  constructor() {}

  public async init() {
    if (this.ctx) return;
    
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    try {
      this.ctx = new AudioContextClass({ latencyHint: 'playback' });
    } catch (e) {
      this.ctx = new AudioContextClass();
    }

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0;
    this.masterGain.connect(this.ctx.destination);
    
    this.noiseGain = this.ctx.createGain();
    this.noiseGain.gain.value = 0;
    this.noiseGain.connect(this.ctx.destination);
  }

  public setVolume(val: number) {
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(val, this.ctx.currentTime, 0.1);
    }
  }

  public setNoiseVolume(val: number) {
    if (this.noiseGain && this.ctx) {
      this.noiseGain.gain.setTargetAtTime(val, this.ctx.currentTime, 0.1);
    }
  }

  public async play(frequency: number) {
    await this.init();
    if (this.ctx!.state === 'suspended') {
      await this.ctx!.resume();
    }

    this.currentFreq = frequency;

    if (this.isPlaying) {
      this.stop(0.5);
    }

    this.isPlaying = true;
    
    const now = this.ctx!.currentTime;
    const merger = this.ctx!.createChannelMerger(2);
    merger.connect(this.masterGain!);
    this.bowlNodes.push(merger);

    // ==========================================
    // LAYER 1: EXACT VOLUMETRIC RESONANCE ENGINE
    // ==========================================
    // Generates mathematically perfect acoustic standing waves to physically fill the room.
    
    // 1. The Core Resonator
    const coreOsc = this.ctx!.createOscillator();
    coreOsc.type = 'sine';
    coreOsc.frequency.value = frequency;
    
    const coreFilter = this.ctx!.createBiquadFilter();
    coreFilter.type = 'bandpass';
    coreFilter.frequency.value = frequency;
    coreFilter.Q.value = 30;

    const coreGain = this.ctx!.createGain();
    coreGain.gain.value = 0;

    coreOsc.connect(coreFilter);
    coreFilter.connect(coreGain);
    coreGain.connect(merger, 0, 0);
    coreGain.connect(merger, 0, 1);
    
    // 2. Spatial Phase Expanders
    const expanderL = this.ctx!.createOscillator();
    expanderL.type = 'sine';
    expanderL.frequency.value = frequency - 0.055;
    const gainL = this.ctx!.createGain();
    gainL.gain.value = 0;
    
    const expanderR = this.ctx!.createOscillator();
    expanderR.type = 'sine';
    expanderR.frequency.value = frequency + 0.055;
    const gainR = this.ctx!.createGain();
    gainR.gain.value = 0;

    expanderL.connect(gainL);
    gainL.connect(merger, 0, 0);
    
    expanderR.connect(gainR);
    gainR.connect(merger, 0, 1);

    // 3. Sub-harmonic Physical Anchor
    const subOsc = this.ctx!.createOscillator();
    subOsc.type = 'triangle';
    subOsc.frequency.value = frequency / 2;
    
    const subFilter = this.ctx!.createBiquadFilter();
    subFilter.type = 'lowpass';
    subFilter.frequency.value = frequency / 1.5;

    const subGain = this.ctx!.createGain();
    subGain.gain.value = 0;

    subOsc.connect(subFilter);
    subFilter.connect(subGain);
    subGain.connect(merger, 0, 0);
    subGain.connect(merger, 0, 1);

    // 4. Harmonic Brilliance (Golden Ratio & Perfect 5th)
    const harm1Osc = this.ctx!.createOscillator();
    harm1Osc.type = 'sine';
    harm1Osc.frequency.value = frequency * 1.5;
    const harm1Gain = this.ctx!.createGain();
    harm1Gain.gain.value = 0;

    const harm2Osc = this.ctx!.createOscillator();
    harm2Osc.type = 'sine';
    harm2Osc.frequency.value = frequency * 1.618;
    const harm2Gain = this.ctx!.createGain();
    harm2Gain.gain.value = 0;

    harm1Osc.connect(harm1Gain);
    harm1Gain.connect(merger, 0, 0);
    harm1Gain.connect(merger, 0, 1);

    harm2Osc.connect(harm2Gain);
    harm2Gain.connect(merger, 0, 0);
    harm2Gain.connect(merger, 0, 1);

    coreOsc.start(now);
    expanderL.start(now);
    expanderR.start(now);
    subOsc.start(now);
    harm1Osc.start(now);
    harm2Osc.start(now);

    // Adjust volumetric gains to blend with binaural layer
    coreGain.gain.setTargetAtTime(0.25, now, 3.0);
    gainL.gain.setTargetAtTime(0.1, now, 4.0);
    gainR.gain.setTargetAtTime(0.1, now, 4.0);
    subGain.gain.setTargetAtTime(0.08, now, 5.0);
    harm1Gain.gain.setTargetAtTime(0.04, now, 6.0);
    harm2Gain.gain.setTargetAtTime(0.02, now, 7.0);

    this.bowlNodes.push(
      coreOsc, coreFilter, coreGain,
      expanderL, gainL,
      expanderR, gainR,
      subOsc, subFilter, subGain,
      harm1Osc, harm1Gain,
      harm2Osc, harm2Gain
    );

    // ==========================================
    // LAYER 2: PREMIUM ACOUSTIC THERAPY & 3D BINAURALS
    // ==========================================
    // The soft, high-quality overtones, Lissajous orbits, HRTF, and Binaural Beats
    
    const partials = [
      { ratio: 1.0, amp: 0.5, binauralBeat: 4.0, orbitSpeed: 0 }, // Fundamental: 4Hz Theta Binaural Beat
      { ratio: 2.71, amp: 0.25, binauralBeat: 2.0, orbitSpeed: 0.05 }, // 1st Overtone: Slow spatial orbit
      { ratio: 5.43, amp: 0.15, binauralBeat: 1.0, orbitSpeed: 0.08 },
      { ratio: 8.95, amp: 0.08, binauralBeat: 0.5, orbitSpeed: 0.11 },
      { ratio: 14.3, amp: 0.04, binauralBeat: 0, orbitSpeed: 0.17 },
      { ratio: 18.2, amp: 0.02, binauralBeat: 0, orbitSpeed: 0.23 }
    ];

    partials.forEach((p) => {
      if (p.binauralBeat > 0 && p.orbitSpeed === 0) {
        // True Binaural Beat (Hard panned L/R)
        const oscL = this.ctx!.createOscillator();
        const oscR = this.ctx!.createOscillator();
        oscL.type = 'sine'; oscR.type = 'sine';
        oscL.frequency.value = frequency * p.ratio - p.binauralBeat / 2;
        oscR.frequency.value = frequency * p.ratio + p.binauralBeat / 2;

        const pGainL = this.ctx!.createGain();
        const pGainR = this.ctx!.createGain();
        pGainL.gain.value = 0; pGainR.gain.value = 0;

        oscL.connect(pGainL); pGainL.connect(merger, 0, 0);
        oscR.connect(pGainR); pGainR.connect(merger, 0, 1);

        oscL.start(now); oscR.start(now);
        pGainL.gain.setTargetAtTime(p.amp * 0.5, now, 2.5);
        pGainR.gain.setTargetAtTime(p.amp * 0.5, now, 2.5);

        this.bowlNodes.push(oscL, oscR, pGainL, pGainR);
      } else {
        // 3D Spatial HRTF Panning
        const osc = this.ctx!.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = frequency * p.ratio;

        const gain = this.ctx!.createGain();
        gain.gain.value = 0;

        const panner = this.ctx!.createPanner();
        panner.panningModel = 'HRTF';
        panner.distanceModel = 'inverse';
        panner.refDistance = 1;
        panner.maxDistance = 10000;
        panner.rolloffFactor = 1;

        // Complex spatial orbiting using Lissajous curves
        if (p.orbitSpeed > 0 && panner.positionX) {
          const lfoX = this.ctx!.createOscillator();
          const lfoZ = this.ctx!.createOscillator();
          lfoX.frequency.value = p.orbitSpeed;
          lfoZ.frequency.value = p.orbitSpeed * 1.31; // Prime ratio for non-repeating path

          const gainX = this.ctx!.createGain(); gainX.gain.value = 2; // 2 meters radius
          const gainZ = this.ctx!.createGain(); gainZ.gain.value = 2;

          lfoX.connect(gainX); gainX.connect(panner.positionX);
          lfoZ.connect(gainZ); gainZ.connect(panner.positionZ);

          lfoX.start(now); lfoZ.start(now);
          this.bowlNodes.push(lfoX, lfoZ, gainX, gainZ);
        }

        // Amplitude Modulation (Tremolo)
        const tremolo = this.ctx!.createOscillator();
        tremolo.frequency.value = p.binauralBeat || 0.5;
        const tremoloGain = this.ctx!.createGain();
        tremoloGain.gain.value = p.amp * 0.2;

        tremolo.connect(tremoloGain);
        tremoloGain.connect(gain.gain);

        osc.connect(gain);
        gain.connect(panner);
        panner.connect(this.masterGain!);

        osc.start(now);
        tremolo.start(now);
        gain.gain.setTargetAtTime(p.amp * 0.5, now, 2.5);

        this.bowlNodes.push(osc, gain, panner, tremolo, tremoloGain);
      }
    });
  }

  public stop(fadeTime = 2.5) {
    if (!this.isPlaying || !this.ctx) return;
    
    const now = this.ctx.currentTime;
    
    this.bowlNodes.forEach(node => {
      if (node instanceof GainNode && node !== this.masterGain) {
        node.gain.cancelScheduledValues(now);
        node.gain.setTargetAtTime(0, now, fadeTime / 3);
      }
    });

    const nodesToStop = [...this.bowlNodes];
    this.bowlNodes = [];
    this.isPlaying = false;
    
    setTimeout(() => {
      nodesToStop.forEach(node => {
        try {
          if (node.stop) node.stop();
          if (node.disconnect) node.disconnect();
        } catch(e) {}
      });
    }, fadeTime * 1000 + 100);
  }

  private stopBackgroundNoise() {
    this.noiseNodes.forEach(node => {
      try {
        if (node.stop) node.stop(this.ctx!.currentTime + 1);
        setTimeout(() => {
          if (node.disconnect) node.disconnect();
        }, 1500);
      } catch (e) {}
    });
    this.noiseNodes = [];
    
    if (this.heartbeatTimeout) {
      clearTimeout(this.heartbeatTimeout);
      this.heartbeatTimeout = null;
    }
  }

  private createNoiseBuffer(duration: number, type: 'pink' | 'brown', addDrops = false): AudioBuffer {
    const bufferSize = this.ctx!.sampleRate * duration;
    const buffer = this.ctx!.createBuffer(1, bufferSize, this.ctx!.sampleRate);
    const data = buffer.getChannelData(0);
    
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    let lastOut = 0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      if (type === 'brown') {
        data[i] = (lastOut + (0.02 * white)) / 1.02;
        lastOut = data[i];
        data[i] *= 3.5;
      } else {
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        data[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
        data[i] *= 0.11;
        b6 = white * 0.115926;
        
        if (addDrops && Math.random() < 0.0015) {
          data[i] += (Math.random() * 2 - 1) * 0.8;
        }
      }
    }
    return buffer;
  }

  public async setBackgroundNoise(type: 'none' | 'rain' | 'ocean' | 'womb') {
    await this.init();
    if (this.noiseType === type) return;
    this.noiseType = type;

    this.stopBackgroundNoise();

    if (type === 'none') return;

    const now = this.ctx!.currentTime;

    if (type === 'womb') {
      const buffer = this.createNoiseBuffer(5, 'brown');
      const source = this.ctx!.createBufferSource();
      source.buffer = buffer;
      source.loop = true;

      const filter = this.ctx!.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 120; // Deep muffle
      
      source.connect(filter);
      filter.connect(this.noiseGain!);
      source.start(now);
      this.noiseNodes.push(source, filter);

      // Organic Heartbeat with slight timing jitter
      const playHeartbeat = () => {
        if (!this.ctx || this.noiseType !== 'womb') return;
        const t = this.ctx.currentTime;
        
        // Lub
        const osc1 = this.ctx.createOscillator();
        const gain1 = this.ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(55, t);
        osc1.frequency.exponentialRampToValueAtTime(30, t + 0.1);
        gain1.gain.setValueAtTime(0, t);
        gain1.gain.linearRampToValueAtTime(0.8, t + 0.02);
        gain1.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
        
        osc1.connect(gain1);
        gain1.connect(this.noiseGain!);
        osc1.start(t);
        osc1.stop(t + 0.2);

        // Dub
        const osc2 = this.ctx.createOscillator();
        const gain2 = this.ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(60, t + 0.25);
        osc2.frequency.exponentialRampToValueAtTime(35, t + 0.35);
        gain2.gain.setValueAtTime(0, t + 0.25);
        gain2.gain.linearRampToValueAtTime(0.6, t + 0.27);
        gain2.gain.exponentialRampToValueAtTime(0.01, t + 0.4);
        
        osc2.connect(gain2);
        gain2.connect(this.noiseGain!);
        osc2.start(t + 0.25);
        osc2.stop(t + 0.45);

        // Schedule next beat (approx 60 BPM with +/- 50ms jitter)
        const jitter = (Math.random() - 0.5) * 100;
        this.heartbeatTimeout = setTimeout(playHeartbeat, 1000 + jitter);
      };
      playHeartbeat();

    } else if (type === 'rain') {
      // Two buffers of prime-number lengths to prevent repetitive looping
      const buf1 = this.createNoiseBuffer(5.3, 'pink', true);
      const buf2 = this.createNoiseBuffer(7.1, 'pink', true);
      
      const src1 = this.ctx!.createBufferSource();
      src1.buffer = buf1; src1.loop = true;
      const src2 = this.ctx!.createBufferSource();
      src2.buffer = buf2; src2.loop = true;

      const filter = this.ctx!.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 2500;

      // Wind simulation: slow LFO modulating the lowpass filter
      const windLfo = this.ctx!.createOscillator();
      windLfo.type = 'sine';
      windLfo.frequency.value = 0.05; // 20s cycle
      const windGain = this.ctx!.createGain();
      windGain.gain.value = 800; // Sweep filter +/- 800Hz

      windLfo.connect(windGain);
      windGain.connect(filter.frequency);

      src1.connect(filter);
      src2.connect(filter);
      filter.connect(this.noiseGain!);

      src1.start(now); src2.start(now); windLfo.start(now);
      this.noiseNodes.push(src1, src2, filter, windLfo, windGain);

    } else if (type === 'ocean') {
      const buffer = this.createNoiseBuffer(8.3, 'brown');
      const source = this.ctx!.createBufferSource();
      source.buffer = buffer;
      source.loop = true;

      const filter = this.ctx!.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 300;
      
      const waveGain = this.ctx!.createGain();
      waveGain.gain.value = 0.5;
      
      // Complex wave modulation using two LFOs (Polyrhythm)
      const lfo1 = this.ctx!.createOscillator();
      lfo1.type = 'sine'; lfo1.frequency.value = 0.07; // ~14s
      const lfo2 = this.ctx!.createOscillator();
      lfo2.type = 'sine'; lfo2.frequency.value = 0.11; // ~9s
      
      const lfoGain1 = this.ctx!.createGain(); lfoGain1.gain.value = 0.3;
      const lfoGain2 = this.ctx!.createGain(); lfoGain2.gain.value = 0.2;
      
      const filterLfoGain = this.ctx!.createGain();
      filterLfoGain.gain.value = 400; // Sweep filter from 100 to 700Hz
      
      lfo1.connect(lfoGain1); lfoGain1.connect(waveGain.gain);
      lfo2.connect(lfoGain2); lfoGain2.connect(waveGain.gain);
      
      lfo1.connect(filterLfoGain); filterLfoGain.connect(filter.frequency);
      
      source.connect(filter);
      filter.connect(waveGain);
      waveGain.connect(this.noiseGain!);
      
      source.start(now); lfo1.start(now); lfo2.start(now);
      this.noiseNodes.push(source, filter, waveGain, lfo1, lfo2, lfoGain1, lfoGain2, filterLfoGain);
    }
  }
}

export const bowlSynth = new BowlSynthesizer();
