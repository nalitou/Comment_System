import { Router } from 'express'
import { z } from 'zod'
import { db } from '../db'
import { authRequired, type AuthedRequest } from '../middleware/auth'
import { now } from '../utils'
import type { Rating } from '../types'

export const ratingRouter = Router()

ratingRouter.post('/posts/:postId/rating', authRequired, async (req: AuthedRequest, res) => {
  const schema = z.object({ score: z.number().min(1).max(5) })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ message: '参数错误' })

  await db.read()
  const postId = req.params.postId
  const userId = req.auth!.userId
  const id = `${postId}_${userId}`
  const existing = db.data!.ratings.find((r) => r.id === id)
  const t = now()
  const rec: Rating = existing
    ? { ...existing, score: parsed.data.score, updatedAt: t }
    : { id, postId, userId, score: parsed.data.score, createdAt: t, updatedAt: t }

  db.data!.ratings = db.data!.ratings.filter((r) => r.id !== id)
  db.data!.ratings.push(rec)
  await db.write()
  return res.json(rec)
})

ratingRouter.get('/posts/:postId/rating', authRequired, async (req: AuthedRequest, res) => {
  await db.read()
  const id = `${req.params.postId}_${req.auth!.userId}`
  const r = db.data!.ratings.find((x) => x.id === id) || null
  return res.json(r)
})

ratingRouter.get('/posts/:postId/rating/summary', authRequired, async (req, res) => {
  await db.read()
  const postId = req.params.postId
  const all = db.data!.ratings.filter((r) => r.postId === postId)
  const totalCount = all.length
  const avg = totalCount ? all.reduce((s, r) => s + r.score, 0) / totalCount : 0
  const dist: Record<string, number> = {}
  for (const r of all) dist[String(r.score)] = (dist[String(r.score)] ?? 0) + 1
  return res.json({ avg, totalCount, dist })
})
