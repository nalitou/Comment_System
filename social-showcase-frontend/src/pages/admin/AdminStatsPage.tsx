import { Box, Card, CardContent, Stack, Typography } from '@mui/material'
import { useEffect, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { adminApi } from '../../services/api/admin'

export function AdminStatsPage() {
  const [trend, setTrend] = useState<{ date: string; count: number }[]>([])
  const [typeRatio, setTypeRatio] = useState<any>(null)
  const [topTags, setTopTags] = useState<{ tag: string; count: number }[]>([])

  useEffect(() => {
    void (async () => {
      const r: any = await adminApi.stats()
      setTrend(r.trend || [])
      setTypeRatio(r.typeRatio || null)
      setTopTags(r.topTags || [])
    })()
  }, [])

  const ratioData = typeRatio
    ? [
        { name: 'text', value: typeRatio.text || 0 },
        { name: 'image', value: typeRatio.image || 0 },
        { name: 'video', value: typeRatio.video || 0 },
        { name: 'mixed', value: typeRatio.mixed || 0 },
      ]
    : []

  return (
    <Stack spacing={2}>
      <Typography variant="h6" sx={{ fontWeight: 800 }}>
        统计分析
      </Typography>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' },
          gap: 2,
        }}
      >
        <Card variant="outlined">
          <CardContent>
            <Typography sx={{ fontWeight: 700, mb: 1 }}>发布量趋势</Typography>
            <div style={{ width: '100%', height: 280 }}>
              <ResponsiveContainer>
                <LineChart data={trend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="#1976d2" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card variant="outlined">
          <CardContent>
            <Typography sx={{ fontWeight: 700, mb: 1 }}>内容类型占比（柱状）</Typography>
            <div style={{ width: '100%', height: 280 }}>
              <ResponsiveContainer>
                <BarChart data={ratioData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#1976d2" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </Box>

      <Card variant="outlined">
        <CardContent>
          <Typography sx={{ fontWeight: 700, mb: 1 }}>热门标签 Top 10</Typography>
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
              <BarChart data={topTags} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" allowDecimals={false} />
                <YAxis type="category" dataKey="tag" width={120} />
                <Tooltip />
                <Bar dataKey="count" fill="#1976d2" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </Stack>
  )
}
