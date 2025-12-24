import { Alert, Button, Card, CardContent, Divider, Stack, TextField, Typography } from '@mui/material'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi } from '../../services/api/auth'
import { uploadApi } from '../../services/api/upload'
import { authStore } from '../../store/authStore'

export function ProfilePage() {
  const nav = useNavigate()
  const user = authStore((s) => s.user)
  const setAuth = authStore((s) => s.setAuth)
  const token = authStore((s) => s.token)

  const [nickname, setNickname] = useState('')
  const [bio, setBio] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const [ok, setOk] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    setNickname(user.nickname || '')
    setBio(user.bio || '')
    setAvatarUrl(user.avatarUrl || '')
  }, [user])

  async function onPickAvatar(ev: React.ChangeEvent<HTMLInputElement>) {
    const f = (ev.target.files ?? [])[0]
    if (!f) return
    const r = await uploadApi.uploadFile(f)
    setAvatarUrl(r.url)
    ev.target.value = ''
  }

  async function onSave() {
    if (!token || !user) return
    setErr(null)
    setOk(null)
    try {
      const r: any = await authApi.updateMe({ nickname: nickname.trim() || undefined, bio: bio.trim() || undefined, avatarUrl: avatarUrl.trim() || undefined, password: password.trim() || undefined })
      setAuth({ token, user: r.user, role: r.user.role })
      setPassword('')
      setOk('已保存')
    } catch (e: any) {
      setErr(e?.message || '保存失败')
    }
  }

  if (!user) return null

  return (
    <Stack spacing={2}>
      <Typography variant="h6" sx={{ fontWeight: 800 }}>
        我的资料
      </Typography>
      {err && <Alert severity="error">{err}</Alert>}
      {ok && <Alert severity="success">{ok}</Alert>}

      <Card variant="outlined">
        <CardContent>
          <Stack spacing={2}>
            <Typography variant="body2" color="text.secondary">
              手机号：{user.phone} · 角色：{user.role}
            </Typography>
            <TextField label="昵称" value={nickname} onChange={(e) => setNickname(e.target.value)} />
            <TextField label="简介" value={bio} onChange={(e) => setBio(e.target.value)} multiline minRows={2} />
            <Stack direction="row" spacing={1} alignItems="center">
              <TextField fullWidth label="头像 URL（或上传）" value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} />
              <Button component="label" variant="outlined">
                上传
                <input hidden type="file" accept="image/*" onChange={onPickAvatar} />
              </Button>
            </Stack>
            <Divider />
            <TextField label="设置/修改登录密码" type="password" value={password} onChange={(e) => setPassword(e.target.value)} helperText="留空则不修改" />
            <Button variant="contained" onClick={() => void onSave()}>
              保存
            </Button>
            <Divider />
            <Button variant="outlined" onClick={() => nav('/me/posts')}>
              查看我的发布
            </Button>
            <Button variant="outlined" onClick={() => nav('/admin/login')}>
              进入管理后台（需管理员登录）
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  )
}
