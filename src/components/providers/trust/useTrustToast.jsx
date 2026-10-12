import { useCallback, useEffect, useRef, useState } from 'react'
import { CircleAlert, CircleCheck } from 'lucide-react'
import { cn } from '../../../lib/utils'

// Toast for ADM-025 → ADM-028 screens: `show(message, tone?)` and the `node` to render.
export function useToast() {
  const [toast, setToast] = useState(null)
  const timer = useRef(null)
  const show = useCallback((message, tone = 'success') => {
    setToast({ message, tone })
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setToast(null), 4200)
  }, [])
  useEffect(() => () => clearTimeout(timer.current), [])
  const node = toast ? (
    <div role="status" className={cn('fixed right-6 bottom-6 z-[90] flex max-w-[440px] items-center gap-2.5 rounded-xl px-4 py-3 text-[12.5px] font-medium text-white shadow-2xl', toast.tone === 'error' ? 'bg-rose-700' : 'bg-royal-950')}>
      {toast.tone === 'error' ? <CircleAlert className="size-4 shrink-0 text-rose-200" /> : <CircleCheck className="size-4 shrink-0 text-emerald-400" />}
      {toast.message}
    </div>
  ) : null
  return { show, node }
}
