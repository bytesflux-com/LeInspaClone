import { useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { CalendarDays, CalendarX2, CircleCheck, CircleX, Clock, CreditCard, Hourglass, Play, Receipt, ShieldAlert, TriangleAlert, UsersRound } from 'lucide-react'
import ErrorState from '../../components/ui/ErrorState'
import { useMarketContext } from '../../hooks/useMarketContext'
import { useDateRange } from '../../hooks/useDateRange'
import { usePermissions } from '../../hooks/usePermissions'
import { useBookingDashboard } from '../../hooks/useBookingOps'
import { bookingOpsService } from '../../services/bookingOpsService'
import { PERMISSIONS } from '../../constants/permissions'
import { formatCompactCurrency } from '../../lib/currency'
import { downloadTextFile, toCsv } from '../../lib/download'
import { AttentionPanel, KpiCards, OpsHeader } from '../../components/bookings/OpsUI'
import {
  ActivityChart,
  AssignmentHealth,
  CancellationCard,
  MarketPerformance,
  PaymentHealth,
  ProviderBreakdown,
  RecentBookings,
  SourceCard,
  StatusOverview,
} from '../../components/bookings/DashboardSections'

// Issue cards deep-link into the workspace that owns the problem — no
// duplicate workflows on the dashboard.
const ATTENTION = [
  { id: 'conflicts', label: 'Booking Conflicts', tone: 'red', icon: CalendarX2, to: '/bookings/active?issue=conflict' },
  { id: 'paymentIssues', label: 'Payment Issues', tone: 'orange', icon: CreditCard, to: '/bookings/active?issue=payment_issue' },
  { id: 'unassigned', label: 'Unassigned Bookings', tone: 'orange', icon: UsersRound, to: '/bookings/upcoming?issue=unassigned' },
  { id: 'serviceProblems', label: 'Service Problems', tone: 'red', icon: TriangleAlert, to: '/bookings/ongoing?issue=service_problem' },
  { id: 'disputed', label: 'Disputed Bookings', tone: 'purple', icon: ShieldAlert, to: '/disputes' },
  { id: 'awaitingCompletion', label: 'Awaiting Completion', tone: 'orange', icon: Hourglass, to: '/bookings/active?tab=awaiting_completion' },
]

// Dashboard export: the figures on screen, one metric per row.
function dashboardCsv(d) {
  const rows = [
    ...Object.entries(d.kpis).filter(([k]) => k !== 'value').map(([k, v]) => ['KPI', k, v]),
    ...Object.entries(d.attention).map(([k, v]) => ['Needs attention', k, v]),
    ...d.statusOverview.map((s) => ['Booking status', s.status, s.count]),
    ...Object.entries(d.payment).map(([k, v]) => ['Payment', k, v]),
    ...Object.entries(d.assignment).map(([k, v]) => ['Assignment', k, v]),
    ...d.sources.map((s) => ['Source', s.label, s.count]),
    ...d.markets.map((m) => ['Market bookings', m.name, m.bookings]),
  ]
  return toCsv(rows, [{ label: 'Section', value: (r) => r[0] }, { label: 'Metric', value: (r) => r[1] }, { label: 'Value', value: (r) => r[2] }])
}

// Booking value never sums different currencies.
function valueKpi(value) {
  if (!value) return null
  if (value.mode === 'single') return { display: value.currency ? formatCompactCurrency(value.amount, value.currency) : '—', sub: null }
  const top = value.byMarket.slice(0, 2).map((m) => `${m.name} ${formatCompactCurrency(m.amount, m.currency)}`).join(' · ')
  return { display: 'Multiple currencies', sub: top || 'By market', small: true }
}

// ADM-044 — Booking Management Dashboard: the overview layer over the shared
// bookings collection. Monitor → Detect → Filter → Investigate → Resolve.
export default function BookingManagement() {
  const navigate = useNavigate()
  const [sp, setSp] = useSearchParams()
  const { selectedMarket, setSelectedMarket } = useMarketContext()
  const { dateRange, customRange } = useDateRange()
  const { can } = usePermissions()
  const canView = can(PERMISSIONS.BOOKINGS_VIEW)
  const finance = can(PERMISSIONS.FINANCE_VIEW)
  const providerType = sp.get('pt') || ''

  const params = useMemo(
    () => ({ market: selectedMarket.id, providerType, dateRange, customRange: dateRange === 'custom' ? customRange : null }),
    [selectedMarket.id, providerType, dateRange, customRange],
  )
  const { data, error, fetching, refetch } = useBookingDashboard(params, canView)

  const setProviderType = (pt) => {
    const next = new URLSearchParams(sp)
    if (pt) next.set('pt', pt)
    else next.delete('pt')
    setSp(next, { replace: true })
  }

  const header = (
    <OpsHeader
      crumb="Booking Management"
      title="Booking Management"
      subtitle="Monitor booking activity and operational health across Lé Inspa."
      market={selectedMarket}
      providerType={providerType}
      onProviderType={setProviderType}
      onRefresh={refetch}
      fetching={fetching}
      generatedAt={data?.context?.generatedAt}
      demo={bookingOpsService.isMock}
      canExport={Boolean(data?.context?.canExport)}
      onExport={() => data && downloadTextFile(`le-inspa-booking-dashboard-${selectedMarket.id}-${dateRange}.csv`, dashboardCsv(data))}
    />
  )

  if (!canView) {
    return (
      <div className="px-4 pt-3 pb-6">
        {header}
        <div className="mx-auto mt-6 max-w-xl"><ErrorState title="You don't have access to bookings" description="Your role does not include booking visibility. Ask a Super Admin to grant bookings access." /></div>
      </div>
    )
  }

  const value = finance ? valueKpi(data?.kpis?.value) : null
  const kpiItems = [
    { key: 'total', label: 'Total Bookings', icon: CalendarDays, color: 'purple', to: '/bookings/active' },
    { key: 'upcoming', label: 'Upcoming', icon: Clock, color: 'blue', to: '/bookings/upcoming', sub: 'Scheduled ahead' },
    { key: 'ongoing', label: 'Ongoing', icon: Play, color: 'orange', to: '/bookings/ongoing', sub: 'In progress now' },
    { key: 'completed', label: 'Completed', icon: CircleCheck, color: 'green', to: '/bookings/completed' },
    { key: 'cancelled', label: 'Cancelled', icon: CircleX, color: 'red', to: '/bookings/cancelled' },
    ...(finance ? [{ key: 'value', label: 'Booking Value', icon: Receipt, color: 'grey', display: value?.display, sub: value?.sub, small: value?.small }] : []),
  ]
  const kpiValues = data?.kpis && { ...data.kpis, value: 0 }

  return (
    <div className="min-h-full space-y-3 px-4 pt-3 pb-6">
      {header}

      {error && !data ? (
        <ErrorState title="Unable to load booking operations" description={error} onRetry={refetch} />
      ) : (
        <div className={fetching ? 'space-y-3 opacity-70 transition-opacity' : 'space-y-3 transition-opacity'}>
          {data?.truncated && (
            <p className="rounded-lg bg-[#fff8eb] px-3 py-2 text-[12px] text-[#9a5a06]">Booking volume exceeded the live query window, so some counts reflect the most recent bookings only.</p>
          )}
          {error && <p role="alert" className="rounded-lg bg-[#fff1f1] px-3 py-2 text-[12px] text-[#b91c1c]">{error} <button type="button" onClick={refetch} className="font-semibold underline">Retry</button></p>}

          <KpiCards items={kpiItems} values={kpiValues} trends={data?.trends} />
          <AttentionPanel
            subtitle="Key booking issues that require admin review."
            items={data && ATTENTION.map((a) => ({ ...a, count: data.attention[a.id] }))}
            loading={!data}
            viewAll={{ to: '/bookings/active?tab=needs_attention', label: 'View All Issues' }}
          />

          <div className="grid gap-3 xl:grid-cols-[1fr_1.25fr_1fr]">
            <StatusOverview data={data} />
            <ActivityChart activity={data?.activity} />
            <ProviderBreakdown providerTypes={data?.providerTypes} />
          </div>

          <div className={selectedMarket.isGlobal ? 'grid gap-3 md:grid-cols-2 xl:grid-cols-[1.55fr_1fr_1fr_1fr]' : 'grid gap-3 md:grid-cols-3'}>
            {selectedMarket.isGlobal && <MarketPerformance markets={data?.markets} onSelectMarket={setSelectedMarket} />}
            <PaymentHealth payment={data?.payment} />
            <AssignmentHealth assignment={data?.assignment} />
            <CancellationCard cancellations={data?.cancellations} />
          </div>

          <div className="grid gap-3 xl:grid-cols-[minmax(0,3fr)_minmax(260px,1fr)]">
            <RecentBookings recent={data?.recent} asOf={data?.context?.generatedAt || new Date().toISOString()} onOpen={(b) => navigate(`/bookings/active?b=${b.id}`)} />
            <SourceCard sources={data?.sources} />
          </div>
        </div>
      )}
    </div>
  )
}
