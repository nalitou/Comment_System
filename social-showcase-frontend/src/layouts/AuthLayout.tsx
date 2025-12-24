import { Box, Container, Paper, Typography } from '@mui/material'

export function AuthLayout(props: { title: string; children: React.ReactNode }) {
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', bgcolor: 'grey.100' }}>
      <Container maxWidth="sm">
        <Paper elevation={2} sx={{ p: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
            {props.title}
          </Typography>
          {props.children}
        </Paper>
      </Container>
    </Box>
  )
}
