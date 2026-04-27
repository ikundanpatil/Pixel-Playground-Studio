import { useEffect, useRef, useState } from "react";
import { Music, Pause } from "lucide-react";

/**
 * Floating music toggle. Generates a looping chiptune-style melody with the
 * Web Audio API so no external audio assets are needed.
 */
export const MusicToggle = () => {
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(0.35);
  const [expanded, setExpanded] = useState(false);
  const ctxRef = useRef<AudioContext | null>(null);
  const masterRef = useRef<GainNode | null>(null);
  const timerRef = useRef<number | null>(null);

  // Simple pentatonic loop (frequencies in Hz)
  const NOTES = [
    523.25, 659.25, 783.99, 880.0, 783.99, 659.25, 523.25, 440.0,
    523.25, 659.25, 587.33, 523.25, 440.0, 523.25, 392.0, 440.0,
  ];
  const STEP_MS = 220;

  const playStep = (freq: number, t0: number) => {
    const ctx = ctxRef.current!;
    const master = masterRef.current!;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(freq, t0);
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(0.18, t0 + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.18);
    osc.connect(gain).connect(master);
    osc.start(t0);
    osc.stop(t0 + 0.2);
  };

  const start = async () => {
    if (!ctxRef.current) {
      const Ctx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      ctxRef.current = new Ctx();
      const master = ctxRef.current.createGain();
      master.gain.value = volume;
      master.connect(ctxRef.current.destination);
      masterRef.current = master;
    }
    await ctxRef.current.resume();
    let i = 0;
    const tick = () => {
      const ctx = ctxRef.current;
      if (!ctx) return;
      playStep(NOTES[i % NOTES.length], ctx.currentTime);
      if (i % 4 === 0) playStep(NOTES[i % NOTES.length] / 2, ctx.currentTime);
      i++;
    };
    tick();
    timerRef.current = window.setInterval(tick, STEP_MS);
  };

  const stop = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    ctxRef.current?.suspend();
  };

  const toggle = () => {
    if (playing) stop();
    else start();
    setPlaying((v) => !v);
  };

  // Update master volume live
  useEffect(() => {
    if (masterRef.current && ctxRef.current) {
      masterRef.current.gain.setTargetAtTime(volume, ctxRef.current.currentTime, 0.05);
    }
  }, [volume]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      ctxRef.current?.close();
    };
  }, []);

  return (
    <div
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2"
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
    >
      {/* Volume slider — appears when expanded */}
      <div
        className={`flex items-center gap-2 bg-card border-2 border-brand-ink rounded-full pl-4 pr-3 py-2 shadow-brutal-sm transition-all duration-300 origin-right ${
          expanded ? "opacity-100 scale-100 translate-x-0" : "opacity-0 scale-90 translate-x-4 pointer-events-none"
        }`}
      >
        <span className="mono text-[10px] uppercase tracking-widest text-muted-foreground">
          VOL
        </span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={volume}
          onChange={(e) => setVolume(parseFloat(e.target.value))}
          aria-label="Music volume"
          className="w-24 h-1 accent-brand-pink cursor-pointer"
        />
        <span className="mono text-[10px] font-bold text-brand-ink w-7 text-right">
          {Math.round(volume * 100)}
        </span>
      </div>

      {/* Main toggle */}
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? "Pause music" : "Play music"}
        aria-pressed={playing}
        className={`group relative w-16 h-16 rounded-full border-2 border-brand-ink shadow-brutal flex items-center justify-center transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-brutal-sm active:translate-x-[3px] active:translate-y-[3px] active:shadow-none ${
          playing ? "bg-brand-pink text-white" : "bg-brand-yellow text-brand-ink"
        }`}
      >
        {/* Pulsing ring when playing */}
        {playing && (
          <span
            className="absolute inset-0 rounded-full border-2 border-brand-pink animate-ping opacity-60"
            aria-hidden
          />
        )}

        {/* Icon OR equalizer bars */}
        {playing ? (
          <div className="flex items-end gap-0.5 h-5" aria-hidden>
            <span className="w-1 bg-white rounded-sm eq-bar" style={{ animationDelay: "0ms" }} />
            <span className="w-1 bg-white rounded-sm eq-bar" style={{ animationDelay: "150ms" }} />
            <span className="w-1 bg-white rounded-sm eq-bar" style={{ animationDelay: "300ms" }} />
            <span className="w-1 bg-white rounded-sm eq-bar" style={{ animationDelay: "75ms" }} />
          </div>
        ) : (
          <Music className="w-6 h-6 transition-transform group-hover:rotate-12" />
        )}

        {/* Hover-only pause hint when playing */}
        {playing && (
          <span className="absolute inset-0 rounded-full bg-brand-ink/0 hover:bg-brand-ink/30 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
            <Pause className="w-5 h-5 text-white" />
          </span>
        )}

        {/* Status label */}
        <span
          className={`absolute -top-2 -left-2 mono text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded border-2 border-brand-ink ${
            playing ? "bg-brand-lime text-brand-ink" : "bg-background text-muted-foreground"
          }`}
        >
          {playing ? "ON" : "OFF"}
        </span>
      </button>
    </div>
  );
};
