import { useContext } from 'react'
import { AdminContext } from '../context/AdminContext.jsx'

export function useMarketContext() {
  const context = useContext(AdminContext)
  if (!context) {
    throw new Error('useMarketContext must be used within an AdminProvider')
  }
  return {
    selectedMarket: context.selectedMarket,
    setSelectedMarket: context.setSelectedMarket,
    availableMarkets: context.availableMarkets,
    permittedMarkets: context.permittedMarkets,
  }
}

