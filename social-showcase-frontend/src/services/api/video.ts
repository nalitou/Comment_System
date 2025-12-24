import { API_BASE_URL } from '../../config/env'
import { ENDPOINTS } from '../endpoints'
import { http } from '../http'
import { isMock } from '../runtime'
import { mockVideo } from '../../mock/api'

function absUrl(url: string) {
  if (!url) return url
  if (/^(https?:|blob:|data:)/.test(url)) return url
  if (url.startsWith('/')) return `${API_BASE_URL}${url}`
  return url
}

type VideoJob = {
  id: string
  fileId: string
  status: 'queued' | 'processing' | 'success' | 'failed'
  progress: number
  result?: { playUrlMp4?: string }
  error?: string
  createdAt: number
  updatedAt: number
}

export const videoApi = {
  createJob: (fileId: string) =>
    isMock() ? mockVideo.createVideoJob(fileId) : http<{ jobId: string }>(ENDPOINTS.video.jobCreate, { method: 'POST', body: JSON.stringify({ fileId }) }),

  status: async (jobId: string) => {
    if (isMock()) return mockVideo.getVideoJobStatus(jobId)
    const job = await http<VideoJob>(`${ENDPOINTS.video.jobStatus}?jobId=${encodeURIComponent(jobId)}`)
    if (job.result?.playUrlMp4) job.result.playUrlMp4 = absUrl(job.result.playUrlMp4)
    return job
  },
}
