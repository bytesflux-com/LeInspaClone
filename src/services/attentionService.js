import { callAdmin } from '../lib/firebaseFunctions'
import { attentionMockService } from '../mocks/attentionMockService'

export function isAttentionMockMode() {
  if (import.meta.env.PROD) return false
  return (
    import.meta.env.VITE_USE_MOCK_DATA === 'true' ||
    (import.meta.env.DEV && typeof window !== 'undefined' && window.__LE_INSPA_MOCK_ATTENTION__ === true) ||
    (import.meta.env.DEV && typeof localStorage !== 'undefined' && localStorage.getItem('le_inspa_mock_attention') === 'true')
  )
}

export function setAttentionMockMode(enabled) {
  if (import.meta.env.PROD) return
  if (typeof localStorage !== 'undefined') {
    if (enabled) localStorage.setItem('le_inspa_mock_attention', 'true')
    else localStorage.removeItem('le_inspa_mock_attention')
  }
}

export const attentionService = {
  isMockMode: isAttentionMockMode,
  setMockMode: setAttentionMockMode,

  async getNeedsAttention({ marketId = 'ALL' } = {}) {
    if (isAttentionMockMode()) {
      return attentionMockService.getNeedsAttention({ marketId })
    }
    return callAdmin('adminGetNeedsAttention', { market: marketId })
  },

  async getReviewItem({ sourceType, sourceId, marketId = 'ALL' }) {
    if (isAttentionMockMode()) {
      return attentionMockService.getReviewItem({ sourceType, sourceId, marketId })
    }
    return callAdmin('adminGetReviewItem', { sourceType, sourceId, market: marketId })
  },

  async processReviewAction({ sourceType, sourceId, action, reason = '' }) {
    if (isAttentionMockMode()) {
      return attentionMockService.processReviewAction({ sourceType, sourceId, action, reason })
    }
    return callAdmin('adminProcessReviewAction', { sourceType, sourceId, action, reason })
  },

  async assignQueueItem({ sourceType, sourceId, assigneeId, assigneeName, assigneeEmail }) {
    if (isAttentionMockMode()) {
      return attentionMockService.assignQueueItem({
        sourceType,
        sourceId,
        assigneeId,
        assigneeName,
        assigneeEmail,
      })
    }
    return callAdmin('adminAssignQueueItem', { sourceType, sourceId, assigneeId })
  },
}


