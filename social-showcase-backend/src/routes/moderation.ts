import { Router } from 'express'
import { z } from 'zod'
import { db } from '../db'
import { maskSensitive } from '../utils'

export const moderationRouter = Router()

moderationRouter.get('/moderation/sensitive-words', async (_req, res) => {
  await db.read()
  return res.json(db.data!.sensitiveWords || [])
})

moderationRouter.post('/moderation/text', async (req, res) => {
  const schema = z.object({ text: z.string().default('') })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ message: '参数错误' })

  await db.read()
  const words = db.data!.sensitiveWords || []
  const r = maskSensitive(parsed.data.text, words)
  return res.json({ allowed: r.allowed, hits: r.hits, maskedText: r.maskedText })
})
