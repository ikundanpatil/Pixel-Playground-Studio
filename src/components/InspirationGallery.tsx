interface InspirationGalleryProps {
  className?: string;
}

type Piece = {
  title: string;
  artist: string;
  size: number;
  palette: string[];
  pixels: string[]; // length size*size, "" = transparent
};

// Simple helper to build pixel grids quickly using a legend map.
const grid = (legend: Record<string, string>, rows: string[]): string[] => {
  return rows.flatMap((row) =>
    row.split("").map((c) => (c === "." ? "" : legend[c] ?? "")),
  );
};

const HEART = grid(
  { p: "#FF1493", g: "#FFD700", w: "#FFFFFF" },
  [
    ".pp..pp.",
    "pwppppwp",
    "pwwppwwp",
    "ppppppgp",
    "ppppppgp",
    ".pppppp.",
    "..pppp..",
    "...pp...",
  ],
);

const SPACE_INVADER = grid(
  { c: "#00FFFF", k: "#36454F" },
  [
    "..c....c..",
    "...c..c...",
    "..cccccc..",
    ".cc.cc.cc.",
    "cccccccccc",
    "c.cccccc.c",
    "c.c....c.c",
    "...cc.cc..",
    "..k....k..",
    ".k......k.",
  ],
);

const SUNSET = grid(
  { y: "#FFFF00", g: "#FFD700", p: "#FF1493", v: "#8B00FF", k: "#36454F" },
  [
    "vvvvvvvv",
    "vvvvpvvv",
    "vpppppvv",
    "ppppppgp",
    "ppgggggp",
    "gggyyyyg",
    "yyyyyyyy",
    "kkkkkkkk",
  ],
);

const MUSHROOM = grid(
  { p: "#FF1493", w: "#FFFFFF", k: "#36454F", b: "#FFD700" },
  [
    "..pppppp..",
    ".pwppppwp.",
    "pwwppppwwp",
    "pppppppppp",
    "pwppppppwp",
    "pwwppppwwp",
    ".pppppppp.",
    "...wwww...",
    "...wbbw...",
    "...wwww...",
  ],
);

const PIECES: Piece[] = [
  { title: "Lover", artist: "@neonbyte", size: 8, palette: ["#FF1493", "#FFD700", "#FFFFFF"], pixels: HEART },
  { title: "Invader 77", artist: "@arcade.lab", size: 10, palette: ["#00FFFF", "#36454F"], pixels: SPACE_INVADER },
  { title: "Dusk Tape", artist: "@solar.kid", size: 8, palette: ["#FFFF00", "#FFD700", "#FF1493", "#8B00FF"], pixels: SUNSET },
  { title: "1-UP", artist: "@pixelmono", size: 10, palette: ["#FF1493", "#FFD700", "#FFFFFF"], pixels: MUSHROOM },
];

const Mini = ({ piece }: { piece: Piece }) => (
  <div
    className="relative aspect-square w-full overflow-hidden rounded-md border-2 border-brand-ink bg-white"
    style={{
      display: "grid",
      gridTemplateColumns: `repeat(${piece.size}, 1fr)`,
      gridTemplateRows: `repeat(${piece.size}, 1fr)`,
    }}
  >
    {piece.pixels.map((c, i) => (
      <div key={i} style={{ backgroundColor: c || "transparent" }} />
    ))}
  </div>
);

export const InspirationGallery = ({ className }: InspirationGalleryProps) => {
  return (
    <section className={className}>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {PIECES.map((p) => (
          <figure
            key={p.title}
            className="group bg-card border-2 border-brand-ink rounded-lg p-3 shadow-brutal-sm hover:-translate-y-1 hover:shadow-brutal transition-all duration-200"
          >
            <Mini piece={p} />
            <figcaption className="mt-3 flex items-center justify-between">
              <div>
                <div className="font-display text-sm">{p.title}</div>
                <div className="mono text-[10px] text-muted-foreground">{p.artist}</div>
              </div>
              <div className="flex -space-x-1">
                {p.palette.slice(0, 4).map((c) => (
                  <span
                    key={c}
                    className="w-3 h-3 rounded-full border border-brand-ink"
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
};
