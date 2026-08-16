const DEFAULT_WORDS = [
  "ZZERKOFF",
  "CHROME",
  "AFTERDARK",
  "UNISEX",
  "METAL",
  "ARCHIVE",
  "DROP 001",
];

export function Marquee({ text, words }: { text?: string; words?: string[] } = {}) {
  const parsed = text
    ? text
        .split(/[\/|•—]+/)
        .map((v) => v.trim())
        .filter(Boolean)
    : [];
  const source = words?.length ? words : parsed.length ? parsed : DEFAULT_WORDS;
  const line = [...source, ...source];

  return (
    <div className="relative overflow-hidden border-y border-border/60 py-5">
      <div className="flex w-max animate-marquee">
        {[0, 1].map((k) => (
          <div key={k} className="flex shrink-0">
            {line.map((w, i) => (
              <span
                key={`${k}-${i}`}
                className="flex items-center gap-8 whitespace-nowrap px-8 text-[11px] font-light uppercase tracking-[0.55em] text-muted-foreground"
              >
                {w}
                <span className="text-chrome/40">/</span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
