import { useState } from 'react'
import { CircleCheck, Copy, LockKeyhole, ShieldAlert } from 'lucide-react'
import CountryFlag from '../../ui/CountryFlag'
import { PROFILE_CARD } from '../profile/ProfileCard'
import { formatDay } from '../../../lib/profileFormat'
import { cn } from '../../../lib/utils'

const STATUS = {
  active: { label: 'Active', box: 'bg-[#dcf6e4] text-[#15803d]', icon: CircleCheck, iconCls: 'fill-[#22a652] text-white' },
  frozen: { label: 'Frozen', box: 'bg-[#fde2e2] text-[#dc2626]', icon: ShieldAlert, iconCls: 'fill-[#e03a3a] text-white' },
}

function Field({ label, children }) {
  return (
    <div className="grid grid-cols-[88px_1fr] items-center gap-2 py-[7px] text-[13px]">
      <dt className="text-[#2a1b57]">{label}</dt>
      <dd className="flex min-w-0 items-center gap-1.5 font-bold text-[#1b1140]">{children}</dd>
    </div>
  )
}

// Wallet identity. Only business identifiers — never payment credentials or processor ids.
export default function WalletStatusCard({ wallet: w, client, onCopy }) {
  const [copied, setCopied] = useState(false)
  const st = STATUS[w.status] || STATUS.active
  const StatusIcon = st.icon

  const copy = async () => {
    await onCopy(w.id)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <section aria-label="Wallet status" className={cn(PROFILE_CARD, 'p-4')}>
      <header className="flex items-center gap-3">
        <span className="flex size-[58px] shrink-0 items-center justify-center rounded-xl bg-[#e8e4fb]" aria-hidden="true">
          <LockKeyhole className="size-7 fill-[#1e40d8]/20 text-[#1e40d8]" />
        </span>
        <h2 className="text-[19px] font-bold tracking-tight text-[#1b1140]">Wallet Status</h2>
        <span className={cn('inline-flex items-center gap-1.5 rounded-full px-3 py-[6px] text-[12px] leading-none font-medium', st.box)}>
          <StatusIcon className={cn('size-4', st.iconCls)} aria-hidden="true" />
          {st.label}
        </span>
      </header>

      <dl className="mt-3 grid gap-x-6 @[34rem]:grid-cols-2">
        <div>
          <Field label="Wallet ID">
            <span className="truncate">{w.id}</span>
            <button type="button" onClick={copy} aria-label="Copy wallet ID" className="shrink-0 rounded p-0.5 text-[#4527c8] hover:bg-[#f1edff]">
              {copied ? <CircleCheck className="size-4 text-[#15803d]" /> : <Copy className="size-4" />}
            </button>
          </Field>
          <Field label="Owner">{w.owner}</Field>
          <Field label="Wallet Type">{w.type}</Field>
        </div>
        <div>
          <Field label="Currency">{w.currency}</Field>
          <Field label="Country"><CountryFlag code={w.country} className="h-3.5 w-[22px]" />{w.countryName}</Field>
          <Field label="Created">{formatDay(w.createdAt, client.timeZone, { year: true })}</Field>
        </div>
      </dl>
    </section>
  )
}
