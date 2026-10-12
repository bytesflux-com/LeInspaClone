import { Construction, ArrowLeft, ArrowRight } from 'lucide-react'
import { Link } from 'react-router'

// Screens that are specified but not built yet. Says so plainly and points to
// the closest working screen instead of leaving the admin at a dead end.
export default function Placeholder({ title, spec, alternatives = [] }) {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
        <Link to="/dashboard" className="hover:text-royal-700">Dashboard</Link>
        <span>/</span>
        <span className="text-gray-900 font-semibold">{title}</span>
      </div>

      <div className="rounded-2xl border border-gray-200/90 bg-white p-12 text-center shadow-xs">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-royal-50 text-royal-700 ring-1 ring-royal-200">
          <Construction className="size-7" />
        </div>

        <h1 className="mt-5 text-2xl font-bold tracking-tight text-royal-950">{title}</h1>
        <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto">
          {spec ? `This screen (${spec}) is in the specification but has not been built yet.` : 'This screen has not been built yet.'}
        </p>

        {alternatives.length > 0 && (
          <div className="mx-auto mt-5 flex max-w-md flex-col gap-2">
            {alternatives.map((a) => (
              <Link key={a.to} to={a.to} className="flex items-center justify-between rounded-xl border border-royal-100 px-4 py-2.5 text-left text-xs font-semibold text-royal-800 hover:bg-royal-50">
                {a.label}
                <ArrowRight className="size-4" />
              </Link>
            ))}
          </div>
        )}

        <div className="mt-6 flex justify-center">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 rounded-xl bg-royal-900 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-royal-800 transition"
          >
            <ArrowLeft className="size-4" />
            Return to Global Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
