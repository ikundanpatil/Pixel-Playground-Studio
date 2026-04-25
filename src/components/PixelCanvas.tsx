import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type Tool = "pencil" | "eraser" | "fill" | "eyedropper";

export interface PixelCanvasHandle {
  exportPNG: (filename?: string) => void;
  copyData: () => Promise<void>;
  getSnapshot: () => { size: number; pixels: string[] };
  loadSnapshot: (snap: { size: number; pixels: string[] }) => void;
}

interface PixelCanvasProps {
  size: number;
  color: string;
  tool: Tool;
  zoom: number; // 0.5 - 2
  showGrid: boolean;
  onColorUsed?: (color: string) => void;
  onPickColor?: (color: string) => void;
  onSizeChange?: (n: number) => void;
  registerHandle?: (handle: PixelCanvasHandle) => void;
}

const TRANSPARENT = "";

export const PixelCanvas = ({
  size,
  color,
  tool,
  zoom,
  showGrid,
  onColorUsed,
  onPickColor,
  onSizeChange,
  registerHandle,
}: PixelCanvasProps) => {
  const makeEmpty = useCallback((n: number) => Array.from({ length: n * n }, () => TRANSPARENT), []);
  const [pixels, setPixels] = useState<string[]>(() => makeEmpty(size));
  const [history, setHistory] = useState<string[][]>([]);
  const [future, setFuture] = useState<string[][]>([]);
  const [hover, setHover] = useState<{ x: number; y: number } | null>(null);
  const drawingRef = useRef(false);
  const strokeStartRef = useRef<string[] | null>(null);

  // Reset on grid size change
  useEffect(() => {
    setPixels(makeEmpty(size));
    setHistory([]);
    setFuture([]);
  }, [size, makeEmpty]);

  const pushHistory = useCallback((snap: string[]) => {
    setHistory((h) => [...h.slice(-49), snap]);
    setFuture([]);
  }, []);

  const commitStroke = useCallback(() => {
    if (strokeStartRef.current) {
      pushHistory(strokeStartRef.current);
      strokeStartRef.current = null;
    }
  }, [pushHistory]);

  const paintAt = useCallback(
    (idx: number) => {
      setPixels((prev) => {
        const newColor = tool === "eraser" ? TRANSPARENT : color;
        if (prev[idx] === newColor) return prev;
        if (!strokeStartRef.current) strokeStartRef.current = prev.slice();
        const next = prev.slice();
        next[idx] = newColor;
        return next;
      });
      if (tool === "pencil") onColorUsed?.(color);
    },
    [color, tool, onColorUsed],
  );

  const floodFill = useCallback(
    (startIdx: number) => {
      setPixels((prev) => {
        const target = prev[startIdx];
        const replacement = color;
        if (target === replacement) return prev;
        const next = prev.slice();
        const stack = [startIdx];
        while (stack.length) {
          const i = stack.pop()!;
          if (next[i] !== target) continue;
          next[i] = replacement;
          const x = i % size;
          const y = Math.floor(i / size);
          if (x > 0) stack.push(i - 1);
          if (x < size - 1) stack.push(i + 1);
          if (y > 0) stack.push(i - size);
          if (y < size - 1) stack.push(i + size);
        }
        pushHistory(prev);
        onColorUsed?.(color);
        return next;
      });
    },
    [color, size, onColorUsed, pushHistory],
  );

  const handleClear = useCallback(() => {
    pushHistory(pixels.slice());
    setPixels(makeEmpty(size));
  }, [pixels, size, makeEmpty, pushHistory]);

  const handleUndo = useCallback(() => {
    setHistory((h) => {
      if (h.length === 0) return h;
      const prev = h[h.length - 1];
      setFuture((f) => [pixels.slice(), ...f]);
      setPixels(prev);
      return h.slice(0, -1);
    });
  }, [pixels]);

  const handleRedo = useCallback(() => {
    setFuture((f) => {
      if (f.length === 0) return f;
      const next = f[0];
      setHistory((h) => [...h, pixels.slice()]);
      setPixels(next);
      return f.slice(1);
    });
  }, [pixels]);

  const renderToCanvas = useCallback(
    (scale = 16) => {
      const canvas = document.createElement("canvas");
      canvas.width = size * scale;
      canvas.height = size * scale;
      const ctx = canvas.getContext("2d")!;
      ctx.imageSmoothingEnabled = false;
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const c = pixels[y * size + x];
          if (c) {
            ctx.fillStyle = c;
            ctx.fillRect(x * scale, y * scale, scale, scale);
          }
        }
      }
      return canvas;
    },
    [pixels, size],
  );

  // Register imperative handle
  useEffect(() => {
    if (!registerHandle) return;
    registerHandle({
      exportPNG: (filename) => {
        const canvas = renderToCanvas(16);
        const link = document.createElement("a");
        link.download = filename ?? `pixel-art-${size}x${size}-${Date.now()}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
      },
      copyData: async () => {
        await navigator.clipboard.writeText(JSON.stringify({ size, pixels }));
      },
      getSnapshot: () => ({ size, pixels: pixels.slice() }),
      loadSnapshot: (snap) => {
        if (snap.size !== size) {
          onSizeChange?.(snap.size);
          // Defer pixel set until next render after size change
          setTimeout(() => {
            setPixels(snap.pixels.slice());
            setHistory([]);
            setFuture([]);
          }, 0);
        } else {
          pushHistory(pixels.slice());
          setPixels(snap.pixels.slice());
        }
      },
    });
  }, [registerHandle, renderToCanvas, pixels, size, onSizeChange, pushHistory]);

  // Keyboard: undo/redo
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) handleRedo();
        else handleUndo();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleUndo, handleRedo]);

  // Window-level action bridge
  useEffect(() => {
    const undo = () => handleUndo();
    const redo = () => handleRedo();
    const clear = () => handleClear();
    window.addEventListener("pixel:undo", undo);
    window.addEventListener("pixel:redo", redo);
    window.addEventListener("pixel:clear", clear);
    return () => {
      window.removeEventListener("pixel:undo", undo);
      window.removeEventListener("pixel:redo", redo);
      window.removeEventListener("pixel:clear", clear);
    };
  }, [handleUndo, handleRedo, handleClear]);

  // Pointer interaction
  const handlePointerDown = (e: React.PointerEvent) => {
    const idx = idxFromEvent(e);
    if (idx == null) return;
    if (tool === "fill") {
      floodFill(idx);
      return;
    }
    if (tool === "eyedropper") {
      const c = pixels[idx];
      if (c) onPickColor?.(c);
      return;
    }
    drawingRef.current = true;
    (e.target as Element).setPointerCapture(e.pointerId);
    paintAt(idx);
  };
  const handlePointerMove = (e: React.PointerEvent) => {
    updateHover(e);
    if (drawingRef.current && (tool === "pencil" || tool === "eraser")) {
      const idx = idxFromEvent(e);
      if (idx != null) paintAt(idx);
    }
  };
  const handlePointerUp = () => {
    if (drawingRef.current) {
      drawingRef.current = false;
      commitStroke();
    }
  };

  const idxFromEvent = (e: React.PointerEvent): number | null => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = Math.floor(((e.clientX - rect.left) / rect.width) * size);
    const y = Math.floor(((e.clientY - rect.top) / rect.height) * size);
    if (x < 0 || y < 0 || x >= size || y >= size) return null;
    return y * size + x;
  };
  const updateHover = (e: React.PointerEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = Math.floor(((e.clientX - rect.left) / rect.width) * size);
    const y = Math.floor(((e.clientY - rect.top) / rect.height) * size);
    if (x >= 0 && y >= 0 && x < size && y < size) setHover({ x, y });
    else setHover(null);
  };

  const cellStyle = useMemo(
    () => ({
      gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))`,
      gridTemplateRows: `repeat(${size}, minmax(0, 1fr))`,
    }),
    [size],
  );

  const cursor =
    tool === "fill"
      ? "cell"
      : tool === "eyedropper"
      ? "copy"
      : "crosshair";

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      <div className="w-full overflow-auto flex justify-center">
        <div
          className="relative aspect-square border-2 border-brand-ink shadow-brutal bg-white overflow-hidden rounded-lg transition-[width] duration-200"
          style={{ width: `min(100%, ${640 * zoom}px)` }}
        >
          {/* Checkerboard background for transparency */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "linear-gradient(45deg, hsl(var(--soft)) 25%, transparent 25%), linear-gradient(-45deg, hsl(var(--soft)) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, hsl(var(--soft)) 75%), linear-gradient(-45deg, transparent 75%, hsl(var(--soft)) 75%)",
              backgroundSize: "16px 16px",
              backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0",
            }}
            aria-hidden
          />

          <div
            className="absolute inset-0 grid select-none touch-none"
            style={{ ...cellStyle, cursor }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={() => setHover(null)}
            role="img"
            aria-label={`Pixel canvas ${size} by ${size}`}
          >
            {pixels.map((c, i) => (
              <div
                key={i}
                style={{
                  backgroundColor: c || undefined,
                  boxShadow:
                    showGrid && size <= 48
                      ? "inset 0 0 0 1px hsl(var(--grid-line) / 0.6)"
                      : undefined,
                }}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 mono text-xs text-muted-foreground flex-wrap justify-center">
        <span>
          GRID <span className="text-brand-ink font-bold">{size}×{size}</span>
        </span>
        <span className="w-1 h-1 rounded-full bg-brand-gray" />
        <span>
          CURSOR{" "}
          <span className="text-brand-ink font-bold">
            {hover ? `${String(hover.x).padStart(2, "0")},${String(hover.y).padStart(2, "0")}` : "--,--"}
          </span>
        </span>
        <span className="w-1 h-1 rounded-full bg-brand-gray" />
        <span>
          PIXELS <span className="text-brand-ink font-bold">{pixels.filter(Boolean).length}</span>
        </span>
        <span className="w-1 h-1 rounded-full bg-brand-gray" />
        <span>
          ZOOM <span className="text-brand-ink font-bold">{Math.round(zoom * 100)}%</span>
        </span>
      </div>
    </div>
  );
};
