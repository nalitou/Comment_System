import { API_BASE_URL } from '../../config/env'
import { ENDPOINTS } from '../endpoints'
import { http } from '../http'
import { isMock } from '../runtime'
import { mockUpload } from '../../mock/api'

function absUrl(url: string) {
  if (!url) return url
  if (/^(https?:|blob:|data:)/.test(url)) return url
  if (url.startsWith('/')) return `${API_BASE_URL}${url}`
  return url
}

export const uploadApi = {
  uploadFile: async (file: File) => {
    if (isMock()) return mockUpload.uploadFile(file)

    const init = await http<{ uploadId: string; chunkSize: number }>(ENDPOINTS.upload.init, {
      method: 'POST',
      body: JSON.stringify({ fileName: file.name, size: file.size, type: file.type }),
    })

    const { uploadId, chunkSize } = init

    let index = 0
    for (let offset = 0; offset < file.size; offset += chunkSize) {
      const chunk = file.slice(offset, Math.min(file.size, offset + chunkSize))
      const fd = new FormData()
      fd.append('uploadId', uploadId)
      fd.append('index', String(index))
      fd.append('chunk', chunk, file.name)
      await http<{ success: true }>(ENDPOINTS.upload.chunk, { method: 'POST', body: fd })
      index++
    }

    const done = await http<{ fileId: string; url: string }>(ENDPOINTS.upload.complete, {
      method: 'POST',
      body: JSON.stringify({ uploadId, fileName: file.name, mime: file.type }),
    })

    return { fileId: done.fileId, url: absUrl(done.url) }
  },

  getFileUrl: async (fileId: string) => {
    if (isMock()) return mockUpload.getFileUrl(fileId)
    const url = `${API_BASE_URL}/files/${encodeURIComponent(fileId)}`
    return { url }
  },
}
