import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { ArrowRight, X } from 'lucide-react'
import { CARD, H2, HistoryStatus, LINK, NotificationStatus, VIEW_BTN } from './AccountParts'
import { HISTORY_PREVIEW } from '../../../constants/clientAccount'
import { formatDay, formatFullStamp } from '../../../lib/profileFormat'
import { cn } from '../../../lib/utils'

const TH = 'px-2 py-1.5 text-left text-[11px] font-semibold text-[#1b1140]'
const TD = 'px-2 py-[7px] text-[11.5px] text-[#1b1140]'

function Row({ label, children }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-[#efecf7] py-2 text-[12.5px] last:border-b-0">
      <dt className="shrink-0 text-[#2a1b57]">{label}</dt>
      <dd className="min-w-0 text-right font-semibold break-words text-[#1b1140]">{children}</dd>
    </div>
  )
}

// Read-only record. Account actions are never edited or deleted; the Audit Log keeps the full trail.
function RecordDialog({ title, rows, note, auditTo, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <button type="button" aria-label="Close record" onClick={onClose} className="absolute inset-0 bg-[#1b1140]/40" />
      <div role="dialog" aria-modal="true" aria-label={title} className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl">
        <header className="mb-2 flex items-center justify-between">
          <h2 className="text-[18px] font-bold text-[#1b1140]">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-lg p-1 hover:bg-[#f1edff]"><X className="size-5" /></button>
        </header>
        <dl>{rows.filter(Boolean).map(([label, value]) => <Row key={label} label={label}>{value}</Row>)}</dl>
        {note}
        {auditTo && <Link to={auditTo} className="mt-3 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border-[1.5px] border-[#8b6cf0] bg-white text-[12.5px] font-semibold text-[#3b1fd6] hover:bg-[#f4f1fc]">Open Audit Logs <ArrowRight className="size-3.5" aria-hidden="true" /></Link>}
      </div>
    </div>
  )
}

const caseLabel = (rel) => (rel?.restricted ? 'Restricted (Trust & Safety only)' : rel ? rel.id : null)

// Every important action stays permanently traceable.
export function ActionHistoryCard({ history, client, canAudit }) {
  const tz = client.timeZone
  const [all, setAll] = useState(false)
  const [open, setOpen] = useState(null)
  const rows = all ? history : history.slice(0, HISTORY_PREVIEW)
  const d = open?.detail

  return (
    <section aria-label="Account action history" className={cn(CARD, 'min-w-0')}>
      <header className="mb-2 flex items-center justify-between gap-2">
        <h2 className={H2}>Account Action History</h2>
        {history.length > HISTORY_PREVIEW && (
          <button type="button" onClick={() => setAll((v) => !v)} className={LINK}>{all ? 'Show Less' : 'View All'} <ArrowRight className="size-3.5" aria-hidden="true" /></button>
        )}
      </header>
      {history.length === 0 ? (
        <p className="py-6 text-center text-[12px] text-[#4a4466]">No account actions have been recorded for this client.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse">
            <thead>
              <tr className="bg-[#f3f0fb]">{['Date', 'Action', 'Reason', 'Scope', 'Admin', 'Status', 'Action'].map((h) => <th key={h} className={TH}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {rows.map((h) => (
                <tr key={h.id} className="border-b border-[#efecf7] last:border-b-0">
                  <td className={cn(TD, 'whitespace-nowrap')}>{formatDay(h.at, tz, { year: true })}</td>
                  <td className={TD}>{h.action}</td>
                  <td className={TD}>{h.reason}</td>
                  <td className={TD}>{h.scope}</td>
                  <td className={TD}>{h.admin}</td>
                  <td className={TD}><HistoryStatus status={h.status} /></td>
                  <td className={TD}><button type="button" onClick={() => setOpen(h)} aria-label={`View ${h.action} on ${formatDay(h.at, tz, { year: true })}`} className={VIEW_BTN}>View <ArrowRight className="size-3" aria-hidden="true" /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {open && (
        <RecordDialog
          title="Account Action Record"
          onClose={() => setOpen(null)}
          auditTo={canAudit ? `/audit-logs?q=${open.id}` : null}
          rows={[
            ['Record ID', open.id],
            ['Action', open.action],
            ['Date', formatFullStamp(open.at, tz)],
            ['Scope', open.scope],
            ['Reason', open.reason],
            d.durationLabel && ['Duration', d.durationLabel],
            ['Performed by', open.admin],
            ['Status', <HistoryStatus key="s" status={open.status} />],
            d.related && ['Related case', caseLabel(d.related)],
            ['Client notified', d.notified ? 'Yes' : 'No'],
            d.clientMessage && ['Sent to client', d.clientMessage],
            d.internalNote && ['Internal note', d.internalNote],
          ]}
          note={<p className="mt-3 rounded-lg bg-[#f4f1fc] px-3 py-2 text-[11.5px] text-[#2a1b57]">Records are permanent. Ending a restriction adds a new event — the original is never overwritten. The internal note is visible to Lé Inspa staff only.</p>}
        />
      )}
    </section>
  )
}

// What did we actually tell the client?
export function AccountNotificationsCard({ notifications, client }) {
  const tz = client.timeZone
  const [all, setAll] = useState(false)
  const [open, setOpen] = useState(null)
  const rows = all ? notifications : notifications.slice(0, HISTORY_PREVIEW)

  return (
    <section aria-label="Account notifications" className={cn(CARD, 'min-w-0')}>
      <header className="mb-2 flex items-center justify-between gap-2">
        <h2 className={H2}>Account Notifications</h2>
        {notifications.length > HISTORY_PREVIEW && (
          <button type="button" onClick={() => setAll((v) => !v)} className={LINK}>{all ? 'Show Less' : 'View All'} <ArrowRight className="size-3.5" aria-hidden="true" /></button>
        )}
      </header>
      {notifications.length === 0 ? (
        <p className="py-6 text-center text-[12px] text-[#4a4466]">No notifications have been sent for account actions.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[460px] border-collapse">
            <thead>
              <tr className="bg-[#f3f0fb]">{['Date', 'Message', 'Channel', 'Status', 'Action'].map((h) => <th key={h} className={TH}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {rows.map((n) => (
                <tr key={n.id} className="border-b border-[#efecf7] last:border-b-0">
                  <td className={cn(TD, 'whitespace-nowrap')}>{formatDay(n.at, tz, { year: true })}</td>
                  <td className={TD}>{n.message}</td>
                  <td className={TD}>{n.channel}</td>
                  <td className={TD}><NotificationStatus status={n.status} /></td>
                  <td className={TD}><button type="button" onClick={() => setOpen(n)} aria-label={`View message: ${n.message}`} className={VIEW_BTN}>View <ArrowRight className="size-3" aria-hidden="true" /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {open && (
        <RecordDialog
          title="Message Sent to Client"
          onClose={() => setOpen(null)}
          rows={[['Message', open.message], ['Sent', formatFullStamp(open.at, tz)], ['Channel', open.channel], ['Status', <NotificationStatus key="s" status={open.status} />]]}
          note={
            <div className="mt-3 rounded-xl border border-[#e6e1f3] bg-[#faf9fe] p-3">
              <p className="text-[10.5px] font-semibold tracking-wide text-[#6b6785] uppercase">What the client saw</p>
              <p className="mt-1 text-[12.5px] leading-snug whitespace-pre-wrap text-[#1b1140]">{open.body}</p>
            </div>
          }
        />
      )}
    </section>
  )
}
