import { getDB } from '../db'
import { ADMIN_USER } from '../../config/seedAccounts'
import { issueToken, getAuthedUserOrThrow } from './common'

export async function adminLogin(payload: { username: string; password: string }) {
  const { username, password } = payload
  if (username !== ADMIN_USER.username || password !== ADMIN_USER.password) throw new Error('账号或密码错误')
  const db = await getDB()
  const admin = (await db.getAllFromIndex('users', 'by-role', 'admin'))[0]
  if (!admin) throw new Error('未初始化管理员')
  const tk = await issueToken(admin)
  return { token: tk.token, admin }
}

function assertAdmin(role: string | null | undefined) {
  if (role !== 'admin') throw new Error('需要管理员权限')
}

export async function adminListUsers(query: { q?: string; page: number; pageSize: number }) {
  const { role } = await getAuthedUserOrThrow()
  assertAdmin(role)
  const db = await getDB()
  let all = (await db.getAll('users')).filter((u) => !u.deleted)
  if (query.q) {
    const q = query.q.trim()
    all = all.filter((u) => u.phone.includes(q) || u.nickname.includes(q) || u.id.includes(q))
  }
  all.sort((a, b) => b.createdAt - a.createdAt)
  const total = all.length
  const start = (query.page - 1) * query.pageSize
  const items = all.slice(start, start + query.pageSize)
  return { items, total }
}

export async function adminDeleteUser(userId: string) {
  const { role } = await getAuthedUserOrThrow()
  assertAdmin(role)
  const db = await getDB()
  const user = await db.get('users', userId)
  if (!user) throw new Error('用户不存在')
  user.deleted = true
  await db.put('users', user)
  return { success: true }
}

export async function adminListPosts(query: { q?: string; tag?: string; page: number; pageSize: number }) {
  const { role } = await getAuthedUserOrThrow()
  assertAdmin(role)
  const db = await getDB()
  let all = await db.getAll('posts')
  if (query.q) {
    const q = query.q.trim()
    all = all.filter((p) => (p.title || '').includes(q) || (p.text || '').includes(q) || p.id.includes(q))
  }
  if (query.tag) all = all.filter((p) => p.tags.includes(query.tag!))
  all.sort((a, b) => b.createdAt - a.createdAt)
  const total = all.length
  const start = (query.page - 1) * query.pageSize
  const items = all.slice(start, start + query.pageSize)
  return { items, total }
}

export async function adminDeletePost(postId: string) {
  const { role } = await getAuthedUserOrThrow()
  assertAdmin(role)
  const db = await getDB()
  await db.delete('posts', postId)
  // 级联删除评论/评分（简单实现）
  const comments = await db.getAllFromIndex('comments', 'by-post', postId)
  for (const c of comments) await db.delete('comments', c.id)
  const ratings = await db.getAllFromIndex('ratings', 'by-post', postId)
  for (const r of ratings) await db.delete('ratings', r.id)
  return { success: true }
}

export async function adminStats() {
  const { role } = await getAuthedUserOrThrow()
  assertAdmin(role)
  const db = await getDB()
  const posts = await db.getAll('posts')

  const dayKey = (t: number) => {
    const d = new Date(t)
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${dd}`
  }

  const trendMap = new Map<string, number>()
  const typeRatio = { text: 0, image: 0, video: 0, mixed: 0 }
  const tagMap = new Map<string, number>()

  for (const p of posts) {
    trendMap.set(dayKey(p.createdAt), (trendMap.get(dayKey(p.createdAt)) ?? 0) + 1)
    const hasImg = p.media.some((m) => m.kind === 'image')
    const hasVid = p.media.some((m) => m.kind === 'video')
    if (!hasImg && !hasVid) typeRatio.text++
    else if (hasImg && !hasVid) typeRatio.image++
    else if (!hasImg && hasVid) typeRatio.video++
    else typeRatio.mixed++
    for (const t of p.tags) tagMap.set(t, (tagMap.get(t) ?? 0) + 1)
  }

  const trend = Array.from(trendMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, count]) => ({ date, count }))

  const topTags = Array.from(tagMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([tag, count]) => ({ tag, count }))

  return { trend, typeRatio, topTags }
}
