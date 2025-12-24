import { Box, Button, Card, CardContent, IconButton, Stack, Typography } from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import { useState } from 'react'
import type { MediaItem } from '../../types/models'
import { uploadApi } from '../../services/api/upload'
import { videoApi } from '../../services/api/video'

export function MediaUploader(props: { value: MediaItem[]; onChange: (v: MediaItem[]) => void }) {
  const [loading, setLoading] = useState(false)
  const [videoJob, setVideoJob] = useState<{ jobId: string; status: string; progress: number } | null>(null)

  async function onPickImages(ev: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(ev.target.files ?? [])
    if (!files.length) return
    setLoading(true)
    try {
      const next = [...props.value]
      for (const f of files) {
        const r = await uploadApi.uploadFile(f)
        next.push({ kind: 'image', fileId: r.fileId, url: r.url })
      }
      props.onChange(next)
    } finally {
      setLoading(false)
      ev.target.value = ''
    }
  }

  async function onPickVideo(ev: React.ChangeEvent<HTMLInputElement>) {
    const file = (ev.target.files ?? [])[0]
    if (!file) return
    setLoading(true)
    try {
      const uploaded = await uploadApi.uploadFile(file)
      const job = await videoApi.createJob(uploaded.fileId)
      setVideoJob({ jobId: job.jobId, status: 'queued', progress: 0 })

      // 轮询任务
      const timer = window.setInterval(async () => {
        try {
          const st: any = await videoApi.status(job.jobId)
          setVideoJob({ jobId: job.jobId, status: st.status, progress: st.progress })
          if (st.status === 'success') {
            window.clearInterval(timer)
            const next = props.value.filter((m) => m.kind !== 'video')
            next.push({ kind: 'video', fileId: uploaded.fileId, url: st.result?.playUrlMp4 })
            props.onChange(next)
          }
          if (st.status === 'failed') window.clearInterval(timer)
        } catch {
          window.clearInterval(timer)
        }
      }, 500)
    } finally {
      setLoading(false)
      ev.target.value = ''
    }
  }

  return (
    <Stack spacing={1}>
      <Stack direction="row" spacing={1}>
        <Button component="label" variant="outlined" disabled={loading}>
          选择图片
          <input hidden type="file" accept="image/*" multiple onChange={onPickImages} />
        </Button>
        <Button component="label" variant="outlined" disabled={loading}>
          选择视频（自动处理）
          <input hidden type="file" accept="video/*" onChange={onPickVideo} />
        </Button>
      </Stack>

      {videoJob && (
        <Card variant="outlined">
          <CardContent>
            <Typography variant="body2">视频处理任务：{videoJob.status}，进度 {videoJob.progress}%</Typography>
          </CardContent>
        </Card>
      )}

      {!!props.value.length && (
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1 }}>
          {props.value.map((m, idx) => (
            <Card key={`${m.kind}_${m.fileId ?? m.url ?? idx}`} variant="outlined" sx={{ position: 'relative' }}>
              <IconButton
                size="small"
                onClick={() => {
                  const next = props.value.slice()
                  next.splice(idx, 1)
                  props.onChange(next)
                }}
                sx={{ position: 'absolute', right: 4, top: 4, bgcolor: 'rgba(255,255,255,0.8)' }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
              <CardContent sx={{ p: 1 }}>
                {m.kind === 'image' ? (
                  <img src={m.url} style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 8 }} />
                ) : (
                  <video src={m.url} style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 8 }} controls />
                )}
              </CardContent>
            </Card>
          ))}
        </Box>
      )}
    </Stack>
  )
}
