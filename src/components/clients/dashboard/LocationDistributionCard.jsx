import { useState } from 'react'
import { MapPin } from 'lucide-react'
import Skeleton from '../../ui/Skeleton'
import { formatNumber } from '../../../lib/format'
import { DashCard, MiniSelect } from './DashCard'

const VIEWS = [
  { value: 'cities', label: 'Top Cities' },
  { value: 'regions', label: 'Top Regions' },
]

// Locations come from the configured regions/cities in the data — not a UI list.
export default function LocationDistributionCard({ locations }) {
  const [view, setView] = useState('cities')
  const rows = locations?.[view] || []
  const max = Math.max(1, ...rows.map((r) => r.count))

  return (
    <DashCard
      className="[&_h2]:gap-1.5 [&_h2]:text-[12px] [&_h2>span]:size-5 [&_h2_svg]:size-4"
      icon={MapPin}
      iconClass="text-[#1f9d4d] fill-[#1f9d4d]/20"
      title="Clients by Location"
      action={<MiniSelect label="Location view" value={view} options={VIEWS} onChange={setView} width="w-36" />}
    >
      {!locations ? (
        <div className="space-y-2.5">{Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-3.5" />)}</div>
      ) : rows.length === 0 ? (
        <p className="py-4 text-center text-[12px] text-[#4a4466]">No location data yet.</p>
      ) : (
        <ul className="space-y-1.5">
          {rows.map((r) => (
            <li key={r.name} className="grid grid-cols-[62px_minmax(0,1fr)_34px_40px] items-center gap-2 text-[11.5px]">
              <span className="truncate text-[#1b1140]">{r.name}</span>
              <span className="h-2 overflow-hidden rounded-full bg-[#efecf7]">
                <span className="block h-full rounded-full bg-[#4527c8]" style={{ width: `${Math.max(4, (r.count / max) * 100)}%` }} />
              </span>
              <span className="text-right text-[#1b1140]">{formatNumber(r.count)}</span>
              <span className="text-right font-semibold text-[#5b2fd0]">{r.pct.toFixed(1)}%</span>
            </li>
          ))}
        </ul>
      )}
    </DashCard>
  )
}
