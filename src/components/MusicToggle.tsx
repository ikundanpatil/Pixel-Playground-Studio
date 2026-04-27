import { useEffect, useRef, useState } from "react";
import { Music, Pause } from "lucide-react";
import musicTrack from "@/assets/sunflower.mp3";

/**
 * 🎵 Background music — bundled track.
 * Swap the import above to change the song.
 */
const MUSIC_URL = musicTrack;

export const MusicToggle = () => {
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(0.4);
  const [expanded, setExpanded] = useState(false);
  const [ready, setReady] = useState(false);
  const [needsInteraction, setNeedsInteraction] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio element once
  useEffect(() => {
    const audio = new Audio(MUSIC_URL);
    audio.loop = true;
    audio.preload = "auto";
    audio.volume = volume;
    audio.addEventListener("canplay", () => setReady(true));
    audio.addEventListener("ended", () => setPlaying(false));
    audioRef.current = audio;
    return () => {
      audio.pause();
      audio.src = "";
      audioRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update volume live
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  const start = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    try {
      await audio.play();
      setPlaying(true);
      setNeedsInteraction(false);
    } catch {
      // Autoplay blocked — show hint, wait for user gesture
      setPlaying(false);
      setNeedsInteraction(true);
    }
  };

  const stop = () => {
    audioRef.current?.pause();
    setPlaying(false);
    setNeedsInteraction(false);
  };

  const toggle = () => {
    if (playing) stop();
    else start();
  };

  // Try to auto-start immediately, then fall back to first interaction
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (localStorage.getItem("pixel:music") === "off") return;

    // Attempt silent autoplay (works if site has media engagement / user pref)
    const tryAutoplay = async () => {
      const audio = audioRef.current;
      if (!audio) return;
      try {
        await audio.play();
        setPlaying(true);
      } catch {
        setNeedsInteraction(true);
      }
    };

    if (ready) tryAutoplay();

    let started = false;
    const kickoff = async () => {
      if (started || playing) return;
      started = true;
      await start();
    };
    const events = ["pointerdown", "keydown", "touchstart"] as const;
    events.forEach((e) => window.addEventListener(e, kickoff, { once: true, passive: true }));
    return () => {
      events.forEach((e) => window.removeEventListener(e, kickoff));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  // Persist choice
  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem("pixel:music", playing ? "on" : "off");
  }, [playing]);

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
        disabled={!ready}
        aria-label={playing ? "Pause music" : "Play music"}
        aria-pressed={playing}
        className={`group relative w-16 h-16 rounded-full border-2 border-brand-ink shadow-brutal flex items-center justify-center transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-brutal-sm active:translate-x-[3px] active:translate-y-[3px] active:shadow-none disabled:opacity-60 disabled:cursor-wait ${
          playing ? "bg-brand-pink text-white" : "bg-brand-yellow text-brand-ink"
        }`}
      >
        {playing && (
          <span
            className="absolute inset-0 rounded-full border-2 border-brand-pink animate-ping opacity-60"
            aria-hidden
          />
        )}

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

        {playing && (
          <span className="absolute inset-0 rounded-full bg-brand-ink/0 hover:bg-brand-ink/30 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
            <Pause className="w-5 h-5 text-white" />
          </span>
        )}

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
