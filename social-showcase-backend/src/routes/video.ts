import { Router } from 'express'
import { nanoid } from 'nanoid'
import { z } from 'zod'
import { db } from '../db'
import { authRequired } from '../middleware/auth'
import { now } from '../utils'
import type { VideoJob } from '../types'

export const videoRouter = Router()

async function writeJob(job: VideoJob) {
  job.updatedAt = now()
  db.data!.videoJobs = db.data!.videoJobs.filter((j) => j.id !== job.id)
  db.data!.videoJobs.push(job)
  await db.write()
}

videoRouter.post('/video/job/create', authRequired, async (req, res) => {
  const schema = z.object({ fileId: z.string().min(1) })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ message: '参数错误' })

  await db.read()
  const t = now()
  const job: VideoJob = { id: nanoid(), fileId: parsed.data.fileId, status: 'queued', progress: 0, createdAt: t, updatedAt: t }
  db.data!.videoJobs.push(job)
  await db.write()

  // 模拟异步转码
  void (async () => {
    try {
      await db.read()
      job.status = 'processing'
      await writeJob(job)
      for (const p of [10, 25, 45, 65, 80, 92, 100]) {
        await new Promise((r) => setTimeout(r, 350))
        await db.read()
        job.progress = p
        await writeJob(job)
      }
      await db.read()
      job.status = 'success'
      job.result = { playUrlMp4: `/files/${job.fileId}` }
      await writeJob(job)
    } catch (e: any) {
      await db.read()
      job.status = 'failed'
      job.error = e?.message || '视频处理失败'
      await writeJob(job)
    }
  })()

  return res.json({ jobId: job.id })
})

videoRouter.get('/video/job/status', authRequired, async (req, res) => {
  await db.read()
  const jobId = String(req.query.jobId || '')
  const job = db.data!.videoJobs.find((j) => j.id === jobId)
  if (!job) return res.status(404).json({ message: '任务不存在' })
  return res.json(job)
})
