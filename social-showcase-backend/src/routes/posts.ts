import { Router } from 'express'
import { nanoid } from 'nanoid'
import { z } from 'zod'
import { db } from '../db'
import { authRequired, type AuthedRequest } from '../middleware/auth'
import { maskSensitive, now } from '../utils'
import type { Post } from '../types'

export const postsRouter = Router()

function buildRatingSummaryMap(postIds: string[]) {
  const set = new Set(postIds)
  const map = new Map<string, { sum: number; count: number }>()
  for (const r of db.data!.ratings) {
    if (!set.has(r.postId)) continue
    const cur = map.get(r.postId) || { sum: 0, count: 0 }
    cur.sum += r.score
    cur.count += 1
    map.set(r.postId, cur)
  }
  const out = new Map<string, { avg: number; totalCount: number }>()
  for (const id of postIds) {
    const x = map.get(id)
    out.set(id, { avg: x && x.count ? x.sum / x.count : 0, totalCount: x?.count || 0 })
  }
  return out
}

function dayStart(t: number) {
  const d = new Date(t)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

function friendSet(meId: string) {
  const set = new Set<string>()
  for (const f of db.data!.friendships) {
    if (f.userA === meId) set.add(f.userB)
    if (f.userB === meId) set.add(f.userA)
  }
  return set
}

function canView(p: Post, meId: string, role: 'user' | 'super_user' | 'admin') {
  if (role === 'admin' || role === 'super_user') return true
  if (p.visibility === 'public') return true
  if (p.authorId === meId) return true
  if (p.visibility === 'private') return false
  const set = friendSet(meId)
  return set.has(p.authorId)
}

postsRouter.get('/tags', authRequired, async (_req, res) => {
  await db.read()
  const map = new Map<string, number>()
  for (const p of db.data!.posts) for (const t of p.tags) map.set(t, (map.get(t) || 0) + 1)
  const items = Array.from(map.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([tag, count]) => ({ tag, count }))
  return res.json(items)
})

postsRouter.get('/posts', authRequired, async (req: AuthedRequest, res) => {
  await db.read()
  const meId = req.auth!.userId
  const q = String(req.query.q || '').trim()
  const tag = String(req.query.tag || '').trim()
  const onlyMine = String(req.query.onlyMine || '') === 'true'
  const onlyFriendsFeed = String(req.query.onlyFriendsFeed || '') === 'true'
  const dateFrom = req.query.dateFrom ? Number(req.query.dateFrom) : undefined
  const dateTo = req.query.dateTo ? Number(req.query.dateTo) : undefined
  const page = Number(req.query.page || 1)
  const pageSize = Number(req.query.pageSize || 10)

  const fset = friendSet(meId)

  let posts = db.data!.posts.filter((p) => {
    if (onlyMine) return p.authorId === meId
    if (!canView(p, meId, req.auth!.role)) return false
    if (onlyFriendsFeed) return p.authorId === meId || fset.has(p.authorId)
    return true
  })

  if (q) posts = posts.filter((p) => (p.title || '').includes(q) || (p.text || '').includes(q) || p.tags.some((t) => t.includes(q)))
  if (tag) posts = posts.filter((p) => p.tags.includes(tag))

  if (dateFrom) {
    const from = dayStart(dateFrom)
    posts = posts.filter((p) => p.createdAt >= from)
  }
  if (dateTo) {
    const to = dayStart(dateTo) + 24 * 60 * 60 * 1000
    posts = posts.filter((p) => p.createdAt < to)
  }

  posts.sort((a, b) => b.createdAt - a.createdAt)
  const total = posts.length
  const items = posts.slice((page - 1) * pageSize, page * pageSize)

  const rs = buildRatingSummaryMap(items.map((x) => x.id))
  const itemsWith = items.map((p) => ({ ...p, ratingSummary: rs.get(p.id) }))
  return res.json({ items: itemsWith, total })
})

postsRouter.get('/posts/:id', authRequired, async (req: AuthedRequest, res) => {
  await db.read()
  const meId = req.auth!.userId
  const p = db.data!.posts.find((x) => x.id === req.params.id)
  if (!p) return res.status(404).json({ message: '内容不存在' })
  if (!canView(p, meId, req.auth!.role)) return res.status(403).json({ message: '无权限查看' })

  const rs = buildRatingSummaryMap([p.id]).get(p.id)
  return res.json({ ...p, ratingSummary: rs })
})

postsRouter.post('/posts', authRequired, async (req: AuthedRequest, res) => {
  const schema = z.object({
    title: z.string().optional(),
    text: z.string().optional(),
    tags: z.array(z.string()).optional(),
    visibility: z.enum(['public', 'friends', 'private'] as const),
    media: z
      .array(
        z.object({
          kind: z.enum(['image', 'video'] as const),
          fileId: z.string().optional(),
          url: z.string().optional(),
          coverUrl: z.string().optional(),
          durationSec: z.number().optional(),
        }),
      )
      .default([]),
  })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ message: '参数错误' })

  await db.read()

  const title = parsed.data.title?.trim() || undefined
  const text = parsed.data.text?.trim() || undefined
  const tags = (parsed.data.tags || []).map((x) => x.trim()).filter(Boolean)

  const check = maskSensitive([title || '', text || '', tags.join(' ')].join('\n').trim(), db.data!.sensitiveWords || [])
  if (!check.allowed) return res.status(400).json({ message: `命中敏感词：${check.hits.join('、')}` })

  const t = now()
  const p: Post = {
    id: nanoid(),
    authorId: req.auth!.userId,
    title,
    text,
    tags,
    visibility: parsed.data.visibility,
    media: parsed.data.media,
    createdAt: t,
    updatedAt: t,
  }
  db.data!.posts.push(p)
  await db.write()
  return res.json(p)
})

postsRouter.put('/posts/:id', authRequired, async (req: AuthedRequest, res) => {
  const schema = z
    .object({
      title: z.string().optional(),
      text: z.string().optional(),
      tags: z.array(z.string()).optional(),
      visibility: z.enum(['public', 'friends', 'private'] as const).optional(),
      media: z
        .array(
          z.object({
            kind: z.enum(['image', 'video'] as const),
            fileId: z.string().optional(),
            url: z.string().optional(),
            coverUrl: z.string().optional(),
            durationSec: z.number().optional(),
          }),
        )
        .optional(),
    })
    .strict()
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ message: '参数错误' })

  await db.read()
  const p = db.data!.posts.find((x) => x.id === req.params.id)
  if (!p) return res.status(404).json({ message: '内容不存在' })
  if (p.authorId !== req.auth!.userId) return res.status(403).json({ message: '无权限' })

  const nextTitle = parsed.data.title !== undefined ? parsed.data.title?.trim() || undefined : p.title
  const nextText = parsed.data.text !== undefined ? parsed.data.text?.trim() || undefined : p.text
  const nextTags = parsed.data.tags !== undefined ? parsed.data.tags.map((x) => x.trim()).filter(Boolean) : p.tags

  const check = maskSensitive([nextTitle || '', nextText || '', nextTags.join(' ')].join('\n').trim(), db.data!.sensitiveWords || [])
  if (!check.allowed) return res.status(400).json({ message: `命中敏感词：${check.hits.join('、')}` })

  if (parsed.data.title !== undefined) p.title = nextTitle
  if (parsed.data.text !== undefined) p.text = nextText
  if (parsed.data.tags !== undefined) p.tags = nextTags
  if (parsed.data.visibility !== undefined) p.visibility = parsed.data.visibility
  if (parsed.data.media !== undefined) p.media = parsed.data.media
  p.updatedAt = now()

  await db.write()
  return res.json(p)
})

postsRouter.delete('/posts/:id', authRequired, async (req: AuthedRequest, res) => {
  await db.read()
  const p = db.data!.posts.find((x) => x.id === req.params.id)
  if (!p) return res.status(404).json({ message: '内容不存在' })
  if (p.authorId !== req.auth!.userId) return res.status(403).json({ message: '无权限' })

  const id = req.params.id
  db.data!.posts = db.data!.posts.filter((x) => x.id !== id)
  db.data!.comments = db.data!.comments.filter((c) => c.postId !== id)
  db.data!.ratings = db.data!.ratings.filter((r) => r.postId !== id)
  await db.write()
  return res.json({ success: true })
})

// 兼容占位：/search 直接复用 posts 列表能力
postsRouter.get('/search', authRequired, async (req, res) => {
  req.url = '/posts'
  return postsRouter.handle(req, res)
})
