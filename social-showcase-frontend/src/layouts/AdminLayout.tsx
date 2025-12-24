import { AppBar, Box, Button, Container, Toolbar, Typography } from '@mui/material'
import { Link, Outlet, useNavigate } from 'react-router-dom'
import { authStore } from '../store/authStore'

export function AdminLayout() {
  const nav = useNavigate()
  const clear = authStore((s) => s.clear)

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50' }}>
      <AppBar position="sticky" elevation={0} sx={{ bgcolor: 'background.paper', color: 'text.primary', borderBottom: '1px solid', borderColor: 'divider' }}>
        <Toolbar>
          <Typography component={Link} to="/admin" sx={{ textDecoration: 'none', color: 'inherit', fontWeight: 800 }}>
            管理后台
          </Typography>
          <Box sx={{ flex: 1 }} />
          <Button component={Link} to="/admin/users">用户</Button>
          <Button component={Link} to="/admin/posts">内容</Button>
          <Button component={Link} to="/admin/stats">统计</Button>
          <Button
            color="inherit"
            onClick={() => {
              clear()
              nav('/admin/login', { replace: true })
            }}
          >
            退出
          </Button>
        </Toolbar>
      </AppBar>
      <Container maxWidth="lg" sx={{ py: 2 }}>
        <Outlet />
      </Container>
    </Box>
  )
}
