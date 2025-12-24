import { useEffect, useState } from 'react'
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material'
import { ensureSeeded } from '../mock/seed'
import { authApi } from '../services/api/auth'
import { isMock } from '../services/runtime'
import { authStore } from '../store/authStore'

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#1976d2' },
  },
  shape: { borderRadius: 10 },
})

export function Providers(props: { children: React.ReactNode }) {
  const setAuth = authStore((s) => s.setAuth)
  const token = authStore((s) => s.token)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    void (async () => {
      if (isMock()) await ensureSeeded()
      try {
        if (token) {
          const me = await authApi.me()
          setAuth({ token, user: me.user, role: me.role })
        }
      } catch {
        authStore.getState().clear()
      } finally {
        setReady(true)
      }
    })()
  }, [setAuth, token])

  if (!ready) return null

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {props.children}
    </ThemeProvider>
  )
}
