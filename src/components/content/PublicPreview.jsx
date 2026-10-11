import { useState } from 'react'
import { Heart, MapPin, Star } from 'lucide-react'
import { formatCurrency } from '../../lib/currency'
import { cn } from '../../lib/utils'
import { Verified } from './ContentUI'

// How a profile photo will look in the Client App: search result card,
// provider profile header and booking specialist picker.
export default function PublicPreview({ photoUrl, provider, currency }) {
  const [device, setDevice] = useState('web')
  const price = typeof provider.price === 'number' && currency ? formatCurrency(provider.price, currency) : null
  const rating = provider.rating != null && (
    <span className="inline-flex items-center gap-0.5 text-[10.5px] text-[#1b1140]"><Star className="size-3 fill-[#f5b301] text-[#f5b301]" />{provider.rating}{provider.reviews != null && <span className="text-[#6b6785]">({provider.reviews})</span>}</span>
  )
  const mobile = device !== 'web'

  return (
    <div>
      <div className="mb-2 flex justify-end">
        <div className="flex rounded-lg border border-[#ddd7ee] p-0.5" role="group" aria-label="Preview device">
          {[['web', 'Web'], ['android', 'Android'], ['ios', 'iOS']].map(([id, l]) => (
            <button key={id} type="button" onClick={() => setDevice(id)} aria-pressed={device === id} className={cn('h-7 rounded-md px-3 text-[11.5px] font-semibold', device === id ? 'bg-[#4125d0] text-white' : 'text-[#2a1b57] hover:bg-[#f4f1fc]')}>{l}</button>
          ))}
        </div>
      </div>
      <div className={cn('grid gap-2', mobile ? 'grid-cols-3' : 'grid-cols-3')}>
        <figure className="space-y-1">
          <figcaption className="text-[11px] font-semibold text-[#2a1b57]">Search Result</figcaption>
          <div className={cn('overflow-hidden border border-[#ebe7f6] bg-white shadow-sm', device === 'ios' ? 'rounded-2xl' : 'rounded-xl')}>
            <div className="relative">
              <img src={photoUrl} alt="" className={cn('w-full object-cover', mobile ? 'aspect-[4/5]' : 'aspect-square')} />
              <Heart className="absolute top-1.5 right-1.5 size-4 text-white drop-shadow" />
            </div>
            <div className="space-y-0.5 p-1.5 leading-tight">
              <p className="flex items-center gap-0.5 text-[11.5px] font-bold text-[#1b1140]"><span className="truncate">{provider.name}</span>{provider.verified && <Verified />}</p>
              {rating}
              <p className="truncate text-[10.5px] text-[#4a4466]">{provider.typeLabel}</p>
              {provider.city && <p className="flex items-center gap-0.5 truncate text-[10px] text-[#6b6785]"><MapPin className="size-2.5" />{provider.city}</p>}
              {price && <p className="text-[11px] font-bold text-[#1b1140]">{price}</p>}
            </div>
          </div>
        </figure>
        <figure className="space-y-1">
          <figcaption className="text-[11px] font-semibold text-[#2a1b57]">Provider Profile</figcaption>
          <div className={cn('flex flex-col items-center gap-1 border border-[#ebe7f6] bg-gradient-to-b from-[#f4f0ff] to-white px-1.5 py-3 text-center shadow-sm', device === 'ios' ? 'rounded-2xl' : 'rounded-xl')}>
            <img src={photoUrl} alt="" className="size-[72px] rounded-full object-cover ring-[3px] ring-white shadow" />
            <p className="flex items-center gap-0.5 text-[12px] font-bold text-[#1b1140]">{provider.name}{provider.verified && <Verified />}</p>
            <p className="text-[10.5px] text-[#4a4466]">{provider.typeLabel}</p>
            {rating}
          </div>
        </figure>
        <figure className="space-y-1">
          <figcaption className="text-[11px] font-semibold text-[#2a1b57]">Booking (Select Specialist)</figcaption>
          <div className={cn('space-y-1.5 border border-[#ebe7f6] bg-white p-2 shadow-sm', device === 'ios' ? 'rounded-2xl' : 'rounded-xl')}>
            <div className="flex items-center gap-1.5">
              <img src={photoUrl} alt="" className="size-10 rounded-lg object-cover" />
              <div className="min-w-0 leading-tight">
                <p className="flex items-center gap-0.5 truncate text-[11px] font-bold text-[#1b1140]">{provider.name}{provider.verified && <Verified />}</p>
                <p className="truncate text-[10px] text-[#4a4466]">{provider.typeLabel}</p>
                {price && <p className="text-[10.5px] font-semibold text-[#1b1140]">{price}</p>}
              </div>
            </div>
            <span className={cn('flex h-7 items-center justify-center bg-[#4125d0] text-[11px] font-semibold text-white', device === 'ios' ? 'rounded-full' : 'rounded-md')}>Select</span>
          </div>
        </figure>
      </div>
    </div>
  )
}
