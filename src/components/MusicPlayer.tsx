import { useEffect, useRef, useState } from "react";
import { Music, Pause, Play, Volume2, VolumeX } from "lucide-react";
import { Slider } from "@/components/ui/slider";

/**
 * Chiptune background loop synthesized with the Web Audio API.
 * No external assets — generated entirely in-browser.
 */

// Frequencies (Hz) for a 4-bar arcade-y melody in C minor pentatonic.
// Pattern values are MIDI-ish notes; null = rest.
const NOTES: Record<string, number> = {
  C4: 261.63, Eb4: 311.13, F4: 349.23, G4: 392.0, Bb4: 466.16,
  C5: 523.25, Eb5: 622.25, F5: 698.46, G5: 783.99, Bb5: 932.33,
  C3: 130.81, G3: 196.0, Eb3: 155.56, F3: 174.61, Bb3: 233.08,
};

const MELODY: (keyof typeof NOTES | null)[] = [
  "C5", "Eb5", "G5", "Eb5", "F5", "Eb5", "C5", null,
  "Bb4", "C5", "Eb5", "C5", "G4", "Bb4", "C5", null,
  "C5", "Eb5", "G5", "Bb5", "G5", "Eb5", "C5", null,
  "F5", "Eb5", "C5", "Bb4", "G4", "Eb4", "C4", null,
];

const BASS: (keyof typeof NOTES | null)[] = [
  "C3", null, "C3", null, "F3", null, "F3", null,
  "Bb3", null, "Bb3", null, "G3", null, "G3", null,
];

const STEP_MS = 180; // melody step
const BASS_STEP_MS = 360; // half-time bass

export const MusicPlayer = () => {
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(0.35);
  const [muted, setMuted] = useState(false);

  const ctxRef = useRef<AudioContext | null>(null);
  const masterRef = useRef<GainNode | null>(null);
  const melodyTimer = useRef<number | null>(null);
  const bassTimer = useRef<number | null>(null);
  const melodyStep = useRef(0);
  const bassStep = useRef(0);

  const ensureCtx = () => {
    if (!ctxRef.current) {
      const Ctor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      const ctx = new Ctor();
      const master = ctx.createGain();
      master.gain.value = muted ? 0 : volume;
      master.connect(ctx.destination);
      ctxRef.current = ctx;
      masterRef.current = master;
    }
    return ctxRef.current!;
  };

  const playBlip = (
    freq: number,
    duration: number,
    type: OscillatorType,
    gain = 0.18,
  ) => {
    const ctx = ctxRef.current;
    const master = masterRef.current;
    if (!ctx || !master) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    env.gain.setValueAtTime(0, t);
    env.gain.linearRampToValueAtTime(gain, t + 0.01);
    env.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    osc.connect(env);
    env.connect(master);
    osc.start(t);
    osc.stop(t + duration + 0.05);
  };

  const start = async () => {
    const ctx = ensureCtx();
    if (ctx.state === "suspended") await ctx.resume();

    melodyStep.current = 0;
    bassStep.current = 0;

    melodyTimer.current = window.setInterval(() => {
      const note = MELODY[melodyStep.current % MELODY.length];
      if (note) playBlip(NOTES[note], 0.16, "square", 0.12);
      melodyStep.current += 1;
    }, STEP_MS);

    bassTimer.current = window.setInterval(() => {
      const note = BASS[bassStep.current % BASS.length];
      if (note) playBlip(NOTES[note], 0.32, "triangle", 0.22);
      bassStep.current += 1;
    }, BASS_STEP_MS);

    setPlaying(true);
  };

  const stop = () => {
    if (melodyTimer.current) window.clearInterval(melodyTimer.current);
    if (bassTimer.current) window.clearInterval(bassTimer.current);
    melodyTimer.current = null;
    bassTimer.current = null;
    setPlaying(false);
  };

  const toggle = () => {
    if (playing) stop();
    else start();
  };

  // Keep gain in sync with volume / mute
  useEffect(() => {
    const master = masterRef.current;
    const ctx = ctxRef.current;
    if (master && ctx) {
      master.gain.setTargetAtTime(muted ? 0 : volume, ctx.currentTime, 0.01);
    }
  }, [volume, muted]);

  useEffect(() => {
    return () => {
      stop();
      ctxRef.current?.close();
    };
  }, []);

  return (
    <div className="inline-flex items-center gap-2 rounded-md border-2 border-brand-ink bg-background px-2 py-1.5 shadow-brutal-sm">
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? "Pause music" : "Play music"}
        className="inline-flex items-center gap-1.5 mono text-[11px] uppercase tracking-widest text-brand-ink hover:text-brand-pink transition-colors"
      >
        {playing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
        <Music className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">{playing ? "Playing" : "Lo-fi"}</span>
      </button>

      <span className="w-px h-5 bg-border" aria-hidden />

      <button
        type="button"
        onClick={() => setMuted((m) => !m)}
        aria-label={muted ? "Unmute" : "Mute"}
        className="text-brand-ink hover:text-brand-pink transition-colors"
      >
        {muted || volume === 0 ? (
          <VolumeX className="w-3.5 h-3.5" />
        ) : (
          <Volume2 className="w-3.5 h-3.5" />
        )}
      </button>

      <Slider
        value={[muted ? 0 : volume * 100]}
        onValueChange={(v) => {
          const next = (v[0] ?? 0) / 100;
          setVolume(next);
          if (next > 0 && muted) setMuted(false);
        }}
        max={100}
        step={1}
        className="w-20"
        aria-label="Volume"
      />
    </div>
  );
};
