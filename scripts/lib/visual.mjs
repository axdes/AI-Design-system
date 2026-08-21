// Shared pixel plumbing for the two visual gates: `visual-check.mjs` (golden
// examples, one component at a time) and `screens-check.mjs` (whole app screens
// at three widths). Extracted rather than copied — a second copy of a PNG
// decoder is exactly what `npm run scout` exists to catch.
//
// Playwright writes 8-bit non-interlaced PNGs, either RGB or RGBA depending on
// whether the page turned out fully opaque, so both are handled and the output is
// normalised to RGBA before comparing. Decoding locally keeps the harness
// dependency-free apart from the browser itself.
import { createServer } from 'node:http'
import { existsSync, readFileSync } from 'node:fs'
import { extname, join } from 'node:path'
import { inflateSync } from 'node:zlib'

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.woff2': 'font/woff2', '.woff': 'font/woff', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.ico': 'image/x-icon' }

export function decodePng(buf) {
  if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error('not a PNG')
  let pos = 8
  let width = 0, height = 0, bitDepth = 0, colorType = 0
  const idat = []
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos)
    const type = buf.toString('ascii', pos + 4, pos + 8)
    const data = buf.subarray(pos + 8, pos + 8 + len)
    if (type === 'IHDR') {
      width = data.readUInt32BE(0)
      height = data.readUInt32BE(4)
      bitDepth = data[8]
      colorType = data[9]
      if (bitDepth !== 8 || (colorType !== 6 && colorType !== 2) || data[12] !== 0) {
        throw new Error(`unsupported PNG (depth ${bitDepth}, colour ${colorType}, interlace ${data[12]})`)
      }
    } else if (type === 'IDAT') idat.push(data)
    else if (type === 'IEND') break
    pos += 12 + len
  }
  const bpp = colorType === 6 ? 4 : 3
  const raw = inflateSync(Buffer.concat(idat))
  const stride = width * bpp
  const out = Buffer.alloc(height * stride)
  let src = 0
  for (let y = 0; y < height; y++) {
    const filter = raw[src++]
    const row = raw.subarray(src, src + stride)
    src += stride
    const cur = out.subarray(y * stride, (y + 1) * stride)
    const prev = y ? out.subarray((y - 1) * stride, y * stride) : Buffer.alloc(stride)
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? cur[x - bpp] : 0
      const b = prev[x]
      const c = x >= bpp ? prev[x - bpp] : 0
      const v = row[x]
      switch (filter) {
        case 0: cur[x] = v; break
        case 1: cur[x] = v + a; break
        case 2: cur[x] = v + b; break
        case 3: cur[x] = v + ((a + b) >> 1); break
        case 4: {
          const p = a + b - c
          const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c)
          cur[x] = v + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c)
          break
        }
        default: throw new Error(`unknown PNG filter ${filter}`)
      }
    }
  }
  if (bpp === 4) return { width, height, data: out }
  /* Normalise RGB to RGBA so the comparison never has to care which one the
   * browser happened to emit. */
  const rgba = Buffer.alloc(width * height * 4)
  for (let i = 0, j = 0; i < out.length; i += 3, j += 4) {
    rgba[j] = out[i]
    rgba[j + 1] = out[i + 1]
    rgba[j + 2] = out[i + 2]
    rgba[j + 3] = 255
  }
  return { width, height, data: rgba }
}


/** Fraction of pixels that differ, plus a mask of where. */
export function comparePng(a, b) {
  const A = decodePng(a)
  const B = decodePng(b)
  if (A.width !== B.width || A.height !== B.height) {
    return { ratio: 1, note: `size changed: ${B.width}x${B.height} -> ${A.width}x${A.height}` }
  }
  let differing = 0
  for (let i = 0; i < A.data.length; i += 4) {
    /* Perceptual enough for a gate: any channel off by more than a rounding
     * step counts. */
    if (
      Math.abs(A.data[i] - B.data[i]) > 2 ||
      Math.abs(A.data[i + 1] - B.data[i + 1]) > 2 ||
      Math.abs(A.data[i + 2] - B.data[i + 2]) > 2 ||
      Math.abs(A.data[i + 3] - B.data[i + 3]) > 2
    ) differing++
  }
  return { ratio: differing / (A.width * A.height), note: `${differing} px` }
}


/** A static file server over one directory, on a free port. */
export function serveDir(dir) {
  const server = createServer((req, res) => {
    const url = decodeURIComponent(req.url.split('?')[0])
    let file = join(dir, url)
    if (url.endsWith('/')) file = join(file, 'index.html')
    /* Any unknown path falls back to index.html: these are client-routed SPAs,
     * so /discovery/types is a route, not a file. */
    if (!existsSync(file) || !extname(file)) file = join(dir, 'index.html')
    if (!existsSync(file)) { res.writeHead(404); res.end('not found'); return }
    res.writeHead(200, { 'content-type': MIME[extname(file)] ?? 'application/octet-stream' })
    res.end(readFileSync(file))
  })
  return new Promise((resolve) =>
    server.listen(0, '127.0.0.1', () => resolve({ server, port: server.address().port })))
}

/* THE instant every screenshot is taken at.
 *
 * Components print time relative ("yesterday", "5 days ago"), so with a live
 * clock a committed baseline decays on its own: `Time` went red on 2026-08-16
 * because three days had passed since its picture was taken, and nothing about
 * the component had changed. screens-check froze its clock in August for exactly
 * this and visual-check did not, which is how the same bug existed twice.
 *
 * Far enough ahead of every fixture in the repository that relative labels are
 * stable, and fixed, so they stay stable. */
export const FROZEN_NOW = '2026-08-10T12:00:00Z'
