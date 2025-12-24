import { Button, Card, CardContent, Stack, Typography } from '@mui/material'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { friendsApi } from '../../services/api/friends'
import type { User } from '../../types/models'

export function FriendsPage() {
  const nav = useNavigate()
  const [friends, setFriends] = useState<User[]>([])

  useEffect(() => {
    void (async () => {
      const r: any = await friendsApi.listFriends()
      setFriends(r)
    })()
  }, [])

  return (
    <Stack spacing={2}>
      <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
        <Typography variant="h6" sx={{ fontWeight: 800 }}>
          好友
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" onClick={() => nav('/friends/requests')}>
            申请
          </Button>
          <Button variant="outlined" onClick={() => nav('/users')}>
            找人
          </Button>
        </Stack>
      </Stack>

      {friends.map((u) => (
        <Card key={u.id} variant="outlined">
          <CardContent>
            <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
              <Typography sx={{ fontWeight: 700 }}>{u.nickname}</Typography>
              <Button
                size="small"
                color="error"
                onClick={async () => {
                  if (!confirm('确定解除好友？')) return
                  await friendsApi.remove(u.id)
                  const r: any = await friendsApi.listFriends()
                  setFriends(r)
                }}
              >
                解除
              </Button>
            </Stack>
            <Typography variant="caption" color="text.secondary">
              {u.phone}
            </Typography>
          </CardContent>
        </Card>
      ))}

      {!friends.length && <Typography color="text.secondary">暂无好友</Typography>}
    </Stack>
  )
}
