import { useMemo, useState } from "react";
import { addDays, type Cycle } from "../../lib/date";
import { fmtDate, ils, ilsCompact } from "../../lib/format";
import { LegendItem, LineKey, niceTicks, Tooltip, useWidth } from "./common";

interface Props {
  cycle: Cycle;
  current: number[]; // cumulative variable spend up to today
  previous: number[]; // previous cycle cumulative, full length
  projectedEnd: number;
  budget: number;
}

const H = 260;
const PAD = { top: 16, bottom: 30, start: 52, end: 12 }; // start = right side in RTL (y axis)

/**
 * Cumulative variable spending through the cycle. Time runs right→left (RTL),
 * the y-axis sits on the right. One axis, three series + a budget reference.
 */
export function ForecastChart({ cycle, current, previous, projectedEnd, budget }: Props) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const n = cycle.days;
  const today = current.length - 1;

  const yMax = Math.max(budget, projectedEnd, ...previous, ...current) * 1.06;
  const ticks = useMemo(() => niceTicks(yMax, 4), [yMax]);
  const top = ticks[ticks.length - 1];
  const innerW = Math.max(0, width - PAD.start - PAD.end);
  const innerH = H - PAD.top - PAD.bottom;

  const x = (i: number) => width - PAD.start - (i / (n - 1)) * innerW;
  const y = (v: number) => PAD.top + innerH - (v / top) * innerH;

  const path = (vals: number[], from = 0) => vals.map((v, i) => `${i === 0 ? "M" : "L"}${x(i + from).toFixed(1)},${y(v).toFixed(1)}`).join("");
  const area = current.length > 1 ? `${path(current)}L${x(today)},${y(0)}L${x(0)},${y(0)}Z` : "";
  const proj = `M${x(today)},${y(current[today] ?? 0)}L${x(n - 1)},${y(projectedEnd)}`;
  const prevVals = previous.slice(0, n);

  const xLabels = width < 480 ? [0, Math.round((n - 1) / 2), n - 1] : [0, Math.round((n - 1) / 3), Math.round(((n - 1) * 2) / 3), n - 1];

  function onMove(e: React.PointerEvent<SVGSVGElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - r.left;
    const i = Math.round(((width - PAD.start - px) / innerW) * (n - 1));
    setHover(Math.max(0, Math.min(n - 1, i)));
  }

  const h = hover;
  const projAt = (i: number) => (current[today] ?? 0) + ((projectedEnd - (current[today] ?? 0)) * (i - today)) / Math.max(1, n - 1 - today);

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-x-4 gap-y-1.5">
        <LegendItem swatch={<LineKey color="var(--series-1)" />}>המחזור הנוכחי</LegendItem>
        <LegendItem swatch={<LineKey color="var(--series-1)" dashed />}>תחזית</LegendItem>
        <LegendItem swatch={<LineKey color="var(--muted)" />}>המחזור הקודם</LegendItem>
      </div>
      <div ref={ref} className="relative w-full select-none" style={{ height: H }}>
        {width > 0 && (
          <svg
            width={width}
            height={H}
            onPointerMove={onMove}
            onPointerLeave={() => setHover(null)}
            role="img"
            aria-label={`הוצאות משתנות מצטברות: ${ils(current[today] ?? 0)} עד היום, תחזית ${ils(projectedEnd)} לסוף המחזור, תקציב ${ils(budget)}`}
            className="touch-pan-y"
            style={{ direction: "ltr" }}
          >
            {ticks.map((t) => (
              <g key={t}>
                <line x1={PAD.end} x2={width - PAD.start} y1={y(t)} y2={y(t)} stroke={t === 0 ? "var(--baseline)" : "var(--grid)"} strokeWidth={1} />
                <text x={width - PAD.start + 8} y={y(t)} dy="0.32em" textAnchor="start" fontSize={11} fill="var(--muted)" className="tnum">
                  {ilsCompact(t)}
                </text>
              </g>
            ))}

            {/* Budget reference: a labelled hairline, not a series */}
            <line x1={PAD.end} x2={width - PAD.start} y1={y(budget)} y2={y(budget)} stroke="var(--ink-2)" strokeWidth={1} opacity={0.55} />
            <text x={PAD.end + 2} y={y(budget) - 6} fontSize={11.5} fontWeight={600} fill="var(--ink-2)" textAnchor="start">
              תקציב {ils(budget)}
            </text>

            <path d={path(prevVals)} fill="none" stroke="var(--muted)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" opacity={0.75} />
            {area && <path d={area} fill="var(--series-1)" opacity={0.1} />}
            <path d={proj} fill="none" stroke="var(--series-1)" strokeWidth={2} strokeDasharray="4 5" strokeLinecap="round" opacity={0.9} />
            <path d={path(current)} fill="none" stroke="var(--series-1)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

            {/* Today marker + end-of-cycle projection marker */}
            <circle cx={x(today)} cy={y(current[today] ?? 0)} r={5} fill="var(--series-1)" stroke="var(--surface)" strokeWidth={2} />
            <circle cx={x(n - 1)} cy={y(projectedEnd)} r={4.5} fill="var(--surface)" stroke="var(--series-1)" strokeWidth={2} />
            <text x={x(n - 1) + 2} y={y(projectedEnd) - 10} fontSize={11.5} fontWeight={600} fill="var(--ink)" textAnchor="start" className="tnum">
              {ilsCompact(projectedEnd)}
            </text>

            {xLabels.map((i) => (
              <text key={i} x={x(i)} y={H - 8} fontSize={11} fill="var(--muted)" textAnchor={i === 0 ? "end" : i === n - 1 ? "start" : "middle"}>
                {fmtDate(addDays(cycle.start, i))}
              </text>
            ))}

            {h !== null && (
              <g pointerEvents="none">
                <line x1={x(h)} x2={x(h)} y1={PAD.top} y2={PAD.top + innerH} stroke="var(--ink-2)" strokeWidth={1} opacity={0.4} />
                {h <= today && <circle cx={x(h)} cy={y(current[h])} r={4.5} fill="var(--series-1)" stroke="var(--surface)" strokeWidth={2} />}
                {prevVals[h] !== undefined && <circle cx={x(h)} cy={y(prevVals[h])} r={4} fill="var(--muted)" stroke="var(--surface)" strokeWidth={2} />}
              </g>
            )}
          </svg>
        )}
        {h !== null && width > 0 && (
          <Tooltip x={x(h)} y={4} width={width}>
            <p className="mb-1.5 font-semibold text-ink">{fmtDate(addDays(cycle.start, h))}</p>
            <Row color="var(--series-1)" dashed={h > today} label={h <= today ? "המחזור הנוכחי" : "תחזית"} value={h <= today ? current[h] : projAt(h)} />
            {prevVals[h] !== undefined && <Row color="var(--muted)" label="המחזור הקודם" value={prevVals[h]} />}
          </Tooltip>
        )}
      </div>
    </div>
  );
}

function Row({ color, label, value, dashed }: { color: string; label: string; value: number; dashed?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 py-0.5">
      <span className="inline-flex items-center gap-1.5 text-ink-2">
        <LineKey color={color} dashed={dashed} />
        {label}
      </span>
      <span className="money tnum font-semibold text-ink">{ils(value)}</span>
    </div>
  );
}
