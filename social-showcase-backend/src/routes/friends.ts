import { Router } from 'express'
import { nanoid } from 'nanoid'
import { z } from 'zod'
import { db } from '../db'
import { authRequired, type AuthedRequest } from '../middleware/auth'
import { now, pairKey } from '../utils'
import type { FriendRequest, Friendship } from '../types'

export const friendsRouter = Router()

friendsRouter.post('/friends/request', authRequired, async (req: AuthedRequest, res) => {
  const schema = z.object({ toUserId: z.string().min(1) })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ message: '参数错误' })

  const meId = req.auth!.userId
  const toUserId = parsed.data.toUserId
  if (toUserId === meId) return res.status(400).json({ message: '不能添加自己' })

  await db.read()
  const existsFriend = db.data!.friendships.some((f) => pairKey(f.userA, f.userB) === pairKey(meId, toUserId))
  if (existsFriend) return res.status(400).json({ message: '已经是好友' })

  const pending = db.data!.friendRequests.find(
    (r) =>
      r.status === 'pending' &&
      ((r.fromUserId === meId && r.toUserId === toUserId) || (r.fromUserId === toUserId && r.toUserId === meId)),
  )
  if (pending) return res.status(400).json({ message: '已有待处理申请' })

  const t = now()
  const fr: FriendRequest = { id: nanoid(), fromUserId: meId, toUserId, status: 'pending', createdAt: t, updatedAt: t }
  db.data!.friendRequests.push(fr)
  await db.write()
  return res.json(fr)
})

friendsRouter.get('/friends/requests', authRequired, async (req: AuthedRequest, res) => {
  await db.read()
  const meId = req.auth!.userId
  const items = db.data!.friendRequests.filter((r) => r.toUserId === meId).sort((a, b) => b.createdAt - a.createdAt)
  return res.json(items)
})

friendsRouter.post('/friends/requests/:id/accept', authRequired, async (req: AuthedRequest, res) => {
  await db.read()
  const meId = req.auth!.userId
  const fr = db.data!.friendRequests.find((r) => r.id === req.params.id)
  if (!fr) return res.status(404).json({ message: '申请不存在' })
  if (fr.toUserId !== meId) return res.status(403).json({ message: '无权限' })
  if (fr.status !== 'pending') return res.status(400).json({ message: '状态已变化' })

  fr.status = 'accepted'
  fr.updatedAt = now()

  const f: Friendship = { id: pairKey(fr.fromUserId, fr.toUserId), userA: fr.fromUserId, userB: fr.toUserId, createdAt: now() }
  db.data!.friendships = db.data!.friendships.filter((x) => x.id !== f.id)
  db.data!.friendships.push(f)

  await db.write()
  return res.json({ success: true })
})

friendsRouter.post('/friends/requests/:id/reject', authRequired, async (req: AuthedRequest, res) => {
  await db.read()
  const meId = req.auth!.userId
  const fr = db.data!.friendRequests.find((r) => r.id === req.params.id)
  if (!fr) return res.status(404).json({ message: '申请不存在' })
  if (fr.toUserId !== meId) return res.status(403).json({ message: '无权限' })
  if (fr.status !== 'pending') return res.status(400).json({ message: '状态已变化' })
  fr.status = 'rejected'
  fr.updatedAt = now()
  await db.write()
  return res.json({ success: true })
})

friendsRouter.get('/friends', authRequired, async (req: AuthedRequest, res) => {
  await db.read()
  const meId = req.auth!.userId
  const set = new Set<string>()
  for (const f of db.data!.friendships) {
    if (f.userA === meId) set.add(f.userB)
    if (f.userB === meId) set.add(f.userA)
  }
  const users = db.data!.users.filter((u) => set.has(u.id) && !u.deleted)
  return res.json(users.map((u) => {
    const { passwordHash, ...rest } = u as any
    return rest
  }))
})

friendsRouter.delete('/friends/:friendUserId', authRequired, async (req: AuthedRequest, res) => {
  await db.read()
  const meId = req.auth!.userId
  const other = req.params.friendUserId
  const key = pairKey(meId, other)
  db.data!.friendships = db.data!.friendships.filter((f) => f.id !== key)
  await db.write()
  return res.json({ success: true })
})
