import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import Button from '../ui/Button'

const TAG_SUGGESTIONS = ['VIP', 'Follow-up', 'Marketing opt-in', 'Needs review']
const field =
  'w-full rounded-lg border border-[#ddd7ee] bg-white px-3 text-[13px] text-[#1b1140] placeholder:text-[#8a85a3] focus:border-[#7a5cf0] focus:ring-3 focus:ring-[#7a5cf0]/15 focus:outline-none'

const COPY = {
  notification: { title: 'Send Notification', cta: 'Send Notification', busy: 'Sending…' },
  tag: { title: 'Add Internal Tag', cta: 'Add Tag', busy: 'Adding…' },
  note: { title: 'Add Client Note', cta: 'Save Note', busy: 'Saving…' },
}

// One dialog for the three safe write actions available from ADM-011.
export default function ClientActionDialog({ mode, targetLabel, onSubmit, onClose }) {
  const [title, setTitle] = useState('')
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const firstField = useRef(null)
  const copy = COPY[mode]

  useEffect(() => {
    firstField.current?.focus()
    const onKey = (e) => e.key === 'Escape' && !busy && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [busy, onClose])

  const valid = mode === 'notification' ? title.trim() && text.trim() : text.trim()

  const submit = async (e) => {
    e.preventDefault()
    if (!valid) return
    setBusy(true)
    setError('')
    try {
      await onSubmit({ title: title.trim(), text: text.trim() })
    } catch (err) {
      setError(err?.message || 'Something went wrong. Please try again.')
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[65] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#13072e]/45 backdrop-blur-[2px]" onClick={() => !busy && onClose()} aria-hidden="true" />
      <form
        onSubmit={submit}
        role="dialog"
        aria-modal="true"
        aria-label={copy.title}
        className="relative w-full max-w-md space-y-4 rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-[16px] font-bold text-[#1b1140]">{copy.title}</h2>
            <p className="mt-0.5 text-[12.5px] text-[#4a4466]">{targetLabel}</p>
          </div>
          <button type="button" onClick={onClose} disabled={busy} aria-label="Close" className="rounded-lg p-1.5 text-[#2a1b57] hover:bg-[#f1edff]">
            <X className="size-[18px]" />
          </button>
        </div>

        {mode === 'notification' && (
          <>
            <input ref={firstField} className={`${field} h-10`} value={title} maxLength={80} onChange={(e) => setTitle(e.target.value)} placeholder="Notification title" aria-label="Notification title" />
            <textarea className={`${field} min-h-28 py-2.5`} value={text} maxLength={500} onChange={(e) => setText(e.target.value)} placeholder="Message to clients" aria-label="Notification message" />
          </>
        )}
        {mode === 'tag' && (
          <>
            <input ref={firstField} className={`${field} h-10`} value={text} maxLength={40} onChange={(e) => setText(e.target.value)} placeholder="Tag name" aria-label="Tag name" />
            <div className="flex flex-wrap gap-2">
              {TAG_SUGGESTIONS.map((t) => (
                <button key={t} type="button" onClick={() => setText(t)} className="rounded-full border border-[#ddd7ee] px-3 py-1 text-[12px] text-[#2a1b57] hover:bg-[#f1edff]">{t}</button>
              ))}
            </div>
          </>
        )}
        {mode === 'note' && (
          <textarea ref={firstField} className={`${field} min-h-32 py-2.5`} value={text} maxLength={1000} onChange={(e) => setText(e.target.value)} placeholder="Write an internal note (not visible to the client)" aria-label="Client note" />
        )}

        {error && <p role="alert" className="text-[12.5px] text-rose-700">{error}</p>}

        <div className="flex justify-end gap-2.5 pt-1">
          <Button variant="secondary" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button type="submit" disabled={!valid} loading={busy} loadingText={copy.busy} className="bg-[#4125d0] ring-[#4125d0] hover:bg-[#3519b8]">{copy.cta}</Button>
        </div>
      </form>
    </div>
  )
}
