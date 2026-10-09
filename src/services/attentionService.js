import { callAdmin } from '../lib/firebaseFunctions'

export const attentionService = {
  async getNeedsAttention({ marketId = 'ALL' } = {}) {
    return callAdmin('adminGetNeedsAttention', { market: marketId })
  },
}
