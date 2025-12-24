import { ENDPOINTS } from '../endpoints'
import { http } from '../http'
import { isMock } from '../runtime'
import { mockComments } from '../../mock/api'
import type { Comment } from '../../types/models'

export const commentsApi = {
  list: (postId: string, page: number, pageSize: number) =>
    isMock() ? mockComments.listComments(postId, page, pageSize) : http<{ items: Comment[]; total: number }>(`${ENDPOINTS.comments.list(postId)}?page=${page}&pageSize=${pageSize}`),

  create: (postId: string, payload: { content: string; parentId?: string }) =>
    isMock() ? mockComments.createComment({ postId, ...payload }) : http<Comment>(ENDPOINTS.comments.create(postId), { method: 'POST', body: JSON.stringify(payload) }),

  remove: (id: string) => (isMock() ? mockComments.deleteComment(id) : http(ENDPOINTS.comments.remove(id), { method: 'DELETE' })),
}
