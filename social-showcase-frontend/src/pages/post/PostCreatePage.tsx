import { Alert, Button, Card, CardContent, Divider, MenuItem, Stack, TextField, Typography } from '@mui/material'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TagEditor } from '../../components/post/TagEditor'
import { MediaUploader } from '../../components/post/MediaUploader'
import { AIHelper } from '../../components/post/AIHelper'
import type { MediaItem, Visibility } from '../../types/models'
import { postsApi } from '../../services/api/posts'
import { moderationApi } from '../../services/api/moderation'

export function PostCreatePage() {
  const nav = useNavigate()
  const [title, setTitle] = useState('')
  const [text, setText] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [tagOptions, setTagOptions] = useState<string[]>([])
  const [visibility, setVisibility] = useState<Visibility>('public')
  const [media, setMedia] = useState<MediaItem[]>([])
  const [err, setErr] = useState<string | null>(null)
  const [warn, setWarn] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    void (async () => {
      const r: any = await postsApi.tags()
      setTagOptions((r || []).map((x: any) => x.tag))
    })()
  }, [])

  async function onSubmit() {
    setErr(null)
    setWarn(null)
    setLoading(true)
    try {
      const inputText = `${title}\n${text}`.trim()
      const checked = await moderationApi.checkText(inputText)
      if (!checked.allowed) {
        setErr(`命中敏感词：${checked.hits.join('、')}，禁止发布。`)
        return
      }

      const post = await postsApi.create({ title, text, tags, visibility, media: media as any })
      nav(`/post/${post.id}`, { replace: true })
    } catch (e: any) {
      setErr(e?.message || '发布失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Stack spacing={2}>
      <Typography variant="h6" sx={{ fontWeight: 800 }}>
        发布内容
      </Typography>

      {err && <Alert severity="error">{err}</Alert>}
      {warn && <Alert severity="warning">{warn}</Alert>}

      <Card variant="outlined">
        <CardContent>
          <Stack spacing={2}>
            <TextField label="标题（可选）" value={title} onChange={(e) => setTitle(e.target.value)} />
            <TextField label="正文" value={text} onChange={(e) => setText(e.target.value)} multiline minRows={4} />
            <TagEditor value={tags} onChange={setTags} suggestions={tagOptions} />
            <TextField select label="可见性" value={visibility} onChange={(e) => setVisibility(e.target.value as any)}>
              <MenuItem value="public">公开</MenuItem>
              <MenuItem value="friends">仅好友</MenuItem>
              <MenuItem value="private">仅自己</MenuItem>
            </TextField>
            <MediaUploader value={media} onChange={setMedia} />
            <Divider />
            <Button variant="contained" disabled={loading} onClick={() => void onSubmit()}>
              发布
            </Button>
          </Stack>
        </CardContent>
      </Card>

      <AIHelper
        text={`${title}\n${text}`}
        onApply={(r) => {
          if (r.title) setTitle(r.title)
          if (r.tags?.length) setTags(r.tags)
          if (r.summary && !text) setText(r.summary)
        }}
      />
    </Stack>
  )
}
