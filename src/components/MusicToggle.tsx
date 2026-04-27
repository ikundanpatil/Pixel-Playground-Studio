import { useEffect, useRef, useState } from "react";
import { Music, VolumeX } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

/**
 * Floating music toggle. Generates a looping chiptune-style melody with the
 * Web Audio API so no external audio assets are needed.
 */
export const MusicToggle = () => {
  const [playing, setPlaying] = useState(false);
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
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      ctxRef.current = new Ctx();
      const master = ctxRef.current.createGain();
      master.gain.value = 0.35;
      master.connect(ctxRef.current.destination);
      masterRef.current = master;
    }
    await ctxRef.current.resume();
    let i = 0;
    const tick = () => {
      const ctx = ctxRef.current;
      if (!ctx) return;
      playStep(NOTES[i % NOTES.length], ctx.currentTime);
      // Add a soft bass note every 4 steps
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

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      ctxRef.current?.close();
    };
  }, []);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={toggle}
            aria-label={playing ? "Mute music" : "Play music"}
            aria-pressed={playing}
            className={`w-14 h-14 rounded-full border-2 border-brand-ink shadow-brutal flex items-center justify-center transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-brutal-sm ${
              playing ? "bg-brand-pink text-white animate-pulse" : "bg-brand-yellow text-brand-ink"
            }`}
          >
            {playing ? <Music className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>
        </TooltipTrigger>
        <TooltipContent side="left">
          {playing ? "Mute chiptune" : "Play chiptune"}
        </TooltipContent>
      </Tooltip>
    </div>
  );
};
