import test from 'node:test'
import assert from 'node:assert/strict'
import {
  calculateBookingsSummary,
  filterProviderBookings,
  calculateTopServices,
  getEarningsChartPoints,
} from '../src/providerBookingsLogic.js'

test('ADM-024 Logic: calculateBookingsSummary accurately computes booking counts, ledger & performance', () => {
  const sampleBookings = [
    { id: 'LI-48291', status: 'confirmed', escrowStatus: 'held', amount: 4500, clientId: 'CL-01', serviceName: 'Deep Tissue Massage' },
    { id: 'LI-47182', status: 'completed', escrowStatus: 'released', amount: 3500, clientId: 'CL-02', serviceName: 'Swedish Massage' },
    { id: 'LI-46021', status: 'cancelled', escrowStatus: 'refunded', amount: 6000, clientId: 'CL-01', serviceName: 'Sports Massage' },
    { id: 'LI-45891', status: 'completed', escrowStatus: 'released', amount: 4000, clientId: 'CL-03', serviceName: 'Deep Tissue Massage' },
    { id: 'LI-45231', status: 'confirmed', escrowStatus: 'held', amount: 4500, clientId: 'CL-04', serviceName: 'Prenatal Massage' },
  ]

  const ledger = {
    grossServiceValue: 1140000,
    providerEarnings: 1026500,
    platformFees: 113500,
    pendingEscrow: 98200,
    availableBalance: 342800,
    paidOut: 586300,
    escrowHeld: 98200,
    escrowReleased: 870300,
    escrowDisputed: 12000,
    escrowRefunded: 15500,
    pendingWithdrawal: 45000,
  }

  const summary = calculateBookingsSummary(sampleBookings, ledger)

  // Verify counts
  assert.equal(summary.counts.total, 5)
  assert.equal(summary.counts.upcoming, 2)
  assert.equal(summary.counts.completed, 2)
  assert.equal(summary.counts.cancelled, 1)

  // Verify financial figures match ledger
  assert.equal(summary.financials.grossServiceValue, 1140000)
  assert.equal(summary.financials.providerEarnings, 1026500)
  assert.equal(summary.financials.platformFees, 113500)
  assert.equal(summary.financials.pendingEscrow, 98200)
  assert.equal(summary.financials.availableBalance, 342800)
  assert.equal(summary.financials.paidOut, 586300)

  // Verify escrow positions
  assert.equal(summary.escrowPositions.held, 98200)
  assert.equal(summary.escrowPositions.released, 870300)
  assert.equal(summary.escrowPositions.disputed, 12000)
  assert.equal(summary.escrowPositions.refunded, 15500)

  // Verify withdrawal positions
  assert.equal(summary.withdrawalPositions.availableToWithdraw, 342800)
  assert.equal(summary.withdrawalPositions.pendingWithdrawal, 45000)
  assert.equal(summary.withdrawalPositions.recentRequest.id, 'WD-82914')
})

test('ADM-024 Logic: filterProviderBookings properly filters by tab and search query', () => {
  const bookings = [
    { id: 'LI-48291', bookingId: 'LI-48291', clientName: 'Wallen Nyaberi', serviceName: 'Deep Tissue Massage', status: 'confirmed', escrowStatus: 'held', paymentStatus: 'paid' },
    { id: 'LI-47182', bookingId: 'LI-47182', clientName: 'Sarah Achieng', serviceName: 'Swedish Massage', status: 'completed', escrowStatus: 'released', paymentStatus: 'paid' },
    { id: 'LI-46021', bookingId: 'LI-46021', clientName: 'Daniel Kimani', serviceName: 'Sports Massage', status: 'cancelled', escrowStatus: 'refunded', paymentStatus: 'refunded' },
  ]

  // Filter tab 'completed'
  const completed = filterProviderBookings(bookings, { tab: 'completed' })
  assert.equal(completed.length, 1)
  assert.equal(completed[0].id, 'LI-47182')

  // Search by client name
  const searched = filterProviderBookings(bookings, { search: 'Sarah' })
  assert.equal(searched.length, 1)
  assert.equal(searched[0].clientName, 'Sarah Achieng')

  // Search by booking ID
  const searchedId = filterProviderBookings(bookings, { search: '46021' })
  assert.equal(searchedId.length, 1)
  assert.equal(searchedId[0].id, 'LI-46021')
})

test('ADM-024 Logic: calculateTopServices correctly ranks services by volume and calculates revenue', () => {
  const bookings = [
    { serviceName: 'Deep Tissue Massage', amount: 4500, status: 'completed' },
    { serviceName: 'Deep Tissue Massage', amount: 4500, status: 'completed' },
    { serviceName: 'Deep Tissue Massage', amount: 4500, status: 'completed' },
    { serviceName: 'Swedish Massage', amount: 3500, status: 'completed' },
    { serviceName: 'Swedish Massage', amount: 3500, status: 'completed' },
    { serviceName: 'Sports Massage', amount: 6000, status: 'completed' },
  ]

  const top = calculateTopServices(bookings)
  assert.equal(top.length, 3)
  assert.equal(top[0].name, 'Deep Tissue Massage')
  assert.equal(top[0].bookings, 3)
  assert.equal(top[0].revenue, 13500)
  assert.equal(top[1].name, 'Swedish Massage')
  assert.equal(top[1].bookings, 2)
  assert.equal(top[2].name, 'Sports Massage')
  assert.equal(top[2].bookings, 1)
})

test('ADM-024 Logic: getEarningsChartPoints returns data points for all time periods', () => {
  const p7d = getEarningsChartPoints('7d')
  assert.equal(p7d.length, 7)

  const p30d = getEarningsChartPoints('30d')
  assert.equal(p30d.length, 5)
  assert.equal(p30d[0].date, '12 Aug')
  assert.equal(p30d[4].date, '9 Sep')

  const p90d = getEarningsChartPoints('90d')
  assert.equal(p90d.length, 6)

  const p12m = getEarningsChartPoints('12m')
  assert.equal(p12m.length, 6)
})

