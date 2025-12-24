import { useMemo, useState } from 'react'
import { Alert, Box, Button, Divider, Link, Stack, TextField } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { AuthLayout } from '../../layouts/AuthLayout'
import { authApi } from '../../services/api/auth'
import { authStore } from '../../store/authStore'
import { SUPER_USER } from '../../config/seedAccounts'

export function LoginPage() {
  const nav = useNavigate()
  const setAuth = authStore((s) => s.setAuth)
  const [mode, setMode] = useState<'sms' | 'password'>('sms')
  const [phone, setPhone] = useState(SUPER_USER.phone)
  const [code, setCode] = useState(SUPER_USER.smsCode)
  const [password, setPassword] = useState(SUPER_USER.password)
  const [err, setErr] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const canSubmit = useMemo(() => phone.trim().length >= 11 && (mode === 'sms' ? code.trim().length > 0 : password.trim().length > 0), [code, mode, password, phone])

  async function onSendCode() {
    setErr(null)
    try {
      const r = await authApi.sendSms({ phone: phone.trim(), scene: 'login' })
      // mock 环境下会返回 mockCode，真实环境不会
      const anyR: any = r as any
      if (anyR?.mockCode) setCode(anyR.mockCode)
    } catch (e: any) {
      setErr(e?.message || '发送失败')
    }
  }

  async function onLogin() {
    setErr(null)
    setLoading(true)
    try {
      const r = mode === 'sms' ? await authApi.loginSms({ phone: phone.trim(), code: code.trim() }) : await authApi.loginPassword({ phone: phone.trim(), password: password.trim() })
      setAuth({ token: (r as any).token, user: (r as any).user, role: (r as any).role })
      nav('/', { replace: true })
    } catch (e: any) {
      setErr(e?.message || '登录失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout title="登录">
      <Stack spacing={2}>
        {err && <Alert severity="error">{err}</Alert>}
        <TextField label="手机号" value={phone} onChange={(e) => setPhone(e.target.value)} />

        <Stack direction="row" spacing={1} alignItems="center">
          <Button variant={mode === 'sms' ? 'contained' : 'text'} onClick={() => setMode('sms')}>
            验证码登录
          </Button>
          <Button variant={mode === 'password' ? 'contained' : 'text'} onClick={() => setMode('password')}>
            密码登录
          </Button>
        </Stack>

        {mode === 'sms' ? (
          <Stack direction="row" spacing={1}>
            <TextField fullWidth label="验证码" value={code} onChange={(e) => setCode(e.target.value)} />
            <Button onClick={onSendCode} sx={{ whiteSpace: 'nowrap' }}>
              获取验证码
            </Button>
          </Stack>
        ) : (
          <TextField label="密码" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        )}

        <Button disabled={!canSubmit || loading} variant="contained" onClick={onLogin}>
          登录
        </Button>

        <Box>
          <Link component="button" onClick={() => nav('/register')}>注册</Link>
          <Divider sx={{ my: 1 }} />
          <Link component="button" onClick={() => nav('/reset')}>忘记密码</Link>
        </Box>
      </Stack>
    </AuthLayout>
  )
}
