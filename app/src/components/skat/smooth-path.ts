// The home card's smooth line (SKATGO-136), since SKATGO-182 the record of play's curve.

/** A smooth line through the days' points (SKATGO-136, the human: 「我希望平缓的」): a monotone cubic (Fritsch–Carlson), so
 *  between two days it never rises above or falls below them, and every day's point is on it. */
export function smoothPath(points: { x: number; y: number }[]): string {
  const n = points.length
  const d = points.slice(1).map((p, i) => (p.y - points[i].y) / (p.x - points[i].x))
  const m = points.map((_, i) => (i === 0 ? d[0] : i === n - 1 ? d[n - 2] : d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2))
  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) {
      m[i] = 0
      m[i + 1] = 0
      continue
    }
    const a = m[i] / d[i]
    const b = m[i + 1] / d[i]
    const r = a * a + b * b
    if (r > 9) {
      m[i] = (3 / Math.sqrt(r)) * a * d[i]
      m[i + 1] = (3 / Math.sqrt(r)) * b * d[i]
    }
  }
  return points.reduce((path, p, i) => {
    if (i === 0) return `M${p.x},${p.y}`
    const q = points[i - 1]
    const h = (p.x - q.x) / 3
    return `${path} C${q.x + h},${q.y + m[i - 1] * h} ${p.x - h},${p.y - m[i] * h} ${p.x},${p.y}`
  }, '')
}
