import { useContext } from 'react'
import { AdminContext } from '../context/AdminContext.jsx'
import { DATE_RANGES } from '../constants/markets'

export function useDateRange() {
  const context = useContext(AdminContext)
  if (!context) {
    throw new Error('useDateRange must be used within an AdminProvider')
  }

  const currentOption = DATE_RANGES.find((r) => r.id === context.dateRange) || DATE_RANGES[0]

  return {
    dateRange: context.dateRange,
    setDateRange: context.setDateRange,
    dateRangeLabel: currentOption.label,
    availableRanges: DATE_RANGES,
    customRange: context.customRange,
    setCustomRange: context.setCustomRange,
  }
}

