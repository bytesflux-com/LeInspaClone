import { useState } from 'react'
import { ArrowRight, CalendarDays, Clock, Eye, EyeOff, Lock, Mail, MapPin, Phone, SmartphoneNfc, UserRound, Users } from 'lucide-react'
import { ProfileCard, CardLink, DetailRow } from './ProfileCard'
import { clientService } from '../../../services/clientService'
import { formatAgo, formatDay } from '../../../lib/profileFormat'

// Contact details arrive masked. Unmasking is a separate, audited call and is
// only offered to admins holding the reveal permission.
export default function ContactCard({ profile: c, canEdit, canReveal, editTo, linkState, onError }) {
  const [full, setFull] = useState(null) // { email, phone } once revealed
  const [show, setShow] = useState({ email: false, phone: false })
  const [busy, setBusy] = useState(false)

  const ensureFull = async () => {
    if (full) return full
    setBusy(true)
    try {
      const data = await clientService.revealClientContact(c.id)
      setFull(data)
      return data
    } catch (err) {
      onError?.(err?.message || 'Unable to reveal contact details')
      return null
    } finally {
      setBusy(false)
    }
  }

  const toggle = async (field) => {
    if (!show[field] && !(await ensureFull())) return
    setShow((s) => ({ ...s, [field]: !s[field] }))
  }

  const allShown = show.email && show.phone
  const toggleAll = async () => {
    if (!allShown && !(await ensureFull())) return
    setShow({ email: !allShown, phone: !allShown })
  }

  const Eyes = ({ field }) =>
    canReveal ? (
      <button
        type="button"
        onClick={() => toggle(field)}
        disabled={busy}
        aria-label={`${show[field] ? 'Hide' : 'Reveal'} ${field}`}
        className="ml-auto shrink-0 rounded p-0.5 text-[#4527c8] transition hover:bg-[#f1edff] disabled:opacity-50"
      >
        {show[field] ? <EyeOff className="size-[17px]" /> : <Eye className="size-[17px] fill-[#4527c8]/20" />}
      </button>
    ) : null

  return (
    <ProfileCard
      icon={Users}
      title="Client Information"
      className="h-full"
      action={canEdit ? <CardLink to={editTo} state={linkState} arrow={false}>Edit</CardLink> : null}
      bodyClass="flex flex-col"
    >
      <ul>
        <DetailRow icon={UserRound} iconClass="fill-[#4527c8] text-[#4527c8]" label="Full Name" labelWidth="w-[84px]">{c.name}</DetailRow>
        <DetailRow icon={Mail} iconClass="fill-[#4527c8] text-white" label="Email" labelWidth="w-[84px]">
          <span className="truncate text-[12px]">{show.email ? full.email : c.email}</span>
          <Eyes field="email" />
        </DetailRow>
        <DetailRow icon={Phone} iconClass="fill-[#4527c8] text-[#4527c8]" label="Phone" labelWidth="w-[84px]">
          <span className="truncate text-[12px]">{show.phone ? full.phone : c.phone}</span>
          <Eyes field="phone" />
        </DetailRow>
        <DetailRow icon={MapPin} iconClass="fill-[#4527c8] text-white" label="Location" labelWidth="w-[84px]">{c.city}, {c.countryName}</DetailRow>
        <DetailRow icon={CalendarDays} iconClass="fill-[#4527c8]/85 text-[#4527c8]" label="Date Joined" labelWidth="w-[84px]">{formatDay(c.joinedAt, c.timeZone, { year: true })}</DetailRow>
        <DetailRow icon={Clock} iconClass="fill-[#4527c8] text-white" label="Last Active" labelWidth="w-[84px]">{formatAgo(c.lastActiveAt, c.asOf)}</DetailRow>
        <DetailRow icon={SmartphoneNfc} iconClass="text-[#4527c8]" label="Registration Method" labelWidth="w-[84px]" className="min-h-[44px]">{c.registrationLabel}</DetailRow>
      </ul>

      <div className="mt-auto pt-3.5">
        {canReveal ? (
          <button
            type="button"
            onClick={toggleAll}
            disabled={busy}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#4125d0] text-[13px] font-semibold text-white shadow-sm transition hover:bg-[#3519b8] disabled:opacity-70"
          >
            {allShown ? 'Hide Full Contact Information' : 'View Full Contact Information'} <ArrowRight className="size-4" />
          </button>
        ) : (
          <p className="flex items-center gap-2 rounded-lg bg-[#f6f3fd] px-3 py-2.5 text-[11.5px] text-[#4a4466]">
            <Lock className="size-3.5 shrink-0 text-[#4527c8]" /> Contact details are masked for your role.
          </p>
        )}
      </div>
    </ProfileCard>
  )
}
