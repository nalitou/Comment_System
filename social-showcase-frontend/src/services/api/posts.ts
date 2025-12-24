import { ENDPOINTS } from '../endpoints'
import { http } from '../http'
import { isMock } from '../runtime'
import { mockPosts } from '../../mock/api'
import type { Post, Visibility } from '../../types/models'

function qs(obj: Record<string, unknown>) {
  const sp = new URLSearchParams()
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null) continue
    sp.set(k, String(v))
  }
  return sp.toString()
}

export const postsApi = {
  list: (query: {
    q?: string
    tag?: string
    dateFrom?: number
    dateTo?: number
    onlyMine?: boolean
    onlyFriendsFeed?: boolean
    page: number
    pageSize: number
  }) => (isMock() ? mockPosts.listPosts(query) : http<{ items: Post[]; total: number }>(`${ENDPOINTS.posts.list}?${qs(query as any)}`)),

  detail: (id: string) => (isMock() ? mockPosts.getPostDetail(id) : http<Post>(ENDPOINTS.posts.detail(id))),

  create: (payload: {
    title?: string
    text?: string
    tags?: string[]
    visibility: Visibility
    media: { kind: 'image' | 'video'; fileId?: string; url?: string; coverUrl?: string; durationSec?: number }[]
  }) => (isMock() ? mockPosts.createPost(payload) : http<Post>(ENDPOINTS.posts.create, { method: 'POST', body: JSON.stringify(payload) })),

  update: (id: string, payload: Partial<Post>) =>
    isMock() ? mockPosts.updatePost(id, payload) : http<Post>(ENDPOINTS.posts.update(id), { method: 'PUT', body: JSON.stringify(payload) }),

  remove: (id: string) => (isMock() ? mockPosts.deletePost(id) : http(ENDPOINTS.posts.remove(id), { method: 'DELETE' })),

  tags: () => (isMock() ? mockPosts.listTags() : http(ENDPOINTS.posts.tags)),
}
