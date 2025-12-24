import { Button, Card, CardContent, Stack, Typography } from '@mui/material'
import dayjs from 'dayjs'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { postsApi } from '../../services/api/posts'
import type { Post } from '../../types/models'

export function MyPostsPage() {
  const nav = useNavigate()
  const [items, setItems] = useState<Post[]>([])
  const [loading, setLoading] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const r = await postsApi.list({ page: 1, pageSize: 50, onlyMine: true })
      setItems(r.items)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  return (
    <Stack spacing={2}>
      <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
        <Typography variant="h6" sx={{ fontWeight: 800 }}>
          我的发布
        </Typography>
        <Button onClick={() => void load()} disabled={loading}>
          刷新
        </Button>
      </Stack>

      {items.map((p) => (
        <Card key={p.id} variant="outlined">
          <CardContent>
            <Stack spacing={1}>
              <Typography sx={{ fontWeight: 700 }}>{p.title || '（无标题）'}</Typography>
              <Typography variant="caption" color="text.secondary">
                {dayjs(p.createdAt).format('YYYY-MM-DD HH:mm')} · {p.visibility}
              </Typography>
              <Stack direction="row" spacing={1}>
                <Button size="small" variant="outlined" onClick={() => nav(`/post/${p.id}`)}>
                  查看
                </Button>
                <Button size="small" variant="outlined" onClick={() => nav(`/post/${p.id}/edit`)}>
                  编辑
                </Button>
                <Button
                  size="small"
                  color="error"
                  onClick={async () => {
                    if (!confirm('确定删除该内容？')) return
                    await postsApi.remove(p.id)
                    await load()
                  }}
                >
                  删除
                </Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      ))}

      {!items.length && <Typography color="text.secondary">暂无内容</Typography>}
    </Stack>
  )
}
