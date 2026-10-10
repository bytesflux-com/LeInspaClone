import { Link } from 'react-router'
import { ArrowRight, CircleCheck, Copy, Settings2 } from 'lucide-react'
import { useState } from 'react'
import CountryFlag from '../../ui/CountryFlag'
import { MembershipStatusPill, formatPrice } from './MembershipBadges'
import { themeFor } from '../../../constants/clientMembership'
import { formatDay } from '../../../lib/profileFormat'
import { cn } from '../../../lib/utils'

function Field({ label, children }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11.5px] text-[#2a1b57]">{label}</dt>
      <dd className="mt-0.5 flex items-center gap-1.5 text-[15px] leading-tight font-bold whitespace-nowrap text-[#1b1140]">{children}</dd>
    </div>
  )
}

// The strongest card on the screen. One layout for every plan — only the data and the
// visual treatment (Standard / Premium / Executive) change.
export default function MembershipHero({ membership: m, config, client, canSeeFinancial, canManage, onManage, paymentTo, linkState, onCopy }) {
  const [copied, setCopied] = useState(false)
  const theme = themeFor(m.tierId)
  const Icon = theme.icon
  const tz = client.timeZone
  const day = (iso) => (iso ? formatDay(iso, tz, { year: true }) : '—')
  const period = m.periodEnd ? `${formatDay(m.periodStart, tz)} – ${formatDay(m.periodEnd, tz, { year: true })}` : 'No billing period'
  const executive = m.tierId === 'executive'

  const copy = async () => {
    await onCopy(m.id)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <section aria-label="Current membership" className={cn('rounded-xl p-3 shadow-[0_10px_30px_-14px_rgba(36,21,71,0.55)]', theme.hero, theme.ring)}>
      <header className="flex items-center gap-3">
        <span className={cn('flex size-[58px] shrink-0 items-center justify-center rounded-xl', theme.tile)} aria-hidden="true">
          <Icon className="size-7" />
        </span>
        <div className="min-w-0 flex-1">
          <p className={cn('flex items-center gap-1.5 text-[13px] font-semibold', theme.kicker)}>
            {executive && <span aria-hidden="true">✦</span>}Current Membership
          </p>
          <h2 className="truncate text-[26px] leading-[1.1] font-bold tracking-tight">{config?.name || m.tierId}</h2>
          {config?.tagline && <p className={cn('mt-0.5 truncate text-[13px]', theme.sub)}>{config.tagline}</p>}
        </div>
        <MembershipStatusPill status={m.status} className="self-start !px-3.5 !py-2 !text-[13px]" />
      </header>

      <div className="mt-3 rounded-xl bg-white p-3.5 text-[#1b1140]">
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3.5 @[40rem]:grid-cols-4">
          <Field label="Membership ID">
            {m.id}
            <button type="button" onClick={copy} aria-label="Copy membership ID" className="rounded p-0.5 text-[#4527c8] hover:bg-[#f1edff]">
              {copied ? <CircleCheck className="size-4 text-[#15803d]" /> : <Copy className="size-4" />}
            </button>
          </Field>
          <Field label="Started">{day(m.startedAt)}</Field>
          <Field label="Current Period">{period}</Field>
          <Field label="Renewal Date">{day(m.renewalAt)}</Field>
          <Field label="Billing">{m.billing}</Field>
          <Field label="Market"><CountryFlag code={m.market} className="h-3.5 w-[22px]" />{client.countryName}</Field>
          <Field label="Currency">{m.currency}</Field>
          <Field label="Current Plan Price">{formatPrice(m.currency, m.price, { restricted: !canSeeFinancial, perMonth: m.billing === 'Monthly' })}</Field>
        </dl>

        <div className="mt-4 grid gap-2.5 @[28rem]:grid-cols-2">
          {paymentTo ? (
            <Link to={paymentTo} state={linkState} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border-[1.5px] border-[#8b6cf0] bg-white px-3 text-[13px] font-semibold text-[#3b1fd6] transition hover:bg-[#f4f1fc]">
              View Payment <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          ) : (
            <span className="hidden @[28rem]:block" />
          )}
          {canManage && (
            <button type="button" onClick={() => onManage()} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#4125d0] px-3 text-[13px] font-semibold text-white shadow-sm transition hover:bg-[#3719b8]">
              <Settings2 className="size-4" aria-hidden="true" /> Manage Membership <ArrowRight className="size-4" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
    </section>
  )
}
