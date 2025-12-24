import { Box, Button, Card, CardContent, Chip, MenuItem, Stack, TextField, Typography } from '@mui/material'
import dayjs from 'dayjs'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { postsApi } from '../../services/api/posts'
import type { Post } from '../../types/models'

export function SearchPage() {
  const nav = useNavigate()
  const [q, setQ] = useState('')
  const [tag, setTag] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [tagOptions, setTagOptions] = useState<{ tag: string; count: number }[]>([])
  const [items, setItems] = useState<Post[]>([])

  useEffect(() => {
    void (async () => {
      const r: any = await postsApi.tags()
      setTagOptions(r)
    })()
  }, [])

  async function onSearch() {
    const r = await postsApi.list({
      q: q.trim() || undefined,
      tag: tag || undefined,
      dateFrom: dateFrom ? new Date(dateFrom).getTime() : undefined,
      dateTo: dateTo ? new Date(dateTo).getTime() : undefined,
      page: 1,
      pageSize: 50,
    })
    setItems(r.items)
  }

  return (
    <Stack spacing={2}>
      <Typography variant="h6" sx={{ fontWeight: 800 }}>
        检索
      </Typography>

      <Card variant="outlined">
        <CardContent>
          <Stack spacing={2}>
            <TextField label="关键词" value={q} onChange={(e) => setQ(e.target.value)} />
            <TextField select label="标签" value={tag} onChange={(e) => setTag(e.target.value)}>
              <MenuItem value="">全部</MenuItem>
              {tagOptions.map((t) => (
                <MenuItem key={t.tag} value={t.tag}>
                  {t.tag}（{t.count}）
                </MenuItem>
              ))}
            </TextField>
            <Stack direction="row" spacing={1}>
              <TextField type="date" label="起始日期" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} InputLabelProps={{ shrink: true }} />
              <TextField type="date" label="结束日期" value={dateTo} onChange={(e) => setDateTo(e.target.value)} InputLabelProps={{ shrink: true }} />
            </Stack>
            <Button variant="contained" onClick={() => void onSearch()}>
              搜索
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {items.map((p) => (
        <Card key={p.id} variant="outlined" sx={{ cursor: 'pointer' }} onClick={() => nav(`/post/${p.id}`)}>
          <CardContent>
            <Stack spacing={1}>
              <Typography sx={{ fontWeight: 700 }}>{p.title || '（无标题）'}</Typography>
              <Typography variant="caption" color="text.secondary">
                {dayjs(p.createdAt).format('YYYY-MM-DD HH:mm')}
              </Typography>
              {!!p.tags.length && (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {p.tags.map((t) => (
                    <Chip size="small" key={t} label={t} />
                  ))}
                </Box>
              )}
            </Stack>
          </CardContent>
        </Card>
      ))}

      {!items.length && <Typography color="text.secondary">暂无结果</Typography>}
    </Stack>
  )
}
