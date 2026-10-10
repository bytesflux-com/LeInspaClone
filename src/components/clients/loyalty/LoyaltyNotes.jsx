import { useState } from 'react'
import { Lock } from 'lucide-react'
import { PROFILE_CARD } from '../profile/ProfileCard'
import { formatFullStamp } from '../../../lib/profileFormat'
import { cn } from '../../../lib/utils'

// Internal notes stay separate from anything the client can see: saving one never creates,
// edits or reverses a reward, referral or loyalty record.
export default function LoyaltyNotes({ notes, timeZone, onSave }) {
  const [text, setText] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const save = async () => {
    if (!text.trim() || saving) return
    setSaving(true)
    setError(null)
    try {
      await onSave(text.trim())
      setText('')
    } catch (err) {
      setError(err?.message || 'Unable to save the note.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section aria-label="Internal referral and loyalty notes" className={cn(PROFILE_CARD, 'p-3.5')}>
      <h2 className="mb-2 text-[17px] leading-tight font-bold tracking-tight text-[#1b1140]">Internal Notes</h2>

      {notes.length > 0 && (
        <ul className="mb-2 max-h-32 space-y-1.5 overflow-y-auto">
          {notes.map((n) => (
            <li key={n.id} className="rounded-lg bg-[#f4f1fc] px-2.5 py-1.5 text-[12px] text-[#1b1140]">
              {n.text}
              <span className="mt-0.5 block text-[10.5px] text-[#4a4466]">{n.author} • {formatFullStamp(n.createdAt, timeZone)}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-stretch gap-3">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={2}
          maxLength={500}
          aria-label="Internal referral or loyalty note"
          aria-describedby="loyalty-note-help"
          placeholder="Add an internal note about this client's referral or loyalty activity…"
          className="min-h-[46px] min-w-0 flex-1 resize-none rounded-lg border border-[#d9d3ee] bg-[#faf9fe] px-3 py-2.5 text-[12.5px] text-[#1b1140] placeholder:text-[#4a4466] focus:border-[#7a5cf0] focus:bg-white focus:outline-none"
        />
        <button
          type="button"
          onClick={save}
          disabled={!text.trim() || saving}
          className="inline-flex w-[170px] shrink-0 items-center justify-center gap-2 rounded-lg bg-[#4125d0] text-[14px] font-semibold text-white shadow-sm transition hover:bg-[#3719b8] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Lock className="size-4" aria-hidden="true" /> {saving ? 'Saving…' : 'Save Note'}
        </button>
      </div>
      {error && <p role="alert" className="mt-1.5 text-[11.5px] text-[#b91c1c]">{error}</p>}
      <p id="loyalty-note-help" className="sr-only">Visible only to authorised Lé Inspa admin staff. Notes never change a referral, loyalty record or reward.</p>
    </section>
  )
}
