import { Link, useNavigate } from 'react-router'
import { CheckCircle2, Clock, ArrowRight, ShieldAlert } from 'lucide-react'
import CountryFlag from '../ui/CountryFlag'

export default function RecentProvidersTable({ providers }) {
  const navigate = useNavigate()
  if (!providers || providers.length === 0) return null

  const getVerificationBadge = (verification) => {
    if (verification === 'Verified') {
      return (
        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
          <CheckCircle2 className="size-3 text-emerald-600" /> Verified
        </span>
      )
    }
    if (verification === 'Documents Review') {
      return (
        <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
          <Clock className="size-3 text-amber-600" /> Documents Review
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
        <Clock className="size-3 text-amber-600" /> Pending
      </span>
    )
  }

  const getStatusBadge = (status) => {
    if (status === 'Active') {
      return (
        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
          <span className="size-1.5 rounded-full bg-emerald-500" /> Active
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
        <span className="size-1.5 rounded-full bg-amber-500" /> Pending
      </span>
    )
  }

  return (
    <div className="flex flex-col rounded-2xl border border-gray-100 bg-white p-4 shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between pb-3">
        <h2 className="text-[15px] font-bold text-[#1b1140]">Recently Joined Providers</h2>
        <Link
          to="/providers/all"
          className="flex items-center gap-1 text-[12px] font-semibold text-[#5c2dd5] transition hover:text-[#4520a8]"
        >
          View All <ArrowRight className="size-3.5" />
        </Link>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-[12px]">
          <thead>
            <tr className="border-b border-gray-100 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              <th className="pb-2.5">Provider</th>
              <th className="pb-2.5">Type</th>
              <th className="pb-2.5">Market</th>
              <th className="pb-2.5">Verification</th>
              <th className="pb-2.5">Status</th>
              <th className="pb-2.5">Joined</th>
              <th className="pb-2.5 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {providers.map((p) => (
              <tr key={p.id} className="transition hover:bg-gray-50/60">
                {/* Provider with Avatar */}
                <td className="py-2.5">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={p.avatar}
                      alt={p.name}
                      className="size-8 rounded-full object-cover ring-1 ring-gray-200"
                    />
                    <span className="font-semibold text-[#1b1140]">{p.name}</span>
                  </div>
                </td>

                {/* Type */}
                <td className="py-2.5 text-gray-600 font-medium">{p.type}</td>

                {/* Market */}
                <td className="py-2.5">
                  <div className="flex items-center gap-1.5 font-medium text-gray-700">
                    <CountryFlag code={p.marketCode} className="w-4 h-2.5" />
                    <span>{p.market}</span>
                  </div>
                </td>

                {/* Verification */}
                <td className="py-2.5">{getVerificationBadge(p.verification)}</td>

                {/* Status */}
                <td className="py-2.5">{getStatusBadge(p.status)}</td>

                {/* Joined */}
                <td className="py-2.5 text-gray-500 font-medium">{p.joined}</td>

                {/* Action */}
                <td className="py-2.5 text-right">
                  {p.verification === 'Verified' ? (
                    <button
                      type="button"
                      onClick={() => navigate(`/providers/${p.id}`)}
                      className="inline-flex items-center gap-1 rounded-lg border border-[#cfc5ee] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#5c2dd5] shadow-2xs transition hover:bg-[#f4f1fc]"
                    >
                      View <ArrowRight className="size-3" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => navigate(`/verifications?providerId=${p.id}`)}
                      className="inline-flex items-center gap-1 rounded-lg bg-[#5c2dd5] px-2.5 py-1 text-[11px] font-semibold text-white shadow-2xs transition hover:bg-[#481ec0]"
                    >
                      Review <ArrowRight className="size-3" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

