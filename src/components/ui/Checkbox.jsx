import { useId } from 'react'

export default function Checkbox({ label, id, className = '', ...props }) {
  const generatedId = useId()
  const inputId = id ?? generatedId

  return (
    <label htmlFor={inputId} className={`inline-flex cursor-pointer items-center gap-2.5 text-sm text-gray-800 ${className}`}>
      <input
        id={inputId}
        type="checkbox"
        className="size-[18px] cursor-pointer rounded accent-royal-700"
        {...props}
      />
      {label}
    </label>
  )
}
