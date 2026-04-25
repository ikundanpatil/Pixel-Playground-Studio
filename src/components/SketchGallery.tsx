import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";

export interface SavedSketch {
  id: string;
  name: string;
  size: number;
  pixels: string[];
  thumb: string; // data URL
  createdAt: number;
}

const KEY = "pixel-studio:sketches";

export const loadSketches = (): SavedSketch[] => {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SavedSketch[];
  } catch {
    return [];
  }
};

export const saveSketches = (list: SavedSketch[]) => {
  localStorage.setItem(KEY, JSON.stringify(list));
};

export const buildThumb = (size: number, pixels: string[], scale = 4): string => {
  const canvas = document.createElement("canvas");
  canvas.width = size * scale;
  canvas.height = size * scale;
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingEnabled = false;
  // checker bg
  ctx.fillStyle = "#F5F5F5";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#FFFFFF";
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if ((x + y) % 2 === 0) ctx.fillRect(x * scale, y * scale, scale, scale);
    }
  }
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const c = pixels[y * size + x];
      if (c) {
        ctx.fillStyle = c;
        ctx.fillRect(x * scale, y * scale, scale, scale);
      }
    }
  }
  return canvas.toDataURL("image/png");
};

interface SketchGalleryProps {
  onLoad: (sketch: SavedSketch) => void;
  refreshKey: number;
}

export const SketchGallery = ({ onLoad, refreshKey }: SketchGalleryProps) => {
  const [items, setItems] = useState<SavedSketch[]>([]);

  useEffect(() => {
    setItems(loadSketches().sort((a, b) => b.createdAt - a.createdAt));
  }, [refreshKey]);

  const remove = (id: string) => {
    const next = items.filter((s) => s.id !== id);
    setItems(next);
    saveSketches(next);
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-8 px-4 border-2 border-dashed border-brand-ink/20 rounded-md bg-brand-soft/50">
        <div className="font-display text-sm mb-1">No sketches yet</div>
        <p className="mono text-[10px] text-muted-foreground uppercase tracking-widest">
          Hit save to stash your work
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-2">
      {items.map((s) => (
        <div key={s.id} className="group relative">
          <button
            type="button"
            onClick={() => onLoad(s)}
            className="block w-full aspect-square overflow-hidden rounded-md border-2 border-brand-ink hover:border-brand-pink hover:-translate-y-0.5 transition-all"
            title={`${s.name} · ${s.size}×${s.size}`}
          >
            <img
              src={s.thumb}
              alt={s.name}
              className="w-full h-full object-cover"
              style={{ imageRendering: "pixelated" }}
            />
          </button>
          <button
            type="button"
            onClick={() => remove(s.id)}
            className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-brand-ink text-background border-2 border-background flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label={`Delete ${s.name}`}
          >
            <Trash2 className="w-2.5 h-2.5" />
          </button>
          <div className="mono text-[9px] uppercase tracking-widest text-muted-foreground mt-1 truncate">
            {s.size}× · {s.name}
          </div>
        </div>
      ))}
    </div>
  );
};
