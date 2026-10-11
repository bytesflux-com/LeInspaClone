import { useState } from 'react'
import { ArrowRight, CircleCheck, Lock, ShieldCheck, TriangleAlert } from 'lucide-react'
import { CaseStatusPill } from './SupportBadges'
import { formatDay } from '../../../lib/profileFormat'
import { cn } from '../../../lib/utils'

const CARD = 'rounded-xl border border-[#e6e1f3] bg-white p-3.5 shadow-[0_1px_2px_rgba(36,21,71,0.04),0_8px_20px_-12px_rgba(36,21,71,0.14)]'
const H2 = 'text-[16px] leading-tight font-bold tracking-tight text-[#1b1140]'
const LINK = 'inline-flex shrink-0 items-center gap-1 text-[12px] font-semibold text-[#3b1fd6] hover:underline'
const VIEW = 'inline-flex h-[24px] items-center justify-center gap-1 rounded-md border-[1.5px] border-[#8b6cf0] bg-white px-2 text-[11px] font-semibold text-[#3b1fd6] transition hover:bg-[#f4f1fc]'

// Reports the client has submitted. A report is an allegation / input — never proof, and several
// reports from one client are not treated as abuse of the platform.
export function ReportsSubmittedCard({ reports, timeZone, onViewAll, onOpen }) {
  return (
    <section aria-label="Reports submitted by client" className={cn(CARD, 'min-w-0')}>
      <header className="mb-2 flex items-center justify-between gap-2">
        <h2 className={H2}>Reports Submitted by Client ({reports.total})</h2>
        {reports.total > 0 && <button type="button" onClick={onViewAll} className={LINK}>View All <ArrowRight className="size-3.5" aria-hidden="true" /></button>}
      </header>
      {reports.total === 0 ? (
        <p className="py-6 text-center text-[12px] text-[#4a4466]">This client has not submitted any reports.</p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[430px] text-left text-[11px] text-[#1b1140]">
              <thead>
                <tr className="border-y border-[#e6e1f3] bg-[#f7f5fd] text-[10.5px] font-semibold">
                  {['Report ID', 'Type', 'Reported', 'Reason', 'Date', 'Status', 'Action'].map((h) => <th key={h} className="px-1.5 py-1.5 font-semibold">{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {reports.items.map((x) => (
                  <tr key={x.id} className="border-b border-[#efecf7] last:border-b-0">
                    <td className="px-1.5 py-1.5 font-semibold">{x.id}</td>
                    <td className="px-1.5 py-1.5">{x.kind}</td>
                    <td className="px-1.5 py-1.5">{x.providerId}</td>
                    <td className="px-1.5 py-1.5">{x.reason}</td>
                    <td className="px-1.5 py-1.5 whitespace-nowrap">{formatDay(x.submittedAt, timeZone, { year: true })}</td>
                    <td className="px-1.5 py-1.5"><CaseStatusPill status={x.status} className="!px-1.5 !py-[3px] !text-[10px] [&_svg]:!size-3" /></td>
                    <td className="px-1.5 py-1.5"><button type="button" onClick={() => onOpen(x.id)} className={VIEW}>View <ArrowRight className="size-3" aria-hidden="true" /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-[10.5px] leading-snug text-[#4a4466]">A report is an input for review, not proof. Patterns can prompt a review; they never decide the outcome.</p>
        </>
      )}
    </section>
  )
}

// Reports about this client: only authorised Admins see it, and the reporter's identity is never shown.
export function ReportsAboutCard({ reports, timeZone }) {
  if (!reports) {
    return (
      <section aria-label="Reports involving client" className={cn(CARD, 'min-w-0')}>
        <h2 className={H2}>Reports Involving Client</h2>
        <div className="flex flex-col items-center py-5 text-center">
          <Lock className="size-8 text-[#8b6cf0]" aria-hidden="true" />
          <p className="mt-2 text-[13px] font-bold text-[#1b1140]">Restricted</p>
          <p className="mt-0.5 max-w-[240px] text-[11.5px] leading-snug text-[#2a1b57]">Only authorised Trust &amp; Safety Admins can see reports about a client.</p>
        </div>
      </section>
    )
  }
  return (
    <section aria-label="Reports involving client" className={cn(CARD, 'min-w-0')}>
      <h2 className={H2}>Reports Involving Client ({reports.total})</h2>
      {reports.total === 0 ? (
        <div className="flex flex-col items-center py-4 text-center">
          <ShieldCheck className="size-9 fill-[#cfd3dc] text-white" aria-hidden="true" />
          <p className="mt-2 text-[14px] font-bold text-[#1b1140]">No reports involving this client.</p>
          <p className="mt-0.5 text-[12px] text-[#2a1b57]">There are no reports about this client.</p>
        </div>
      ) : (
        <ul className="mt-2 divide-y divide-[#efecf7]">
          {reports.items.map((x) => (
            <li key={x.id} className="py-2 text-[12px]">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-[#1b1140]">{x.id}</span>
                <CaseStatusPill status={x.status} className="!px-1.5 !py-[3px] !text-[10px]" />
              </div>
              <p className="text-[#2a1b57]">{x.category} • {formatDay(x.date, timeZone, { year: true })}</p>
              <p className="text-[#2a1b57]">Outcome: {x.outcome}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

// Compact resolution history. Applied and removed restrictions are both kept — the original action is never erased.
export function CaseOutcomesCard({ outcomes, timeZone }) {
  const [all, setAll] = useState(false)
  const shown = all ? outcomes : outcomes.slice(0, 4)
  return (
    <section aria-label="Case outcomes" className={cn(CARD, 'min-w-0')}>
      <header className="mb-2 flex items-center justify-between gap-2">
        <h2 className={H2}>Case Outcomes</h2>
        {outcomes.length > 4 && <button type="button" onClick={() => setAll((v) => !v)} className={LINK}>{all ? 'Show less' : 'View All'} <ArrowRight className="size-3.5" aria-hidden="true" /></button>}
      </header>
      {outcomes.length === 0 ? (
        <p className="py-6 text-center text-[12px] text-[#4a4466]">No resolved cases yet.</p>
      ) : (
        <ul className="space-y-[7px]">
          {shown.map((o) => {
            const restriction = o.kind === 'restriction'
            const Icon = restriction ? TriangleAlert : CircleCheck
            return (
              <li key={o.id} className="flex items-center gap-2 text-[12px]">
                <Icon className={cn('size-[18px] shrink-0', restriction ? 'fill-[#f08a24] text-white' : 'fill-[#22a652] text-white')} aria-hidden="true" />
                <span className="min-w-0 flex-1 truncate text-[#1b1140]">{o.label}{o.ref ? ` → ${o.ref}` : ''}</span>
                <span className="shrink-0 text-[11.5px] text-[#2a1b57]">{formatDay(o.at, timeZone, { year: true })}</span>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
