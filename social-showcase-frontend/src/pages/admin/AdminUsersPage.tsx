import { Button, Card, CardContent, Stack, TextField, Typography } from '@mui/material'
import { useEffect, useState } from 'react'
import { adminApi } from '../../services/api/admin'
import type { User } from '../../types/models'

export function AdminUsersPage() {
  const [q, setQ] = useState('')
  const [items, setItems] = useState<User[]>([])
  const [page, setPage] = useState(1)
  const pageSize = 10
  const [total, setTotal] = useState(0)

  async function load() {
    const r: any = await adminApi.listUsers({ q: q.trim() || undefined, page, pageSize })
    setItems(r.items)
    setTotal(r.total)
  }

  useEffect(() => {
    void load()
  }, [page])

  return (
    <Stack spacing={2}>
      <Typography variant="h6" sx={{ fontWeight: 800 }}>
        用户管理
      </Typography>

      <Stack direction="row" spacing={1}>
        <TextField fullWidth size="small" label="手机号/昵称/ID" value={q} onChange={(e) => setQ(e.target.value)} />
        <Button variant="contained" onClick={() => void load()}>
          查询
        </Button>
      </Stack>

      {items.map((u) => (
        <Card key={u.id} variant="outlined">
          <CardContent>
            <Stack direction="row" spacing={1} justifyContent="space-between" alignItems="center">
              <Stack>
                <Typography sx={{ fontWeight: 700 }}>{u.nickname}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {u.phone} · {u.role} · {u.id}
                </Typography>
              </Stack>
              <Button
                color="error"
                onClick={async () => {
                  if (!confirm('确定删除该用户？')) return
                  await adminApi.deleteUser(u.id)
                  await load()
                }}
              >
                删除
              </Button>
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
