import { useMemo, useState } from 'react'
import { Alert, Button, Divider, Link, Stack, TextField } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { AuthLayout } from '../../layouts/AuthLayout'
import { authApi } from '../../services/api/auth'
import { authStore } from '../../store/authStore'

export function RegisterPage() {
  const nav = useNavigate()
  const setAuth = authStore((s) => s.setAuth)
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [nickname, setNickname] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const canSubmit = useMemo(() => phone.trim().length >= 11 && code.trim().length > 0, [code, phone])

  async function onSendCode() {
    setErr(null)
    try {
      const r = await authApi.sendSms({ phone: phone.trim(), scene: 'register' })
      const anyR: any = r as any
      if (anyR?.mockCode) setCode(anyR.mockCode)
    } catch (e: any) {
      setErr(e?.message || '发送失败')
    }
  }

  async function onRegister() {
    setErr(null)
    setLoading(true)
    try {
      const r: any = await authApi.register({ phone: phone.trim(), code: code.trim(), password: password.trim() || undefined, nickname: nickname.trim() || undefined })
      setAuth({ token: r.token, user: r.user, role: r.role })
      nav('/', { replace: true })
    } catch (e: any) {
      setErr(e?.message || '注册失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout title="注册（手机号 + 验证码）">
      <Stack spacing={2}>
        {err && <Alert severity="error">{err}</Alert>}
        <TextField label="手机号" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <Stack direction="row" spacing={1}>
          <TextField fullWidth label="验证码" value={code} onChange={(e) => setCode(e.target.value)} />
          <Button onClick={onSendCode} sx={{ whiteSpace: 'nowrap' }}>
            获取验证码
          </Button>
        </Stack>
        <TextField label="昵称（可选）" value={nickname} onChange={(e) => setNickname(e.target.value)} />
        <TextField label="设置密码（可选）" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <Button disabled={!canSubmit || loading} variant="contained" onClick={onRegister}>
          注册并登录
        </Button>
        <Divider />
        <Link component="button" onClick={() => nav('/login')}>返回登录</Link>
      </Stack>
    </AuthLayout>
  )
}
