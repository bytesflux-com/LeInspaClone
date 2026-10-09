import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Ellipsis } from 'lucide-react'

// Fixed-position menu so it is never clipped by the table's scroll container.
export default function RowActionsMenu({ label, actions }) {
  const [pos, setPos] = useState(null)
  const buttonRef = useRef(null)
  const menuRef = useRef(null)

  useEffect(() => {
    if (!pos) return undefined
    const close = () => setPos(null)
    const onDown = (e) => {
      if (menuRef.current?.contains(e.target) || buttonRef.current?.contains(e.target)) return
      close()
    }
    const onKey = (e) => e.key === 'Escape' && close()
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    window.addEventListener('resize', close)
    document.addEventListener('scroll', close, true)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
      window.removeEventListener('resize', close)
      document.removeEventListener('scroll', close, true)
    }
  }, [pos])

  // Flip above the button when there is no room below.
  useLayoutEffect(() => {
    if (!pos || !menuRef.current || !buttonRef.current) return
    const menuH = menuRef.current.offsetHeight
    const rect = buttonRef.current.getBoundingClientRect()
    if (rect.bottom + menuH + 12 > window.innerHeight) {
      menuRef.current.style.top = `${Math.max(8, rect.top - menuH - 6)}px`
    }
  }, [pos])

  const toggle = (e) => {
    e.stopPropagation()
    if (pos) return setPos(null)
    const rect = buttonRef.current.getBoundingClientRect()
    setPos({ top: rect.bottom + 6, right: window.innerWidth - rect.right })
  }

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={toggle}
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={Boolean(pos)}
        className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-[#d9d2ee] bg-white text-[#4527c8] transition hover:bg-[#f1edff]"
      >
        <Ellipsis className="size-4" />
      </button>
      {pos &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            style={{ top: pos.top, right: pos.right }}
            className="fixed z-[70] w-48 rounded-xl border border-[#e6e1f3] bg-white p-1.5 shadow-xl ring-1 ring-black/5"
          >
            {actions.map((a) => (
              <button
                key={a.label}
                type="button"
                role="menuitem"
                onClick={(e) => {
                  e.stopPropagation()
                  setPos(null)
                  a.onSelect()
                }}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[12.5px] font-medium text-[#2a1b57] transition hover:bg-[#f4f1fc]"
              >
                {a.icon && <a.icon className="size-4 text-[#5b2fd0]" />}
                {a.label}
              </button>
            ))}
          </div>,
          document.body,
        )}
    </>
  )
}
