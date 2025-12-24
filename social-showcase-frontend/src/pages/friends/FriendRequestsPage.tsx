import { Button, Card, CardContent, Stack, Typography } from '@mui/material'
import { useEffect, useState } from 'react'
import { friendsApi } from '../../services/api/friends'
import type { FriendRequest } from '../../types/models'

export function FriendRequestsPage() {
  const [items, setItems] = useState<FriendRequest[]>([])

  async function load() {
    const r: any = await friendsApi.listRequests()
    setItems(r)
  }

  useEffect(() => {
    void load()
  }, [])

  return (
    <Stack spacing={2}>
      <Typography variant="h6" sx={{ fontWeight: 800 }}>
        好友申请
      </Typography>

      {items.map((r) => (
        <Card key={r.id} variant="outlined">
          <CardContent>
            <Stack spacing={1}>
              <Typography variant="body2">来自用户：{r.fromUserId}</Typography>
              <Typography variant="caption" color="text.secondary">
                状态：{r.status}
              </Typography>
              {r.status === 'pending' && (
                <Stack direction="row" spacing={1}>
                  <Button
                    size="small"
                    variant="contained"
                    onClick={async () => {
                      await friendsApi.accept(r.id)
                      await load()
                    }}
                  >
                    同意
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    color="error"
                    onClick={async () => {
                      await friendsApi.reject(r.id)
                      await load()
                    }}
                  >
                    拒绝
                  </Button>
                </Stack>
              )}
            </Stack>
          </CardContent>
        </Card>
      ))}

      {!items.length && <Typography color="text.secondary">暂无申请</Typography>}
    </Stack>
  )
}
