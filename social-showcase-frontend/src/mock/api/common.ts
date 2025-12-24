import { nanoid } from 'nanoid'
import { getDB } from '../db'
import type { Role, TokenRecord, User } from '../../types/models'
import { getStoredToken } from '../../store/authStore'

export function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

export async function getAuthedUserOrThrow(token?: string | null): Promise<{ token: string; user: User; role: Role }> {
  const tk = token ?? getStoredToken()
  if (!tk) throw new Error('未登录')
  const db = await getDB()
  const rec = await db.get('tokens', tk)
  if (!rec) throw new Error('登录已失效')
  const user = await db.get('users', rec.userId)
  if (!user || user.deleted) throw new Error('用户不存在')
  return { token: tk, user, role: rec.role }
}

export async function issueToken(user: User): Promise<TokenRecord> {
  const db = await getDB()
  const token = `mock_${nanoid(24)}`
  const rec: TokenRecord = { token, userId: user.id, role: user.role, createdAt: Date.now() }
  await db.put('tokens', rec)
  return rec
}

export function pairKey(a: string, b: string) {
  return [a, b].sort().join('_')
}
