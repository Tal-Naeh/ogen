import { useEffect, useRef, useState, type ReactNode } from "react";

export function useWidth<T extends HTMLElement>(): [React.RefObject<T | null>, number] {
  const ref = useRef<T>(null);
  const [w, setW] = useState(0);
  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([e]) => setW(Math.floor(e.contentRect.width)));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  return [ref, w];
}

/** Round tick values: 0, 1,000, 2,000 … */
export function niceTicks(max: number, count = 4): number[] {
  if (!(max > 0)) return [0, 1_000]; // empty data still gets a real scale
  const raw = max / count;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? raw;
  const ticks: number[] = [];
  for (let v = 0; v <= max + step * 0.001; v += step) ticks.push(v);
  if (ticks[ticks.length - 1] < max) ticks.push(ticks[ticks.length - 1] + step);
  return ticks;
}

export function LegendItem({ swatch, children }: { swatch: ReactNode; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[12.5px] text-ink-2">
      {swatch}
      {children}
    </span>
  );
}

export const LineKey = ({ color, dashed }: { color: string; dashed?: boolean }) => (
  <svg width="18" height="8" aria-hidden>
    <line x1="1" y1="4" x2="17" y2="4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeDasharray={dashed ? "3 3" : undefined} />
  </svg>
);

export const BoxKey = ({ color }: { color: string }) => (
  <span className="inline-block h-2.5 w-2.5 rounded-[3px]" style={{ background: color }} aria-hidden />
);

export function Tooltip({ x, y, width, children }: { x: number; y: number; width: number; children: ReactNode }) {
  // Keep inside the plot horizontally; flip side near edges.
  const W = 188;
  const left = Math.max(4, Math.min(x - W / 2, width - W - 4));
  return (
    <div
      className="pointer-events-none absolute z-10 rounded-2xl border border-line bg-surface px-3 py-2.5 text-[12.5px] shadow-card"
      style={{ left, top: Math.max(0, y), width: W }}
      role="status"
    >
      {children}
    </div>
  );
}
