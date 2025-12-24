import { getDB } from '../db'

export async function getSensitiveWords() {
  const db = await getDB()
  const all = await db.getAll('sensitiveWords')
  return all.map((x) => x.word)
}

export async function checkText(text: string) {
  const words = await getSensitiveWords()
  const hits: string[] = []
  let masked = text
  for (const w of words) {
    if (!w) continue
    if (masked.includes(w)) {
      hits.push(w)
      masked = masked.split(w).join('*'.repeat(w.length))
    }
  }
  return {
    allowed: hits.length === 0,
    hits,
    maskedText: masked,
  }
}
