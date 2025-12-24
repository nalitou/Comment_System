import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { nanoid } from 'nanoid'
import { z } from 'zod'
import { config } from '../config'
import { db } from '../db'
import { authRequired, signToken, type AuthedRequest } from '../middleware/auth'
import { now } from '../utils'
import type { Role, User } from '../types'

export const authRouter = Router()

authRouter.post('/auth/sms/send', async (req, res) => {
  const schema = z.object({ phone: z.string().min(3), scene: z.string().min(1) })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ message: '参数错误' })

  const { phone, scene } = parsed.data
  await db.read()
  const code = phone === config.superUser.phone ? config.superUser.smsCode : '000000'
  db.data!.smsCodes = db.data!.smsCodes.filter((x) => x.phone !== phone)
  db.data!.smsCodes.push({ phone, code, scene, createdAt: now() })
  await db.write()

  // 为了方便前端联调，这里返回 code；生产环境建议去掉。
  return res.json({ success: true, mockCode: code })
})

function verifyCode(phone: string, code: string) {
  const rec = db.data!.smsCodes.find((x) => x.phone === phone)
  if (!rec) throw new Error('请先获取验证码')
  if (rec.code !== code) throw new Error('验证码错误')
}

authRouter.post('/auth/register', async (req, res) => {
  const schema = z.object({ phone: z.string().min(3), code: z.string().min(1), password: z.string().optional(), nickname: z.string().optional() })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ message: '参数错误' })

  const { phone, code, password, nickname } = parsed.data
  await db.read()
  try {
    verifyCode(phone, code)
    const exists = db.data!.users.find((u) => u.phone === phone && !u.deleted)
    if (exists) return res.status(400).json({ message: '手机号已注册' })

    const role: Role = phone === config.superUser.phone ? 'super_user' : 'user'
    const user: User = {
      id: nanoid(),
      phone,
      nickname: nickname?.trim() || `用户${phone.slice(-4)}`,
      role,
      passwordHash: password ? bcrypt.hashSync(password, 10) : undefined,
      createdAt: now(),
    }
    db.data!.users.push(user)
    await db.write()

    const token = signToken({ userId: user.id, role: user.role })
    return res.json({ token, user: sanitizeUser(user), role: user.role })
  } catch (e: any) {
    return res.status(400).json({ message: e?.message || '注册失败' })
  }
})

authRouter.post('/auth/login/sms', async (req, res) => {
  const schema = z.object({ phone: z.string().min(3), code: z.string().min(1) })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ message: '参数错误' })

  const { phone, code } = parsed.data
  await db.read()
  try {
    verifyCode(phone, code)
    const user = db.data!.users.find((u) => u.phone === phone && !u.deleted)
    if (!user) return res.status(404).json({ message: '用户不存在' })
    const token = signToken({ userId: user.id, role: user.role })
    return res.json({ token, user: sanitizeUser(user), role: user.role })
  } catch (e: any) {
    return res.status(400).json({ message: e?.message || '登录失败' })
  }
})

authRouter.post('/auth/login/password', async (req, res) => {
  const schema = z.object({ phone: z.string().min(3), password: z.string().min(1) })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ message: '参数错误' })

  const { phone, password } = parsed.data
  await db.read()
  const user = db.data!.users.find((u) => u.phone === phone && !u.deleted)
  if (!user) return res.status(404).json({ message: '用户不存在' })
  if (!user.passwordHash) return res.status(400).json({ message: '该账号未设置密码，请使用验证码登录' })
  const ok = bcrypt.compareSync(password, user.passwordHash)
  if (!ok) return res.status(400).json({ message: '密码错误' })
  const token = signToken({ userId: user.id, role: user.role })
  return res.json({ token, user: sanitizeUser(user), role: user.role })
})

authRouter.post('/auth/password/reset', async (req, res) => {
  const schema = z.object({ phone: z.string().min(3), code: z.string().min(1), newPassword: z.string().min(6) })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ message: '参数错误' })

  const { phone, code, newPassword } = parsed.data
  await db.read()
  try {
    verifyCode(phone, code)
    const user = db.data!.users.find((u) => u.phone === phone && !u.deleted)
    if (!user) return res.status(404).json({ message: '用户不存在' })
    user.passwordHash = bcrypt.hashSync(newPassword, 10)
    await db.write()
    return res.json({ success: true })
  } catch (e: any) {
    return res.status(400).json({ message: e?.message || '重置失败' })
  }
})

authRouter.get('/me', authRequired, async (req: AuthedRequest, res) => {
  await db.read()
  const user = db.data!.users.find((u) => u.id === req.auth!.userId && !u.deleted)
  if (!user) return res.status(404).json({ message: '用户不存在' })
  return res.json({ user: sanitizeUser(user), role: user.role })
})

authRouter.put('/me', authRequired, async (req: AuthedRequest, res) => {
  const schema = z.object({ nickname: z.string().optional(), avatarUrl: z.string().optional(), bio: z.string().optional(), password: z.string().optional() })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ message: '参数错误' })

  await db.read()
  const user = db.data!.users.find((u) => u.id === req.auth!.userId && !u.deleted)
  if (!user) return res.status(404).json({ message: '用户不存在' })

  const { nickname, avatarUrl, bio, password } = parsed.data
  if (nickname !== undefined) user.nickname = nickname.trim() || user.nickname
  if (avatarUrl !== undefined) user.avatarUrl = avatarUrl.trim() || undefined
  if (bio !== undefined) user.bio = bio
  if (password !== undefined && password.trim()) user.passwordHash = bcrypt.hashSync(password.trim(), 10)

  await db.write()
  return res.json({ user: sanitizeUser(user) })
})

export function sanitizeUser(u: User) {
  const { passwordHash, ...rest } = u
  return rest
}
