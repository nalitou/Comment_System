import { Alert, Box, Button, Card, CardContent, Chip, Stack, Typography } from '@mui/material'
import { useEffect, useState } from 'react'
import type { AIAction } from '../../types/models'
import { aiApi } from '../../services/api/ai'

export function AIHelper(props: {
  postId?: string
  text?: string
  onApply?: (result: { title?: string; tags?: string[]; summary?: string }) => void
}) {
  const [taskId, setTaskId] = useState<string | null>(null)
  const [status, setStatus] = useState<string | null>(null)
  const [result, setResult] = useState<any>(null)
  const [err, setErr] = useState<string | null>(null)

  async function run(actions: AIAction[]) {
    setErr(null)
    setResult(null)
    setStatus('queued')
    const r = await aiApi.process({ postId: props.postId, text: props.text, actions })
    setTaskId((r as any).taskId)
  }

  useEffect(() => {
    if (!taskId) return
    const timer = window.setInterval(async () => {
      try {
        const t: any = await aiApi.task(taskId)
        setStatus(t.status)
        if (t.status === 'success') {
          setResult(t.result)
          window.clearInterval(timer)
        }
        if (t.status === 'failed') {
          setErr(t.error || 'AI 失败')
          window.clearInterval(timer)
        }
      } catch (e: any) {
        setErr(e?.message || 'AI 失败')
        window.clearInterval(timer)
      }
    }, 600)
    return () => window.clearInterval(timer)
  }, [taskId])

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack spacing={1}>
          <Typography sx={{ fontWeight: 700 }}>AI 处理</Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Button size="small" variant="outlined" onClick={() => void run(['gen_title'])}>
              生成标题
            </Button>
            <Button size="small" variant="outlined" onClick={() => void run(['gen_tags'])}>
              推荐标签
            </Button>
            <Button size="small" variant="outlined" onClick={() => void run(['summarize'])}>
              生成摘要
            </Button>
            <Button size="small" variant="outlined" onClick={() => void run(['safety'])}>
              安全检测
            </Button>
            <Button size="small" variant="outlined" onClick={() => void run(['gen_title', 'gen_tags', 'summarize', 'safety'])}>
              全部
            </Button>
          </Stack>

          {status && <Typography variant="body2">状态：{status}</Typography>}
          {err && <Alert severity="error">{err}</Alert>}

          {result && (
            <Box>
              {result.title && (
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                  <Typography variant="body2">标题：</Typography>
                  <Chip label={result.title} />
                </Stack>
              )}
              {result.tags?.length ? (
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1, flexWrap: 'wrap' }}>
                  <Typography variant="body2">标签：</Typography>
                  {result.tags.map((t: string) => (
                    <Chip key={t} label={t} size="small" />
                  ))}
                </Stack>
              ) : null}
              {result.summary && <Typography variant="body2">摘要：{result.summary}</Typography>}
              {result.safety && (
                <Alert severity={result.safety.allowed ? 'success' : 'warning'} sx={{ mt: 1 }}>
                  {result.safety.allowed ? '通过安全检测' : result.safety.reason}
                </Alert>
              )}

              {props.onApply && (
                <Button
                  sx={{ mt: 1 }}
                  variant="contained"
                  onClick={() => props.onApply?.({ title: result.title, tags: result.tags, summary: result.summary })}
                >
                  一键应用
                </Button>
              )}
            </Box>
          )}
        </Stack>
      </CardContent>
    </Card>
  )
}
