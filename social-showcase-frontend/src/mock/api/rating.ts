import { getDB } from '../db'
import type { Rating } from '../../types/models'
import { getAuthedUserOrThrow } from './common'


export async function upsertRating(postId: string, score: number) {
  const { user } = await getAuthedUserOrThrow()
  const db = await getDB()
  const id = `${postId}_${user.id}`
  const existing = await db.get('ratings', id)
  const now = Date.now()
  const rec: Rating = existing
    ? { ...existing, score, updatedAt: now }
    : { id, postId, userId: user.id, score, createdAt: now, updatedAt: now }
  await db.put('ratings', rec)
  return rec
}

export async function getRatingSummary(postId: string) {
  const db = await getDB()
  const all = await db.getAllFromIndex('ratings', 'by-post', postId)
  const totalCount = all.length
  const avg = totalCount ? all.reduce((s, r) => s + r.score, 0) / totalCount : 0
  const dist: Record<string, number> = {}
  for (const r of all) dist[String(r.score)] = (dist[String(r.score)] ?? 0) + 1
  return { avg, totalCount, dist }
}

export async function getMyRating(postId: string) {
  const { user } = await getAuthedUserOrThrow()
  const db = await getDB()
  return (await db.get('ratings', `${postId}_${user.id}`)) || null
}
