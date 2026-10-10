import { Link } from 'react-router'
import { ArrowRight, CircleCheck } from 'lucide-react'
import { PROFILE_CARD } from '../profile/ProfileCard'
import { cn } from '../../../lib/utils'

// Benefits are read from the current plan configuration — never hardcoded here.
export default function AccessBenefitsCard({ config, accessEnabled, configTo }) {
  return (
    <section aria-label="Access and benefits" className={cn(PROFILE_CARD, 'flex flex-col p-4')}>
      <h2 className="text-[19px] font-bold tracking-tight text-[#1b1140]">Access &amp; Benefits</h2>
      {!accessEnabled && <p className="mt-2 rounded-lg bg-[#f1f2f6] px-2.5 py-1.5 text-[11.5px] text-[#3f4457]">Access is currently disabled, so these benefits are not active for the client.</p>}
      <ul className="mt-3 flex-1 space-y-2.5">
        {(config?.benefits || []).map((b) => (
          <li key={b} className={cn('flex items-start gap-2 text-[13px] text-[#1b1140]', !accessEnabled && 'opacity-50')}>
            <CircleCheck className="mt-0.5 size-4 shrink-0 fill-[#4527c8] text-white" aria-hidden="true" />{b}
          </li>
        ))}
        {!config?.benefits?.length && <li className="text-[12.5px] text-[#4a4466]">No benefits are configured for this plan.</li>}
      </ul>
      {configTo && (
        <Link to={configTo} className="mt-3 inline-flex h-10 items-center justify-center gap-2 rounded-lg border-[1.5px] border-[#8b6cf0] bg-white px-3 text-[13px] font-semibold text-[#3b1fd6] transition hover:bg-[#f4f1fc]">
          View Full Plan Configuration <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      )}
    </section>
  )
}
