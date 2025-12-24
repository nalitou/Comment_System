import { Alert, Button, Card, CardContent, Stack, TextField, Typography } from '@mui/material'
import { useState } from 'react'
import { friendsApi } from '../../services/api/friends'
import type { User } from '../../types/models'

export function UserSearchPage() {
  const [q, setQ] = useState('')
  const [items, setItems] = useState<User[]>([])
  const [err, setErr] = useState<string | null>(null)

  async function onSearch() {
    setErr(null)
    try {
      const r: any = await friendsApi.searchUsers(q)
      setItems(r)
    } catch (e: any) {
      setErr(e?.message || '搜索失败')
    }
  }

  return (
    <Stack spacing={2}>
      <Typography variant="h6" sx={{ fontWeight: 800 }}>
        查找用户
      </Typography>
      {err && <Alert severity="error">{err}</Alert>}

      <Stack direction="row" spacing={1}>
        <TextField fullWidth label="手机号/昵称/ID" value={q} onChange={(e) => setQ(e.target.value)} />
        <Button variant="contained" onClick={() => void onSearch()}>
          搜索
        </Button>
      </Stack>

      {items.map((u) => (
        <Card key={u.id} variant="outlined">
          <CardContent>
            <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
              <Stack>
                <Typography sx={{ fontWeight: 700 }}>{u.nickname}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {u.phone}
                </Typography>
              </Stack>
              <Button
                variant="outlined"
                onClick={async () => {
                  try {
                    await friendsApi.sendRequest(u.id)
                    alert('已发送好友申请')
                  } catch (e: any) {
                    alert(e?.message || '发送失败')
                  }
                }}
              >
                加好友
              </Button>
            </Stack>
          </CardContent>
        </Card>
      ))}

      {!items.length && <Typography color="text.secondary">暂无结果</Typography>}
    </Stack>
  )
}
