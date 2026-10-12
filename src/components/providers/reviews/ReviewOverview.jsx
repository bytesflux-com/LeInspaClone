import { ArrowDown, ArrowUp, Ban, BarChart3, CircleCheck, Flag, Smile, Star, Undo2, Users } from 'lucide-react'
import { KpiCard, LinkAction, Panel } from '../trust/TrustUI'

function Delta({ value, suffix = '', label = 'vs last month' }) {
  if (value === null || value === undefined) return <span className="text-slate-400">{label}</span>
  const up = value >= 0
  return (
    <span className="inline-flex items-center gap-0.5">
      <span className={up ? 'text-emerald-600' : 'text-rose-600'}>{up ? <ArrowUp className="inline size-3" /> : <ArrowDown className="inline size-3" />}{up ? '+' : ''}{value}{suffix}</span>
      <span className="text-slate-400">&nbsp;{label}</span>
    </span>
  )
}

// ADM-025 — KPI cards + rating distribution, all computed from the review records.
export function ReviewOverview({ overview, distribution }) {
  const o = overview
  return (
    <div className="grid gap-3 lg:grid-cols-[repeat(5,minmax(0,1fr))_minmax(0,1.35fr)]">
      <KpiCard icon={Star} tone="gold" label="Average Rating" value={o.averageRating ?? '—'} sub={<Delta value={o.ratingChange} />} />
      <KpiCard icon={Users} tone="purple" label="Total Reviews" value={o.totalReviews} sub={<Delta value={o.newReviews30d} label="last 30 days" />} />
      <KpiCard icon={CircleCheck} tone="green" label="Verified Booking Reviews" value={o.verifiedBookingReviews} sub={`${o.verifiedShare}% of total`} />
      <KpiCard icon={Flag} tone="red" label="Reported Reviews" value={o.reportedReviews} sub={`${o.reportedShare}% of total`} />
      <KpiCard icon={Ban} tone="red" label="Hidden / Removed" value={o.hiddenRemoved} sub={`${o.hiddenShare}% of total`} />
      <Panel title="Rating Distribution" className="lg:col-span-1" bodyClass="space-y-1.5">
        {distribution.map((d) => (
          <div key={d.star} className="grid grid-cols-[28px_1fr_36px] items-center gap-2 text-[11.5px]">
            <span className="inline-flex items-center gap-0.5 font-semibold text-slate-700">{d.star}<Star className="size-3 fill-gold-400 text-gold-400" /></span>
            <span className="h-2 overflow-hidden rounded-full bg-royal-50"><span className="block h-full rounded-full bg-royal-600" style={{ width: `${d.percent}%` }} /></span>
            <span className="text-right text-slate-600" title={`${d.count} reviews`}>{d.percent}%</span>
          </div>
        ))}
      </Panel>
    </div>
  )
}

export function ReviewPerformance({ performance: p }) {
  const items = [
    { icon: Star, tone: 'text-gold-500 bg-[#fbf3e2]', label: 'Average Rating', value: p.averageRating ?? '—' },
    { icon: BarChart3, tone: 'text-royal-600 bg-royal-50', label: 'Reviews This Month', value: p.reviewsThisMonth, sub: p.monthChange !== null ? `${p.monthChange >= 0 ? '+' : ''}${p.monthChange}%` : null, up: p.monthChange >= 0 },
    { icon: Smile, tone: 'text-emerald-600 bg-emerald-50', label: 'Positive Reviews', value: p.positiveShare !== null ? `${p.positiveShare}%` : '—', hint: 'Share of 4–5★ ratings (not AI sentiment)' },
    { icon: Flag, tone: 'text-rose-600 bg-rose-50', label: 'Reported Review Rate', value: `${p.reportedReviewRate}%` },
    { icon: Undo2, tone: 'text-sky-600 bg-sky-50', label: 'Response Rate', value: `${p.responseRate}%` },
  ]
  return (
    <Panel title="Review Performance">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {items.map((it) => (
          <div key={it.label} className="flex items-start gap-2" title={it.hint}>
            <span className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${it.tone}`}><it.icon className="size-4" /></span>
            <div className="min-w-0">
              <p className="text-[10.5px] leading-tight text-slate-500">{it.label}</p>
              <p className="text-[18px] leading-tight font-bold text-royal-950">{it.value}</p>
              {it.sub && <p className={`text-[11px] font-semibold ${it.up ? 'text-emerald-600' : 'text-rose-600'}`}>{it.sub}</p>}
            </div>
          </div>
        ))}
      </div>
    </Panel>
  )
}

export function TopReviewedServices({ services, onFilter }) {
  return (
    <Panel title="Top Reviewed Services" action={<LinkAction onClick={() => onFilter?.('')}>View All</LinkAction>}>
      {services.length === 0 ? (
        <p className="text-[12px] text-slate-500">No published reviews yet.</p>
      ) : (
        <ol className="grid grid-cols-1 gap-x-5 gap-y-2 sm:grid-cols-2">
          {services.map((s, i) => (
            <li key={s.name}>
              <button type="button" onClick={() => onFilter?.(s.name)} className="flex w-full items-center justify-between gap-2 text-left text-[12px] hover:text-royal-700">
                <span className="min-w-0"><span className="mr-1 text-slate-400">{i + 1}.</span><span className="font-semibold text-slate-800">{s.name}</span><span className="block pl-4 text-[10.5px] text-slate-500">{s.count} reviews</span></span>
                <span className="inline-flex items-center gap-0.5 font-semibold text-slate-700"><Star className="size-3 fill-gold-400 text-gold-400" />{s.averageRating}</span>
              </button>
            </li>
          ))}
        </ol>
      )}
    </Panel>
  )
}
