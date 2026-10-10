import { ChartNoAxesColumn, CircleCheck, CircleMinus, Coins, Crown, Gift, Info, Target } from 'lucide-react'
import { PROFILE_CARD } from '../profile/ProfileCard'
import { Amount } from './LoyaltyBadges'
import { cn } from '../../../lib/utils'

// The loyalty mechanism is configurable (milestone / points / credit), so wording is derived
// from the rule that arrives with the account — never hardcoded here.
function ruleHint(rule, progress) {
  if (!progress) return 'Rewards are issued as credits under the configured loyalty rule.'
  if (rule.mode === 'points') return `Points accumulate toward the next reward (${progress.target.toLocaleString('en-US')} points).`
  return `A reward is earned after ${rule.target} ${rule.unitLabelPlural}.`
}

function Tile({ icon: Icon, disc, iconClass, label, children }) {
  return (
    <li className="flex min-w-0 items-center gap-1.5 rounded-lg border border-[#e6e1f3] bg-white px-2 py-2">
      <span className={cn('flex size-[26px] shrink-0 items-center justify-center rounded-lg', disc)}>
        <Icon className={cn('size-[16px]', iconClass)} aria-hidden="true" />
      </span>
      <div className="min-w-0 leading-tight">
        <p className="truncate text-[10.5px] text-[#2a1b57]">{label}</p>
        <p className="mt-0.5 truncate text-[20px] leading-none font-bold tracking-tight text-[#1b1140]">{children}</p>
      </div>
    </li>
  )
}

// Loyalty Rewards — its own section, with its own counters; never mixed into the referral balance.
export function LoyaltyRewardsCard({ loyalty, currency, canSeeFinancial }) {
  const { status, rule, progress, summary } = loyalty
  const active = status === 'active'
  const first =
    progress?.mode === 'points'
      ? { label: 'Points Balance', value: progress.current.toLocaleString('en-US') }
      : progress
        ? { label: 'Current Progress', value: `${progress.current} / ${progress.target}` }
        : { label: 'Reward Credits', value: summary.available }

  return (
    <section aria-label="Loyalty rewards" className={cn(PROFILE_CARD, '@container p-3')}>
      <header className="mb-2.5 flex items-center gap-2.5">
        <span className="flex size-[42px] shrink-0 items-center justify-center rounded-lg bg-[#2b1175]">
          <Crown className="size-6 fill-[#e8a317] text-[#e8a317]" aria-hidden="true" />
        </span>
        <h2 className="flex items-center gap-1.5 text-[17px] leading-tight font-bold tracking-tight text-[#1b1140]">
          Loyalty Rewards
          <span title={ruleHint(rule, progress)} className="text-[#4a4466]">
            <Info className="size-[15px]" aria-label={ruleHint(rule, progress)} />
          </span>
        </h2>
        <span
          className={cn(
            'inline-flex h-[26px] items-center gap-1.5 rounded-full px-3 text-[12.5px] font-medium',
            active ? 'bg-[#dcf6e4] text-[#15803d]' : 'bg-[#e6e8ee] text-[#3f4457]',
          )}
        >
          {active ? <CircleCheck className="size-[15px] fill-[#22a652] text-white" aria-hidden="true" /> : <CircleMinus className="size-[15px] fill-[#7d8599] text-white" aria-hidden="true" />}
          {active ? 'Active' : 'Inactive'}
        </span>
      </header>

      <ul className="grid grid-cols-2 gap-1.5 @[34rem]:grid-cols-5" aria-label="Loyalty summary">
        <Tile icon={Target} disc="bg-[#e4defb]" iconClass="text-[#4527c8]" label={first.label}>{first.value}</Tile>
        <Tile icon={Gift} disc="bg-[#4125d0]" iconClass="fill-white/20 text-white" label="Rewards Earned">{summary.earned}</Tile>
        <Tile icon={CircleCheck} disc="bg-[#e4defb]" iconClass="text-[#4527c8]" label="Rewards Redeemed">{summary.redeemed}</Tile>
        <Tile icon={Coins} disc="bg-[#ffe9d2]" iconClass="text-[#e8791a]" label="Available Rewards">{summary.available}</Tile>
        <Tile icon={ChartNoAxesColumn} disc="bg-[#e4defb]" iconClass="text-[#4527c8] [stroke-width:3]" label="Total Savings">
          <Amount value={summary.totalSavings} currency={currency} show={canSeeFinancial} className="text-[14px] font-bold" />
        </Tile>
      </ul>
    </section>
  )
}

// Loyalty Progress — only rendered when the configured program actually has a progress
// mechanism, so the "N more … until your next reward" line never lies about the real rule.
export function LoyaltyProgressCard({ progress }) {
  if (!progress) return null
  const points = progress.mode === 'points'
  const target = Math.max(1, progress.target)
  const pct = Math.max(0, Math.min(100, Math.round((progress.current / target) * 100)))
  const remaining = Math.max(0, progress.target - progress.current)
  const noun = points ? (remaining === 1 ? 'point' : 'points') : remaining === 1 ? progress.unitLabel : progress.unitLabelPlural
  const cap = (t) => `${t.charAt(0).toUpperCase()}${t.slice(1)}`
  const left = points ? `${progress.current.toLocaleString('en-US')} points` : `${progress.current} ${cap(progress.current === 1 ? progress.unitLabel : progress.unitLabelPlural)}`

  return (
    <section aria-label="Loyalty progress" className={cn(PROFILE_CARD, 'p-3.5')}>
      <h2 className="text-[17px] leading-tight font-bold tracking-tight text-[#1b1140]">Loyalty Progress</h2>
      <div className="mt-2.5 flex items-baseline justify-between gap-3 text-[13px] text-[#1b1140]">
        <p>{left}</p>
        <p className="text-[14px] font-bold">{progress.current.toLocaleString('en-US')} / {progress.target.toLocaleString('en-US')}</p>
      </div>
      <div className="mt-1.5 h-[10px] overflow-hidden rounded-full bg-[#e4defb]" role="progressbar" aria-valuemin={0} aria-valuemax={progress.target} aria-valuenow={Math.min(progress.current, progress.target)} aria-label="Loyalty progress">
        <div className="h-full rounded-full bg-linear-to-r from-[#6b43e0] to-[#4a22c8] transition-all" style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-2 text-[12.5px] text-[#1b1140]">
        {remaining > 0 ? `${remaining.toLocaleString('en-US')} more ${noun} until your next reward` : 'The next reward is ready to be issued.'}
      </p>
    </section>
  )
}
