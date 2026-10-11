import { useState } from 'react'
import {
  X,
  Sliders,
  Clock,
  FileCheck,
  ShieldAlert,
  Building,
  User,
  Check,
  Save,
  AlertTriangle,
} from 'lucide-react'
import CountryFlag from '../ui/CountryFlag'

/**
 * ADM-029 Verification Settings Modal
 * Configuration modal triggered by "⚙ Verification Settings" in the header.
 * Allows Super Admins & Compliance Leads to configure review SLAs, auto-escalations,
 * dynamic document requirements per jurisdiction, and security authorization controls.
 */
export default function VerificationSettingsModal({
  isOpen,
  onClose,
  onSave,
}) {
  const [activeTab, setActiveTab] = useState('sla') // 'sla' | 'requirements' | 'security'
  const [selectedMarket, setSelectedMarket] = useState('KE')
  const [selectedCategory, setSelectedCategory] = useState('INDIVIDUAL')

  // SLA state
  const [normalSlaHours, setNormalSlaHours] = useState(24)
  const [urgentSlaHours, setUrgentSlaHours] = useState(4)
  const [autoEscalateOverdue, setAutoEscalateOverdue] = useState(true)

  // Document checklists state
  const [docChecklists, setDocChecklists] = useState({
    KE_INDIVIDUAL: {
      govt_id: true,
      prof_cert: true,
      practice_license: true,
      police_clearance: true,
      tax_pin: false,
    },
    KE_SPA_WELLNESS: {
      business_reg: true,
      premises_license: true,
      fire_safety: true,
      tax_pin: true,
      health_permit: true,
    },
    KE_HOTEL_RESORT: {
      tra_license: true,
      property_title: true,
      safety_audit: true,
      power_attorney: true,
      tax_clearance: true,
    },
  })

  // Security & Authorization state
  const [mandatorySeniorSignoff, setMandatorySeniorSignoff] = useState(true)
  const [doubleReviewerResorts, setDoubleReviewerResorts] = useState(true)
  const [strictOcrThreshold, setStrictOcrThreshold] = useState(95)

  if (!isOpen) return null

  const handleToggleDoc = (docKey) => {
    const groupKey = `${selectedMarket}_${selectedCategory}`
    setDocChecklists((prev) => {
      const currentGroup = prev[groupKey] || {}
      return {
        ...prev,
        [groupKey]: {
          ...currentGroup,
          [docKey]: !currentGroup[docKey],
        },
      }
    })
  }

  const handleSave = (e) => {
    e.preventDefault()
    if (onSave) {
      onSave({
        sla: { normalSlaHours, urgentSlaHours, autoEscalateOverdue },
        requirements: docChecklists,
        security: { mandatorySeniorSignoff, doubleReviewerResorts, strictOcrThreshold },
      })
    }
    onClose()
  }

  const currentDocs = docChecklists[`${selectedMarket}_${selectedCategory}`] || {}

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="relative flex h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        {/* Header */}
        <header className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-slate-50/75 px-6 py-4 dark:border-slate-800 dark:bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-purple-700 text-white shadow-xs">
              <Sliders className="size-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Verification Center Settings & Policies
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Configure review workflows, auto-escalation thresholds, and dynamic country checklists.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white"
          >
            <X className="size-5" />
          </button>
        </header>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-white px-6 text-xs font-semibold dark:border-slate-800 dark:bg-slate-900">
          <button
            type="button"
            onClick={() => setActiveTab('sla')}
            className={`border-b-2 py-3 px-4 transition-colors ${
              activeTab === 'sla'
                ? 'border-purple-700 text-purple-700 dark:border-purple-400 dark:text-purple-300'
                : 'border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <span className="flex items-center gap-2">
              <Clock className="size-4" />
              <span>SLA & Review Targets</span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('requirements')}
            className={`border-b-2 py-3 px-4 transition-colors ${
              activeTab === 'requirements'
                ? 'border-purple-700 text-purple-700 dark:border-purple-400 dark:text-purple-300'
                : 'border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <span className="flex items-center gap-2">
              <FileCheck className="size-4" />
              <span>Dynamic Document Requirements</span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('security')}
            className={`border-b-2 py-3 px-4 transition-colors ${
              activeTab === 'security'
                ? 'border-purple-700 text-purple-700 dark:border-purple-400 dark:text-purple-300'
                : 'border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <span className="flex items-center gap-2">
              <ShieldAlert className="size-4" />
              <span>Security & Compliance Controls</span>
            </span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* 1. SLA & Targets Tab */}
          {activeTab === 'sla' && (
            <div className="space-y-5">
              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/40">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Target Review Timelines (SLA)
                </h4>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Defines target durations before a verification submission triggers amber or red urgency flags in officer queues.
                </p>

                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Normal Priority SLA Target
                    </label>
                    <div className="mt-2 flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        max="72"
                        value={normalSlaHours}
                        onChange={(e) => setNormalSlaHours(Number(e.target.value))}
                        className="w-20 rounded-md border border-slate-300 px-2.5 py-1 text-xs font-bold text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                      />
                      <span className="text-xs text-slate-500">hours (Default: 24h)</span>
                    </div>
                  </div>

                  <div className="rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Urgent Priority SLA Target
                    </label>
                    <div className="mt-2 flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        max="24"
                        value={urgentSlaHours}
                        onChange={(e) => setUrgentSlaHours(Number(e.target.value))}
                        className="w-20 rounded-md border border-slate-300 px-2.5 py-1 text-xs font-bold text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                      />
                      <span className="text-xs text-slate-500">hours (Default: 4h)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Auto Escalation */}
              <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="text-xs font-bold text-slate-900 dark:text-white">
                      Automated Overdue Escalation
                    </h5>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                      Automatically route unreviewed submissions to Senior Compliance Officers once SLA expires.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={autoEscalateOverdue}
                    onChange={(e) => setAutoEscalateOverdue(e.target.checked)}
                    className="size-4 rounded text-purple-600 focus:ring-purple-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 2. Dynamic Document Requirements Tab */}
          {activeTab === 'requirements' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Market:</span>
                  <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs dark:border-slate-700 dark:bg-slate-800">
                    <CountryFlag code={selectedMarket} className="size-3.5" />
                    <select
                      value={selectedMarket}
                      onChange={(e) => setSelectedMarket(e.target.value)}
                      className="bg-transparent font-medium text-slate-800 dark:text-white focus:outline-hidden"
                    >
                      <option value="KE">Kenya 🇰🇪</option>
                      <option value="UG">Uganda 🇺🇬</option>
                      <option value="TZ">Tanzania 🇹🇿</option>
                      <option value="ZA">South Africa 🇿🇦</option>
                      <option value="MA">Morocco 🇲🇦</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Tier:</span>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="INDIVIDUAL">Individual Professionals</option>
                    <option value="SPA_WELLNESS">Spas & Wellness Centers</option>
                    <option value="HOTEL_RESORT">Hotels & Wellness Resorts</option>
                  </select>
                </div>
              </div>

              {/* Document Toggle Checklist */}
              <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Required Documents Checklist
                </h4>

                <div className="space-y-2.5">
                  {[
                    { key: 'govt_id', label: 'Government-Issued National ID or Passport' },
                    { key: 'prof_cert', label: 'Accredited Professional Diploma / Board Certification' },
                    { key: 'practice_license', label: 'Regulatory Council Practice License' },
                    { key: 'police_clearance', label: 'Police Clearance / Good Conduct Certificate' },
                    { key: 'tax_pin', label: 'National Revenue Authority Tax Compliance / PIN' },
                    { key: 'premises_license', label: 'County / Municipal Premises Operating Permit' },
                    { key: 'fire_safety', label: 'Public Health & Fire Safety Audit Accreditation' },
                  ].map((doc) => {
                    const isEnabled = currentDocs[doc.key] !== false
                    return (
                      <label
                        key={doc.key}
                        className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/50 p-2.5 text-xs transition-colors hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800/40 dark:hover:bg-slate-800"
                      >
                        <span className="font-medium text-slate-800 dark:text-slate-200">
                          {doc.label}
                        </span>
                        <input
                          type="checkbox"
                          checked={isEnabled}
                          onChange={() => handleToggleDoc(doc.key)}
                          className="size-4 rounded text-purple-600 focus:ring-purple-500"
                        />
                      </label>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* 3. Security & Compliance Tab */}
          {activeTab === 'security' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="text-xs font-bold text-slate-900 dark:text-white">
                      Mandatory Senior Officer Rejection Sign-off
                    </h5>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                      Requires secondary confirmation before an application rejection is finalized and emailed.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={mandatorySeniorSignoff}
                    onChange={(e) => setMandatorySeniorSignoff(e.target.checked)}
                    className="size-4 rounded text-purple-600 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="text-xs font-bold text-slate-900 dark:text-white">
                      Four-Eyes Review for Tier-3 Wellness Resorts
                    </h5>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                      Hotel and Wellness Resorts require independent review from both a verification officer and a compliance lead.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={doubleReviewerResorts}
                    onChange={(e) => setDoubleReviewerResorts(e.target.checked)}
                    className="size-4 rounded text-purple-600 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                <div>
                  <h5 className="text-xs font-bold text-slate-900 dark:text-white">
                    Minimum Automated OCR Confidence Threshold
                  </h5>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    Flag documents for mandatory manual inspection if OCR text extraction falls below this score.
                  </p>
                  <div className="mt-3 flex items-center gap-3">
                    <input
                      type="range"
                      min="80"
                      max="99"
                      value={strictOcrThreshold}
                      onChange={(e) => setStrictOcrThreshold(Number(e.target.value))}
                      className="w-48 accent-purple-600"
                    />
                    <span className="font-mono text-xs font-bold text-purple-700 dark:text-purple-300">
                      {strictOcrThreshold}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <footer className="flex shrink-0 items-center justify-end gap-2.5 border-t border-slate-200 bg-slate-50/75 px-6 py-3.5 dark:border-slate-800 dark:bg-slate-950">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center gap-1.5 rounded-xl bg-purple-700 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-purple-800"
          >
            <Save className="size-3.5" />
            <span>Save Configuration</span>
          </button>
        </footer>
      </div>
    </div>
  )
}
