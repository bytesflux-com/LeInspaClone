import { Activity, ArrowLeft, Radio, Shield, Users } from 'lucide-react'
import { Link } from 'react-router'
import PageContainer from '../../components/layout/PageContainer'
import Card from '../../components/ui/Card'
import { useMarketContext } from '../../hooks/useMarketContext'

// ADM-006 — Operations Center (Telemetry & Dispatch)
export default function OperationsCenter() {
  const { selectedMarket } = useMarketContext()

  return (
    <PageContainer>
      <div className="flex items-center justify-between border-b border-gray-200/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl" role="img" aria-label={selectedMarket.name}>
              {selectedMarket.flag}
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-royal-950">
              Operations Center — {selectedMarket.name}
            </h1>
          </div>
          <p className="mt-1 text-sm text-gray-600">
            Real-time live fleet tracking, dispatch coordination, and active incident response.
          </p>
        </div>

        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 shadow-xs hover:bg-gray-50 transition"
        >
          <ArrowLeft className="size-4" />
          Back to Global Dashboard
        </Link>
      </div>

      <div className="grid gap-6 sm:grid-cols-3">
        <Card title="Active In-Transit" subtitle="Therapists on the way">
          <div className="flex items-center justify-between">
            <span className="text-3xl font-extrabold text-royal-950">14</span>
            <Radio className="size-6 text-emerald-600 animate-pulse" />
          </div>
        </Card>

        <Card title="Services In-Progress" subtitle="Under active session">
          <div className="flex items-center justify-between">
            <span className="text-3xl font-extrabold text-royal-950">29</span>
            <Activity className="size-6 text-royal-700" />
          </div>
        </Card>

        <Card title="Safety Escort Available" subtitle="On standby">
          <div className="flex items-center justify-between">
            <span className="text-3xl font-extrabold text-royal-950">8</span>
            <Shield className="size-6 text-gold-500" />
          </div>
        </Card>
      </div>

      <Card
        title="Live Dispatch Telematics"
        subtitle={`Real-time GPS nodes active in ${selectedMarket.name}`}
      >
        <div className="flex h-80 items-center justify-center rounded-xl bg-gray-50 border border-dashed border-gray-300 p-8 text-center">
          <div>
            <Activity className="mx-auto size-10 text-royal-400" />
            <h3 className="mt-3 text-sm font-bold text-royal-950">ADM-006 Telematics Console</h3>
            <p className="mt-1 text-xs text-gray-500 max-w-sm">
              Live mapping coordinates and active route tracking scoped to {selectedMarket.name}. Reuses persistent market context.
            </p>
          </div>
        </div>
      </Card>
    </PageContainer>
  )
}

