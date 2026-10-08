import { useEffect, useRef, useState } from 'react'
import { cn } from '../../lib/utils'

export default function Dropdown({
  trigger,
  children,
  align = 'right',
  className = '',
  menuWidth = 'w-56',
}) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div className={cn('relative inline-block text-left', className)} ref={containerRef}>
      <div onClick={() => setOpen((prev) => !prev)}>
        {typeof trigger === 'function' ? trigger({ open }) : trigger}
      </div>

      {open && (
        <div
          className={cn(
            'absolute z-50 mt-2 rounded-2xl border border-gray-200 bg-white p-1.5 shadow-xl ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-100',
            align === 'right' ? 'right-0' : 'left-0',
            menuWidth,
          )}
          onClick={() => setOpen(false)}
        >
          {children}
        </div>
      )}
    </div>
  )
}

