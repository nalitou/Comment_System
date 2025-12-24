import { Alert, Button, Card, CardContent, Divider, MenuItem, Stack, TextField, Typography } from '@mui/material'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { TagEditor } from '../../components/post/TagEditor'
import { MediaUploader } from '../../components/post/MediaUploader'
import type { MediaItem, Post, Visibility } from '../../types/models'
import { postsApi } from '../../services/api/posts'
import { moderationApi } from '../../services/api/moderation'

export function PostEditPage() {
  const { id } = useParams()
  const nav = useNavigate()
  const [post, setPost] = useState<Post | null>(null)
  const [title, setTitle] = useState('')
  const [text, setText] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [visibility, setVisibility] = useState<Visibility>('public')
  const [media, setMedia] = useState<MediaItem[]>([])
  const [err, setErr] = useState<string | null>(null)
  const [warn, setWarn] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    void (async () => {
      if (!id) return
      try {
        const p = await postsApi.detail(id)
        setPost(p)
        setTitle(p.title || '')
        setText(p.text || '')
        setTags(p.tags || [])
        setVisibility(p.visibility)
        setMedia(p.media || [])
      } catch (e: any) {
        setErr(e?.message || '加载失败')
      }
    })()
  }, [id])

  async function onSubmit() {
    if (!id) return
    setErr(null)
    setWarn(null)
    setLoading(true)
    try {
      const inputText = `${title}\n${text}`.trim()
      const checked = await moderationApi.checkText(inputText)
      if (!checked.allowed) {
        setErr(`命中敏感词：${checked.hits.join('、')}，禁止保存。`)
        return
      }
      const updated = await postsApi.update(id, { title, text, tags, visibility, media } as any)
      nav(`/post/${updated.id}`, { replace: true })
    } catch (e: any) {
      setErr(e?.message || '保存失败')
    } finally {
      setLoading(false)
    }
  }

  if (!post) return <Typography color="text.secondary">{err || '加载中...'}</Typography>

  return (
    <Stack spacing={2}>
      <Typography variant="h6" sx={{ fontWeight: 800 }}>
        编辑内容
      </Typography>
      {err && <Alert severity="error">{err}</Alert>}
      {warn && <Alert severity="warning">{warn}</Alert>}

      <Card variant="outlined">
        <CardContent>
          <Stack spacing={2}>
            <TextField label="标题（可选）" value={title} onChange={(e) => setTitle(e.target.value)} />
            <TextField label="正文" value={text} onChange={(e) => setText(e.target.value)} multiline minRows={4} />
            <TagEditor value={tags} onChange={setTags} />
            <TextField select label="可见性" value={visibility} onChange={(e) => setVisibility(e.target.value as any)}>
              <MenuItem value="public">公开</MenuItem>
              <MenuItem value="friends">仅好友</MenuItem>
              <MenuItem value="private">仅自己</MenuItem>
            </TextField>
            <MediaUploader value={media} onChange={setMedia} />
            <Divider />
            <Button variant="contained" disabled={loading} onClick={() => void onSubmit()}>
              保存
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  )
}
