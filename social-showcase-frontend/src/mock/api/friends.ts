import { nanoid } from 'nanoid'
import { getDB } from '../db'
import type { FriendRequest, Friendship, User } from '../../types/models'
import { getAuthedUserOrThrow, pairKey } from './common'

export async function searchUsers(q: string) {
  const { user } = await getAuthedUserOrThrow()
  const db = await getDB()
  const all = (await db.getAll('users')).filter((u) => !u.deleted && u.id !== user.id)
  const key = q.trim()
  const items = key ? all.filter((u) => u.phone.includes(key) || u.nickname.includes(key) || u.id.includes(key)) : all
  items.sort((a, b) => b.createdAt - a.createdAt)
  return items.slice(0, 50)
}

async function getFriendSet(db: Awaited<ReturnType<typeof getDB>>, meId: string) {
  const fs = await db.getAll('friendships')
  const set = new Set<string>()
  for (const f of fs) {
    if (f.userA === meId) set.add(f.userB)
    if (f.userB === meId) set.add(f.userA)
  }
  return set
}

export async function listFriends() {
  const { user } = await getAuthedUserOrThrow()
  const db = await getDB()
  const set = await getFriendSet(db, user.id)
  const users = await db.getAll('users')
  return users.filter((u) => set.has(u.id) && !u.deleted)
}

export async function sendFriendRequest(toUserId: string) {
  const { user } = await getAuthedUserOrThrow()
  if (toUserId === user.id) throw new Error('不能添加自己')
  const db = await getDB()

  const set = await getFriendSet(db, user.id)
  if (set.has(toUserId)) throw new Error('已经是好友')

  const all = await db.getAll('friendRequests')
  const exists = all.find(
    (r) =>
      (r.fromUserId === user.id && r.toUserId === toUserId && r.status === 'pending') ||
      (r.fromUserId === toUserId && r.toUserId === user.id && r.status === 'pending'),
  )
  if (exists) throw new Error('已有待处理申请')

  const now = Date.now()
  const req: FriendRequest = {
    id: nanoid(),
    fromUserId: user.id,
    toUserId,
    status: 'pending',
    createdAt: now,
    updatedAt: now,
  }
  await db.put('friendRequests', req)
  return req
}

export async function listFriendRequests() {
  const { user } = await getAuthedUserOrThrow()
  const db = await getDB()
  const all = await db.getAllFromIndex('friendRequests', 'by-to', user.id)
  return all.sort((a, b) => b.createdAt - a.createdAt)
}

export async function acceptFriendRequest(id: string) {
  const { user } = await getAuthedUserOrThrow()
  const db = await getDB()
  const req = await db.get('friendRequests', id)
  if (!req) throw new Error('申请不存在')
  if (req.toUserId !== user.id) throw new Error('无权限')
  if (req.status !== 'pending') throw new Error('状态已变化')

  req.status = 'accepted'
  req.updatedAt = Date.now()
  await db.put('friendRequests', req)

  const now = Date.now()
  const f: Friendship = {
    id: pairKey(req.fromUserId, req.toUserId),
    userA: req.fromUserId,
    userB: req.toUserId,
    createdAt: now,
  }
  await db.put('friendships', f)
  return { success: true }
}

export async function rejectFriendRequest(id: string) {
  const { user } = await getAuthedUserOrThrow()
  const db = await getDB()
  const req = await db.get('friendRequests', id)
  if (!req) throw new Error('申请不存在')
  if (req.toUserId !== user.id) throw new Error('无权限')
  if (req.status !== 'pending') throw new Error('状态已变化')
  req.status = 'rejected'
  req.updatedAt = Date.now()
  await db.put('friendRequests', req)
  return { success: true }
}

export async function removeFriend(friendUserId: string) {
  const { user } = await getAuthedUserOrThrow()
  const db = await getDB()
  const key = pairKey(user.id, friendUserId)
  await db.delete('friendships', key)
  return { success: true }
}

export async function getUserById(id: string) {
  const db = await getDB()
  const u = (await db.get('users', id)) as User | undefined
  return u && !u.deleted ? u : null
}
