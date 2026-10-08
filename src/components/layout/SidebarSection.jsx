export default function SidebarSection({ label, children }) {
  return (
    <div className="space-y-1">
      {label && (
        <h3 className="px-3 py-1 text-[11px] font-bold tracking-wider text-royal-300/60 uppercase">
          {label}
        </h3>
      )}
      <div className="space-y-0.5">{children}</div>
    </div>
  )
}

