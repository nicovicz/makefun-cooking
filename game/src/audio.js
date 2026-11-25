// Procedural Web Audio API sound effects (zero external assets).

export function createAudioEngine() {
  let ctx = null;
  let muted = false;

  function ensureContext() {
    if (muted) return null;
    if (!ctx && typeof AudioContext !== 'undefined') {
      ctx = new AudioContext();
    }
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    return ctx;
  }

  function tone(freq, duration, type = 'triangle', volume = 0.12, endFreq = freq) {
    const ac = ensureContext();
    if (!ac) return;
    const now = ac.currentTime;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (endFreq !== freq) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(40, endFreq), now + duration);
    }
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.0008, now + duration);
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start(now);
    osc.stop(now + duration);
  }

  function noiseBurst(duration, volume = 0.08, cutoff = 1800) {
    const ac = ensureContext();
    if (!ac) return;
    const now = ac.currentTime;
    const length = Math.floor(ac.sampleRate * duration);
    const buffer = ac.createBuffer(1, length, ac.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / length);
    }
    const src = ac.createBufferSource();
    src.buffer = buffer;
    const filter = ac.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(cutoff, now);
    const gain = ac.createGain();
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(ac.destination);
    src.start(now);
  }

  return {
    toggleMute() {
      muted = !muted;
      return muted;
    },
    isMuted() {
      return muted;
    },
    playPickup() {
      tone(420, 0.07, 'triangle', 0.09, 560);
    },
    playChop() {
      tone(190, 0.055, 'square', 0.08, 95);
      noiseBurst(0.05, 0.09, 2400);
    },
    playSizzle() {
      noiseBurst(0.18, 0.06, 3600);
    },
    playPlate() {
      tone(780, 0.08, 'sine', 0.1, 1040);
    },
    playServeBell(combo = 1) {
      const base = 880 * Math.pow(1.06, Math.min(combo, 6));
      tone(base, 0.22, 'sine', 0.14, base * 1.01);
      setTimeout(() => tone(base * 1.5, 0.28, 'sine', 0.11, base * 1.5), 65);
    },
    playBurnAlert() {
      tone(240, 0.14, 'sawtooth', 0.11, 160);
    },
    playTrash() {
      tone(170, 0.12, 'triangle', 0.09, 85);
    },
  };
}
