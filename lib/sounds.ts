let audioCtx: AudioContext | null = null;

function ac(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioCtx;
}

function playTone(freq: number, dur: number, type: OscillatorType = 'sine', vol = 0.14, delay = 0) {
  try {
    const ctx = ac();
    const t0 = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    gain.gain.setValueAtTime(vol, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur);
  } catch (e) { /* ignore */ }
}

export const sfx = {
  click: () => playTone(520, 0.07, 'sine', 0.1),
  navigate: () => playTone(420, 0.09, 'triangle', 0.1),
  flip: () => playTone(600, 0.08, 'sine', 0.1),
  success: () => {
    playTone(523, 0.15, 'sine', 0.13);
    playTone(659, 0.15, 'sine', 0.13, 0.12);
    playTone(784, 0.22, 'sine', 0.13, 0.24);
  },
  open: () => {
    playTone(440, 0.12, 'sine', 0.1);
    playTone(660, 0.18, 'sine', 0.1, 0.1);
  },
  tick: () => playTone(880, 0.05, 'square', 0.05),
  piece: () => {
    try {
      const ctx = ac();
      const t0 = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(300, t0);
      osc.frequency.exponentialRampToValueAtTime(100, t0 + 0.1);
      gain.gain.setValueAtTime(0.5, t0);
      gain.gain.exponentialRampToValueAtTime(0.01, t0 + 0.1);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t0);
      osc.stop(t0 + 0.1);
    } catch (e) { /* ignore */ }
  },
};

export function playHeartbeat() {
  let beats = 0;
  const hb = setInterval(() => {
    if (navigator?.vibrate) navigator.vibrate([150, 100, 150]);
    playTone(120, 0.15, 'sine', 0.6);
    setTimeout(() => playTone(120, 0.15, 'sine', 0.6), 250);
    beats++;
    if (beats >= 3) clearInterval(hb);
  }, 900);
}
