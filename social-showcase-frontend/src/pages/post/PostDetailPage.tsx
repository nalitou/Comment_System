import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Rating as MuiRating,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import dayjs from 'dayjs'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { API_BASE_URL } from '../../config/env'
import { AIHelper } from '../../components/post/AIHelper'
import { commentsApi } from '../../services/api/comments'
import { postsApi } from '../../services/api/posts'
import { ratingApi } from '../../services/api/rating'
import { authStore } from '../../store/authStore'
import type { Comment, Post } from '../../types/models'

function absMediaUrl(url?: string) {
  if (!url) return url
  if (/^(https?:|blob:|data:)/.test(url)) return url
  if (url.startsWith('/')) return `${API_BASE_URL}${url}`
  return url
}

export function PostDetailPage() {
  const { id } = useParams()
  const nav = useNavigate()
  const me = authStore((s) => s.user)

  const [post, setPost] = useState<Post | null>(null)
  const [err, setErr] = useState<string | null>(null)

  const [myScore, setMyScore] = useState<number | null>(null)
  const [summary, setSummary] = useState<{ avg: number; totalCount: number } | null>(null)

  const [comments, setComments] = useState<Comment[]>([])
  const [commentText, setCommentText] = useState('')
  const [replyTo, setReplyTo] = useState<Comment | null>(null)

  const canEdit = useMemo(() => post && me && post.authorId === me.id, [me, post])

  async function loadAll() {
    if (!id) return
    setErr(null)
    try {
      const p = await postsApi.detail(id)
      setPost(p)
      const s: any = await ratingApi.summary(id)
      setSummary({ avg: s.avg, totalCount: s.totalCount })
      const mr: any = await ratingApi.my(id)
      setMyScore(mr?.score ?? null)
      const cs = await commentsApi.list(id, 1, 100)
      setComments(cs.items)
    } catch (e: any) {
      setErr(e?.message || '加载失败')
    }
  }

  useEffect(() => {
    void loadAll()
  }, [id])

  async function onRate(score: number | null) {
    if (!id || !score) return
    await ratingApi.upsert(id, score)
    await loadAll()
  }

  async function onSendComment() {
    if (!id) return
    const content = commentText.trim()
    if (!content) return
    await commentsApi.create(id, { content, parentId: replyTo?.id })
    setCommentText('')
    setReplyTo(null)
    await loadAll()
  }

  if (err) return <Alert severity="error">{err}</Alert>
  if (!post) return <Typography color="text.secondary">加载中...</Typography>

  return (
    <Stack spacing={2}>
      <Card variant="outlined">
        <CardContent>
          <Stack spacing={1}>
            <Stack direction="row" spacing={1} justifyContent="space-between" alignItems="center">
              <Typography sx={{ fontWeight: 800 }}>{post.title || '（无标题）'}</Typography>
              <Stack alignItems="flex-end" spacing={0.25}>
                <Typography variant="caption" color="text.secondary">
                  {dayjs(post.createdAt).format('YYYY-MM-DD HH:mm')}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  评分：{summary ? `${summary.avg.toFixed(2)}（${summary.totalCount} 人）` : '暂无'}
                </Typography>
              </Stack>
            </Stack>

            {post.text && <Typography variant="body2">{post.text}</Typography>}

            {!!post.media.length && (
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1 }}>
                {post.media.map((m, idx) =>
                  m.kind === 'image' ? (
                    <img key={idx} src={absMediaUrl(m.url)} style={{ width: '100%', height: 240, objectFit: 'cover', borderRadius: 10 }} />
                  ) : (
                    <video key={idx} src={absMediaUrl(m.url)} style={{ width: '100%', height: 240, objectFit: 'cover', borderRadius: 10 }} controls />
                  ),
                )}
              </Box>
            )}

            {!!post.tags.length && (
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {post.tags.map((t) => (
                  <Chip key={t} size="small" label={t} />
                ))}
              </Stack>
            )}

            {canEdit && (
              <Stack direction="row" spacing={1}>
                <Button size="small" variant="outlined" onClick={() => nav(`/post/${post.id}/edit`)}>
                  编辑
                </Button>
                <Button
                  size="small"
                  color="error"
                  onClick={async () => {
                    if (!confirm('确定删除该内容？')) return
                    await postsApi.remove(post.id)
                    nav('/', { replace: true })
                  }}
                >
                  删除
                </Button>
              </Stack>
            )}
          </Stack>
        </CardContent>
      </Card>

      <Card variant="outlined">
        <CardContent>
          <Stack spacing={1}>
            <Typography sx={{ fontWeight: 700 }}>评分</Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <MuiRating value={myScore} onChange={(_, v) => void onRate(v)} />
              <Typography variant="body2" color="text.secondary">
                平均 {summary?.avg.toFixed(2)}（{summary?.totalCount || 0} 人）
              </Typography>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      <Card variant="outlined">
        <CardContent>
          <Stack spacing={1}>
            <Typography sx={{ fontWeight: 700 }}>评论</Typography>
            {comments.map((c) => (
              <Box key={c.id} sx={{ p: 1, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                <Stack spacing={0.5}>
                  <Typography variant="caption" color="text.secondary">
                    {dayjs(c.createdAt).format('MM-DD HH:mm')} {c.parentId ? '（回复）' : ''}
                  </Typography>
                  <Typography variant="body2">{c.content}</Typography>
                  <Stack direction="row" spacing={1}>
                    <Button size="small" onClick={() => setReplyTo(c)}>
                      回复
                    </Button>
                    {c.authorId === me?.id && (
                      <Button
                        size="small"
                        color="error"
                        onClick={async () => {
                          await commentsApi.remove(c.id)
                          await loadAll()
                        }}
                      >
                        删除
                      </Button>
                    )}
                  </Stack>
                </Stack>
              </Box>
            ))}

            <Divider />
            {replyTo && (
              <Alert severity="info" onClose={() => setReplyTo(null)}>
                正在回复：{replyTo.content.slice(0, 40)}
              </Alert>
            )}
            <TextField value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="写评论..." multiline minRows={2} />
            <Button variant="contained" onClick={() => void onSendComment()}>
              发送
            </Button>
          </Stack>
        </CardContent>
      </Card>

      <AIHelper postId={post.id} />
    </Stack>
  )
}
