import { Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react'
import { Link } from 'react-router'
import CountryFlag from '../ui/CountryFlag'

export default function ExactMatchBanner({ match }) {
  if (!match) return null

  return (
    <div className="relative overflow-hidden rounded-2xl border-2 border-purple-300 bg-linear-to-r from-purple-50 via-white to-purple-50/40 p-4 sm:p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-[#5c2dd5] text-white shadow-xs shrink-0">
            <Sparkles className="size-5" />
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="rounded-md bg-[#5c2dd5] px-2 py-0.5 text-[10px] font-black tracking-wide text-white uppercase">
                Exact Match
              </span>
              <h3 className="text-base font-extrabold text-gray-950">{match.title}</h3>
              {match.status && (
                <span className="rounded-md bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                  {match.status}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 mt-1 text-xs text-gray-600 flex-wrap">
              {match.subtitle && <span className="font-semibold text-gray-900">{match.subtitle}</span>}
              {match.amount && <span className="font-black text-gray-950">· {match.amount}</span>}
              {match.market && (
                <span className="inline-flex items-center gap-1">
                  · <CountryFlag code={match.market} className="w-3.5 h-2.5 inline" />
                  <span>{match.marketName}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        <Link
          to={match.link || '/operations'}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#5c2dd5] px-4 py-2.5 text-xs font-bold text-white shadow-2xs hover:bg-[#4922ab] transition-all shrink-0 cursor-pointer"
        >
          <span>Open Exact Record</span>
          <ArrowRight className="size-3.5" />
        </Link>
      </div>
    </div>
  )
}

