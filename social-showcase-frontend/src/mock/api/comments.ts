import { nanoid } from 'nanoid'
import { getDB } from '../db'
import type { Comment } from '../../types/models'
import { getAuthedUserOrThrow } from './common'

export async function listComments(postId: string, page: number, pageSize: number) {
  await getAuthedUserOrThrow()
  const db = await getDB()
  let all = await db.getAllFromIndex('comments', 'by-post', postId)
  all = all.filter((c) => !c.deleted)
  all.sort((a, b) => a.createdAt - b.createdAt)
  const total = all.length
  const start = (page - 1) * pageSize
  const items = all.slice(start, start + pageSize)
  return { items, total }
}

export async function createComment(payload: { postId: string; content: string; parentId?: string }) {
  const { user } = await getAuthedUserOrThrow()
  const db = await getDB()
  const c: Comment = {
    id: nanoid(),
    postId: payload.postId,
    authorId: user.id,
    content: payload.content.trim(),
    parentId: payload.parentId,
    createdAt: Date.now(),
  }
  if (!c.content) throw new Error('评论不能为空')
  await db.put('comments', c)
  return c
}

export async function deleteComment(id: string) {
  const { user } = await getAuthedUserOrThrow()
  const db = await getDB()
  const c = await db.get('comments', id)
  if (!c) throw new Error('评论不存在')
  if (c.authorId !== user.id) throw new Error('无权限')
  c.deleted = true
  await db.put('comments', c)
  return { success: true }
}
