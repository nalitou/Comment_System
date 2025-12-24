import { Router } from 'express'
import { nanoid } from 'nanoid'
import { z } from 'zod'
import fetch from 'node-fetch'
import { db } from '../db'
import { authRequired } from '../middleware/auth'
import { maskSensitive, now } from '../utils'
import type { AIAction, AITask } from '../types'

export const aiRouter = Router()

/* ================= DeepSeek 写死配置 ================= */

const DS_API_KEY = 'sk-d326def7dd5f46578f1d1fc9b876c821'
const DS_URL = 'https://api.deepseek.com'
const DS_MODEL = 'deepseek-chat'

/* ================= DeepSeek 调用 ================= */

async function deepseekChat(system: string, user: string) {
  const resp = await fetch(`${DS_URL}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${DS_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: DS_MODEL,
      temperature: 0.2,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    }),
  })

  if (!resp.ok) {
    const text = await resp.text()
    throw new Error(`DeepSeek HTTP ${resp.status}: ${text}`)
  }

  const data: any = await resp.json()
  const content = data?.choices?.[0]?.message?.content
  if (!content) throw new Error('DeepSeek 返回为空')

  return String(content)
}

/* ================= 工具函数 ================= */

function pickTagsFallback(text: string) {
  const candidates = ['旅行', '美食', '学习', '日常', '运动', '音乐', '电影', '校园', '作业', '演示']
  const tags = candidates.filter((c) => text.includes(c))
  return tags.length ? tags.slice(0, 5) : ['日常']
}

function parseTags(raw: string) {
  try {
    const arr = JSON.parse(raw)
    if (Array.isArray(arr)) {
      return arr.map((x) => String(x).trim()).slice(0, 5)
    }
  } catch {}
  return raw
    .replace(/[\[\]"']/g, '')
    .split(/[,，\s]+/)
    .map((x) => x.trim())
    .filter(Boolean)
    .slice(0, 5)
}

async function writeTask(task: AITask) {
  task.updatedAt = now()
  db.data!.aiTasks = db.data!.aiTasks.filter((t) => t.id !== task.id)
  db.data!.aiTasks.push(task)
  await db.write()
}

/* ================= 创建 AI 任务 ================= */

aiRouter.post('/ai/process', authRequired, async (req, res) => {
  const schema = z.object({
    postId: z.string().optional(),
    text: z.string().optional(),
    actions: z
      .array(z.enum(['gen_title', 'gen_tags', 'summarize', 'safety'] as const))
      .min(1),
  })

  const parsed = schema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ message: '参数错误' })
  }

  await db.read()
  const t = now()

  const task: AITask = {
    id: nanoid(),
    status: 'queued',
    actions: parsed.data.actions as AIAction[],
    input: parsed.data,
    createdAt: t,
    updatedAt: t,
  }

  db.data!.aiTasks.push(task)
  await db.write()

  /* ===== 异步执行 AI ===== */
  void (async () => {
    try {
      task.status = 'processing'
      await writeTask(task)

      await db.read()
      let text = parsed.data.text || ''

      if (parsed.data.postId) {
        const p = db.data!.posts.find((x) => x.id === parsed.data.postId)
        if (p) {
          text = [p.title, p.text, p.tags.join(' ')].join(' ').trim()
        }
      }

      const result: any = {}

      if (task.actions.includes('gen_title')) {
        result.title = (await deepseekChat(
          '你是一个内容运营助手。',
          `根据以下内容生成一个不超过20个中文字符的标题，只输出标题：\n${text}`,
        )).slice(0, 20)
      }

      if (task.actions.includes('summarize')) {
        result.summary = (await deepseekChat(
          '你是一个内容助手。',
          `请将以下内容总结为不超过120字的一段话，只输出总结：\n${text}`,
        )).slice(0, 120)
      }

      if (task.actions.includes('gen_tags')) {
        try {
          const raw = await deepseekChat(
            '你是一个内容标签助手。',
            `为以下内容生成 3~5 个中文标签，返回 JSON 数组：\n${text}`,
          )
          result.tags = parseTags(raw)
        } catch {
          result.tags = pickTagsFallback(text)
        }
      }

      if (task.actions.includes('safety')) {
        const r = maskSensitive(text, db.data!.sensitiveWords || [])
        result.safety = r.allowed
          ? { allowed: true }
          : { allowed: false, reason: `命中敏感词：${r.hits.join('、')}` }
      }

      task.status = 'success'
      task.result = result
      await writeTask(task)
    } catch (e: any) {
      task.status = 'failed'
      task.error = e?.message || 'AI 任务失败'
      await writeTask(task)
    }
  })()

  res.json({ taskId: task.id })
})

/* ================= 查询任务 ================= */

aiRouter.get('/ai/task/:id', authRequired, async (req, res) => {
  await db.read()
  const task = db.data!.aiTasks.find((t) => t.id === req.params.id)
  if (!task) return res.status(404).json({ message: '任务不存在' })
  res.json(task)
})
