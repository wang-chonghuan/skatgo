import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'

// SkatZero's bidding tables (SKATGO-39): bidding/data/{values,outcome_distributions}_{D,G,DH,GH}.npy
// from github.com/Jimboom7/SkatZero 1fe5cab (MIT), committed under ../../skatzero/bidding/ and named
// with size and SHA-256 in the manifest. Read here as SimulatedDataBidder.load_data reads them: each
// distribution averaged over its simulated hands, then both ends padded with the extreme values so the
// interpolation always has a bracket.

export type GameKind = 'D' | 'G' | 'DH' | 'GH'
/** Rewards per outcome: own Schwarz, own Schneider, lost, won, Schneider, Schwarz. */
export const REWARDS: Record<GameKind, number[]> = {
  D: [-170, -150, -130, 70, 80, 90],
  DH: [-190, -170, -150, 80, 90, 100],
  G: [-282, -234, -186, 98, 122, 146],
  GH: [-330, -282, -234, 122, 146, 170],
}

export type BiddingTables = Record<GameKind, { values: Float64Array; dists: Float64Array[] }>

type Manifest = { bidding: { name: string; bytes: number; sha256: string }[] }

/** A .npy file (format 1.0/2.0, little-endian f4/f8, C order): its shape and values as float64. */
export function readNpy(bytes: Uint8Array): { shape: number[]; data: Float64Array } {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  if (String.fromCharCode(...bytes.subarray(1, 6)) !== 'NUMPY') throw new Error('npy_magic')
  const major = bytes[6]
  const headerLen = major === 1 ? view.getUint16(8, true) : view.getUint32(8, true)
  const start = major === 1 ? 10 : 12
  const header = new TextDecoder().decode(bytes.subarray(start, start + headerLen))
  const descr = /'descr':\s*'([^']+)'/.exec(header)?.[1]
  const fortran = /'fortran_order':\s*(True|False)/.exec(header)?.[1]
  const shape = (/'shape':\s*\(([^)]*)\)/.exec(header)?.[1] ?? '').split(',').map((x) => x.trim()).filter(Boolean).map(Number)
  if (fortran !== 'False' || (descr !== '<f4' && descr !== '<f8')) throw new Error(`npy_format ${descr} ${fortran}`)
  const n = shape.reduce((a, b) => a * b, 1)
  const width = descr === '<f4' ? 4 : 8
  const offset = start + headerLen
  if (bytes.length !== offset + n * width) throw new Error('npy_length')
  const data = new Float64Array(n)
  for (let i = 0; i < n; i++) data[i] = width === 4 ? view.getFloat32(offset + i * 4, true) : view.getFloat64(offset + i * 8, true)
  return { shape, data }
}

export async function loadBiddingTables(dir: URL): Promise<BiddingTables> {
  const manifest = JSON.parse(await readFile(new URL('manifest.json', dir), 'utf8')) as Manifest
  const file = async (name: string) => {
    const entry = manifest.bidding?.find((f) => f.name === name)
    if (!entry) throw new Error(`skatzero_table_missing ${name}`)
    const bytes = new Uint8Array(await readFile(new URL(`bidding/${name}`, dir)))
    if (bytes.length !== entry.bytes || createHash('sha256').update(bytes).digest('hex') !== entry.sha256) throw new Error(`skatzero_table_altered ${name}`)
    return readNpy(bytes)
  }
  const out = {} as BiddingTables
  for (const kind of ['D', 'G', 'DH', 'GH'] as GameKind[]) {
    const values = await file(`values_${kind}.npy`)
    const dists = await file(`outcome_distributions_${kind}.npy`)
    const [n, m, k] = dists.shape
    if (values.shape[0] !== n || k !== 6) throw new Error('skatzero_table_shape')
    // np.mean(dists, axis=1): a running sum over the hands, then one division — as numpy adds along a
    // non-contiguous axis.
    const mean: number[][] = []
    for (let i = 0; i < n; i++) {
      const row = new Array<number>(6).fill(0)
      for (let j = 0; j < m; j++) for (let o = 0; o < 6; o++) row[o] += dists.data[(i * m + j) * 6 + o]
      mean.push(row.map((x) => x / m))
    }
    const r = REWARDS[kind]
    const padded = [-1000, r[0] - 2, ...values.data, r[5] + 2, 1000]
    const rows = [[1, 0, 0, 0, 0, 0], [1, 0, 0, 0, 0, 0], ...mean, [0, 0, 0, 0, 0, 1], [0, 0, 0, 0, 0, 1]]
    out[kind] = {
      values: Float64Array.from(padded),
      dists: Array.from({ length: 6 }, (_, o) => Float64Array.from(rows.map((row) => row[o]))),
    }
  }
  return out
}

/** numpy.interp for one point: clamped at both ends; an exact knot returns its value. */
export function interp(x: number, xp: Float64Array, fp: Float64Array): number {
  const n = xp.length
  if (x < xp[0]) return fp[0]
  if (x > xp[n - 1]) return fp[n - 1]
  if (x === xp[n - 1]) return fp[n - 1]
  let lo = 0
  let hi = n - 1
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1
    if (xp[mid] <= x) lo = mid
    else hi = mid
  }
  if (xp[lo] === x) return fp[lo]
  const slope = (fp[lo + 1] - fp[lo]) / (xp[lo + 1] - xp[lo])
  return slope * (x - xp[lo]) + fp[lo]
}
