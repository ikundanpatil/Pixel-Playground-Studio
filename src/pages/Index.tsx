import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Download,
  Eraser,
  ExternalLink,
  Eye,
  Keyboard,
  Pencil,
  Redo2,
  Sparkles,
  Trash2,
  Undo2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { PixelCanvas, type PixelCanvasHandle, type Tool } from "@/components/PixelCanvas";
import { PRESETS, PresetSwatches } from "@/components/PresetSwatches";
import { InspirationGallery } from "@/components/InspirationGallery";

const TIPS = [
  "Start low-res. Magic happens at 16×16.",
  "Limit your palette to 4–6 colors for cohesion.",
  "Use anti-aliasing pixels at edges for soft curves.",
  "Outline with a darker shade of your fill color, not pure black.",
];

const Index = () => {
  const [size, setSize] = useState(16);
  const [color, setColor] = useState("#FF1493");
  const [tool, setTool] = useState<Tool>("pencil");
  const [recent, setRecent] = useState<string[]>(["#FF1493"]);
  const handleRef = useRef<PixelCanvasHandle | null>(null);

  const trackColor = (c: string) => {
    setRecent((r) => {
      const next = [c, ...r.filter((x) => x.toLowerCase() !== c.toLowerCase())];
      return next.slice(0, 8);
    });
  };

  const onPickPreset = (c: string) => {
    setColor(c);
    setTool("pencil");
    trackColor(c);
  };

  // Keyboard shortcuts (tools)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;
      if (e.key.toLowerCase() === "c") setTool("pencil");
      if (e.key.toLowerCase() === "e") setTool("eraser");
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const handleDownload = () => {
    handleRef.current?.exportPNG();
    toast.success("PNG downloaded", { description: `Exported at ${size * 16}×${size * 16}px` });
  };

  const handleCopy = async () => {
    try {
      await handleRef.current?.copyData();
      toast.success("Copied pixel data", { description: "JSON copied to clipboard" });
    } catch {
      toast.error("Couldn't copy", { description: "Clipboard permission denied" });
    }
  };

  return (
    <TooltipProvider delayDuration={150}>
      <div className="min-h-screen bg-background text-foreground">
        {/* Top marquee */}
        <div className="border-b-2 border-brand-ink bg-brand-ink text-background overflow-hidden">
          <div className="flex whitespace-nowrap mono text-xs uppercase tracking-[0.2em] py-2 marquee-track">
            {Array.from({ length: 2 }).map((_, k) => (
              <div key={k} className="flex items-center gap-8 pr-8">
                {[
                  "Pixel Art Studio",
                  "★ Free & in-browser",
                  "Export PNG",
                  "8×8 → 64×64",
                  "Made for makers",
                  "★ No sign-up",
                  "Awwwards-ready palette",
                  "★ Draw, erase, ship",
                ].map((t, i) => (
                  <span key={`${k}-${i}`} className="flex items-center gap-8">
                    <span>{t}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-cyan" />
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Header / Hero */}
        <header className="border-b-2 border-brand-ink bg-brand-soft relative overflow-hidden">
          <div className="absolute inset-0 bg-dots opacity-60" aria-hidden />
          <div className="container relative py-10 md:py-16">
            <div className="flex items-center justify-between gap-6 mb-10">
              <div className="flex items-center gap-3">
                <div className="grid grid-cols-3 gap-0.5 p-1.5 rounded-md bg-brand-ink">
                  <span className="w-2 h-2 bg-brand-pink" />
                  <span className="w-2 h-2 bg-brand-cyan" />
                  <span className="w-2 h-2 bg-brand-yellow" />
                  <span className="w-2 h-2 bg-brand-cyan" />
                  <span className="w-2 h-2 bg-brand-pink" />
                  <span className="w-2 h-2 bg-brand-gold" />
                  <span className="w-2 h-2 bg-brand-yellow" />
                  <span className="w-2 h-2 bg-brand-purple" />
                  <span className="w-2 h-2 bg-brand-pink" />
                </div>
                <span className="mono text-xs uppercase tracking-widest text-brand-ink">
                  Pixel/Studio · v1.0
                </span>
              </div>
              <a
                href="#inspiration"
                className="hidden md:inline-flex items-center gap-2 mono text-xs uppercase tracking-widest text-brand-ink hover:text-brand-pink transition-colors"
              >
                Browse gallery <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            <div className="grid md:grid-cols-12 gap-8 items-end">
              <div className="md:col-span-8">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-cyan border-2 border-brand-ink mono text-[11px] uppercase tracking-widest mb-6">
                  <Sparkles className="w-3 h-3" /> Draw · Export · Repeat
                </div>
                <h1 className="font-display text-5xl sm:text-7xl md:text-[8rem] leading-[0.85] text-brand-ink text-balance">
                  PIXEL
                  <br />
                  <span className="relative inline-block">
                    <span className="text-brand-pink">STUDIO</span>
                    <span className="absolute -bottom-2 left-0 right-0 h-2 bg-brand-yellow -z-0" />
                  </span>
                  .
                </h1>
                <p className="mt-6 max-w-xl text-base md:text-lg text-muted-foreground">
                  A loud, opinionated pixel art editor for the browser. Snap a grid,
                  pick a color, ship a PNG. No accounts, no plug-ins — just{" "}
                  <span className="font-semibold text-brand-ink">vibes per pixel</span>.
                </p>
              </div>
              <div className="md:col-span-4 flex md:justify-end">
                <div className="flex flex-wrap gap-2">
                  {["#FF1493", "#00FFFF", "#FFFF00", "#FFD700", "#8B00FF"].map((c, i) => (
                    <span
                      key={c}
                      className="w-12 h-12 md:w-14 md:h-14 border-2 border-brand-ink rounded-md shadow-brutal-sm"
                      style={{ backgroundColor: c, transform: `rotate(${(i - 2) * 4}deg)` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Studio */}
        <main className="container py-10 md:py-16">
          <div className="grid lg:grid-cols-12 gap-6">
            {/* Left: Tools */}
            <aside className="lg:col-span-3 space-y-4 order-2 lg:order-1">
              <Panel label="01 / Tool">
                <div className="grid grid-cols-2 gap-2">
                  <ToolButton
                    active={tool === "pencil"}
                    onClick={() => setTool("pencil")}
                    label="Pencil"
                    hint="C"
                    icon={<Pencil className="w-4 h-4" />}
                  />
                  <ToolButton
                    active={tool === "eraser"}
                    onClick={() => setTool("eraser")}
                    label="Eraser"
                    hint="E"
                    icon={<Eraser className="w-4 h-4" />}
                  />
                </div>
              </Panel>

              <Panel label="02 / Color">
                <div className="flex items-center gap-3 mb-3">
                  <label className="relative w-14 h-14 rounded-md border-2 border-brand-ink overflow-hidden cursor-pointer shadow-brutal-sm">
                    <input
                      type="color"
                      value={color}
                      onChange={(e) => {
                        setColor(e.target.value);
                        setTool("pencil");
                        trackColor(e.target.value);
                      }}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      aria-label="Pick custom color"
                    />
                    <span className="block w-full h-full" style={{ backgroundColor: color }} />
                  </label>
                  <div>
                    <div className="mono text-[10px] uppercase tracking-widest text-muted-foreground">
                      Active
                    </div>
                    <div className="font-display text-lg leading-none mt-1">
                      {color.toUpperCase()}
                    </div>
                    <div className="mono text-[10px] mt-1 text-muted-foreground">
                      {PRESETS.find((p) => p.hex.toLowerCase() === color.toLowerCase())?.name ?? "Custom"}
                    </div>
                  </div>
                </div>
                <PresetSwatches current={color} onPick={onPickPreset} />
                {recent.length > 1 && (
                  <div className="mt-4">
                    <div className="mono text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
                      Recent
                    </div>
                    <div className="flex gap-1.5 flex-wrap">
                      {recent.map((c) => (
                        <button
                          key={c}
                          onClick={() => {
                            setColor(c);
                            setTool("pencil");
                          }}
                          className="w-6 h-6 rounded border-2 border-brand-ink hover:scale-110 transition-transform"
                          style={{ backgroundColor: c }}
                          aria-label={`Use ${c}`}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </Panel>

              <Panel label="03 / Grid">
                <div className="flex items-baseline justify-between mb-3">
                  <span className="font-display text-3xl">
                    {size}
                    <span className="text-brand-pink">×</span>
                    {size}
                  </span>
                  <span className="mono text-[10px] uppercase text-muted-foreground">
                    {size * size} cells
                  </span>
                </div>
                <Slider
                  value={[size]}
                  min={8}
                  max={64}
                  step={8}
                  onValueChange={(v) => setSize(v[0])}
                  aria-label="Grid size"
                />
                <div className="flex justify-between mono text-[10px] text-muted-foreground mt-2">
                  <span>8</span>
                  <span>16</span>
                  <span>24</span>
                  <span>32</span>
                  <span>40</span>
                  <span>48</span>
                  <span>56</span>
                  <span>64</span>
                </div>
              </Panel>
            </aside>

            {/* Center: Canvas */}
            <section className="lg:col-span-6 order-1 lg:order-2">
              <div className="bg-card border-2 border-brand-ink rounded-xl p-5 md:p-8 shadow-brutal">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-brand-pink animate-blink" />
                    <span className="mono text-[10px] uppercase tracking-widest text-muted-foreground">
                      Live Canvas
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <IconBtn
                      onClick={() => window.dispatchEvent(new Event("pixel:undo"))}
                      label="Undo (⌘Z)"
                    >
                      <Undo2 className="w-4 h-4" />
                    </IconBtn>
                    <IconBtn
                      onClick={() => window.dispatchEvent(new Event("pixel:redo"))}
                      label="Redo (⇧⌘Z)"
                    >
                      <Redo2 className="w-4 h-4" />
                    </IconBtn>
                    <IconBtn
                      onClick={() => {
                        window.dispatchEvent(new Event("pixel:clear"));
                        toast("Canvas cleared");
                      }}
                      label="Clear"
                    >
                      <Trash2 className="w-4 h-4" />
                    </IconBtn>
                  </div>
                </div>
                <PixelCanvas
                  size={size}
                  color={color}
                  tool={tool}
                  onColorUsed={trackColor}
                  registerHandle={(h) => (handleRef.current = h)}
                />
              </div>
            </section>

            {/* Right: Export & tips */}
            <aside className="lg:col-span-3 space-y-4 order-3">
              <Panel label="04 / Export" accent="pink">
                <Button
                  onClick={handleDownload}
                  className="w-full h-12 bg-brand-pink hover:bg-brand-pink/90 text-white font-display text-base border-2 border-brand-ink shadow-brutal-sm hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] transition-all"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download PNG
                </Button>
                <Button
                  onClick={handleCopy}
                  variant="outline"
                  className="w-full mt-2 h-10 border-2 border-brand-ink hover:bg-brand-cyan hover:text-brand-ink"
                >
                  Copy pixel data
                </Button>
                <p className="mono text-[10px] text-muted-foreground mt-3 leading-relaxed">
                  Output: <span className="text-brand-ink font-bold">{size * 16}×{size * 16}px</span>{" "}
                  PNG with transparent background.
                </p>
              </Panel>

              <Panel label="05 / Shortcuts">
                <ul className="space-y-2 text-sm">
                  <Shortcut keys={["C"]} label="Pencil" />
                  <Shortcut keys={["E"]} label="Eraser" />
                  <Shortcut keys={["⌘", "Z"]} label="Undo" />
                  <Shortcut keys={["⇧", "⌘", "Z"]} label="Redo" />
                </ul>
              </Panel>

              <Panel label="06 / Tips" accent="cyan">
                <ul className="space-y-3">
                  {TIPS.map((t, i) => (
                    <li key={i} className="flex gap-2 text-sm leading-snug">
                      <span className="mono text-xs text-brand-pink mt-0.5">{String(i + 1).padStart(2, "0")}</span>
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
              </Panel>
            </aside>
          </div>
        </main>

        {/* Inspiration */}
        <section id="inspiration" className="border-t-2 border-brand-ink bg-brand-soft">
          <div className="container py-16">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
              <div>
                <div className="mono text-xs uppercase tracking-widest text-brand-pink mb-2">
                  / 07 — Inspiration
                </div>
                <h2 className="font-display text-4xl md:text-6xl text-brand-ink leading-none">
                  Made by the<br />
                  <span className="text-brand-purple">community.</span>
                </h2>
              </div>
              <a
                href="https://www.awwwards.com/awwwards/colors/"
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-2 mono text-xs uppercase tracking-widest text-brand-ink hover:text-brand-pink transition-colors"
              >
                <Eye className="w-4 h-4" />
                Awwwards color references
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <InspirationGallery />
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t-2 border-brand-ink bg-brand-ink text-background">
          <div className="container py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="grid grid-cols-2 gap-0.5">
                <span className="w-2 h-2 bg-brand-pink" />
                <span className="w-2 h-2 bg-brand-cyan" />
                <span className="w-2 h-2 bg-brand-yellow" />
                <span className="w-2 h-2 bg-brand-purple" />
              </div>
              <span className="font-display text-lg">PIXEL/STUDIO</span>
            </div>
            <div className="flex items-center gap-2 mono text-[11px] uppercase tracking-widest opacity-70">
              <Keyboard className="w-3.5 h-3.5" />
              Press C / E / ⌘Z to fly
            </div>
            <div className="mono text-[11px] uppercase tracking-widest opacity-70">
              © {new Date().getFullYear()} — One pixel at a time
            </div>
          </div>
        </footer>
      </div>
    </TooltipProvider>
  );
};

/* ---------- Local UI primitives ---------- */

const Panel = ({
  label,
  children,
  accent,
}: {
  label: string;
  children: React.ReactNode;
  accent?: "pink" | "cyan";
}) => (
  <div
    className={`bg-card border-2 border-brand-ink rounded-xl p-4 shadow-brutal-sm relative ${
      accent === "pink" ? "before:absolute before:-top-1.5 before:left-4 before:right-4 before:h-1.5 before:bg-brand-pink before:rounded-t" : ""
    } ${
      accent === "cyan" ? "before:absolute before:-top-1.5 before:left-4 before:right-4 before:h-1.5 before:bg-brand-cyan before:rounded-t" : ""
    }`}
  >
    <div className="mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-3">
      {label}
    </div>
    {children}
  </div>
);

const ToolButton = ({
  active,
  onClick,
  label,
  hint,
  icon,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  hint: string;
  icon: React.ReactNode;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`group relative h-16 rounded-md border-2 border-brand-ink flex flex-col items-center justify-center gap-1 transition-all ${
      active
        ? "bg-brand-yellow shadow-brutal-sm -translate-y-0.5"
        : "bg-background hover:bg-brand-soft"
    }`}
  >
    {icon}
    <span className="text-xs font-semibold">{label}</span>
    <span className="absolute top-1 right-1.5 mono text-[9px] text-muted-foreground">{hint}</span>
  </button>
);

const IconBtn = ({
  children,
  onClick,
  label,
}: {
  children: React.ReactNode;
  onClick: () => void;
  label: string;
}) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <button
        type="button"
        onClick={onClick}
        className="w-9 h-9 rounded-md border-2 border-brand-ink bg-background hover:bg-brand-cyan transition-colors flex items-center justify-center"
        aria-label={label}
      >
        {children}
      </button>
    </TooltipTrigger>
    <TooltipContent side="bottom">{label}</TooltipContent>
  </Tooltip>
);

const Shortcut = ({ keys, label }: { keys: string[]; label: string }) => (
  <li className="flex items-center justify-between">
    <span className="text-sm">{label}</span>
    <span className="flex items-center gap-1">
      {keys.map((k) => (
        <kbd
          key={k}
          className="mono text-[10px] px-1.5 py-0.5 rounded border-2 border-brand-ink bg-brand-soft min-w-[20px] text-center"
        >
          {k}
        </kbd>
      ))}
    </span>
  </li>
);

export default Index;
