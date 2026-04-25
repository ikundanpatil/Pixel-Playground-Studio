import { useRef, useState } from "react";
import { ImagePlus, Loader2, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { PRESETS } from "@/components/PresetSwatches";

interface ImageToPixelsProps {
  size: number;
  onResult: (pixels: string[]) => void;
}

const toHex = (n: number) => n.toString(16).padStart(2, "0");
const rgbToHex = (r: number, g: number, b: number) => `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();

const hexToRgb = (hex: string): [number, number, number] => {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
};

const PALETTE_RGB = PRESETS.map((p) => ({ hex: p.hex.toUpperCase(), rgb: hexToRgb(p.hex) }));

const nearestPaletteColor = (r: number, g: number, b: number): string => {
  let best = PALETTE_RGB[0].hex;
  let bestD = Infinity;
  for (const { hex, rgb } of PALETTE_RGB) {
    const dr = r - rgb[0];
    const dg = g - rgb[1];
    const db = b - rgb[2];
    const d = dr * dr + dg * dg + db * db;
    if (d < bestD) {
      bestD = d;
      best = hex;
    }
  }
  return best;
};

const processImage = (
  file: File,
  size: number,
  options: { snap: boolean; alphaCutoff: number },
): Promise<string[]> =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      try {
        // Cover-crop the source square so the result is square.
        const src = document.createElement("canvas");
        const sctx = src.getContext("2d")!;
        const side = Math.min(img.width, img.height);
        src.width = side;
        src.height = side;
        sctx.drawImage(
          img,
          (img.width - side) / 2,
          (img.height - side) / 2,
          side,
          side,
          0,
          0,
          side,
          side,
        );

        // Downsample with bilinear (browser's smoothing) to size×size for averaging,
        // then read pixels.
        const small = document.createElement("canvas");
        small.width = size;
        small.height = size;
        const sm = small.getContext("2d")!;
        sm.imageSmoothingEnabled = true;
        sm.imageSmoothingQuality = "high";
        sm.drawImage(src, 0, 0, size, size);

        const data = sm.getImageData(0, 0, size, size).data;
        const pixels: string[] = new Array(size * size).fill("");
        for (let i = 0; i < size * size; i++) {
          const r = data[i * 4];
          const g = data[i * 4 + 1];
          const b = data[i * 4 + 2];
          const a = data[i * 4 + 3];
          if (a < options.alphaCutoff) {
            pixels[i] = "";
            continue;
          }
          pixels[i] = options.snap ? nearestPaletteColor(r, g, b) : rgbToHex(r, g, b);
        }
        URL.revokeObjectURL(url);
        resolve(pixels);
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not load image"));
    };
    img.src = url;
  });

export const ImageToPixels = ({ size, onResult }: ImageToPixelsProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [snap, setSnap] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleFiles = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Not an image", { description: "Pick a JPG, PNG, GIF or WebP." });
      return;
    }
    setBusy(true);
    try {
      const pixels = await processImage(file, size, { snap, alphaCutoff: 32 });
      onResult(pixels);
      toast.success("Image converted", {
        description: `Sampled to ${size}×${size}${snap ? " · palette-snapped" : ""}`,
      });
    } catch (err) {
      toast.error("Conversion failed", {
        description: err instanceof Error ? err.message : "Try a different image.",
      });
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className="w-full h-12 flex items-center justify-center gap-2 rounded-md border-2 border-dashed border-brand-ink hover:border-solid hover:bg-brand-yellow transition-colors disabled:opacity-60 disabled:cursor-wait font-semibold text-sm"
      >
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
        {busy ? "Converting..." : "Upload image"}
      </button>

      <label className="flex items-center justify-between gap-2 text-sm cursor-pointer select-none">
        <span className="flex items-center gap-2">
          <Wand2 className="w-3.5 h-3.5 text-brand-pink" />
          Snap to Awwwards palette
        </span>
        <span
          className={`relative inline-flex h-5 w-9 items-center rounded-full border-2 border-brand-ink transition-colors ${
            snap ? "bg-brand-pink" : "bg-background"
          }`}
          role="switch"
          aria-checked={snap}
          onClick={(e) => {
            e.preventDefault();
            setSnap((v) => !v);
          }}
        >
          <span
            className={`inline-block h-3 w-3 transform rounded-full bg-brand-ink transition-transform ${
              snap ? "translate-x-4" : "translate-x-0.5"
            }`}
          />
        </span>
        <input
          type="checkbox"
          className="sr-only"
          checked={snap}
          onChange={(e) => setSnap(e.target.checked)}
        />
      </label>

      <p className="mono text-[10px] text-muted-foreground leading-relaxed">
        Center-cropped to a square, downsampled to{" "}
        <span className="text-brand-ink font-bold">{size}×{size}</span>. Transparent areas are kept.
      </p>
    </div>
  );
};
