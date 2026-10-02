import { useState } from "react";
import type { HistoryPoint } from "../../lib/finance";
import { fmtMonth, ils, ilsCompact } from "../../lib/format";
import { BoxKey, LegendItem, niceTicks, Tooltip, useWidth } from "./common";

const H = 250;
const PAD = { top: 22, bottom: 50, start: 48, end: 8 };
const BAR = 20;
const GAP = 2; // surface gap between the paired bars

/** Income vs expenses per cycle. Oldest on the right (RTL). Current cycle = partial. */
export function CashflowBars({ data }: { data: HistoryPoint[] }) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(...data.flatMap((d) => [d.income, d.expenses + d.savings]));
  const ticks = niceTicks(max * 1.05, 4);
  const top = ticks[ticks.length - 1];
  const innerW = Math.max(0, width - PAD.start - PAD.end);
  const innerH = H - PAD.top - PAD.bottom;
  const band = innerW / data.length;
  const cx = (i: number) => width - PAD.start - band * (i + 0.5);
  const y = (v: number) => PAD.top + innerH - (v / top) * innerH;
  const last = data.length - 1;

  const bar = (xLeft: number, v: number, fill: string, opacity = 1) => {
    const h = Math.max(0, y(0) - y(v));
    const r = Math.min(4, h);
    const x0 = xLeft, x1 = xLeft + BAR, yt = y(v), yb = y(0);
    // 4px rounded data-end, square at the baseline
    const d = `M${x0},${yb}L${x0},${yt + r}Q${x0},${yt} ${x0 + r},${yt}L${x1 - r},${yt}Q${x1},${yt} ${x1},${yt + r}L${x1},${yb}Z`;
    return <path d={d} fill={fill} opacity={opacity} />;
  };

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-x-4 gap-y-1.5">
        <LegendItem swatch={<BoxKey color="var(--series-1)" />}>נכנס</LegendItem>
        <LegendItem swatch={<BoxKey color="var(--series-2)" />}>יצא</LegendItem>
      </div>
      <div ref={ref} className="relative w-full select-none" style={{ height: H }}>
        {width > 0 && (
          <svg width={width} height={H} style={{ direction: "ltr" }} role="img" aria-label="נכנס מול יצא בששת החודשים האחרונים" onPointerLeave={() => setHover(null)}>
            {ticks.map((t) => (
              <g key={t}>
                <line x1={PAD.end} x2={width - PAD.start} y1={y(t)} y2={y(t)} stroke={t === 0 ? "var(--baseline)" : "var(--grid)"} />
                <text x={width - PAD.start + 8} y={y(t)} dy="0.32em" fontSize={11} fill="var(--muted)" className="tnum">
                  {ilsCompact(t)}
                </text>
              </g>
            ))}
            {data.map((d, i) => {
              const partial = i === last;
              const c = cx(i);
              // RTL pair: income on the right, expenses on the left
              const xInc = c + GAP / 2;
              const xExp = c - GAP / 2 - BAR;
              return (
                <g key={i} onPointerEnter={() => setHover(i)}>
                  <rect x={c - band / 2} y={PAD.top} width={band} height={innerH} fill={hover === i ? "var(--surface-2)" : "transparent"} rx={10} />
                  {bar(xInc, d.income, "var(--series-1)", partial ? 0.45 : 1)}
                  {bar(xExp, d.expenses + d.savings, "var(--series-2)", partial ? 0.45 : 1)}
                  <text x={c} y={H - 28} textAnchor="middle" fontSize={11.5} fill={partial ? "var(--ink)" : "var(--muted)"} fontWeight={partial ? 600 : 400}>
                    {fmtMonth(d.cycle.start)}
                  </text>
                  {!partial && (
                    <text x={c} y={H - 9} textAnchor="middle" fontSize={12} fontWeight={600} fill={d.net >= 0 ? "var(--good-text)" : "var(--critical-text)"} className="tnum">
                      {d.net >= 0 ? "+" : "−"}
                      {ilsCompact(Math.abs(d.net))}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        )}
        {hover !== null && width > 0 && (
          <Tooltip x={cx(hover)} y={0} width={width}>
            <p className="mb-1.5 font-semibold text-ink">
              {fmtMonth(data[hover].cycle.start)}
              {hover === last && <span className="font-normal text-muted"> · עד היום</span>}
            </p>
            {[
              ["נכנס", data[hover].income, "var(--series-1)"],
              ["יצא", data[hover].expenses + data[hover].savings, "var(--series-2)"],
            ].map(([l, v, c]) => (
              <div key={l as string} className="flex items-center justify-between py-0.5">
                <span className="inline-flex items-center gap-1.5 text-ink-2">
                  <BoxKey color={c as string} />
                  {l}
                </span>
                <span className="money tnum font-semibold text-ink">{ils(v as number)}</span>
              </div>
            ))}
            <div className="mt-1.5 flex justify-between border-t border-line pt-1.5">
              <span className="text-ink-2">תזרים</span>
              <span className="money tnum font-semibold text-ink">{ils(data[hover].net, { sign: true })}</span>
            </div>
          </Tooltip>
        )}
      </div>
    </div>
  );
}
