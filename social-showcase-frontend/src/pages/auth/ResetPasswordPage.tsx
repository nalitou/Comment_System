import { useMemo, useState } from 'react'
import { Alert, Button, Divider, Link, Stack, TextField } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { AuthLayout } from '../../layouts/AuthLayout'
import { authApi } from '../../services/api/auth'

export function ResetPasswordPage() {
  const nav = useNavigate()
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const canSubmit = useMemo(() => phone.trim().length >= 11 && code.trim().length > 0 && newPassword.trim().length >= 6, [code, newPassword, phone])

  async function onSendCode() {
    setErr(null)
    try {
      const r = await authApi.sendSms({ phone: phone.trim(), scene: 'reset' })
      const anyR: any = r as any
      if (anyR?.mockCode) setCode(anyR.mockCode)
    } catch (e: any) {
      setErr(e?.message || '发送失败')
    }
  }

  async function onReset() {
    setErr(null)
    setLoading(true)
    try {
      await authApi.resetPassword({ phone: phone.trim(), code: code.trim(), newPassword: newPassword.trim() })
      nav('/login', { replace: true })
    } catch (e: any) {
      setErr(e?.message || '重置失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout title="重置密码">
      <Stack spacing={2}>
        {err && <Alert severity="error">{err}</Alert>}
        <TextField label="手机号" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <Stack direction="row" spacing={1}>
          <TextField fullWidth label="验证码" value={code} onChange={(e) => setCode(e.target.value)} />
          <Button onClick={onSendCode} sx={{ whiteSpace: 'nowrap' }}>
            获取验证码
          </Button>
        </Stack>
        <TextField label="新密码（至少 6 位）" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
        <Button disabled={!canSubmit || loading} variant="contained" onClick={onReset}>
          确认重置
        </Button>
        <Divider />
        <Link component="button" onClick={() => nav('/login')}>返回登录</Link>
      </Stack>
    </AuthLayout>
  )
}
