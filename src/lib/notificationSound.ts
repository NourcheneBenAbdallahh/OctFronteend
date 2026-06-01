/** Soft two-tone chime for new alerts (Web Audio API). */

let sharedCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;

  const Ctx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return null;

  if (!sharedCtx || sharedCtx.state === "closed") {
    sharedCtx = new Ctx();
  }

  return sharedCtx;
}

/** Unlock audio after a user gesture (required by most browsers). */
export function primeNotificationSound(): void {
  const ctx = getAudioContext();
  if (ctx?.state === "suspended") {
    void ctx.resume();
  }
}

export async function playNotificationSound(): Promise<void> {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    if (ctx.state === "suspended") {
      await ctx.resume();
    }
    if (ctx.state !== "running") return;

    const t0 = ctx.currentTime;

    const tone = (frequency: number, start: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.value = frequency;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.035, start + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0008, start + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + duration + 0.02);
    };

    tone(523.25, t0, 0.1);
    tone(659.25, t0 + 0.11, 0.14);
  } catch {
    // Ignore audio API failures silently.
  }
}
