import { ENDPOINTS } from '../endpoints'
import { http } from '../http'
import { isMock } from '../runtime'
import { mockRating } from '../../mock/api'

export const ratingApi = {
  upsert: (postId: string, score: number) =>
    isMock() ? mockRating.upsertRating(postId, score) : http(ENDPOINTS.rating.upsert(postId), { method: 'POST', body: JSON.stringify({ score }) }),

  summary: (postId: string) => (isMock() ? mockRating.getRatingSummary(postId) : http(ENDPOINTS.rating.summary(postId))),

  my: (postId: string) => (isMock() ? mockRating.getMyRating(postId) : http(`${ENDPOINTS.rating.upsert(postId)}`)),
}
