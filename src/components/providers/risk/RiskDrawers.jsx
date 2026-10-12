import { useState } from 'react'
import { Btn, Drawer, ErrorBanner, Field, Pill, Row } from '../trust/TrustUI'
import { inputCls } from '../trust/trustFormat'

// Every score is explainable: model version, weights and per-component points.
export function ScoreExplanationDrawer({ data, onClose }) {
  const q = data.kpis.quality
  const r = data.kpis.risk
  return (
    <Drawer open title="How this provider is assessed" subtitle={q.available ? `Quality model ${q.modelVersion}` : 'No score available'} onClose={onClose}>
      {q.available ? (
        <section className="space-y-2">
          <h4 className="text-[13px] font-bold text-royal-950">Quality Score — {q.score} / 100 ({q.label})</h4>
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full text-left text-[12px]">
              <thead className="bg-lavender-50 text-[11px] text-slate-500"><tr><th className="px-3 py-2">Component</th><th className="px-3 py-2">Weight</th><th className="px-3 py-2">Points</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {q.explanation.map((c) => (
                  <tr key={c.key}>
                    <td className="px-3 py-2"><span className="font-semibold text-slate-800">{c.label}</span><span className="block text-[11px] text-slate-500">{c.how}</span></td>
                    <td className="px-3 py-2">{c.weight}</td>
                    <td className="px-3 py-2">{c.points ?? <span className="text-slate-400">{c.note}</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[11px] text-slate-500">Score = points earned ÷ weight of components with data × 100. Subscription and Premium Visibility are never inputs.</p>
        </section>
      ) : <p className="text-[12px] text-slate-600">{q.reason}</p>}
      <section className="space-y-1.5">
        <h4 className="text-[13px] font-bold text-royal-950">Risk Level — {r.label}</h4>
        {r.reasons.length === 0 ? <p className="text-[12px] text-slate-600">No configured risk rule is currently triggered.</p> : r.reasons.map((x) => (
          <Row key={x.text} label={x.text}><Pill tone={x.level === 'high' ? 'red' : 'amber'}>{x.level}</Pill></Row>
        ))}
        <p className="text-[11px] text-slate-500">Low: no significant unresolved indicators. Medium: one or more signals require investigation (e.g. several open cases, a serious open case, expired credential). High: serious or repeated confirmed violations.</p>
      </section>
    </Drawer>
  )
}

export function AssessmentDrawer({ data, onClose, onSubmit }) {
  const [level, setLevel] = useState(data.assessment?.level || data.kpis.risk.level)
  const [reason, setReason] = useState('')
  const [note, setNote] = useState('')
  const [relatedCases, setRelatedCases] = useState(data.openCases.map((c) => c.id))
  const [nextReviewDays, setNextReviewDays] = useState(30)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const toggle = (id) => setRelatedCases((list) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]))
  const submit = async () => {
    setBusy(true)
    setError(null)
    try {
      await onSubmit({ level, reason, note, relatedCases, nextReviewDays: Number(nextReviewDays) })
    } catch (err) {
      setError(err?.message || 'The assessment could not be saved.')
    } finally {
      setBusy(false)
    }
  }
  return (
    <Drawer open title="Update Assessment" subtitle={`Current: ${data.assessment?.levelLabel || 'none'} • Calculated: ${data.kpis.risk.label}`} onClose={onClose}
      footer={<div className="flex justify-end gap-2"><Btn variant="ghost" onClick={onClose}>Cancel</Btn><Btn disabled={busy || reason.trim().length < 10} onClick={submit}>{busy ? 'Saving…' : 'Record Assessment'}</Btn></div>}>
      <Field label="Assessment" required>
        <div className="grid grid-cols-3 gap-2">
          {data.levels.map((l) => (
            <button key={l.code} type="button" onClick={() => setLevel(l.code)} className={`rounded-xl border px-3 py-2 text-[12px] font-semibold ${level === l.code ? 'border-royal-500 bg-royal-50 text-royal-800' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>{l.label}</button>
          ))}
        </div>
      </Field>
      <Field label="Internal reason" required hint="At least 10 characters. Required for every assessment.">
        <input value={reason} onChange={(e) => setReason(e.target.value)} className={inputCls} placeholder="e.g. Complaint under review; no pattern of misconduct" />
      </Field>
      <Field label="Internal review note">
        <textarea rows={4} value={note} onChange={(e) => setNote(e.target.value)} className={inputCls} />
      </Field>
      {data.openCases.length > 0 && (
        <Field label="Related cases">
          <div className="space-y-1">
            {data.openCases.map((c) => (
              <label key={c.id} className="flex items-center gap-2 text-[12px]"><input type="checkbox" checked={relatedCases.includes(c.id)} onChange={() => toggle(c.id)} className="accent-royal-700" />{c.id} — {c.category}</label>
            ))}
          </div>
        </Field>
      )}
      <Field label="Next review in (days)">
        <input type="number" min={1} max={180} value={nextReviewDays} onChange={(e) => setNextReviewDays(e.target.value)} className={inputCls} />
      </Field>
      <p className="text-[11.5px] text-slate-500">The assessment is stored as a new record — previous assessments are preserved. Enforcement happens only in Provider Account Actions.</p>
      <ErrorBanner>{error}</ErrorBanner>
    </Drawer>
  )
}
