import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import { initDB } from './db'
import { ensureSeeded } from './seed'
import { config } from './config'
import { authRouter } from './routes/auth'
import { adminRouter } from './routes/admin'
import { postsRouter } from './routes/posts'
import { commentsRouter } from './routes/comments'
import { ratingRouter } from './routes/rating'
import { friendsRouter } from './routes/friends'
import { moderationRouter } from './routes/moderation'
import { uploadRouter } from './routes/upload'
import { videoRouter } from './routes/video'
import { aiRouter } from './routes/ai'
import { usersRouter } from './routes/users'

async function main() {
  await initDB()
  await ensureSeeded()

  const app = express()

  app.use(cors({ origin: true, credentials: true }))
  app.use(morgan('dev'))
  app.use(express.json({ limit: '10mb' }))

  app.get('/health', (_req, res) => res.json({ ok: true }))

  app.use(authRouter)
  app.use(adminRouter)
  app.use(postsRouter)
  app.use(commentsRouter)
  app.use(ratingRouter)
  app.use(friendsRouter)
  app.use(usersRouter)
  app.use(moderationRouter)
  app.use(uploadRouter)
  app.use(videoRouter)
  app.use(aiRouter)

  app.use((err: any, _req: any, res: any, _next: any) => {
    const msg = err?.message || '服务器错误'
    return res.status(500).json({ message: msg })
  })

  app.listen(config.port, () => {
    // eslint-disable-next-line no-console
    console.log(`API listening on http://localhost:${config.port}`)
  })
}

void main()
