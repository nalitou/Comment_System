import bcrypt from 'bcryptjs'
import { nanoid } from 'nanoid'
import { config } from './config'
import { db } from './db'
import { now, pairKey } from './utils'
import type { Comment, Friendship, Post, Rating, User } from './types'

export async function ensureSeeded() {
  await db.read()
  db.data ||= {
    users: [],
    smsCodes: [],
    posts: [],
    comments: [],
    ratings: [],
    friendRequests: [],
    friendships: [],
    files: [],
    videoJobs: [],
    aiTasks: [],
    sensitiveWords: [],
  }

  const data = db.data

  const hasSuper = data.users.some((u) => u.phone === config.superUser.phone && !u.deleted)
  if (!hasSuper) {
    const u: User = {
      id: nanoid(),
      phone: config.superUser.phone,
      nickname: config.superUser.nickname,
      role: 'super_user',
      passwordHash: bcrypt.hashSync(config.superUser.password, 10),
      createdAt: now(),
    }
    data.users.push(u)
  }

  const hasAdmin = data.users.some((u) => u.role === 'admin' && !u.deleted)
  if (!hasAdmin) {
    const u: User = {
      id: nanoid(),
      phone: config.admin.phone,
      nickname: config.admin.nickname,
      role: 'admin',
      passwordHash: bcrypt.hashSync(config.admin.password, 10),
      createdAt: now(),
    }
    data.users.push(u)
  }

  if (!data.sensitiveWords?.length) {
    data.sensitiveWords = ['傻逼', '妈的', '法轮功', '色情', '赌博', '毒品']
  }

  // demo 数据：用于丰富统计与好友/内容功能的演示
  const demoPassword = '123456'
  const demoUsersCount = data.users.filter((u) => !u.deleted && u.role === 'user').length
  if (demoUsersCount < 8) {
    for (let i = 1; i <= 8; i++) {
      const phone = `1330000000${i}`
      const exists = data.users.some((u) => u.phone === phone && !u.deleted)
      if (exists) continue
      const u: User = {
        id: nanoid(),
        phone,
        nickname: `测试用户${i}`,
        role: 'user',
        passwordHash: bcrypt.hashSync(demoPassword, 10),
        createdAt: now() - (20 - i) * 24 * 60 * 60 * 1000,
      }
      data.users.push(u)
    }
  }

  const demoUsers = data.users.filter((u) => !u.deleted && u.role === 'user').slice(0, 12)
  if (data.friendships.length < 10 && demoUsers.length >= 4) {
    const pairs: Array<[string, string]> = [
      [demoUsers[0].id, demoUsers[1].id],
      [demoUsers[0].id, demoUsers[2].id],
      [demoUsers[1].id, demoUsers[3].id],
      [demoUsers[2].id, demoUsers[3].id],
      [demoUsers[4]?.id, demoUsers[5]?.id],
      [demoUsers[6]?.id, demoUsers[7]?.id],
    ].filter((x): x is [string, string] => !!x[0] && !!x[1])

    for (const [a, b] of pairs) {
      const id = pairKey(a, b)
      if (data.friendships.some((f) => f.id === id)) continue
      const f: Friendship = { id, userA: a, userB: b, createdAt: now() - 10 * 24 * 60 * 60 * 1000 }
      data.friendships.push(f)
    }
  }

  const makeMedia = (i: number) => {
    if (i % 5 === 0) {
      return [{ kind: 'video' as const, url: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4' }]
    }
    if (i % 3 === 0) {
      return [{ kind: 'image' as const, url: `https://picsum.photos/seed/social_${i}/900/600` }]
    }
    if (i % 7 === 0) {
      return [
        { kind: 'image' as const, url: `https://picsum.photos/seed/social_mix_${i}/900/600` },
        { kind: 'video' as const, url: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4' },
      ]
    }
    return []
  }

  if (data.posts.length < 30 && demoUsers.length) {
    const base = now()
    let idx = data.posts.length
    for (const u of demoUsers.slice(0, 8)) {
      for (let j = 0; j < 4; j++) {
        const createdAt = base - (idx % 14) * 24 * 60 * 60 * 1000 - (idx % 12) * 60 * 60 * 1000
        const media = makeMedia(idx)
        const tags = ['日常', '演示', idx % 2 ? '旅行' : '学习', idx % 3 ? '美食' : '运动'].slice(0, 3)
        const p: Post = {
          id: nanoid(),
          authorId: u.id,
          title: `示例内容 ${idx + 1}`,
          text: `这是用于演示的示例内容（#${idx + 1}）。包含一些关键词：${tags.join('、')}。`,
          tags,
          visibility: (idx % 5 === 0 ? 'friends' : idx % 11 === 0 ? 'private' : 'public') as any,
          media: media as any,
          createdAt,
          updatedAt: createdAt,
        }
        data.posts.push(p)
        idx++
      }
    }
  }

  if (data.ratings.length < 80 && demoUsers.length >= 3) {
    for (const p of data.posts.slice(0, 40)) {
      const raters = demoUsers.filter((u) => u.id !== p.authorId).slice(0, 4)
      for (let i = 0; i < raters.length; i++) {
        const u = raters[i]
        const id = `${p.id}_${u.id}`
        if (data.ratings.some((r) => r.id === id)) continue
        const score = 3 + ((i + p.createdAt) % 3)
        const t = p.createdAt + (i + 1) * 60 * 60 * 1000
        const r: Rating = { id, postId: p.id, userId: u.id, score, createdAt: t, updatedAt: t }
        data.ratings.push(r)
      }
    }
  }

  if (data.comments.length < 120 && demoUsers.length >= 3) {
    for (const p of data.posts.slice(0, 30)) {
      const commenters = demoUsers.filter((u) => u.id !== p.authorId).slice(0, 3)
      for (let i = 0; i < commenters.length; i++) {
        const u = commenters[i]
        const t = p.createdAt + (i + 1) * 30 * 60 * 1000
        const c: Comment = { id: nanoid(), postId: p.id, authorId: u.id, content: `评论 ${i + 1}：这个内容很不错（演示）`, createdAt: t }
        data.comments.push(c)
      }
    }
  }

  await db.write()
}
