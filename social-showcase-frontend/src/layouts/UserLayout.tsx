import { AppBar, Box, Button, Container, Toolbar, Typography } from '@mui/material'
import { Link, Outlet, useNavigate } from 'react-router-dom'
import { authStore } from '../store/authStore'

export function UserLayout() {
  const nav = useNavigate()
  const clear = authStore((s) => s.clear)

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50' }}>
      <AppBar position="sticky" elevation={0} sx={{ bgcolor: 'background.paper', color: 'text.primary', borderBottom: '1px solid', borderColor: 'divider' }}>
        <Toolbar>
          <Typography component={Link} to="/" sx={{ textDecoration: 'none', color: 'inherit', fontWeight: 800 }}>
            多媒体展示
          </Typography>
          <Box sx={{ flex: 1 }} />
          <Button component={Link} to="/post/new">发布</Button>
          <Button component={Link} to="/search">检索</Button>
          <Button component={Link} to="/friends">好友</Button>
          <Button component={Link} to="/me">我的</Button>
          <Button
            color="inherit"
            onClick={() => {
              clear()
              nav('/login', { replace: true })
            }}
          >
            退出
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ py: 2 }}>
        <Outlet />
      </Container>
    </Box>
  )
}
