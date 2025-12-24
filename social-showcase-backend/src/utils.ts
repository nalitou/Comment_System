import crypto from 'node:crypto'

export function now() {
  return Date.now()
}

export function pairKey(a: string, b: string) {
  return [a, b].sort().join('_')
}

export function maskSensitive(text: string, words: string[]) {
  const hits: string[] = []
  let masked = text
  for (const w of words) {
    if (!w) continue
    if (masked.includes(w)) {
      hits.push(w)
      masked = masked.split(w).join('*'.repeat(w.length))
    }
  }
  return { hits, maskedText: masked, allowed: hits.length === 0 }
}

export function sha256(buf: Buffer | string) {
  return crypto.createHash('sha256').update(buf).digest('hex')
}
