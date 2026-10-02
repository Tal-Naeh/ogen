import { useState } from "react";
import type { BalanceOutlook } from "../../lib/finance";
import { ils, ilsCompact } from "../../lib/format";
import { LegendItem, LineKey, Tooltip, useWidth } from "./common";

const H = 300;
const PAD = { top: 26, bottom: 30, start: 56, end: 14 };
const monthShort = new Intl.DateTimeFormat("he-IL", { month: "short" });
const monthYear = new Intl.DateTimeFormat("he-IL", { month: "long", year: "numeric" });

/**
 * Month-end bank balance: reconstructed past (solid) and projected at the recent average
 * monthly flow (dashed). Time runs right→left (RTL). The zero line is the destination.
 */
export function BalancePath({ outlook }: { outlook: BalanceOutlook }) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const pts = outlook.points;
  const n = pts.length;
  const firstProjected = pts.findIndex((p) => p.projected);

  const vals = pts.map((p) => p.balance);
  const lo = Math.min(0, ...vals);
  const hi = Math.max(0, ...vals);
  const span = hi - lo || 1;
  const step = niceStep(span / 4);
  const yMin = Math.floor(lo / step) * step;
  const yMax = Math.ceil(hi / step) * step;
  const ticks: number[] = [];
  for (let v = yMin; v <= yMax + step / 2; v += step) ticks.push(v);

  const innerW = Math.max(0, width - PAD.start - PAD.end);
  const innerH = H - PAD.top - PAD.bottom;
  const x = (i: number) => width - PAD.start - (i / Math.max(1, n - 1)) * innerW;
  const y = (v: number) => PAD.top + ((yMax - v) / (yMax - yMin || 1)) * innerH;
  const line = (from: number, to: number) =>
    pts.slice(from, to + 1).map((p, k) => `${k === 0 ? "M" : "L"}${x(from + k).toFixed(1)},${y(p.balance).toFixed(1)}`).join("");

  const actualEnd = Math.max(0, firstProjected - 1);
  const clearIdx = outlook.clearsAt ? pts.findIndex((p) => p.month.getTime() === outlook.clearsAt!.getTime()) : -1;
  // Interpolate the exact zero crossing between the last negative point and the clearing month.
  const crossX = clearIdx > 0 ? (() => {
    const a = pts[clearIdx - 1].balance, b = pts[clearIdx].balance;
    const t = a === b ? 1 : (0 - a) / (b - a);
    return x(clearIdx - 1) + (x(clearIdx) - x(clearIdx - 1)) * t;
  })() : null;

  function onMove(e: React.PointerEvent<SVGSVGElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    const i = Math.round(((width - PAD.start - (e.clientX - r.left)) / innerW) * (n - 1));
    setHover(Math.max(0, Math.min(n - 1, i)));
  }

  // Thin out month labels on narrow screens.
  const every = width < 520 ? 3 : width < 760 ? 2 : 1;

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-x-4 gap-y-1.5">
        <LegendItem swatch={<LineKey color="var(--series-1)" />}>יתרה בסוף כל חודש</LegendItem>
        <LegendItem swatch={<LineKey color="var(--series-1)" dashed />}>תחזית בקצב הנוכחי</LegendItem>
      </div>
      <div ref={ref} className="relative w-full select-none" style={{ height: H }}>
        {width > 0 && (
          <svg
            width={width}
            height={H}
            style={{ direction: "ltr" }}
            onPointerMove={onMove}
            onPointerLeave={() => setHover(null)}
            role="img"
            aria-label={`יתרה עכשיו ${ils(outlook.current)}. ${outlook.clearsAt ? `בקצב הנוכחי יוצאים מהמינוס ב${monthYear.format(outlook.clearsAt)}` : ""}`}
            className="touch-pan-y"
          >
            {/* Overdraft zone: a faint wash below zero, so "out of the red" reads at a glance. */}
            <rect x={PAD.end} y={y(0)} width={innerW} height={Math.max(0, y(yMin) - y(0))} fill="var(--critical)" opacity={0.045} />
            {ticks.map((t) => (
              <g key={t}>
                <line x1={PAD.end} x2={width - PAD.start} y1={y(t)} y2={y(t)} stroke={t === 0 ? "var(--ink-2)" : "var(--grid)"} strokeWidth={1} opacity={t === 0 ? 0.5 : 1} />
                <text x={width - PAD.start + 8} y={y(t)} dy="0.32em" fontSize={11} fill={t === 0 ? "var(--ink-2)" : "var(--muted)"} fontWeight={t === 0 ? 600 : 400} className="tnum">
                  {t === 0 ? "₪0" : ilsCompact(t)}
                </text>
              </g>
            ))}

            {firstProjected > 0 && <path d={line(firstProjected - 1, n - 1)} fill="none" stroke="var(--series-1)" strokeWidth={2} strokeDasharray="4 5" strokeLinecap="round" />}
            <path d={line(0, actualEnd)} fill="none" stroke="var(--series-1)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
            {pts.slice(0, actualEnd + 1).map((p, i) => (
              <circle key={i} cx={x(i)} cy={y(p.balance)} r={4} fill="var(--series-1)" stroke="var(--surface)" strokeWidth={2} />
            ))}

            {crossX !== null && (
              <g>
                <circle cx={crossX} cy={y(0)} r={7} fill="var(--good)" stroke="var(--surface)" strokeWidth={2.5} />
                <path d={`M${crossX - 3},${y(0)} l2,2 l4,-4`} fill="none" stroke="#fff" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
                <text x={crossX} y={y(0) - 14} textAnchor="middle" fontSize={12} fontWeight={600} fill="var(--good-text)">
                  יוצאים מהמינוס · {monthShort.format(outlook.clearsAt!)}
                </text>
              </g>
            )}

            {pts.map((p, i) =>
              i % every === 0 || i === n - 1 ? (
                <text key={i} x={x(i)} y={H - 8} textAnchor="middle" fontSize={11} fill={i === firstProjected ? "var(--ink)" : "var(--muted)"} fontWeight={i === firstProjected ? 600 : 400}>
                  {monthShort.format(p.month)}
                  {i === 0 || i === n - 1 || p.month.getMonth() === 0 ? ` ${String(p.month.getFullYear()).slice(2)}` : ""}
                </text>
              ) : null,
            )}

            {hover !== null && (
              <g pointerEvents="none">
                <line x1={x(hover)} x2={x(hover)} y1={PAD.top} y2={PAD.top + innerH} stroke="var(--ink-2)" strokeWidth={1} opacity={0.35} />
                <circle cx={x(hover)} cy={y(pts[hover].balance)} r={5} fill="var(--series-1)" stroke="var(--surface)" strokeWidth={2} />
              </g>
            )}
          </svg>
        )}
        {hover !== null && width > 0 && (
          <Tooltip x={x(hover)} y={0} width={width}>
            <p className="font-semibold text-ink">סוף {monthYear.format(pts[hover].month)}</p>
            <p className="mt-0.5 text-ink-2">{pts[hover].projected ? "תחזית" : "יתרה משוערת לפי התזרים"}</p>
            <p className="money tnum mt-1.5 text-[15px] font-semibold text-ink">{ils(pts[hover].balance)}</p>
          </Tooltip>
        )}
      </div>
    </div>
  );
}

function niceStep(raw: number): number {
  const mag = Math.pow(10, Math.floor(Math.log10(Math.max(raw, 1))));
  return [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? raw;
}
