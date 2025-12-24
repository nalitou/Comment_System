import { nanoid } from 'nanoid'
import { getDB } from './db'
import type { Post, User } from '../types/models'
import { SUPER_USER } from '../config/seedAccounts'

const SEEDED_KEY = 'social_showcase_seeded_v1'

export async function ensureSeeded() {
  if (localStorage.getItem(SEEDED_KEY) === '1') return
  const db = await getDB()

  const now = Date.now()

  const superUser: User = {
    id: nanoid(),
    phone: SUPER_USER.phone,
    nickname: '超级用户',
    role: 'super_user',
    password: SUPER_USER.password,
    createdAt: now,
  }

  const adminUser: User = {
    id: nanoid(),
    phone: '19900000000',
    nickname: '管理员',
    role: 'admin',
    password: SUPER_USER.password,
    createdAt: now,
  }

  await db.put('users', superUser)
  await db.put('users', adminUser)

  // 基础敏感词（可自行扩充）
  const baseWords = ['傻逼', '妈的', '法轮功', '色情', '赌博', '毒品']
  for (const w of baseWords) {
    await db.put('sensitiveWords', { id: nanoid(), word: w })
  }

  // 造几条演示内容
  const demoPosts: Post[] = [
    {
      id: nanoid(),
      authorId: superUser.id,
      title: '欢迎使用多媒体展示系统',
      text: '这是一个用于软件工程大作业演示的前端项目：支持发图/视频/文本、评论、评分、好友、敏感词、视频处理与 AI。',
      tags: ['公告', '演示'],
      visibility: 'public',
      media: [],
      createdAt: now - 1000 * 60 * 60 * 3,
      updatedAt: now - 1000 * 60 * 60 * 3,
    },
  ]
  for (const p of demoPosts) await db.put('posts', p)

  localStorage.setItem(SEEDED_KEY, '1')
}
