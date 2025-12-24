import { nanoid } from 'nanoid'
import { getDB } from '../db'
import type { VideoJob } from '../../types/models'
import { getAuthedUserOrThrow, sleep } from './common'
import { getFileUrl } from './upload'

async function updateJob(job: VideoJob) {
  const db = await getDB()
  job.updatedAt = Date.now()
  await db.put('videoJobs', job)
}

export async function createVideoJob(fileId: string) {
  await getAuthedUserOrThrow()
  const db = await getDB()
  const now = Date.now()
  const job: VideoJob = {
    id: nanoid(),
    fileId,
    status: 'queued',
    progress: 0,
    createdAt: now,
    updatedAt: now,
  }
  await db.put('videoJobs', job)

  // 模拟异步处理
  void (async () => {
    try {
      job.status = 'processing'
      await updateJob(job)
      for (const p of [10, 25, 45, 65, 80, 92, 100]) {
        await sleep(350)
        job.progress = p
        await updateJob(job)
      }
      const { url } = await getFileUrl(fileId)
      job.status = 'success'
      job.result = { playUrlMp4: url }
      await updateJob(job)
    } catch (e: any) {
      job.status = 'failed'
      job.error = e?.message || '视频处理失败'
      await updateJob(job)
    }
  })()

  return { jobId: job.id }
}

export async function getVideoJobStatus(jobId: string) {
  const db = await getDB()
  const job = await db.get('videoJobs', jobId)
  if (!job) throw new Error('任务不存在')
  return job
}
