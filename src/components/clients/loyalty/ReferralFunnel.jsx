import { PROFILE_CARD } from '../profile/ProfileCard'
import { FUNNEL_COLORS } from '../../../constants/clientLoyalty'
import { cn } from '../../../lib/utils'

const W = 140
const H = 138
const GAP = 3
const INSET = 46 // how far each side closes in between the top and bottom of the funnel

// Four stacked trapezoids that together form a funnel narrowing toward the bottom.
function Funnel() {
  const layerH = (H - GAP * 3) / 4
  const edge = (y) => ({ l: 2 + (INSET * y) / H, r: W - 2 - (INSET * y) / H })
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-[138px] w-[140px] shrink-0" aria-hidden="true">
      {FUNNEL_COLORS.map((fill, i) => {
        const y0 = i * (layerH + GAP)
        const y1 = y0 + layerH
        const a = edge(y0)
        const b = edge(y1)
        return <polygon key={fill} fill={fill} points={`${a.l},${y0} ${a.r},${y0} ${b.r},${y1} ${b.l},${y1}`} />
      })}
    </svg>
  )
}

// Referral Performance — how far each referral travelled. Counts and conversion come from
// the backend, which resolves qualification from the configured referral rule: registration
// alone is never counted as a successful referral unless that rule says so.
export default function ReferralFunnel({ funnel, className }) {
  const empty = funnel[0]?.count === 0
  return (
    <section aria-label="Referral performance" className={cn(PROFILE_CARD, 'p-3.5', className)}>
      <h2 className="mb-2 text-[17px] leading-tight font-bold tracking-tight text-[#1b1140]">Referral Performance</h2>

      {empty ? (
        <p className="py-8 text-center text-[12.5px] text-[#4a4466]">No referrals yet. Referrals appear here as soon as someone uses this client's code.</p>
      ) : (
        <div className="flex items-stretch gap-3">
          <Funnel />
          <ol className="flex min-w-0 flex-1 flex-col justify-between py-0.5">
            {funnel.map((stage) => (
              <li key={stage.id} className="flex items-start gap-2">
                <span className="mt-[3px] flex size-[17px] shrink-0 items-center justify-center rounded-full bg-[#e4defb]" aria-hidden="true">
                  <span className="size-[9px] rounded-full bg-[#1b1140]" />
                </span>
                <div className="min-w-0 leading-tight">
                  <p className="text-[16px] leading-none font-bold text-[#1b1140]">{stage.count}</p>
                  <p className="mt-0.5 text-[11.5px] text-[#1b1140]">{stage.label}</p>
                  {stage.conversion !== null && <p className="text-[10.5px] text-[#4a4466]">{stage.conversion}% conversion</p>}
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}
    </section>
  )
}
