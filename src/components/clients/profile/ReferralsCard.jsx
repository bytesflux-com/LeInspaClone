import { CircleCheck, Clover, Copy, Gift, ShieldCheck, UserRound, Users, Minus } from 'lucide-react'
import { ProfileCard, CardLink, DetailRow, Pill } from './ProfileCard'

export default function ReferralsCard({ profile: c, canSeeFinancial, to, linkState, onCopy }) {
  const r = c.referrals
  const active = r.loyaltyStatus === 'active'
  return (
    <ProfileCard icon={Gift} disc title="Referrals & Loyalty" action={<CardLink to={to} state={linkState}>View Details</CardLink>}>
      <ul>
        <DetailRow icon={Gift} iconClass="fill-[#2a1b57]/80 text-[#2a1b57]" label="Referral Code" labelWidth="w-[116px]">
          <span className="font-bold">{r.code}</span>
          <button type="button" onClick={() => onCopy(r.code)} aria-label="Copy referral code" className="rounded p-0.5 text-[#4527c8] transition hover:bg-[#f1edff]">
            <Copy className="size-4" />
          </button>
        </DetailRow>
        <DetailRow icon={UserRound} iconClass="fill-[#2a1b57]/85 text-[#2a1b57]" label="Referred By" labelWidth="w-[116px]">
          {r.referredBy || <Minus className="size-4 text-[#1b1140]" aria-label="None" />}
        </DetailRow>
        <DetailRow icon={Users} iconClass="fill-[#2a1b57]/85 text-[#2a1b57]" label="Successful Referrals" labelWidth="w-[116px]">{r.successful}</DetailRow>
        <DetailRow icon={Clover} iconClass="fill-[#22a652] text-[#15803d]" label="Loyalty Status" labelWidth="w-[116px]">
          <Pill
            box={active ? 'bg-[#dcf6e4] text-[#15803d]' : 'bg-[#eceef2] text-[#4b5563]'}
            dot={CircleCheck}
            dotClass={active ? 'fill-[#22a652] text-white' : 'fill-[#8b93a5] text-white'}
            className="px-2.5 py-1 text-[11px]"
          >
            {active ? 'Active' : 'Inactive'}
          </Pill>
        </DetailRow>
        <DetailRow icon={ShieldCheck} iconClass="fill-[#2a1b57]/85 text-white" label="Total Savings" labelWidth="w-[116px]" className="font-bold">
          {canSeeFinancial ? <span className="font-bold">{`${c.currency} ${r.totalSavings.toLocaleString('en-US')}`}</span> : <span className="text-[#4a4466]">Restricted</span>}
        </DetailRow>
      </ul>
    </ProfileCard>
  )
}
