import { nanoid } from 'nanoid'
import { getDB } from '../db'
import type { FileRecord } from '../../types/models'
import { getAuthedUserOrThrow, sleep } from './common'

export async function uploadFile(file: File) {
  await getAuthedUserOrThrow()
  const db = await getDB()
  await sleep(200)
  const rec: FileRecord = {
    id: nanoid(),
    name: file.name,
    mime: file.type || 'application/octet-stream',
    size: file.size,
    blob: file,
    createdAt: Date.now(),
  }
  await db.put('files', rec)
  const url = URL.createObjectURL(file)
  return { fileId: rec.id, url }
}

export async function getFileUrl(fileId: string) {
  const db = await getDB()
  const rec = await db.get('files', fileId)
  if (!rec) throw new Error('文件不存在')
  const url = URL.createObjectURL(rec.blob)
  return { url, mime: rec.mime, name: rec.name, size: rec.size }
}
