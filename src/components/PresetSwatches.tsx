interface PresetSwatchesProps {
  current: string;
  onPick: (color: string) => void;
}

export const PRESETS: { name: string; hex: string }[] = [
  { name: "Hot Pink", hex: "#FF1493" },
  { name: "Electric Cyan", hex: "#00FFFF" },
  { name: "Yellow", hex: "#FFFF00" },
  { name: "Gold", hex: "#FFD700" },
  { name: "Lime", hex: "#00FF00" },
  { name: "Purple", hex: "#8B00FF" },
  { name: "White", hex: "#FFFFFF" },
  { name: "Black", hex: "#000000" },
];

export const PresetSwatches = ({ current, onPick }: PresetSwatchesProps) => {
  const isActive = (hex: string) => hex.toLowerCase() === current.toLowerCase();
  return (
    <div className="grid grid-cols-4 gap-2">
      {PRESETS.map((p) => (
        <button
          key={p.hex}
          type="button"
          onClick={() => onPick(p.hex)}
          title={`${p.name} · ${p.hex}`}
          aria-label={p.name}
          className={`group relative aspect-square rounded-md border-2 transition-all duration-200 hover:scale-110 hover:-rotate-3 ${
            isActive(p.hex)
              ? "border-brand-ink shadow-brutal-sm scale-105"
              : "border-brand-ink/20 hover:border-brand-ink"
          }`}
          style={{ backgroundColor: p.hex }}
        >
          {isActive(p.hex) && (
            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-brand-ink ring-2 ring-background" />
          )}
        </button>
      ))}
    </div>
  );
};
