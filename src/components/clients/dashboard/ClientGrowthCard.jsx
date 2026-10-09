import { useState } from 'react'
import { TrendingUp } from 'lucide-react'
import Skeleton from '../../ui/Skeleton'
import { useClientGrowth } from '../../../hooks/useClientDashboard'
import { DashCard, MiniSelect } from './DashCard'
import { GrowthAreaChart } from './charts'

const WINDOWS = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
]

export default function ClientGrowthCard() {
  const [window, setWindow] = useState('monthly')
  const { data, loading } = useClientGrowth(window)
  const up = (data?.changePct ?? 0) >= 0

  return (
    <DashCard
      icon={TrendingUp}
      iconWrap="rounded-full bg-[#e6defc]"
      iconClass="size-3.5 text-[#5b2fd0]"
      title="Client Growth"
      action={<MiniSelect label="Growth period" value={window} options={WINDOWS} onChange={setWindow} width="w-36" />}
    >
      <div className={loading ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
        {data ? <GrowthAreaChart points={data.points} /> : <Skeleton className="h-[104px] w-full" />}
      </div>
      <div className="mt-1 flex items-center gap-3">
        <span className={`text-[22px] leading-none font-bold tracking-tight ${up ? 'text-[#16a34a]' : 'text-[#dc2626]'}`}>
          {data ? `${up ? '+' : '−'}${Math.abs(data.changePct)}%` : '—'}
        </span>
        <span className="text-[10.5px] text-[#4a4466]">New clients {data?.comparison || ''}</span>
      </div>
    </DashCard>
  )
}
