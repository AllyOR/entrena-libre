/** Small dependency-free SVG charts. Colours come from the theme's CSS variables. */

export function Ring({ value, label }: { value: number; label: string }) {
  const r = 34
  const c = 2 * Math.PI * r
  const clamped = Math.min(Math.max(value, 0), 1)
  return (
    <svg className="ring" viewBox="0 0 80 80" role="img" aria-label={label}>
      <circle cx="40" cy="40" r={r} className="ring-track" />
      <circle
        cx="40"
        cy="40"
        r={r}
        className="ring-value"
        strokeDasharray={`${c * clamped} ${c}`}
        transform="rotate(-90 40 40)"
      />
      <text x="40" y="45" textAnchor="middle" className="ring-text">
        {Math.round(clamped * 100)}%
      </text>
    </svg>
  )
}

export interface Bar {
  label: string
  value: number
  /** Shown above the bar; defaults to the value. */
  caption?: string
}

export function BarChart({ bars, label }: { bars: Bar[]; label: string }) {
  const max = Math.max(...bars.map((b) => b.value), 1)
  const w = 320
  const h = 150
  const slot = w / bars.length
  const barW = Math.min(slot * 0.56, 36)
  return (
    <svg className="chart" viewBox={`0 0 ${w} ${h}`} role="img" aria-label={label}>
      <line x1="0" y1={h - 22} x2={w} y2={h - 22} className="chart-axis" />
      {bars.map((b, i) => {
        const height = (b.value / max) * (h - 48)
        const x = i * slot + (slot - barW) / 2
        return (
          <g key={b.label}>
            <rect x={x} y={h - 22 - height} width={barW} height={Math.max(height, 1)} rx="3" className="chart-bar" />
            <text x={x + barW / 2} y={h - 28 - height} textAnchor="middle" className="chart-value">
              {b.caption ?? b.value}
            </text>
            <text x={x + barW / 2} y={h - 6} textAnchor="middle" className="chart-label">
              {b.label}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

export interface Point {
  label: string
  value: number
}

export function LineChart({ points, label, unit }: { points: Point[]; label: string; unit: string }) {
  const w = 320
  const h = 150
  const pad = { l: 8, r: 44, t: 16, b: 24 }
  const values = points.map((p) => p.value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  const x = (i: number) => pad.l + (points.length === 1 ? 0.5 : i / (points.length - 1)) * (w - pad.l - pad.r)
  const y = (v: number) => pad.t + (1 - (v - min) / span) * (h - pad.t - pad.b)
  const last = points[points.length - 1]
  return (
    <svg className="chart" viewBox={`0 0 ${w} ${h}`} role="img" aria-label={label}>
      <line x1={pad.l} y1={h - pad.b} x2={w - pad.r} y2={h - pad.b} className="chart-axis" />
      <polyline points={points.map((p, i) => `${x(i)},${y(p.value)}`).join(' ')} className="chart-line" />
      {points.map((p, i) => (
        <circle key={p.label} cx={x(i)} cy={y(p.value)} r="3" className="chart-dot">
          <title>{`${p.label}: ${p.value} ${unit}`}</title>
        </circle>
      ))}
      <text x={x(points.length - 1) + 7} y={y(last.value) + 4} className="chart-value">
        {last.value} {unit}
      </text>
      <text x={pad.l} y={h - 6} className="chart-label">
        {points[0].label}
      </text>
      {points.length > 1 && (
        <text x={w - pad.r} y={h - 6} textAnchor="end" className="chart-label">
          {last.label}
        </text>
      )}
    </svg>
  )
}
