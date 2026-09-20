let audioContext: AudioContext | null = null;
let isUnlocked = false;

function getContext(): AudioContext {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
}

export function unlockAudio() {
  if (isUnlocked) return;
  try {
    const ctx = getContext();
    if (ctx.state === "suspended") {
      ctx.resume();
    }
    isUnlocked = true;
  } catch {
    // ignore
  }
}

export function playNotificationSound() {
  try {
    const ctx = getContext();
    if (ctx.state === "suspended") {
      ctx.resume();
    }
    const now = ctx.currentTime;

    const notes = [
      { freq: 740, start: 0, dur: 0.16 },
      { freq: 988, start: 0.09, dur: 0.22 },
    ];

    notes.forEach(({ freq, start, dur }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + start);

      gain.gain.setValueAtTime(0.0001, now + start);
      gain.gain.exponentialRampToValueAtTime(0.12, now + start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + start + dur);

      osc.start(now + start);
      osc.stop(now + start + dur);
    });
  } catch {
    // Certains navigateurs bloquent l'audio avant une interaction utilisateur — on ignore silencieusement
  }
}