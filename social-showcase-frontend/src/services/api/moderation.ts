import { ENDPOINTS } from '../endpoints'
import { http } from '../http'
import { isMock } from '../runtime'
import { mockModeration } from '../../mock/api'

export const moderationApi = {
  words: () => (isMock() ? mockModeration.getSensitiveWords() : http<string[]>(ENDPOINTS.moderation.sensitiveWords)),
  checkText: (text: string) =>
    isMock()
      ? mockModeration.checkText(text)
      : http<{ allowed: boolean; hits: string[]; maskedText?: string }>(ENDPOINTS.moderation.text, { method: 'POST', body: JSON.stringify({ text }) }),
}
