import { Router } from 'express'
import multer from 'multer'
import fs from 'node:fs'
import path from 'node:path'
import { nanoid } from 'nanoid'
import { z } from 'zod'
import { db, getDataDir } from '../db'
import { authRequired } from '../middleware/auth'
import { now } from '../utils'
import type { FileRecord } from '../types'

export const uploadRouter = Router()

const uploadTmpDir = path.join(getDataDir(), 'uploads_tmp')
const uploadDir = path.join(getDataDir(), 'uploads')
fs.mkdirSync(uploadTmpDir, { recursive: true })
fs.mkdirSync(uploadDir, { recursive: true })

const mem = multer({ storage: multer.memoryStorage() })

uploadRouter.post('/upload/init', authRequired, async (req, res) => {
  const schema = z.object({ fileName: z.string().min(1), size: z.number().optional(), md5: z.string().optional(), type: z.string().optional() })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ message: '参数错误' })

  const uploadId = nanoid()
  const dir = path.join(uploadTmpDir, uploadId)
  fs.mkdirSync(dir, { recursive: true })
  return res.json({ uploadId, chunkSize: 5 * 1024 * 1024 })
})

uploadRouter.post('/upload/chunk', authRequired, mem.single('chunk'), async (req, res) => {
  const uploadId = String((req.body as any).uploadId || '')
  const index = Number((req.body as any).index)
  const file = (req as any).file as Express.Multer.File | undefined
  if (!uploadId || Number.isNaN(index) || !file) return res.status(400).json({ message: '参数错误' })

  const dir = path.join(uploadTmpDir, uploadId)
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(path.join(dir, String(index)), file.buffer)
  return res.json({ success: true })
})

uploadRouter.post('/upload/complete', authRequired, async (req, res) => {
  const schema = z.object({ uploadId: z.string().min(1), fileName: z.string().optional(), mime: z.string().optional() })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ message: '参数错误' })

  const dir = path.join(uploadTmpDir, parsed.data.uploadId)
  if (!fs.existsSync(dir)) return res.status(404).json({ message: 'uploadId 不存在' })

  const parts = fs.readdirSync(dir).map((n) => Number(n)).filter((n) => !Number.isNaN(n)).sort((a, b) => a - b)
  const fileId = nanoid()
  const targetPath = path.join(uploadDir, fileId)

  const ws = fs.createWriteStream(targetPath)
  for (const idx of parts) {
    const buf = fs.readFileSync(path.join(dir, String(idx)))
    ws.write(buf)
  }
  ws.end()
  await new Promise((r) => ws.on('finish', r))

  fs.rmSync(dir, { recursive: true, force: true })

  await db.read()
  const rec: FileRecord = {
    id: fileId,
    name: parsed.data.fileName || fileId,
    mime: parsed.data.mime || 'application/octet-stream',
    size: fs.statSync(targetPath).size,
    path: targetPath,
    createdAt: now(),
  }
  db.data!.files.push(rec)
  await db.write()

  return res.json({ fileId, url: `/files/${fileId}` })
})

uploadRouter.get('/files/:id', async (req, res) => {
  await db.read()
  const rec = db.data!.files.find((f) => f.id === req.params.id)
  if (!rec) return res.status(404).json({ message: '文件不存在' })
  res.setHeader('Content-Type', rec.mime || 'application/octet-stream')
  res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(rec.name)}"`)
  return fs.createReadStream(rec.path).pipe(res)
})
