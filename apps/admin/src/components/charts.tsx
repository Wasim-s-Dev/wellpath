/** Hand-built SVG charts: no chart library, so the bundle stays small. */
import { useState } from 'react'

export function AreaChart({ data, height = 220, label }: { data: { x: string; y: number }[]; height?: number; label: string }) {
  const [hover, setHover] = useState<number | null>(null)
  const W = 640, H = height, pad = { l: 36, r: 12, t: 12, b: 26 }
  const max = Math.max(...data.map((d) => d.y), 1)
  const nice = Math.ceil(max / 4 / 10) * 10 * 4 || 4
  const X = (i: number) => pad.l + (i / Math.max(1, data.length - 1)) * (W - pad.l - pad.r)
  const Y = (v: number) => pad.t + (1 - v / nice) * (H - pad.t - pad.b)
  const line = data.map((d, i) => `${i ? 'L' : 'M'}${X(i)},${Y(d.y)}`).join('')
  const area = `${line}L${X(data.length - 1)},${Y(0)}L${X(0)},${Y(0)}Z`
  const ticks = [0, 1, 2, 3, 4].map((i) => (nice / 4) * i)
  const step = Math.ceil(data.length / 6)

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={label} onMouseLeave={() => setHover(null)}>
        <defs>
          <linearGradient id="area-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#4f46e5" stopOpacity="0.22" />
            <stop offset="1" stopColor="#4f46e5" stopOpacity="0" />
          </linearGradient>
        </defs>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.l} x2={W - pad.r} y1={Y(t)} y2={Y(t)} stroke="#ebebf0" />
            <text x={pad.l - 8} y={Y(t) + 4} textAnchor="end" fontSize="11" fill="#6b7280">{t}</text>
          </g>
        ))}
        {data.map((d, i) => i % step === 0 && <text key={d.x} x={X(i)} y={H - 6} textAnchor="middle" fontSize="11" fill="#6b7280">{d.x}</text>)}
        <path d={area} fill="url(#area-fill)" />
        <path d={line} fill="none" stroke="#4f46e5" strokeWidth="2.25" strokeLinejoin="round" pathLength={1} strokeDasharray="1" className="draw" style={{ ['--len' as string]: 1 }} />
        {data.map((_, i) => (
          <rect key={i} x={X(i) - (W / data.length) / 2} y={0} width={W / data.length} height={H} fill="transparent" onMouseEnter={() => setHover(i)} />
        ))}
        {hover !== null && (
          <g pointerEvents="none">
            <line x1={X(hover)} x2={X(hover)} y1={pad.t} y2={Y(0)} stroke="#c7d2fe" />
            <circle cx={X(hover)} cy={Y(data[hover].y)} r="4.5" fill="#fff" stroke="#4f46e5" strokeWidth="2" />
          </g>
        )}
      </svg>
      {hover !== null && (
        <div className="pointer-events-none absolute -translate-x-1/2 rounded-lg bg-heading px-2.5 py-1.5 text-xs text-white shadow-lg" style={{ left: `${(X(hover) / W) * 100}%`, top: 0 }}>
          {data[hover].x}: <b>{data[hover].y}</b>
        </div>
      )}
    </div>
  )
}

export function StackedBars({ rows, keys, colors, label }: { rows: ({ day: string } & Record<string, number | string>)[]; keys: string[]; colors: string[]; label: string }) {
  const totals = rows.map((r) => keys.reduce((a, k) => a + Number(r[k]), 0))
  const max = Math.max(...totals, 1)
  return (
    <div role="img" aria-label={label}>
      <div className="flex h-44 items-end gap-3">
        {rows.map((r, i) => (
          <div key={r.day} className="group relative flex h-full flex-1 flex-col justify-end">
            <div className="flex flex-col-reverse overflow-hidden rounded-md" style={{ height: `${(totals[i] / max) * 100}%` }}>
              {keys.map((k, ki) => <div key={k} style={{ height: `${(Number(r[k]) / totals[i]) * 100}%`, background: colors[ki] }} />)}
            </div>
            <span className="pointer-events-none absolute -top-7 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-heading px-2 py-1 text-[11px] text-white group-hover:block">{totals[i]} requests</span>
            <span className="mt-2 text-center text-[11px] text-muted">{r.day}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted">
        {keys.map((k, i) => <span key={k} className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: colors[i] }} />{k}</span>)}
      </div>
    </div>
  )
}

export function BarList({ items }: { items: { label: string; value: number }[] }) {
  const max = Math.max(...items.map((i) => i.value), 1)
  return (
    <ul className="space-y-3">
      {items.map((it) => (
        <li key={it.label}>
          <div className="flex justify-between text-sm"><span className="text-text">{it.label}</span><span className="font-semibold tabular-nums text-heading">{it.value}</span></div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-ink-3"><div className="h-full rounded-full bg-violet transition-[width] duration-700" style={{ width: `${(it.value / max) * 100}%` }} /></div>
        </li>
      ))}
    </ul>
  )
}
