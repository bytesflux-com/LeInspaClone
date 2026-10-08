import { useState } from 'react'
import { ChevronDown, Globe } from 'lucide-react'

// Only languages with complete translations should be listed here.
const languages = [{ code: 'en', label: 'English' }]

export default function LanguageSelect() {
  const [language, setLanguage] = useState('en')

  return (
    <div className="relative">
      <Globe className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-gray-700" aria-hidden="true" />
      <select
        aria-label="Language"
        value={language}
        onChange={(e) => setLanguage(e.target.value)}
        className="h-10 cursor-pointer appearance-none rounded-xl border border-gray-200 bg-white pr-9 pl-9 text-sm text-gray-800 shadow-sm focus:border-royal-500 focus:ring-4 focus:ring-royal-500/15 focus:outline-none"
      >
        {languages.map((l) => (
          <option key={l.code} value={l.code}>
            {l.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-gray-600" aria-hidden="true" />
    </div>
  )
}
