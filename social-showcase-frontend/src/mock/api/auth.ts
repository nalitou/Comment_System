import { nanoid } from 'nanoid'
import { getDB } from '../db'
import type { User } from '../../types/models'
import { SUPER_USER } from '../../config/seedAccounts'
import { issueToken, sleep, getAuthedUserOrThrow } from './common'

export async function sendSms(phone: string, _scene: string) {
  const db = await getDB()
  await sleep(300)
  const code = phone === SUPER_USER.phone ? SUPER_USER.smsCode : '000000'
  await db.put('smsCodes', { phone, code, createdAt: Date.now() })
  return { success: true, mockCode: code }
}

async function verifyCode(phone: string, code: string) {
  const db = await getDB()
  const rec = await db.get('smsCodes', phone)
  if (!rec) throw new Error('请先获取验证码')
  if (rec.code !== code) throw new Error('验证码错误')
}

export async function register(payload: { phone: string; code: string; password?: string; nickname?: string }) {
  const { phone, code, password, nickname } = payload
  await verifyCode(phone, code)
  const db = await getDB()

  const exists = (await db.getAllFromIndex('users', 'by-phone', phone))[0]
  if (exists && !exists.deleted) throw new Error('手机号已注册')

  const role = phone === SUPER_USER.phone ? 'super_user' : 'user'
  const user: User = {
    id: nanoid(),
    phone,
    nickname: nickname?.trim() || `用户${phone.slice(-4)}`,
    role,
    password: password || undefined,
    createdAt: Date.now(),
  }
  await db.put('users', user)
  const tk = await issueToken(user)
  return { token: tk.token, user, role: user.role }
}

export async function loginBySms(payload: { phone: string; code: string }) {
  const { phone, code } = payload
  await verifyCode(phone, code)
  const db = await getDB()
  const user = (await db.getAllFromIndex('users', 'by-phone', phone))[0]
  if (!user || user.deleted) throw new Error('用户不存在')
  const tk = await issueToken(user)
  return { token: tk.token, user, role: user.role }
}

export async function loginByPassword(payload: { phone: string; password: string }) {
  const { phone, password } = payload
  const db = await getDB()
  const user = (await db.getAllFromIndex('users', 'by-phone', phone))[0]
  if (!user || user.deleted) throw new Error('用户不存在')
  if (!user.password) throw new Error('该账号未设置密码，请使用验证码登录')
  if (user.password !== password) throw new Error('密码错误')
  const tk = await issueToken(user)
  return { token: tk.token, user, role: user.role }
}

export async function resetPassword(payload: { phone: string; code: string; newPassword: string }) {
  const { phone, code, newPassword } = payload
  await verifyCode(phone, code)
  const db = await getDB()
  const user = (await db.getAllFromIndex('users', 'by-phone', phone))[0]
  if (!user || user.deleted) throw new Error('用户不存在')
  user.password = newPassword
  await db.put('users', user)
  return { success: true }
}

export async function getMe() {
  const { user, role } = await getAuthedUserOrThrow()
  return { user, role }
}

export async function updateMe(payload: Partial<Pick<User, 'nickname' | 'avatarUrl' | 'bio' | 'password'>>) {
  const { user } = await getAuthedUserOrThrow()
  const db = await getDB()
  const updated: User = {
    ...user,
    nickname: payload.nickname ?? user.nickname,
    avatarUrl: payload.avatarUrl ?? user.avatarUrl,
    bio: payload.bio ?? user.bio,
    password: payload.password ?? user.password,
  }
  await db.put('users', updated)
  return { user: updated }
}
