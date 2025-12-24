import { nanoid } from 'nanoid'
import { getDB } from '../db'
import type { AIAction, AITask, Post } from '../../types/models'
import { getAuthedUserOrThrow, sleep } from './common'
import { checkText } from './moderation'

function pickTags(text: string) {
  const candidates = ['旅行', '美食', '学习', '日常', '运动', '音乐', '电影', '校园', '作业', '演示']
  const tags: string[] = []
  for (const c of candidates) {
    if (text.includes(c)) tags.push(c)
  }
  if (tags.length === 0) tags.push('日常')
  return Array.from(new Set(tags)).slice(0, 5)
}

export async function createAITask(payload: { postId?: string; text?: string; actions: AIAction[] }) {
  await getAuthedUserOrThrow()
  const db = await getDB()
  const now = Date.now()
  const task: AITask = {
    id: nanoid(),
    status: 'queued',
    actions: payload.actions,
    input: { postId: payload.postId, text: payload.text },
    createdAt: now,
    updatedAt: now,
  }
  await db.put('aiTasks', task)

  void (async () => {
    try {
      task.status = 'processing'
      task.updatedAt = Date.now()
      await db.put('aiTasks', task)
      await sleep(600)

      let text = payload.text || ''
      if (payload.postId) {
        const post = (await db.get('posts', payload.postId)) as Post | undefined
        if (post) text = [post.title ?? '', post.text ?? '', post.tags.join(' ')].join(' ').trim()
      }

      const result: AITask['result'] = {}
      if (payload.actions.includes('gen_title')) result.title = (text || '分享').slice(0, 20)
      if (payload.actions.includes('summarize')) result.summary = (text || '').slice(0, 120)
      if (payload.actions.includes('gen_tags')) result.tags = pickTags(text || '')
      if (payload.actions.includes('safety')) {
        const checked = await checkText(text || '')
        result.safety = checked.allowed ? { allowed: true } : { allowed: false, reason: `命中敏感词：${checked.hits.join('、')}` }
      }

      task.status = 'success'
      task.result = result
      task.updatedAt = Date.now()
      await db.put('aiTasks', task)
    } catch (e: any) {
      task.status = 'failed'
      task.error = e?.message || 'AI 任务失败'
      task.updatedAt = Date.now()
      await db.put('aiTasks', task)
    }
  })()

  return { taskId: task.id }
}

export async function getAITask(taskId: string) {
  const db = await getDB()
  const task = await db.get('aiTasks', taskId)
  if (!task) throw new Error('任务不存在')
  return task
}
