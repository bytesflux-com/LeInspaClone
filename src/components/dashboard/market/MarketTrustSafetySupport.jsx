import { ShieldCheck, ShieldAlert, LifeBuoy, FileText, Camera, UserX, Clock, CheckCircle2 } from 'lucide-react'
import Badge from '../../ui/Badge'

export function MarketTrustSafetySupport({ moderationSafetySupport, marketName = 'Kenya' }) {
  if (!moderationSafetySupport) return null

  const { verificationsQueue, trustAndSafety, supportService } = moderationSafetySupport

  return (
    <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
      {/* Verification & Approvals Backlog */}
      <div className="flex flex-col justify-between rounded-2xl border border-gray-200/90 bg-white p-5 shadow-xs">
        <div>
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-4.5 text-royal-700" />
              <h3 className="text-base font-bold text-royal-950">Verification & Moderation</h3>
            </div>
            <Badge variant="warning">
              {verificationsQueue?.applications + verificationsQueue?.credentials} Backlog
            </Badge>
          </div>

          <p className="mt-2 text-xs text-gray-500">
            Pending document & content moderation queues in {marketName}
          </p>

          <div className="mt-4 space-y-2.5 text-xs">
            <div className="flex items-center justify-between rounded-xl bg-gray-50 p-2.5 border border-gray-100">
              <span className="text-gray-700 font-medium">Provider KYC Applications</span>
              <span className="font-bold text-royal-950">{verificationsQueue?.applications}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-gray-50 p-2.5 border border-gray-100">
              <span className="text-gray-700 font-medium">Professional Credentials</span>
              <span className="font-bold text-royal-950">{verificationsQueue?.credentials}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-gray-50 p-2.5 border border-gray-100">
              <span className="text-gray-700 font-medium">Profile Photos & Avatars</span>
              <span className="font-bold text-royal-950">{verificationsQueue?.photos}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-gray-50 p-2.5 border border-gray-100">
              <span className="text-gray-700 font-medium">Portfolio Gallery Media</span>
              <span className="font-bold text-royal-950">{verificationsQueue?.media}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Trust & Safety Overview */}
      <div className="flex flex-col justify-between rounded-2xl border border-gray-200/90 bg-white p-5 shadow-xs">
        <div>
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2">
              <ShieldAlert className="size-4.5 text-rose-600" />
              <h3 className="text-base font-bold text-royal-950">Trust & Safety Response</h3>
            </div>
            <Badge variant="danger" dot dotColor="bg-rose-500">
              {trustAndSafety?.highPriority} High Priority
            </Badge>
          </div>

          <p className="mt-2 text-xs text-gray-500">
            Field incidents & account integrity in {marketName}
          </p>

          <div className="mt-4 space-y-2.5 text-xs">
            <div className="flex items-center justify-between rounded-xl bg-rose-50/60 p-2.5 border border-rose-100">
              <span className="text-rose-900 font-medium">Open Safety Incidents</span>
              <span className="font-extrabold text-rose-950">{trustAndSafety?.openReports}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-amber-50/60 p-2.5 border border-amber-100">
              <span className="text-amber-900 font-medium">Active Booking Disputes</span>
              <span className="font-extrabold text-amber-950">{trustAndSafety?.disputes}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-gray-50 p-2.5 border border-gray-100">
              <span className="text-gray-700 font-medium">Suspended Accounts</span>
              <span className="font-bold text-gray-900">{trustAndSafety?.suspendedAccounts}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Customer & Partner Support Concierge */}
      <div className="flex flex-col justify-between rounded-2xl border border-gray-200/90 bg-white p-5 shadow-xs">
        <div>
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2">
              <LifeBuoy className="size-4.5 text-royal-700" />
              <h3 className="text-base font-bold text-royal-950">Support Concierge SLA</h3>
            </div>
            <Badge variant="success">96.8% SLA</Badge>
          </div>

          <p className="mt-2 text-xs text-gray-500">
            Ticket turnaround telemetry in {marketName}
          </p>

          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between rounded-xl bg-gray-50 p-3 border border-gray-100">
              <div>
                <div className="text-[11px] text-gray-500">Open Tickets</div>
                <div className="text-lg font-bold text-royal-950">{supportService?.openTickets}</div>
              </div>
              <div>
                <div className="text-[11px] text-gray-500">Avg Response</div>
                <div className="text-lg font-bold text-emerald-700">{supportService?.avgResponseMinutes} min</div>
              </div>
              <div>
                <div className="text-[11px] text-gray-500">Resolved Today</div>
                <div className="text-lg font-bold text-blue-900">{supportService?.resolvedToday}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
export default MarketTrustSafetySupport
