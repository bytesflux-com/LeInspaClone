import { Link } from 'react-router'
import { Construction, ArrowLeft } from 'lucide-react'
import { PROFILE_CARD } from './ProfileCard'

// Tabs whose full screens (ADM-013 → ADM-019) are not built yet keep the
// profile header and control panel visible instead of leaving the profile.
export default function SectionPlaceholder({ title, screen, clientId, linkState }) {
  return (
    <section className={`${PROFILE_CARD} px-6 py-14 text-center`}>
      <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-[#f1edff] text-[#4527c8] ring-1 ring-[#d6caf1]">
        <Construction className="size-7" />
      </div>
      <h2 className="mt-4 text-[20px] font-bold tracking-tight text-[#1b1140]">{title}</h2>
      <p className="mx-auto mt-1.5 max-w-md text-[13px] text-[#4a4466]">
        The full {title.toLowerCase()} view is delivered in {screen}. Everything the admin needs at a glance is on the Overview tab.
      </p>
      <Link to={`/clients/${clientId}`} state={linkState} className="mt-5 inline-flex h-9 items-center gap-2 rounded-lg border-[1.5px] border-[#8b6cf0] bg-white px-4 text-[13px] font-semibold text-[#3b1fd6] transition hover:bg-[#f4f1fc]">
        <ArrowLeft className="size-4" /> Back to Overview
      </Link>
    </section>
  )
}
