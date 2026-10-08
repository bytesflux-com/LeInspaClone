import { useRef } from 'react'

// Six separate digit boxes with auto-advance, backspace/arrow navigation and
// paste support. `value` is an array of single-digit strings ('' when empty).
export default function OtpInput({ value, onChange, onComplete, error = false, disabled = false, autoFocus = false, label = 'Verification code' }) {
  const refs = useRef([])
  const length = value.length

  function focus(i) {
    refs.current[Math.max(0, Math.min(length - 1, i))]?.focus()
  }

  function update(next) {
    onChange(next)
    if (next.every((d) => d !== '')) onComplete?.(next.join(''))
  }

  function fill(start, digits) {
    const next = [...value]
    digits.slice(0, length - start).forEach((d, k) => {
      next[start + k] = d
    })
    update(next)
    focus(start + digits.length)
  }

  function handleChange(i, e) {
    const digits = e.target.value.replace(/\D/g, '').split('')
    if (digits.length === 0) return
    // Typing over a filled box keeps only the newest digit; autofill/paste can bring several.
    fill(i, digits.length > 1 && value[i] !== '' ? digits.slice(-1) : digits)
  }

  function handleKeyDown(i, e) {
    if (e.key === 'Backspace') {
      e.preventDefault()
      const next = [...value]
      if (next[i] !== '') {
        next[i] = ''
        onChange(next)
      } else if (i > 0) {
        next[i - 1] = ''
        onChange(next)
        focus(i - 1)
      }
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      focus(i - 1)
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      focus(i + 1)
    }
  }

  function handlePaste(i, e) {
    const digits = e.clipboardData.getData('text').replace(/\D/g, '').split('')
    if (digits.length === 0) return
    e.preventDefault()
    fill(i, digits)
  }

  return (
    <div role="group" aria-label={label} className="flex justify-between gap-2 sm:gap-3">
      {value.map((digit, i) => (
        <input
          key={i}
          ref={(el) => (refs.current[i] = el)}
          value={digit}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={(e) => handlePaste(i, e)}
          onFocus={(e) => e.target.select()}
          inputMode="numeric"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          pattern="[0-9]*"
          maxLength={length}
          disabled={disabled}
          autoFocus={autoFocus && i === 0}
          aria-label={`Digit ${i + 1} of ${length}`}
          aria-invalid={error || undefined}
          className={`h-14 w-full min-w-0 rounded-xl border bg-white text-center text-2xl font-semibold text-royal-950 tabular-nums transition-colors focus:ring-4 focus:outline-none disabled:bg-gray-50 disabled:text-gray-400 sm:h-16 ${
            error
              ? 'border-danger-600 focus:border-danger-600 focus:ring-danger-600/15'
              : digit
                ? 'border-royal-400 focus:border-royal-500 focus:ring-royal-500/15'
                : 'border-gray-300 focus:border-royal-500 focus:ring-royal-500/15'
          }`}
        />
      ))}
    </div>
  )
}
