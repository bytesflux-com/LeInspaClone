import { useMarketContext } from '../../hooks/useMarketContext'
import { formatNumber } from '../../lib/format'
import CountryFlag from '../ui/CountryFlag'

export default function MarketDistributionCard({ markets }) {
  const { selectedMarket, setSelectedMarket } = useMarketContext()

  if (!markets || markets.length === 0) return null

  const handleSelectCountry = (code) => {
    if (code === 'OTHER') {
      setSelectedMarket('ALL')
    } else {
      setSelectedMarket(code)
    }
  }

  return (
    <div className="flex h-full flex-col justify-between rounded-2xl border border-gray-100 bg-white p-4 shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between pb-3">
        <h2 className="text-[15px] font-bold text-[#1b1140]">Providers by Market</h2>
        <span className="text-[11px] text-gray-400">Click to filter</span>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Stylized Africa Map SVG */}
        <div className="relative flex items-center justify-center rounded-xl bg-purple-50/30 p-2">
          <svg
            viewBox="0 0 320 340"
            className="h-48 w-full max-w-[220px] drop-shadow-sm select-none"
            aria-label="Lé Inspa African Market Coverage"
          >
            {/* Background silhouette outline of Africa */}
            <path
              d="M110,25 C140,20 180,25 210,35 C235,45 245,60 230,85 C220,105 240,115 255,125 C265,135 270,150 255,165 C240,180 230,195 220,220 C205,250 185,290 170,310 C155,325 145,310 140,290 C135,260 120,230 110,210 C95,180 70,165 60,155 C45,140 35,125 45,105 C55,85 75,70 95,50 Z"
              fill="#e2daf8"
              stroke="#cfc5ee"
              strokeWidth="1.5"
            />

            {/* Northern Hub: Morocco */}
            <path
              d="M65,45 C80,35 105,40 110,55 C95,65 80,65 65,45 Z"
              fill={selectedMarket.id === 'MA' ? '#5c2dd5' : '#8f6fd2'}
              className="cursor-pointer transition hover:fill-[#5c2dd5]"
              onClick={() => handleSelectCountry('MA')}
            >
              <title>Morocco</title>
            </path>

            {/* West Africa: Ghana & Nigeria */}
            <path
              d="M75,130 C90,125 110,130 115,145 C100,155 85,150 75,130 Z"
              fill={selectedMarket.id === 'GH' ? '#5c2dd5' : '#7c3aed'}
              className="cursor-pointer transition hover:fill-[#5c2dd5]"
              onClick={() => handleSelectCountry('GH')}
            >
              <title>Ghana</title>
            </path>
            <path
              d="M115,135 C135,130 150,140 145,160 C130,165 115,155 115,135 Z"
              fill={selectedMarket.id === 'NG' ? '#5c2dd5' : '#6d28d9'}
              className="cursor-pointer transition hover:fill-[#5c2dd5]"
              onClick={() => handleSelectCountry('NG')}
            >
              <title>Nigeria</title>
            </path>

            {/* East African Core: Kenya, Uganda, Tanzania, Rwanda */}
            <path
              d="M205,145 C230,140 240,160 230,175 C210,175 200,160 205,145 Z"
              fill={selectedMarket.id === 'KE' ? '#5c2dd5' : '#4f46e5'}
              className="cursor-pointer transition hover:fill-[#3730a3]"
              onClick={() => handleSelectCountry('KE')}
            >
              <title>Kenya (HQ)</title>
            </path>
            <path
              d="M185,145 C205,142 205,160 185,162 Z"
              fill={selectedMarket.id === 'UG' ? '#5c2dd5' : '#6366f1'}
              className="cursor-pointer transition hover:fill-[#4338ca]"
              onClick={() => handleSelectCountry('UG')}
            >
              <title>Uganda</title>
            </path>
            <path
              d="M195,168 C225,165 220,195 195,195 Z"
              fill={selectedMarket.id === 'TZ' ? '#5c2dd5' : '#818cf8'}
              className="cursor-pointer transition hover:fill-[#4f46e5]"
              onClick={() => handleSelectCountry('TZ')}
            >
              <title>Tanzania</title>
            </path>

            {/* Southern Hub: South Africa */}
            <path
              d="M140,280 C170,275 185,305 160,315 C145,315 135,300 140,280 Z"
              fill={selectedMarket.id === 'ZA' ? '#5c2dd5' : '#7c3aed'}
              className="cursor-pointer transition hover:fill-[#5c2dd5]"
              onClick={() => handleSelectCountry('ZA')}
            >
              <title>South Africa</title>
            </path>
          </svg>
          <div className="absolute bottom-2 left-2 rounded-md bg-white/90 px-1.5 py-0.5 text-[9.5px] font-semibold text-purple-900 shadow-2xs backdrop-blur-xs">
            Lé Inspa Sovereign Zones
          </div>
        </div>

        {/* Ranked Market List */}
        <div className="flex flex-col justify-between space-y-1">
          {markets.map((m) => {
            const isSelected = selectedMarket.id === m.code
            return (
              <button
                key={m.code}
                type="button"
                onClick={() => handleSelectCountry(m.code)}
                className={`flex w-full items-center justify-between rounded-xl px-2.5 py-1.5 text-left text-[12px] font-medium transition ${
                  isSelected
                    ? 'bg-[#5c2dd5] font-bold text-white shadow-xs'
                    : 'text-gray-700 hover:bg-gray-100/80'
                }`}
              >
                <div className="flex items-center gap-2">
                  {m.code !== 'OTHER' ? (
                    <CountryFlag code={m.code} className="w-4 h-2.5" />
                  ) : (
                    <span>🌐</span>
                  )}
                  <span>{m.name}</span>
                </div>
                <span className={isSelected ? 'text-white' : 'font-semibold text-[#1b1140]'}>
                  {formatNumber(m.count)}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

