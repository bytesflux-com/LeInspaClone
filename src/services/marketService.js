import { MARKETS, DEFAULT_MARKET } from '../constants/markets'

export const marketService = {
  getAllMarkets() {
    return MARKETS
  },

  getAvailableMarkets(permittedMarkets = null) {
    const enabled = MARKETS.filter((m) => m.enabled)
    if (!permittedMarkets || permittedMarkets.includes('ALL')) {
      return enabled
    }
    return enabled.filter((m) => m.isGlobal || permittedMarkets.includes(m.id))
  },

  getMarketById(id) {
    if (!id) return DEFAULT_MARKET
    const normalized = id.toUpperCase()
    return MARKETS.find((m) => m.id === normalized || m.code === normalized) || DEFAULT_MARKET
  },
}

