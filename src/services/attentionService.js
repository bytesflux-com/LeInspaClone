import { callAdmin } from '../lib/firebaseFunctions'

<<<<<<< HEAD
// ADM-009 — Needs Your Attention. `marketId` is only a filter; the backend
// (adminGetNeedsAttention) re-checks the admin's permitted markets and
// category permissions. No sandbox/mock fallback: a failed call is an error,
// never an empty queue.
export const attentionService = {
  async getNeedsAttention({ marketId = 'ALL' } = {}) {
    const result = await callAdmin('adminGetNeedsAttention', { market: marketId })
    if (!result || !result.summary || !Array.isArray(result.items) || !result.categories) {
      throw new Error('Unexpected response from the attention queue.')
    }
    return result
=======
export const attentionService = {
  async getNeedsAttention({ marketId = 'ALL' } = {}) {
    return callAdmin('adminGetNeedsAttention', { market: marketId })
>>>>>>> 34d6fc54f70a52ab6bda0e4055cb0e1c9840e2e7
  },
}
