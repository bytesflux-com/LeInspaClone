// import { Link } from 'react-router'
// import { AlertCircle, Banknote, Camera, Clock, FileCheck, LifeBuoy, ShieldAlert, AlertTriangle } from 'lucide-react'
// import PageContainer from '../../components/layout/PageContainer'
// import Card from '../../components/ui/Card'
// import Badge from '../../components/ui/Badge'
// import CountryFlag from '../../components/ui/CountryFlag'
// import LoadingState from '../../components/ui/LoadingState'
// import ErrorState from '../../components/ui/ErrorState'
// import EmptyState from '../../components/ui/EmptyState'
// import { useMarketContext } from '../../hooks/useMarketContext'
// import { useNeedsAttention } from '../../hooks/useNeedsAttention'
// import { MARKETS } from '../../constants/markets'

// // ---------------------------------------------------------------------------
// // ADM-009 — Needs Your Attention (Phase 2: Country / Market Context Layer)
// //
// // Market authorization is sourced exclusively from AdminContext → adminGetSession
// // (Cloud Function). The frontend never decides which markets an Admin may access.
// // The selectedMarket is only a UI filter — backend calls must enforce access.
// // ---------------------------------------------------------------------------

// /**
//  * Returns a human-readable description of what "All Markets" means for this Admin.
//  * "All Markets" always means ONLY the markets this Admin is authorized for —
//  * never every country in the platform.
//  */
// function resolveAllMarketsLabel(permittedMarkets, availableMarkets) {
//   // permittedMarkets comes from the server session (adminGetSession).
//   // If the Admin has ['ALL'], they see every enabled market; otherwise only their list.
//   if (!permittedMarkets || permittedMarkets.includes('ALL')) {
//     // Super-admin or global: list all enabled non-global markets
//     const names = availableMarkets
//       .filter((m) => !m.isGlobal)
//       .map((m) => m.name)
//     return names.length > 0 ? names.join(', ') : 'All enabled markets'
//   }
//   // Country-admin: only their authorized codes
//   const authorized = MARKETS.filter(
//     (m) => !m.isGlobal && permittedMarkets.includes(m.code),
//   )
//   return authorized.length > 0 ? authorized.map((m) => m.name).join(', ') : 'No markets authorized'
// }

// // ---------------------------------------------------------------------------
// // Queue category definitions (Phase 3+ will replace counts with live Firestore)
// // ---------------------------------------------------------------------------
// const QUEUE_CATEGORIES = [
//   {
//     id: 'verification',
//     title: 'Provider Verifications',
//     icon: FileCheck,
//     badgeVariant: 'warning',
//     route: '/verifications',
//     description: 'Applications pending document verification',
//   },
//   {
//     id: 'withdrawal',
//     title: 'Pending Withdrawals',
//     icon: Banknote,
//     badgeVariant: 'warning',
//     route: '/withdrawals',
//     description: 'Provider payout batches awaiting authorization',
//   },
//   {
//     id: 'dispute',
//     title: 'Disputes & Refunds',
//     icon: AlertTriangle,
//     badgeVariant: 'danger',
//     route: '/disputes',
//     description: 'Booking disputes awaiting resolution',
//   },
//   {
//     id: 'support',
//     title: 'Open Support Tickets',
//     icon: LifeBuoy,
//     badgeVariant: 'default',
//     route: '/support',
//     description: 'Unassigned customer & partner tickets',
//   },
// ]

// // ---------------------------------------------------------------------------
// // Dev-mode market indicator (Step 8)
// // Renders a small pill showing the current resolved market state.
// // Visible only in development builds; removed automatically in production.
// // ---------------------------------------------------------------------------
// function DevMarketIndicator({ selectedMarket, allMarketsLabel }) {
//   if (import.meta.env.PROD) return null
//   const label =
//     selectedMarket.isGlobal
//       ? `All Markets → ${allMarketsLabel}`
//       : selectedMarket.name

//   return (
//     <div
//       aria-label="Development market context indicator"
//       className="flex items-center gap-2 rounded-lg border border-dashed border-amber-300 bg-amber-50/70 px-3 py-1.5 text-[11px] font-mono text-amber-800"
//     >
//       <span className="font-bold">DEV</span>
//       <span className="text-amber-600">|</span>
//       <span>
//         selectedMarket ={' '}
//         <span className="font-semibold">{selectedMarket.code}</span>
//       </span>
//       <span className="text-amber-600">|</span>
//       <span className="truncate max-w-xs">{label}</span>
//     </div>
//   )
// }

// // ---------------------------------------------------------------------------
// // Queue category card (live counts)
// // ---------------------------------------------------------------------------
// function QueueCategoryCard({ category, data }) {
//   const Icon = category.icon
//   const catData = data?.categories?.[category.id]
//   const isOk = catData?.state === 'ok'
//   const isPermitted = catData?.permitted ?? true

//   let countDisplay = '—'
//   if (!isPermitted) countDisplay = '🔒'
//   else if (catData?.state === 'restricted') countDisplay = '—'
//   else if (catData?.state === 'error') countDisplay = '⚠️'
//   else if (isOk && catData.total !== null) countDisplay = catData.total

//   return (
//     <Link to={category.route} className="group flex flex-col justify-between rounded-xl border border-gray-100 bg-gray-50/60 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-royal-300 hover:bg-white hover:shadow-md">
//       <div>
//         <div className="flex items-center justify-between">
//           <div className="flex size-8 items-center justify-center rounded-lg border border-gray-100 bg-white text-royal-700 shadow-2xs group-hover:bg-royal-50 group-hover:text-royal-900">
//             <Icon className="size-4" />
//           </div>
//           {isOk && catData.total > 0 && (
//             <Badge variant={category.badgeVariant} size="sm">
//               Needs Action
//             </Badge>
//           )}
//         </div>
//         <div className="mt-3">
//           <div className="text-2xl font-extrabold text-royal-950">{countDisplay}</div>
//           <div className="mt-0.5 text-xs font-semibold text-gray-800">{category.title}</div>
//         </div>
//       </div>
//       <div className="mt-3 border-t border-gray-200/60 pt-2 text-[11px] text-gray-500 line-clamp-1">
//         {category.description}
//       </div>
//     </Link>
//   )
// }

// // ---------------------------------------------------------------------------
// // Market scope banner — shows the Admin which market scope is active
// // ---------------------------------------------------------------------------
// function MarketScopeBanner({ selectedMarket, availableMarkets, permittedMarkets }) {
//   const allMarketsLabel = resolveAllMarketsLabel(permittedMarkets, availableMarkets)
//   const isAll = selectedMarket.isGlobal

//   return (
//     <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200/80 bg-white px-5 py-3 shadow-xs">
//       <div className="flex items-center gap-3">
//         <CountryFlag code={selectedMarket.code} className="w-6 h-4" />
//         <div>
//           <p className="text-xs font-semibold text-gray-700">
//             {isAll ? 'Viewing all authorized markets' : `Scoped to ${selectedMarket.name}`}
//           </p>
//           {isAll && (
//             <p className="mt-0.5 text-[11px] text-gray-500">
//               Authorized scope: {allMarketsLabel}
//             </p>
//           )}
//         </div>
//       </div>

//       {/* Authorized market chips */}
//       <div className="flex flex-wrap items-center gap-1.5">
//         {availableMarkets
//           .filter((m) => !m.isGlobal)
//           .map((m) => {
//             const isActive = isAll || selectedMarket.code === m.code
//             return (
//               <span
//                 key={m.id}
//                 className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset transition ${
//                   isActive
//                     ? 'bg-royal-50 text-royal-700 ring-royal-300'
//                     : 'bg-gray-100 text-gray-400 ring-gray-200'
//                 }`}
//               >
//                 <CountryFlag code={m.code} className="w-3.5 h-2.5" />
//                 {m.name}
//               </span>
//             )
//           })}
//       </div>

//       {/* Dev indicator */}
//       <DevMarketIndicator
//         selectedMarket={selectedMarket}
//         allMarketsLabel={allMarketsLabel}
//       />
//     </div>
//   )
// }

// // ---------------------------------------------------------------------------
// // Queue Item List
// // ---------------------------------------------------------------------------
// function QueueItemList({ items }) {
//   if (!items || items.length === 0) {
//     return <EmptyState title="Queue is empty" description="There are no actionable items in the selected scope." />
//   }

//   return (
//     <div className="divide-y divide-gray-100">
//       {items.map((item) => (
//         <div key={item.id} className="flex flex-wrap items-center justify-between gap-4 p-5 hover:bg-gray-50/50 transition-colors">
//           <div className="flex items-start gap-4">
//             <div className="mt-1">
//               <CountryFlag code={item.marketCode} className="w-6 h-4" />
//             </div>
//             <div>
//               <div className="flex items-center gap-2">
//                 <span className="font-semibold text-gray-900">{item.title}</span>
//                 {item.priority === 'critical' && <Badge variant="danger" size="sm">Critical</Badge>}
//                 {item.priority === 'high' && <Badge variant="warning" size="sm">High</Badge>}
//                 {item.status && (
//                   <span className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">
//                     {item.status}
//                   </span>
//                 )}
//               </div>
//               {item.description && <p className="mt-1 text-sm text-gray-600">{item.description}</p>}
//               <div className="mt-1.5 flex items-center gap-3 text-[11px] text-gray-500">
//                 <span className="font-mono">{item.sourceType} • {item.sourceId}</span>
//                 {item.waitingMinutes !== null && (
//                   <span className="flex items-center gap-1">
//                     <Clock className="size-3" />
//                     Waiting {item.waitingMinutes > 60 ? `${Math.floor(item.waitingMinutes / 60)}h` : `${item.waitingMinutes}m`}
//                   </span>
//                 )}
//               </div>
//             </div>
//           </div>
//           <Link
//             to={item.actionRoute}
//             className="inline-flex items-center justify-center rounded-lg bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-2xs ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
//           >
//             {item.actionLabel}
//           </Link>
//         </div>
//       ))}
//     </div>
//   )
// }

// // ---------------------------------------------------------------------------
// // ADM-009 — Needs Your Attention (main export)
// // ---------------------------------------------------------------------------
// export default function NeedsAttention() {
//   const { selectedMarket, availableMarkets, permittedMarkets } = useMarketContext()
//   const { data, loading, error, refetch } = useNeedsAttention()

//   return (
//     <PageContainer>
//       {/* Page Header */}
//       <div className="flex flex-wrap items-start justify-between gap-4 border-b border-gray-200/80 pb-5">
//         <div>
//           <div className="flex items-center gap-2">
//             <span className="flex size-8 items-center justify-center rounded-full bg-rose-50 text-rose-600">
//               <AlertCircle className="size-5" />
//             </span>
//             <h1 className="text-2xl font-extrabold tracking-tight text-royal-950 sm:text-3xl">
//               Needs Your Attention
//             </h1>
//           </div>
//           <p className="mt-1.5 text-sm text-gray-600">
//             Operational queue scoped to{' '}
//             <span className="font-semibold text-royal-800">
//               {selectedMarket.isGlobal
//                 ? 'all authorized markets'
//                 : selectedMarket.name}
//             </span>
//             . Use the market selector in the top bar to switch scope.
//           </p>
//         </div>

//         <Badge variant="success" size="md" dot dotColor="bg-emerald-500">
//           Phase 3 — Audit & Hardening
//         </Badge>
//       </div>

//       {/* Market Scope Banner */}
//       <MarketScopeBanner
//         selectedMarket={selectedMarket}
//         availableMarkets={availableMarkets}
//         permittedMarkets={permittedMarkets}
//       />

//       {/* Loading & Error States */}
//       {loading && <LoadingState message="Loading attention queue..." className="mt-6" />}
//       {error && !loading && <ErrorState title="Failed to load queue" description={error} onRetry={refetch} className="mt-6" />}

//       {/* Content */}
//       {!loading && !error && (
//         <div className="mt-6 space-y-6">
//           {/* Queue Categories */}
//           <Card
//             title="Attention Queue"
//             subtitle={`Items requiring Admin review — scoped to ${selectedMarket.isGlobal ? 'all authorized markets' : selectedMarket.name}`}
//           >
//             <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
//               {QUEUE_CATEGORIES.map((cat) => (
//                 <QueueCategoryCard key={cat.id} category={cat} data={data} />
//               ))}
//             </div>
//             {data?.summary?.complete === false && (
//               <div className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800 border border-amber-200/60">
//                 <strong>Notice:</strong> Some categories could not be loaded or are restricted. Totals may be incomplete.
//               </div>
//             )}
//           </Card>

//           {/* Actionable Items */}
//           <Card title="Actionable Items" subtitle={data?.summary?.truncated ? `Showing oldest ${data.items.length} of ${data.summary.total} items` : `Showing all ${data?.summary?.total ?? 0} items`} noPadding>
//             <QueueItemList items={data?.items} />
//           </Card>
//         </div>
//       )}

//       {/* Phase notice */}
//       <div className="mt-8 rounded-xl border border-dashed border-gray-300 bg-gray-50/60 px-5 py-4 text-sm text-gray-500">
//         <span className="font-semibold text-gray-700">Phase 3 complete.</span>{' '}
//         Queue aggregation, Firestore queries, priority calculations, safe limits, deduplication, and market authorization are integrated. Action workflows will be added in Phase 4.
//       </div>
//     </PageContainer>
//   )
// }



//pasted code

import { useMemo, useState } from 'react'
import {
  AlertCircle,
  ArrowRight,
  BadgeCheck,
  Banknote,
  CalendarCheck,
  CheckCircle2,
  FileCheck,
  Filter,
  Headphones,
  Image,
  Scale,
  ShieldAlert,
  SlidersHorizontal,
} from 'lucide-react'
import PageContainer from '../../components/layout/PageContainer'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import EmptyState from '../../components/ui/EmptyState'
import ErrorState from '../../components/ui/ErrorState'
import LoadingState from '../../components/ui/LoadingState'
import { useNeedsAttention } from '../../hooks/useNeedsAttention'
import { cn } from '../../lib/utils'

const CATEGORY_META = {
  verification: {
    type: 'Provider Verification',
    icon: BadgeCheck,
    iconClass: 'bg-royal-50 text-royal-800',
  },
  content: {
    type: 'Content Approval',
    icon: Image,
    iconClass: 'bg-amber-50 text-amber-800',
  },
  finance: {
    type: 'Withdrawal Request',
    icon: Banknote,
    iconClass: 'bg-amber-50 text-amber-800',
  },
  disputes: {
    type: 'Booking Dispute',
    icon: Scale,
    iconClass: 'bg-rose-50 text-rose-700',
  },
  safety: {
    type: 'Safety Report',
    icon: ShieldAlert,
    iconClass: 'bg-rose-50 text-rose-700',
  },
  support: {
    type: 'Support Ticket',
    icon: Headphones,
    iconClass: 'bg-royal-50 text-royal-800',
  },
  booking: {
    type: 'Booking Issue',
    icon: CalendarCheck,
    iconClass: 'bg-amber-50 text-amber-800',
  },
}

const QUEUE_TABS = [
  { id: 'all', label: 'All' },
  { id: 'critical', label: 'Critical' },
  { id: 'verification', label: 'Verification' },
  { id: 'content', label: 'Content' },
  { id: 'finance', label: 'Finance' },
  { id: 'safety', label: 'Safety' },
  { id: 'support', label: 'Support' },
]

const PRIORITY_BADGE = {
  critical: 'danger',
  high: 'warning',
  normal: 'royal',
}

function displayCount(value) {
  return typeof value === 'number' ? value : '—'
}

function formatWaiting(minutes) {
  if (minutes == null) return 'Waiting time unknown'
  if (minutes < 1) return 'Waiting < 1 min'
  if (minutes < 60) return `Waiting ${minutes} min`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `Waiting ${hours} hr${hours === 1 ? '' : 's'}`
  const days = Math.round(hours / 24)
  return `Waiting ${days} day${days === 1 ? '' : 's'}`
}

function formatLastUpdated(iso) {
  if (!iso) return 'Last updated just now'
  return `Last updated ${new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`
}

function humanizeStatus(status) {
  if (!status) return 'Pending'
  const text = String(status).replaceAll('_', ' ')
  return text.charAt(0).toUpperCase() + text.slice(1)
}

function Adm009PageHeader({ total, generatedAt }) {
  return (
    <div className="flex flex-col gap-4 border-b border-gray-200/80 pb-5 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-royal-700">ADM-009</p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-royal-950 sm:text-3xl">
          Needs Your Attention
        </h1>
        <p className="mt-1 text-sm text-gray-600">Review items waiting for Admin action.</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="danger" size="lg" dot>
          {displayCount(total)} Awaiting Action
        </Badge>
        <span className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-semibold text-gray-500 shadow-xs">
          {formatLastUpdated(generatedAt)}
        </span>
      </div>
    </div>
  )
}

function PrioritySummaryCard({ item }) {
  const Icon = item.icon

  return (
    <Card className="shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-gray-500">{item.label}</p>
          <p className="mt-2 text-3xl font-extrabold leading-none text-royal-950 tabular-nums">{item.count}</p>
          <p className="mt-2 text-xs font-medium text-gray-500">{item.description}</p>
        </div>
        <span className={cn('flex size-10 items-center justify-center rounded-xl ring-1', item.iconClass)}>
          <Icon className="size-5" />
        </span>
      </div>
      <Badge variant={item.tone} size="sm" className="mt-5">
        {item.label}
      </Badge>
    </Card>
  )
}

function ActionCategoryCard({ item, onSelect }) {
  const Icon = item.icon

  return (
    <button
      type="button"
      onClick={onSelect}
      className="group flex min-h-28 flex-col justify-between rounded-2xl border border-gray-200/90 bg-white p-4 text-left shadow-xs transition hover:border-royal-200 hover:bg-lavender-50/40"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="flex size-9 items-center justify-center rounded-xl bg-royal-50 text-royal-700 ring-1 ring-royal-100">
          <Icon className="size-4.5" />
        </span>
        <Badge variant={item.tone} size="sm">
          {item.status}
        </Badge>
      </div>
      <div>
        <p className="text-sm font-bold text-royal-950">{item.label}</p>
        <p className="mt-1 text-xs font-medium text-gray-500">
          <span className="text-lg font-extrabold text-royal-950 tabular-nums">{item.count}</span> {item.status}
        </p>
      </div>
    </button>
  )
}

function QueueTabs({ activeTab, onChange }) {
  return (
    <div className="flex gap-1 overflow-x-auto rounded-xl bg-gray-100 p-1">
      {QUEUE_TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={cn(
            'whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold transition',
            activeTab === tab.id ? 'bg-white text-royal-950 shadow-xs' : 'text-gray-600 hover:bg-white/70 hover:text-gray-900',
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}

function ActionQueueItem({ item }) {
  const meta = CATEGORY_META[item.category] || CATEGORY_META.verification
  const Icon = meta.icon

  return (
    <div className="flex flex-col gap-4 border-b border-gray-100 px-5 py-4 transition last:border-b-0 hover:bg-gray-50/70 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex min-w-0 gap-3">
        <span className={cn('mt-0.5 flex size-11 shrink-0 items-center justify-center rounded-xl', meta.iconClass)}>
          <Icon className="size-5" />
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-bold text-royal-950">{meta.type}</p>
            <Badge variant={PRIORITY_BADGE[item.priority] || 'royal'} size="sm">
              {humanizeStatus(item.status)}
            </Badge>
          </div>
          <p className="mt-1 text-base font-extrabold text-gray-900">{item.title}</p>
          <p className="mt-0.5 text-xs font-medium text-gray-500">
            {item.description}
            {item.market ? <span> - {item.market}</span> : null}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 lg:justify-end">
        <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600">
          {formatWaiting(item.waitingMinutes)}
        </span>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-xl bg-royal-900 px-3 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-royal-800"
        >
          <span>{item.actionLabel || 'Review'}</span>
          <ArrowRight className="size-3.5" />
        </button>
      </div>
    </div>
  )
}

function filterItems(items, tab) {
  if (tab === 'all') return items
  if (tab === 'critical') return items.filter((item) => item.priority === 'critical')
  return items.filter((item) => item.category === tab)
}

function ActionQueue({ items, loading, error, onRetry, activeTab, onTabChange }) {
  const visibleItems = filterItems(items, activeTab)

  return (
    <Card
      title="Action Queue"
      subtitle="Items currently waiting for an Admin decision."
      noPadding
      headerAction={
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" size="sm" icon={Filter}>
            Filters
          </Button>
          <Button variant="secondary" size="sm" icon={SlidersHorizontal}>
            Priority First
          </Button>
        </div>
      }
    >
      <div className="border-b border-gray-100 px-5 py-4">
        <QueueTabs activeTab={activeTab} onChange={onTabChange} />
      </div>

      {loading ? <LoadingState message="Loading action queue…" /> : null}

      {!loading && error ? (
        <ErrorState
          title="Unable to load the action queue"
          description={error}
          onRetry={onRetry}
          className="m-5"
        />
      ) : null}

      {!loading && !error && visibleItems.length > 0 ? (
        <div>
          {visibleItems.map((item) => (
            <ActionQueueItem key={item.id} item={item} />
          ))}
        </div>
      ) : null}

      {!loading && !error && visibleItems.length === 0 ? (
        <div className="border-t border-gray-100 bg-gray-50/60">
          <EmptyState
            icon={CheckCircle2}
            title="You're All Caught Up"
            description="There are no items requiring your attention right now."
            className="py-8"
          />
        </div>
      ) : null}
    </Card>
  )
}

export default function NeedsAttention() {
  const { data, loading, error, refetch } = useNeedsAttention()
  const [activeTab, setActiveTab] = useState('all')
  const summary = data?.summary
  const items = data?.items || []

  const overviewItems = useMemo(
    () => [
      {
        label: 'Critical',
        count: displayCount(summary?.critical),
        description: 'Immediate attention',
        icon: ShieldAlert,
        tone: 'danger',
        iconClass: 'bg-rose-50 text-rose-700 ring-rose-200',
      },
      {
        label: 'High Priority',
        count: displayCount(summary?.high),
        description: 'Review soon',
        icon: AlertCircle,
        tone: 'warning',
        iconClass: 'bg-amber-50 text-amber-800 ring-amber-200',
      },
      {
        label: 'Normal',
        count: displayCount(summary?.normal),
        description: 'Pending review',
        icon: FileCheck,
        tone: 'royal',
        iconClass: 'bg-royal-50 text-royal-800 ring-royal-200',
      },
      {
        label: 'Resolved Today',
        count: displayCount(summary?.resolvedToday),
        description: 'Completed',
        icon: CheckCircle2,
        tone: 'success',
        iconClass: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
      },
    ],
    [summary],
  )

  const categoryItems = useMemo(
    () => [
      { id: 'verification', label: 'Verification', count: displayCount(summary?.verification), status: 'Pending', icon: BadgeCheck, tone: 'royal' },
      { id: 'content', label: 'Content Approval', count: displayCount(summary?.content), status: 'Pending', icon: Image, tone: 'warning' },
      { id: 'finance', label: 'Withdrawals', count: displayCount(summary?.finance), status: 'Pending', icon: Banknote, tone: 'warning' },
      { id: 'disputes', label: 'Disputes', count: displayCount(summary?.disputes), status: 'Open', icon: Scale, tone: 'danger' },
      { id: 'safety', label: 'Safety', count: displayCount(summary?.safety), status: 'Priority Cases', icon: ShieldAlert, tone: 'danger' },
      { id: 'support', label: 'Support', count: displayCount(summary?.support), status: 'Escalated', icon: Headphones, tone: 'royal' },
      { id: 'booking', label: 'Booking Issues', count: displayCount(summary?.bookingIssues), status: 'Need Action', icon: CalendarCheck, tone: 'warning' },
    ],
    [summary],
  )

  return (
    <PageContainer>
      <Adm009PageHeader total={summary?.total} generatedAt={data?.context?.generatedAt} />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Priority overview">
        {overviewItems.map((item) => (
          <PrioritySummaryCard key={item.label} item={item} />
        ))}
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-base font-bold text-royal-950">What Needs Review</h2>
          <p className="mt-0.5 text-xs text-gray-500">Live counts from the current Admin action queue.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {categoryItems.map((item) => (
            <ActionCategoryCard key={item.label} item={item} onSelect={() => setActiveTab(item.id === 'booking' ? 'all' : item.id)} />
          ))}
        </div>
      </section>

      <ActionQueue
        items={items}
        loading={loading}
        error={error}
        onRetry={refetch}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
    </PageContainer>
  )
}
