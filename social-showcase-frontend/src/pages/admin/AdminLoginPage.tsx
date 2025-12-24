import { Alert, Button, Divider, Stack, TextField } from '@mui/material'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthLayout } from '../../layouts/AuthLayout'
import { adminApi } from '../../services/api/admin'
import { authStore } from '../../store/authStore'
import { ADMIN_USER } from '../../config/seedAccounts'

export function AdminLoginPage() {
  const nav = useNavigate()
  const setAuth = authStore((s) => s.setAuth)

  const [username, setUsername] = useState(ADMIN_USER.username)
  const [password, setPassword] = useState(ADMIN_USER.password)
  const [err, setErr] = useState<string | null>(null)

  async function onLogin() {
    setErr(null)
    try {
      const r: any = await adminApi.login({ username: username.trim(), password: password.trim() })
      setAuth({ token: r.token, user: r.admin, role: 'admin' })
      nav('/admin', { replace: true })
    } catch (e: any) {
      setErr(e?.message || '登录失败')
    }
  }

  return (
    <AuthLayout title="管理后台登录">
      <Stack spacing={2}>
        {err && <Alert severity="error">{err}</Alert>}
        <TextField label="账号" value={username} onChange={(e) => setUsername(e.target.value)} />
        <TextField label="密码" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <Button variant="contained" onClick={() => void onLogin()}>
          登录
        </Button>
        <Divider />
      </Stack>
    </AuthLayout>
  )
}
