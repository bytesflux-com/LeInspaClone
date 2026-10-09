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
<<<<<<< HEAD
    // Raw authorized market codes from the Admin session (e.g. ['KE','UG'] or ['ALL']).
    // Source of truth is AdminContext, which loads from the adminGetSession Cloud Function.
    // Never use this for access control — the backend enforces authorization.
=======
>>>>>>> 34d6fc54f70a52ab6bda0e4055cb0e1c9840e2e7
    permittedMarkets: context.permittedMarkets,
  }
}

