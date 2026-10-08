import { Check, ChevronDown } from 'lucide-react'
import { useMarketContext } from '../../hooks/useMarketContext'
import Dropdown from '../ui/Dropdown'
import CountryFlag from '../ui/CountryFlag'

export default function MarketSelector() {
  const { selectedMarket, setSelectedMarket, availableMarkets } = useMarketContext()

  return (
    <Dropdown
      menuWidth="w-56"
      trigger={({ open }) => (
        <button
          type="button"
          aria-label="Select Market"
          className={`flex h-9 items-center gap-2 rounded-xl border px-3 text-xs font-medium transition sm:text-sm ${
            open
              ? 'border-royal-600 bg-royal-50/60 text-royal-950 ring-2 ring-royal-500/20'
              : 'border-gray-200 bg-white text-gray-800 hover:border-gray-300 hover:bg-gray-50/80 shadow-xs'
          }`}
        >
          <CountryFlag code={selectedMarket.id} className="w-4.5 h-3" />
          <span className="font-semibold text-royal-950">{selectedMarket.name}</span>
          <ChevronDown className={`size-3.5 text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
      )}
    >
      <div className="px-3 py-2 text-[11px] font-semibold tracking-wider text-gray-400 uppercase">
        Sovereign Markets
      </div>
      <div className="space-y-0.5">
        {availableMarkets.map((m) => {
          const isSelected = m.id === selectedMarket.id
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => setSelectedMarket(m.id)}
              className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-medium transition sm:text-sm ${
                isSelected
                  ? 'bg-royal-50 text-royal-800 font-semibold'
                  : 'text-gray-700 hover:bg-gray-100/80'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <CountryFlag code={m.id} className="w-4.5 h-3" />
                <span>{m.name}</span>
              </span>
              {isSelected && <Check className="size-4 text-royal-700" />}
            </button>
          )
        })}
      </div>
      <div className="mt-1.5 border-t border-gray-100 px-3 py-1.5 text-[11px] text-gray-500">
        Workspace scoped to {selectedMarket.name}
      </div>
    </Dropdown>
  )
}

