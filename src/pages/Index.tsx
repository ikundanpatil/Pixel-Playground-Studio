import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Download,
  Eraser,
  ExternalLink,
  Eye,
  Grid3x3,
  Keyboard,
  PaintBucket,
  Pencil,
  Pipette,
  Redo2,
  Save,
  Sparkles,
  Trash2,
  Undo2,
  ZoomIn,
  ZoomOut,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { PixelCanvas, type PixelCanvasHandle, type Tool } from "@/components/PixelCanvas";
import { PRESETS, PresetSwatches } from "@/components/PresetSwatches";
import { InspirationGallery } from "@/components/InspirationGallery";
import {
  type SavedSketch,
  SketchGallery,
  buildThumb,
  loadSketches,
  saveSketches,
} from "@/components/SketchGallery";
import { ImageToPixels } from "@/components/ImageToPixels";
import { MusicPlayer } from "@/components/MusicPlayer";

const TIPS = [
  "Start low-res. Magic happens at 16×16.",
  "Limit your palette to 4–6 colors for cohesion.",
  "Use anti-aliasing pixels at edges for soft curves.",
  "Outline with a darker shade of your fill color, not pure black.",
];

const ZOOM_STEPS = [0.5, 0.75, 1, 1.25, 1.5, 2];

const Index = () => {
  const [size, setSize] = useState(16);
  const [color, setColor] = useState("#FF1493");
  const [tool, setTool] = useState<Tool>("pencil");
  const [zoom, setZoom] = useState(1);
  const [showGrid, setShowGrid] = useState(true);
  const [recent, setRecent] = useState<string[]>(["#FF1493"]);
  const [galleryKey, setGalleryKey] = useState(0);
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

  const onEyedropPicked = (c: string) => {
    setColor(c);
    setTool("pencil");
    trackColor(c);
    toast.success("Color sampled", { description: c.toUpperCase() });
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;
      const k = e.key.toLowerCase();
      if (k === "c") setTool("pencil");
      if (k === "e") setTool("eraser");
      if (k === "f") setTool("fill");
      if (k === "i") setTool("eyedropper");
      if (k === "g") setShowGrid((v) => !v);
      if (k === "+" || (e.shiftKey && k === "=")) bumpZoom(1);
      if (k === "-") bumpZoom(-1);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const bumpZoom = (dir: 1 | -1) => {
    setZoom((z) => {
      const idx = ZOOM_STEPS.indexOf(z);
      const nextIdx = Math.max(0, Math.min(ZOOM_STEPS.length - 1, idx + dir));
      return ZOOM_STEPS[nextIdx];
    });
  };

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

  const handleSave = () => {
    const snap = handleRef.current?.getSnapshot();
    if (!snap) return;
    const hasArt = snap.pixels.some(Boolean);
    if (!hasArt) {
      toast("Canvas is empty", { description: "Draw something first." });
      return;
    }
    const sketch: SavedSketch = {
      id: crypto.randomUUID(),
      name: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      size: snap.size,
      pixels: snap.pixels,
      thumb: buildThumb(snap.size, snap.pixels),
      createdAt: Date.now(),
    };
    const next = [sketch, ...loadSketches()].slice(0, 24);
    saveSketches(next);
    setGalleryKey((k) => k + 1);
    toast.success("Sketch saved", { description: `Stored locally · ${snap.size}×${snap.size}` });
  };

  const handleLoad = (sketch: SavedSketch) => {
    handleRef.current?.loadSnapshot({ size: sketch.size, pixels: sketch.pixels });
    if (sketch.size !== size) setSize(sketch.size);
    toast.success("Sketch loaded", { description: `${sketch.size}×${sketch.size}` });
  };

  const handleImagePixels = (pixels: string[]) => {
    handleRef.current?.loadSnapshot({ size, pixels });
  };

  return (
    <TooltipProvider delayDuration={150}>
      <div className="min-h-screen bg-paper text-zine-ink font-geist relative overflow-x-hidden">
        {/* Texture layer */}
        <div className="fixed inset-0 noise-overlay pointer-events-none z-50" aria-hidden />

        {/* Sticky Pill Nav */}
        <nav className="fixed top-4 md:top-6 left-1/2 -translate-x-1/2 z-[60] px-1.5 py-1.5 bg-zine-ink text-paper rounded-full flex items-center gap-2 md:gap-4 shadow-2xl border border-white/10 max-w-[95vw]">
          <div className="flex items-center gap-3 md:gap-5 px-3 md:px-4">
            <span className="font-serif-display italic font-bold text-xl tracking-tighter">PX.</span>
            <div className="hidden sm:block h-4 w-px bg-paper/20" />
            <a href="#studio" className="hidden sm:inline text-[10px] md:text-xs font-medium uppercase tracking-widest hover:text-white/70 transition-colors">Studio</a>
            <a href="#grid" className="hidden md:inline text-xs font-medium uppercase tracking-widest hover:text-white/70 transition-colors">Tools</a>
            <a href="#inspiration" className="text-[10px] md:text-xs font-medium uppercase tracking-widest hover:text-white/70 transition-colors">Archive</a>
          </div>
          <div className="hidden md:block">
            <MusicPlayer />
          </div>
          <a
            href="#studio"
            className="holo-sticker text-zine-ink px-4 md:px-5 py-2 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-widest border border-white/40 hover:scale-105 transition-transform"
          >
            Open App
          </a>
        </nav>

        {/* Hero */}
        <header className="pt-32 md:pt-40 pb-16 px-6 max-w-7xl mx-auto">
          <div className="flex flex-col items-center text-center space-y-7">
            <div className="holo-sticker px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] border border-white/60">
              V.04 Pixel Assembly Engine
            </div>
            <h1 className="font-serif-display text-6xl sm:text-8xl md:text-9xl font-light tracking-tight text-balance leading-[0.9] italic">
              Modern Craft{" "}
              <span className="font-geist not-italic font-black block tracking-tighter">Lo-Fi Spirit.</span>
            </h1>
            <p className="max-w-[55ch] text-base md:text-xl font-medium leading-relaxed text-zine-ink/80">
              The rhythmic pixel-art workshop designed for the high-end editorial era.
              Precise, modular, and unyieldingly raw — ship a PNG in seconds.
            </p>
            <div className="flex flex-wrap justify-center gap-3 pt-2">
              <a
                href="#studio"
                className="px-7 md:px-8 py-3.5 md:py-4 bg-zine-ink text-paper text-xs md:text-sm font-bold uppercase tracking-widest hover:translate-x-1 hover:-translate-y-1 transition-transform border border-zine-ink"
              >
                Start Assembling
              </a>
              <a
                href="#inspiration"
                className="px-7 md:px-8 py-3.5 md:py-4 bg-transparent border border-zine-ink text-xs md:text-sm font-bold uppercase tracking-widest hover:bg-zine-ink hover:text-paper transition-all"
              >
                View Showreel
              </a>
            </div>
          </div>
        </header>

        {/* Marquee strip */}
        <div className="border-y border-zine-ink/10 bg-paper-deep overflow-hidden py-4">
          <div className="flex whitespace-nowrap animate-marquee-fast">
            {Array.from({ length: 2 }).map((_, k) => (
              <div key={k} className="flex items-center gap-10 pr-10">
                {[
                  "Sub-pixel rendering",
                  "Linear workflow",
                  "Zero latency",
                  "Perfect geometry",
                  "Open source spirit",
                  "Editorial grid",
                ].map((t, i) => (
                  <span key={`${k}-${i}`} className="flex items-center gap-10">
                    <span className="font-serif-display italic text-3xl md:text-5xl font-light tracking-tight">{t}</span>
                    <span className="font-geist text-3xl md:text-5xl font-light text-zine-ink/30">/</span>
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Bento Feature Grid */}
        <section id="grid" className="px-6 py-20 md:py-32 max-w-7xl mx-auto">
          <div className="grid grid-cols-12 gap-0 border-t border-l border-zine-ink">
            {/* Block 1: Global grid */}
            <div className="col-span-12 md:col-span-8 p-8 md:p-12 border-r border-b border-zine-ink flex flex-col justify-between min-h-[420px] relative overflow-hidden">
              <div className="relative z-10 max-w-md">
                <span className="text-[10px] font-black uppercase tracking-widest mb-4 block">[ 01 ] Global Grid System</span>
                <h2 className="font-serif-display text-4xl md:text-5xl italic leading-tight">
                  Infinite scaling, zero friction.
                </h2>
              </div>
              <p className="relative z-10 max-w-xs text-sm font-medium mt-8">
                Every pixel aligned to a rhythmic 8pt grid. Consistency is not an accident; it's an assembly.
              </p>
              <div className="absolute top-0 right-0 w-1/2 h-full bg-zine-ink/5 border-l border-zine-ink hidden md:block">
                <div className="w-full h-full bg-grid-pattern opacity-60" />
              </div>
            </div>

            {/* Block 2: Pro palette */}
            <div className="col-span-12 md:col-span-4 p-8 md:p-12 border-r border-b border-zine-ink flex flex-col justify-center bg-paper-deep">
              <div className="holo-sticker size-20 md:size-24 rounded-2xl mb-6 flex items-center justify-center rotate-3 border-2 border-white">
                <div className="size-12 bg-zine-ink rounded-full flex items-center justify-center text-paper font-serif-display italic text-2xl">P</div>
              </div>
              <h3 className="text-xl md:text-2xl font-black tracking-tight mb-3 uppercase">Pro Palette Control</h3>
              <p className="text-sm leading-relaxed mb-5 text-zine-ink/70">
                Curated palette of hot pink, cyan, gold and ink for instantly cohesive output.
              </p>
              <div className="flex gap-1">
                <div className="size-7 bg-brand-pink border border-zine-ink" />
                <div className="size-7 bg-brand-cyan border border-zine-ink" />
                <div className="size-7 bg-brand-yellow border border-zine-ink" />
                <div className="size-7 bg-brand-purple border border-zine-ink" />
                <div className="size-7 bg-zine-ink border border-zine-ink" />
              </div>
            </div>

            {/* Block 3: Live preview */}
            <div className="col-span-12 md:col-span-4 p-8 md:p-10 border-r border-b border-zine-ink space-y-5">
              <div className="text-6xl md:text-7xl font-serif-display italic border-b border-zine-ink pb-4">60fps</div>
              <p className="text-[10px] uppercase font-bold tracking-[0.2em]">Live Preview Rendering</p>
              <p className="text-sm text-zine-ink/70">
                Watch your assembly come to life with hardware-accelerated rendering and real-time eyedrop sampling.
              </p>
            </div>

            {/* Block 4: Mini gallery */}
            <div className="col-span-12 md:col-span-8 p-0 border-r border-b border-zine-ink">
              <div className="grid grid-cols-2 md:grid-cols-4 h-full">
                {[
                  ["#FF1493", "#FFD700"],
                  ["#00FFFF", "#8B00FF"],
                  ["#FFFF00", "#FF1493"],
                  ["#36454F", "#00FFFF"],
                ].map(([a, b], i) => (
                  <div key={i} className="aspect-square border-r last:border-r-0 border-zine-ink overflow-hidden group relative">
                    <div
                      className="w-full h-full transition-transform duration-700 group-hover:scale-110"
                      style={{
                        background: `repeating-conic-gradient(${a} 0 25%, ${b} 0 50%) 0 0/24px 24px`,
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Stats row */}
            <div className="col-span-12 p-8 md:p-12 border-r border-b border-zine-ink flex flex-wrap items-center justify-between gap-8 bg-zine-ink text-paper">
              <div className="space-y-1">
                <div className="text-3xl md:text-4xl font-serif-display italic">12.4k</div>
                <div className="text-[10px] uppercase tracking-widest opacity-60">Active Workshops</div>
              </div>
              <div className="space-y-1">
                <div className="text-3xl md:text-4xl font-serif-display italic">1.2m</div>
                <div className="text-[10px] uppercase tracking-widest opacity-60">Pixels Rendered</div>
              </div>
              <div className="space-y-1">
                <div className="text-3xl md:text-4xl font-serif-display italic">99.9%</div>
                <div className="text-[10px] uppercase tracking-widest opacity-60">Uptime Accuracy</div>
              </div>
              <a
                href="#studio"
                className="px-6 md:px-8 py-3 holo-sticker text-zine-ink rounded-full text-[10px] md:text-xs font-black uppercase tracking-[0.2em]"
              >
                Join the collective
              </a>
            </div>
          </div>
        </section>

        {/* Studio (kept functional, restyled wrapper) */}
        <main id="studio" className="px-6 pb-20 md:pb-32 max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest mb-3 block">[ 02 ] The Workbench</span>
              <h2 className="font-serif-display text-5xl md:text-7xl italic leading-[0.9] max-w-2xl">
                Assemble pixel by pixel.
              </h2>
            </div>
            <p className="max-w-sm text-sm md:text-base text-zine-ink/70">
              A loud, opinionated editor. Pick a tool, pick a color, ship a PNG. No accounts, no plug-ins —
              just <span className="font-semibold text-zine-ink">vibes per pixel</span>.
            </p>
          </div>

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
                  <ToolButton
                    active={tool === "fill"}
                    onClick={() => setTool("fill")}
                    label="Fill"
                    hint="F"
                    icon={<PaintBucket className="w-4 h-4" />}
                  />
                  <ToolButton
                    active={tool === "eyedropper"}
                    onClick={() => setTool("eyedropper")}
                    label="Pick"
                    hint="I"
                    icon={<Pipette className="w-4 h-4" />}
                  />
                </div>
              </Panel>

              <Panel label="02 / Color">
                <div className="flex items-center gap-3 mb-3">
                  <label className="relative w-14 h-14 rounded-md border-2 border-zine-ink overflow-hidden cursor-pointer shadow-brutal-sm">
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
                    <div className="font-serif-display italic text-xl leading-none mt-1">
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
                          className="w-6 h-6 rounded border-2 border-zine-ink hover:scale-110 transition-transform"
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
                  <span className="font-serif-display italic text-3xl">
                    {size}<span className="text-brand-pink not-italic">×</span>{size}
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
                  <span>8</span><span>16</span><span>24</span><span>32</span>
                  <span>40</span><span>48</span><span>56</span><span>64</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowGrid((v) => !v)}
                  className={`mt-4 w-full flex items-center justify-between px-3 py-2 rounded-md border-2 border-zine-ink text-sm font-semibold transition-colors ${
                    showGrid ? "holo-sticker" : "bg-paper hover:bg-paper-deep"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Grid3x3 className="w-4 h-4" /> Grid lines
                  </span>
                  <span className="mono text-[10px]">{showGrid ? "ON · G" : "OFF · G"}</span>
                </button>
              </Panel>
            </aside>

            {/* Center: Canvas */}
            <section className="lg:col-span-6 order-1 lg:order-2">
              <div className="bg-card border-2 border-zine-ink rounded-xl p-5 md:p-8 shadow-brutal">
                <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-brand-pink animate-blink" />
                    <span className="mono text-[10px] uppercase tracking-widest text-muted-foreground">
                      Live Canvas
                    </span>
                  </div>
                  <div className="flex items-center gap-1 flex-wrap">
                    <IconBtn onClick={() => bumpZoom(-1)} label="Zoom out (-)">
                      <ZoomOut className="w-4 h-4" />
                    </IconBtn>
                    <IconBtn onClick={() => bumpZoom(1)} label="Zoom in (+)">
                      <ZoomIn className="w-4 h-4" />
                    </IconBtn>
                    <span className="w-px h-6 bg-border mx-1" />
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
                  zoom={zoom}
                  showGrid={showGrid}
                  onColorUsed={trackColor}
                  onPickColor={onEyedropPicked}
                  onSizeChange={setSize}
                  registerHandle={(h) => (handleRef.current = h)}
                />
              </div>
            </section>

            {/* Right */}
            <aside className="lg:col-span-3 space-y-4 order-3">
              <Panel label="04 / Export" accent="pink">
                <Button
                  onClick={handleDownload}
                  className="w-full h-12 bg-zine-ink hover:bg-zine-ink/90 text-paper font-bold uppercase tracking-widest text-sm border-2 border-zine-ink shadow-brutal-sm hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] transition-all"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download PNG
                </Button>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <Button
                    onClick={handleSave}
                    variant="outline"
                    className="h-10 border-2 border-zine-ink hover:bg-brand-lime hover:text-zine-ink"
                  >
                    <Save className="w-4 h-4 mr-1" /> Save
                  </Button>
                  <Button
                    onClick={handleCopy}
                    variant="outline"
                    className="h-10 border-2 border-zine-ink hover:bg-brand-cyan hover:text-zine-ink"
                  >
                    Copy data
                  </Button>
                </div>
                <p className="mono text-[10px] text-muted-foreground mt-3 leading-relaxed">
                  Output: <span className="text-zine-ink font-bold">{size * 16}×{size * 16}px</span>{" "}
                  PNG with transparent background.
                </p>
              </Panel>

              <Panel label="05 / Image → Pixels" accent="cyan">
                <ImageToPixels size={size} onResult={handleImagePixels} />
              </Panel>

              <Panel label="06 / My sketches">
                <SketchGallery onLoad={handleLoad} refreshKey={galleryKey} />
              </Panel>

              <Panel label="07 / Shortcuts">
                <ul className="space-y-2 text-sm">
                  <Shortcut keys={["C"]} label="Pencil" />
                  <Shortcut keys={["E"]} label="Eraser" />
                  <Shortcut keys={["F"]} label="Fill" />
                  <Shortcut keys={["I"]} label="Eyedropper" />
                  <Shortcut keys={["G"]} label="Toggle grid" />
                  <Shortcut keys={["+", "−"]} label="Zoom" />
                  <Shortcut keys={["⌘", "Z"]} label="Undo" />
                  <Shortcut keys={["⇧", "⌘", "Z"]} label="Redo" />
                </ul>
              </Panel>

              <Panel label="08 / Tips">
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
        <section id="inspiration" className="border-t border-zine-ink bg-paper-deep">
          <div className="max-w-7xl mx-auto px-6 py-20 md:py-28">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest mb-3 block">[ 03 ] Archive</span>
                <h2 className="font-serif-display text-5xl md:text-7xl italic leading-[0.9]">
                  Made by the<br />
                  <span className="not-italic font-geist font-black tracking-tighter">community.</span>
                </h2>
              </div>
              <a
                href="https://www.awwwards.com/awwwards/colors/"
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-2 mono text-xs uppercase tracking-widest text-zine-ink hover:text-brand-pink transition-colors"
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
        <footer className="px-6 py-20 md:py-24 bg-paper border-t border-zine-ink">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start gap-12">
              <div className="max-w-xs space-y-5">
                <div className="font-serif-display italic font-bold tracking-tighter text-3xl md:text-4xl">PXL.STUDIO</div>
                <p className="text-sm font-medium leading-relaxed text-zine-ink/70">
                  A rhythmic assembly environment for the modern creator. Built for precision, defined by spirit.
                </p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-10">
                <div className="space-y-3">
                  <h4 className="text-[10px] uppercase font-black tracking-widest">Assembly</h4>
                  <ul className="text-sm space-y-2 font-medium text-zine-ink/60">
                    <li className="hover:text-zine-ink cursor-pointer">Grid Engine</li>
                    <li className="hover:text-zine-ink cursor-pointer">Palette Tool</li>
                    <li className="hover:text-zine-ink cursor-pointer">Export Lab</li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <h4 className="text-[10px] uppercase font-black tracking-widest">Workshop</h4>
                  <ul className="text-sm space-y-2 font-medium text-zine-ink/60">
                    <li className="hover:text-zine-ink cursor-pointer">Journal</li>
                    <li className="hover:text-zine-ink cursor-pointer">Archive</li>
                    <li className="hover:text-zine-ink cursor-pointer">Community</li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <h4 className="text-[10px] uppercase font-black tracking-widest">Legal</h4>
                  <ul className="text-sm space-y-2 font-medium text-zine-ink/60">
                    <li className="hover:text-zine-ink cursor-pointer">Terms</li>
                    <li className="hover:text-zine-ink cursor-pointer">Privacy</li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="mt-16 pt-10 border-t border-zine-ink/10 flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="text-[10px] font-bold uppercase tracking-widest text-zine-ink/40">
                © {new Date().getFullYear()} PXL WORKSHOP — One pixel at a time
              </div>
              <div className="flex items-center gap-2 mono text-[10px] uppercase tracking-widest text-zine-ink/50">
                <Keyboard className="w-3.5 h-3.5" />
                C / E / F / I / G / ⌘Z
              </div>
              <div className="flex gap-3">
                <div className="size-4 rounded-full holo-sticker" />
                <div className="size-4 rounded-full bg-zine-ink" />
                <div className="size-4 rounded-full bg-zine-ink/20" />
              </div>
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
