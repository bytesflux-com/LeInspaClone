import { useState } from 'react'
import { X, UserPlus, Building2, Flower2, Sparkles, Check } from 'lucide-react'

export function AddProviderModal({ isOpen, onClose, onSuccess }) {
  const [entityType, setEntityType] = useState('individual')
  const [category, setCategory] = useState('massage_therapist')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [market, setMarket] = useState('KE')
  const [city, setCity] = useState('Nairobi')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  if (!isOpen) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    setSubmitting(true)
    setTimeout(() => {
      setSubmitting(false)
      setSubmitted(true)
      setTimeout(() => {
        setSubmitted(false)
        onSuccess?.({
          name,
          email,
          phone,
          entityType,
          category,
          market,
          city,
        })
        onClose()
      }, 1200)
    }, 600)
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Add New Provider</h3>
              <p className="text-xs text-slate-500">Register an individual professional, spa or wellness resort</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {submitted ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <Check className="w-6 h-6 stroke-[3]" />
            </div>
            <h4 className="font-bold text-slate-900 text-lg">Provider Registered!</h4>
            <p className="text-xs text-slate-500">
              Provider profile record created and verification queue initialized.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
            {/* Entity Selection 3 buttons */}
            <div>
              <label className="block text-slate-700 font-semibold mb-2">Provider Entity Type</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'individual', label: 'Professional', icon: Sparkles },
                  { id: 'spa', label: 'Spa Center', icon: Flower2 },
                  { id: 'hotel_resort', label: 'Hotel & Resort', icon: Building2 },
                ].map((item) => {
                  const Icon = item.icon
                  const isSel = entityType === item.id
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setEntityType(item.id)}
                      className={`p-2.5 rounded-xl border text-center transition ${
                        isSel
                          ? 'border-purple-600 bg-purple-50 text-purple-900 font-bold ring-2 ring-purple-500/20'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <Icon className="w-4 h-4 mx-auto mb-1 text-purple-600" />
                      <span>{item.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Subcategory if individual */}
            {entityType === 'individual' && (
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Wellness Specialty</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                >
                  <option value="massage_therapist">Massage Therapist</option>
                  <option value="fitness_trainer">Personal Trainer</option>
                  <option value="physiotherapy">Physiotherapy & Recovery Specialist</option>
                  <option value="yoga_specialist">Yoga Specialist</option>
                  <option value="meditation_specialist">Meditation Specialist</option>
                </select>
              </div>
            )}

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                {entityType === 'individual' ? 'Full Name' : 'Business / Resort Name'}
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={entityType === 'individual' ? 'e.g. Grace Njeri' : 'e.g. Serenity Wellness Spa'}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-purple-600"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Contact Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contact@example.com"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Phone Number</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+254 700 000 000"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Country Market</label>
                <select
                  value={market}
                  onChange={(e) => setMarket(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                >
                  <option value="KE">Kenya 🇰🇪</option>
                  <option value="ZA">South Africa 🇿🇦</option>
                  <option value="NG">Nigeria 🇳🇬</option>
                  <option value="GH">Ghana 🇬🇭</option>
                  <option value="TZ">Tanzania 🇹🇿</option>
                  <option value="UG">Uganda 🇺🇬</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Operating City</label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Nairobi"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-lg transition shadow-xs disabled:opacity-60"
              >
                {submitting ? 'Creating...' : 'Register Provider'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

