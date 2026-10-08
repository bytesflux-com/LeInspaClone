import { Check } from 'lucide-react'

// Horizontal progress indicator: completed steps show a check, the current
// step is filled purple, upcoming steps are muted.
export default function Steps({ steps, current }) {
  return (
    <ol className="flex items-start" aria-label="Progress">
      {steps.map((label, i) => {
        const state = i < current ? 'done' : i === current ? 'current' : 'upcoming'
        return (
          <li key={label} className="relative flex flex-1 flex-col items-center text-center" aria-current={state === 'current' ? 'step' : undefined}>
            {i > 0 && (
              <span
                className={`absolute top-3.5 right-1/2 h-0.5 w-[calc(100%-2.25rem)] -translate-x-[1.125rem] ${i <= current ? 'bg-royal-600' : 'bg-gray-200'}`}
                aria-hidden="true"
              />
            )}
            <span
              className={`relative flex size-7 items-center justify-center rounded-full text-xs font-semibold ${
                state === 'upcoming' ? 'bg-gray-200 text-gray-600' : 'bg-royal-700 text-white'
              }`}
            >
              {state === 'done' ? <Check className="size-3.5" aria-hidden="true" /> : i + 1}
            </span>
            <span className={`mt-2 text-[0.7rem] leading-tight ${state === 'upcoming' ? 'text-gray-500' : 'font-medium text-royal-950'}`}>
              {label}
              <span className="sr-only">{state === 'done' ? ' (completed)' : state === 'current' ? ' (current)' : ''}</span>
            </span>
          </li>
        )
      })}
    </ol>
  )
}
