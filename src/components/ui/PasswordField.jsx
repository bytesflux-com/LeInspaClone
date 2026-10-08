import { useState } from 'react'
import { Eye, EyeOff, Lock } from 'lucide-react'
import TextField from './TextField.jsx'

export default function PasswordField({ label = 'Password', ...props }) {
  const [visible, setVisible] = useState(false)
  const Toggle = visible ? EyeOff : Eye

  return (
    <TextField
      label={label}
      icon={Lock}
      type={visible ? 'text' : 'password'}
      trailing={
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          aria-pressed={visible}
          className="rounded-lg p-2 text-gray-600 hover:text-royal-700 focus-visible:outline-2 focus-visible:outline-royal-600"
        >
          <Toggle className="size-[18px]" aria-hidden="true" />
        </button>
      }
      {...props}
    />
  )
}
