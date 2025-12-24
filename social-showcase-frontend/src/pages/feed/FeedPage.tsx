import { Box, Button, Card, CardContent, Chip, Divider, Rating as MuiRating, Stack, TextField, Typography } from '@mui/material'
import dayjs from 'dayjs'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_BASE_URL } from '../../config/env'
import { postsApi } from '../../services/api/posts'
import { authStore } from '../../store/authStore'
import type { Post } from '../../types/models'

function absMediaUrl(url?: string) {
  if (!url) return url
  if (/^(https?:|blob:|data:)/.test(url)) return url
  if (url.startsWith('/')) return `${API_BASE_URL}${url}`
  return url
}

export function FeedPage() {
  const nav = useNavigate()
  const me = authStore((s) => s.user)
  const [items, setItems] = useState<Post[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [onlyFriendsFeed, setOnlyFriendsFeed] = useState(false)
  const [q, setQ] = useState('')
  const [tag, setTag] = useState<string | undefined>(undefined)
  const [tagOptions, setTagOptions] = useState<{ tag: string; count: number }[]>([])

  const pageSize = 10

  const query = useMemo(() => ({ q: q || undefined, tag, page, pageSize, onlyFriendsFeed }), [onlyFriendsFeed, page, q, tag])

  useEffect(() => {
    void (async () => {
      const tags: any = await postsApi.tags()
      setTagOptions(tags)
    })()
  }, [])

  useEffect(() => {
    void (async () => {
      const r = await postsApi.list(query)
      setItems(r.items)
      setTotal(r.total)
    })()
  }, [query])

  return (
    <Stack spacing={2}>
      <Card variant="outlined">
        <CardContent>
          <Stack spacing={1}>
            <Typography sx={{ fontWeight: 800 }}>信息流</Typography>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
              <TextField size="small" label="关键词" value={q} onChange={(e) => setQ(e.target.value)} />
              <Button variant={onlyFriendsFeed ? 'contained' : 'outlined'} onClick={() => setOnlyFriendsFeed((v) => !v)}>
                {onlyFriendsFeed ? '好友圈' : '全站'}
              </Button>
              <Button variant="outlined" onClick={() => nav('/post/new')}>
                发布
              </Button>
              <Button variant="outlined" onClick={() => nav('/me/posts')}>
                我的发布
              </Button>
            </Stack>
            {!!tagOptions.length && (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                <Chip label="全部" color={!tag ? 'primary' : 'default'} onClick={() => setTag(undefined)} />
                {tagOptions.slice(0, 12).map((t) => (
                  <Chip key={t.tag} label={`${t.tag}(${t.count})`} color={tag === t.tag ? 'primary' : 'default'} onClick={() => setTag(t.tag)} />
                ))}
              </Box>
            )}
          </Stack>
        </CardContent>
      </Card>

      {items.map((p) => (
        <Card key={p.id} variant="outlined" sx={{ cursor: 'pointer' }} onClick={() => nav(`/post/${p.id}`)}>
          <CardContent>
            <Stack spacing={1}>
              <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                <Typography sx={{ fontWeight: 700 }}>{p.title || '（无标题）'}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {dayjs(p.createdAt).format('YYYY-MM-DD HH:mm')}
                </Typography>
              </Stack>

              {p.text && <Typography variant="body2">{p.text.slice(0, 120)}</Typography>}

              {!!p.media.length && (
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1 }}>
                  {p.media.slice(0, 3).map((m, idx) =>
                    m.kind === 'image' ? (
                      <img key={idx} src={absMediaUrl(m.url)} style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 8 }} />
                    ) : (
                      <video key={idx} src={absMediaUrl(m.url)} style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 8 }} />
                    ),
                  )}
                </Box>
              )}

              {!!p.tags.length && (
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  {p.tags.map((t) => (
                    <Chip key={t} size="small" label={t} />
                  ))}
                </Stack>
              )}

              <Divider />
              <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                <Stack direction="row" spacing={1} alignItems="center">
                  <MuiRating value={p.ratingSummary?.avg ?? 0} precision={0.1} readOnly size="small" />
                  <Typography variant="caption" color="text.secondary">
                    {p.ratingSummary ? `平均 ${p.ratingSummary.avg.toFixed(2)}（${p.ratingSummary.totalCount} 人）` : '暂无评分'}
                  </Typography>
                </Stack>
                <Typography variant="caption" color="text.secondary">
                  可见性：{p.visibility} {p.authorId === me?.id ? '（我的）' : ''}
                </Typography>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      ))}

      <Stack direction="row" spacing={1} justifyContent="center" alignItems="center">
        <Button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
          上一页
        </Button>
        <Typography variant="body2">
          {page} / {Math.max(1, Math.ceil(total / pageSize))}
        </Typography>
        <Button disabled={page >= Math.ceil(total / pageSize)} onClick={() => setPage((p) => p + 1)}>
          下一页
        </Button>
      </Stack>
    </Stack>
  )
}
