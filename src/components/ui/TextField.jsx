import { useId } from 'react'

export default function TextField({
  label,
  icon: Icon,
  error,
  trailing,
  id,
  className = '',
  ...inputProps
}) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const errorId = `${inputId}-error`

  return (
    <div className={className}>
      <label htmlFor={inputId} className="mb-2 block text-sm font-medium text-royal-950">
        {label}
      </label>
      <div className="relative">
        {Icon && (
          <Icon
            className="pointer-events-none absolute top-1/2 left-4 size-[18px] -translate-y-1/2 text-gray-700"
            aria-hidden="true"
          />
        )}
        <input
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={`h-12 w-full rounded-xl border bg-white text-[0.95rem] text-gray-900 transition-colors placeholder:text-gray-400 focus:ring-4 focus:outline-none ${
            Icon ? 'pl-11' : 'pl-4'
          } ${trailing ? 'pr-12' : 'pr-4'} ${
            error
              ? 'border-danger-600 focus:border-danger-600 focus:ring-danger-600/15'
              : 'border-gray-300 focus:border-royal-500 focus:ring-royal-500/15'
          }`}
          {...inputProps}
        />
        {trailing && <div className="absolute inset-y-0 right-2 flex items-center">{trailing}</div>}
      </div>
      {error && (
        <p id={errorId} className="mt-1.5 text-xs text-danger-600">
          {error}
        </p>
      )}
    </div>
  )
}
