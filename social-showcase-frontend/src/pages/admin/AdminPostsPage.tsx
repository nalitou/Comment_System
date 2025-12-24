import { Button, Card, CardContent, MenuItem, Stack, TextField, Typography } from '@mui/material'
import dayjs from 'dayjs'
import { useEffect, useState } from 'react'
import { adminApi } from '../../services/api/admin'
import type { Post } from '../../types/models'

export function AdminPostsPage() {
  const [q, setQ] = useState('')
  const [tag, setTag] = useState('')
  const [tagOptions, setTagOptions] = useState<{ tag: string; count: number }[]>([])
  const [items, setItems] = useState<Post[]>([])
  const [page, setPage] = useState(1)
  const pageSize = 10
  const [total, setTotal] = useState(0)

  async function load() {
    const r: any = await adminApi.listPosts({ q: q.trim() || undefined, tag: tag || undefined, page, pageSize })
    setItems(r.items)
    setTotal(r.total)
  }

  useEffect(() => {
    void (async () => {
      // 复用 stats/tag
      const s: any = await adminApi.stats()
      const tags = (s.topTags || []).map((x: any) => ({ tag: x.tag, count: x.count }))
      setTagOptions(tags)
    })()
  }, [])

  useEffect(() => {
    void load()
  }, [page])

  return (
    <Stack spacing={2}>
      <Typography variant="h6" sx={{ fontWeight: 800 }}>
        内容管理
      </Typography>

      <Stack direction="row" spacing={1}>
        <TextField fullWidth size="small" label="关键词/ID" value={q} onChange={(e) => setQ(e.target.value)} />
        <TextField select size="small" label="标签" value={tag} onChange={(e) => setTag(e.target.value)} sx={{ width: 200 }}>
          <MenuItem value="">全部</MenuItem>
          {tagOptions.map((t) => (
            <MenuItem key={t.tag} value={t.tag}>
              {t.tag}
            </MenuItem>
          ))}
        </TextField>
        <Button variant="contained" onClick={() => void load()}>
          查询
        </Button>
      </Stack>

      {items.map((p) => (
        <Card key={p.id} variant="outlined">
          <CardContent>
            <Stack direction="row" spacing={1} justifyContent="space-between" alignItems="center">
              <Stack>
                <Typography sx={{ fontWeight: 700 }}>{p.title || '（无标题）'}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {dayjs(p.createdAt).format('YYYY-MM-DD HH:mm')} · 作者 {p.authorId} · {p.id}
                </Typography>
                {!!p.text && (
                  <Typography variant="body2" color="text.secondary">
                    {p.text.slice(0, 80)}
                  </Typography>
                )}
              </Stack>
              <Stack direction="row" spacing={1}>
                <Button
                  variant="outlined"
                  onClick={() => {
                    window.open(`/post/${p.id}`, '_blank')
                  }}
                >
                  查看
                </Button>
                <Button
                  color="error"
                  onClick={async () => {
                    if (!confirm('确定删除该内容？')) return
                    await adminApi.deletePost(p.id)
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
