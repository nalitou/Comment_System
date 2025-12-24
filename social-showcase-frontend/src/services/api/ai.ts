import { ENDPOINTS } from '../endpoints'
import { http } from '../http'
import { isMock } from '../runtime'
import { mockAI } from '../../mock/api'
import type { AIAction } from '../../types/models'

export const aiApi = {
  process: (payload: { postId?: string; text?: string; actions: AIAction[] }) =>
    isMock() ? mockAI.createAITask(payload) : http<{ taskId: string }>(ENDPOINTS.ai.process, { method: 'POST', body: JSON.stringify(payload) }),
  task: (taskId: string) => (isMock() ? mockAI.getAITask(taskId) : http(ENDPOINTS.ai.task(taskId))),
}
