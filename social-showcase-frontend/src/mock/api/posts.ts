import { nanoid } from 'nanoid'
import { getDB } from '../db'
import type { Post, Visibility } from '../../types/models'
import { getAuthedUserOrThrow, pairKey } from './common'

function dayStart(t: number) {
  const d = new Date(t)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

async function isFriend(db: Awaited<ReturnType<typeof getDB>>, meId: string, otherId: string) {
  const all = await db.getAll('friendships')
  const key = pairKey(meId, otherId)
  return all.some((f) => pairKey(f.userA, f.userB) === key)
}

export async function createPost(payload: {
  title?: string
  text?: string
  tags?: string[]
  visibility: Visibility
  media: { kind: 'image' | 'video'; fileId?: string; url?: string; coverUrl?: string; durationSec?: number }[]
}) {
  const { user } = await getAuthedUserOrThrow()
  const db = await getDB()
  const now = Date.now()
  const post: Post = {
    id: nanoid(),
    authorId: user.id,
    title: payload.title?.trim() || undefined,
    text: payload.text?.trim() || undefined,
    tags: (payload.tags ?? []).map((t) => t.trim()).filter(Boolean),
    visibility: payload.visibility,
    media: payload.media ?? [],
    createdAt: now,
    updatedAt: now,
  }
  await db.put('posts', post)
  return post
}

export async function updatePost(id: string, payload: Partial<Pick<Post, 'title' | 'text' | 'tags' | 'visibility' | 'media'>>) {
  const { user } = await getAuthedUserOrThrow()
  const db = await getDB()
  const post = await db.get('posts', id)
  if (!post) throw new Error('内容不存在')
  if (post.authorId !== user.id) throw new Error('无权限')
  const updated: Post = {
    ...post,
    title: payload.title !== undefined ? (payload.title?.trim() || undefined) : post.title,
    text: payload.text !== undefined ? (payload.text?.trim() || undefined) : post.text,
    tags: payload.tags !== undefined ? payload.tags.map((t) => t.trim()).filter(Boolean) : post.tags,
    visibility: payload.visibility ?? post.visibility,
    media: payload.media ?? post.media,
    updatedAt: Date.now(),
  }
  await db.put('posts', updated)
  return updated
}

export async function deletePost(id: string) {
  const { user } = await getAuthedUserOrThrow()
  const db = await getDB()
  const post = await db.get('posts', id)
  if (!post) throw new Error('内容不存在')
  if (post.authorId !== user.id) throw new Error('无权限')
  await db.delete('posts', id)
  const comments = await db.getAllFromIndex('comments', 'by-post', id)
  for (const c of comments) await db.delete('comments', c.id)
  const ratings = await db.getAllFromIndex('ratings', 'by-post', id)
  for (const r of ratings) await db.delete('ratings', r.id)
  return { success: true }
}

export async function getPostDetail(id: string) {
  const { user } = await getAuthedUserOrThrow()
  const db = await getDB()
  const post = await db.get('posts', id)
  if (!post) throw new Error('内容不存在')
  if (post.visibility === 'private' && post.authorId !== user.id) throw new Error('无权限查看')
  if (post.visibility === 'friends' && post.authorId !== user.id) {
    const ok = await isFriend(db, user.id, post.authorId)
    if (!ok) throw new Error('仅好友可见')
  }
  return post
}

export async function listPosts(query: {
  q?: string
  tag?: string
  dateFrom?: number
  dateTo?: number
  onlyMine?: boolean
  onlyFriendsFeed?: boolean
  page: number
  pageSize: number
}) {
  const { user } = await getAuthedUserOrThrow()
  const db = await getDB()
  let all = await db.getAll('posts')

  // 可见性过滤
  const friendSet = new Set<string>()
  if (all.length) {
    const fs = await db.getAll('friendships')
    for (const f of fs) {
      if (f.userA === user.id) friendSet.add(f.userB)
      if (f.userB === user.id) friendSet.add(f.userA)
    }
  }

  all = all.filter((p) => {
    if (query.onlyMine) return p.authorId === user.id
    if (p.visibility === 'public') return true
    if (p.visibility === 'private') return p.authorId === user.id
    // friends
    if (p.authorId === user.id) return true
    return friendSet.has(p.authorId)
  })

  if (query.onlyFriendsFeed) {
    all = all.filter((p) => p.authorId === user.id || friendSet.has(p.authorId))
  }

  if (query.q) {
    const q = query.q.trim()
    all = all.filter((p) => (p.title || '').includes(q) || (p.text || '').includes(q) || p.tags.some((t) => t.includes(q)))
  }
  if (query.tag) all = all.filter((p) => p.tags.includes(query.tag!))

  if (query.dateFrom) {
    const from = dayStart(query.dateFrom)
    all = all.filter((p) => p.createdAt >= from)
  }
  if (query.dateTo) {
    const to = dayStart(query.dateTo) + 24 * 60 * 60 * 1000
    all = all.filter((p) => p.createdAt < to)
  }

  all.sort((a, b) => b.createdAt - a.createdAt)
  const total = all.length
  const start = (query.page - 1) * query.pageSize
  const items = all.slice(start, start + query.pageSize)
  return { items, total }
}

export async function listTags() {
  const db = await getDB()
  const posts = await db.getAll('posts')
  const map = new Map<string, number>()
  for (const p of posts) for (const t of p.tags) map.set(t, (map.get(t) ?? 0) + 1)
  return Array.from(map.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([tag, count]) => ({ tag, count }))
}
