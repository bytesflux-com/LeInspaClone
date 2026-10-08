import { callAdmin } from '../lib/firebaseFunctions'

export const systemService = {
  async ping() {
    try {
      return await callAdmin('adminPing')
    } catch (err) {
      return { ok: false, error: err.message, time: new Date().toISOString() }
    }
  },
}

