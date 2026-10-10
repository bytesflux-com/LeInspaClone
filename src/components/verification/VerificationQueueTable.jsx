import { useState, useMemo } from 'react'
import { Link } from 'react-router'
import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  ArrowRight,
  SlidersHorizontal,
  X,
} from 'lucide-react'
import CountryFlag from '../ui/CountryFlag'
import {
  VERIFICATION_STATUSES,
  VERIFICATION_STATUS_CONFIG,
} from '../../data/verificationSchema'

/**
 * ADM-029 Primary Verification Queue Table
 * Clean, crisp light theme matching ADM-009 (Needs Your Attention):
 * - Light pill tabs (bg-slate-100/80) with royal purple active pill (bg-[#6D28D9] text-white)
 * - Light inputs with subtle border and focus ring
 * - Soft pastel status badges
 * - Gentle purple tint for selected row (bg-purple-50/70 border-l-4 border-l-[#6D28D9])
 */
export default function VerificationQueueTable({
  records = [],
  selectedRecordId,
  onSelectRecord,
  activeTab = 'ALL',
  onTabChange,
  searchTerm = '',
  onSearchChange,
  filters = {},
  onFilterChange,
  totalCount = 428,
}) {
  const [selectedRowIds, setSelectedRowIds] = useState(new Set())
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [showMoreFilters, setShowMoreFilters] = useState(false)

  // Tab definitions
  const tabs = [
    { id: 'ALL', label: 'All', count: totalCount || 428 },
    { id: 'AWAITING_REVIEW', label: 'New', count: 196 },
    { id: 'UNDER_REVIEW', label: 'Under Review', count: 86 },
    { id: 'RESUBMITTED', label: 'Resubmitted', count: 46 },
    { id: 'CHANGES_REQUESTED', label: 'Changes Requested', count: 112 },
    { id: 'ESCALATED', label: 'Escalated', count: 7 },
  ]

  // Select all toggle
  const allRowIds = useMemo(() => records.map((r) => r.id), [records])
  const isAllSelected = records.length > 0 && allRowIds.every((id) => selectedRowIds.has(id))

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedRowIds(new Set(allRowIds))
    } else {
      setSelectedRowIds(new Set())
    }
  }

  const handleToggleRow = (id, e) => {
    e.stopPropagation()
    const next = new Set(selectedRowIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedRowIds(next)
  }

  const handleFilterUpdate = (key, value) => {
    if (onFilterChange) {
      onFilterChange({ ...filters, [key]: value })
    }
  }

  // Priority badge styling
  const renderPriorityBadge = (priority) => {
    const p = String(priority || 'NORMAL').toUpperCase()
    if (p === 'URGENT') {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-700">
          <span className="size-1.5 rounded-full bg-red-500" />
          Urgent
        </span>
      )
    }
    if (p === 'HIGH') {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-200 bg-orange-50 px-2.5 py-0.5 text-xs font-semibold text-orange-700">
          <span className="size-1.5 rounded-full bg-orange-500" />
          High
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-medium text-slate-600">
        <span className="size-1.5 rounded-full bg-slate-400" />
        Normal
      </span>
    )
  }

  // Status badge styling
  const renderStatusBadge = (status) => {
    const s = String(status || 'AWAITING_REVIEW').toUpperCase()
    if (s === 'APPROVED') {
      return (
        <span className="inline-flex items-center rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
          Approved
        </span>
      )
    }
    if (s === 'REJECTED') {
      return (
        <span className="inline-flex items-center rounded-md border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-700">
          Rejected
        </span>
      )
    }
    if (s === 'CHANGES_REQUESTED') {
      return (
        <span className="inline-flex items-center rounded-md border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
          Changes Requested
        </span>
      )
    }
    if (s === 'UNDER_REVIEW') {
      return (
        <span className="inline-flex items-center rounded-md border border-purple-200 bg-purple-50 px-2.5 py-0.5 text-xs font-semibold text-purple-700">
          Under Review
        </span>
      )
    }
    if (s === 'RESUBMITTED') {
      return (
        <span className="inline-flex items-center rounded-md border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
          Resubmitted
        </span>
      )
    }
    if (s === 'ESCALATED') {
      return (
        <span className="inline-flex items-center rounded-md border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-700">
          Escalated
        </span>
      )
    }
    return (
      <span className="inline-flex items-center rounded-md border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
        Awaiting Review
      </span>
    )
  }

  // Market label formatting
  const renderMarketBadge = (market) => {
    const code = market?.code || 'KE'
    const name = market?.name || 'Kenya'
    return (
      <div className="flex items-center gap-2">
        <CountryFlag code={code} className="size-4" />
        <span className="text-xs font-medium text-slate-700">{name}</span>
      </div>
    )
  }

  // Action button label
  const getActionLabel = (status) => {
    const s = String(status || '').toUpperCase()
    if (s === 'UNDER_REVIEW') return 'Continue'
    if (s === 'APPROVED' || s === 'REJECTED') return 'View'
    return 'Review'
  }

  return (
    <div className="flex flex-col rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
      {/* 1. Status Filter Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-200/80 bg-slate-50/60 p-3">
        <div className="inline-flex flex-wrap items-center gap-1 rounded-xl bg-slate-100/80 p-1">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange && onTabChange(tab.id)}
                className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-[#6D28D9] text-white shadow-xs'
                    : 'text-slate-600 hover:bg-white hover:text-slate-900'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                    isActive
                      ? 'bg-purple-800 text-purple-100'
                      : 'bg-slate-200/80 text-slate-600'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* 2. Search & Filter Bar */}
      <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Search input */}
        <div className="relative min-w-[280px] flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
            placeholder="Search provider, business, Provider ID..."
            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs text-slate-800 placeholder:text-slate-400 focus:border-purple-600 focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 shadow-2xs"
          />
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Provider Type */}
          <select
            value={filters.providerType || 'ALL'}
            onChange={(e) => handleFilterUpdate('providerType', e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-2xs hover:bg-slate-50 focus:border-purple-600 focus:outline-hidden focus:ring-2 focus:ring-purple-500/20"
          >
            <option value="ALL">Provider Type ▾</option>
            <option value="INDIVIDUAL">Individual Professional</option>
            <option value="SPA_WELLNESS">Spa & Wellness Center</option>
            <option value="HOTEL_RESORT">Hotel & Wellness Resort</option>
          </select>

          {/* Verification Type */}
          <select
            value={filters.verificationType || 'ALL'}
            onChange={(e) => handleFilterUpdate('verificationType', e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-2xs hover:bg-slate-50 focus:border-purple-600 focus:outline-hidden focus:ring-2 focus:ring-purple-500/20"
          >
            <option value="ALL">Verification Type ▾</option>
            <option value="Credentials">Professional Credentials</option>
            <option value="Business Docs">Business Documents</option>
            <option value="Property">Property Verification</option>
            <option value="Identity">Identity Verification</option>
            <option value="Location">Location Verification</option>
          </select>

          {/* Market */}
          <select
            value={filters.marketId || 'ALL'}
            onChange={(e) => handleFilterUpdate('marketId', e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-2xs hover:bg-slate-50 focus:border-purple-600 focus:outline-hidden focus:ring-2 focus:ring-purple-500/20"
          >
            <option value="ALL">Market ▾</option>
            <option value="KE">Kenya 🇰🇪</option>
            <option value="UG">Uganda 🇺🇬</option>
            <option value="TZ">Tanzania 🇹🇿</option>
            <option value="ZA">South Africa 🇿🇦</option>
            <option value="MA">Morocco 🇲🇦</option>
          </select>

          {/* Priority */}
          <select
            value={filters.priority || 'ALL'}
            onChange={(e) => handleFilterUpdate('priority', e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-2xs hover:bg-slate-50 focus:border-purple-600 focus:outline-hidden focus:ring-2 focus:ring-purple-500/20"
          >
            <option value="ALL">Priority ▾</option>
            <option value="NORMAL">Normal</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>

          {/* More Filters Toggle */}
          <button
            type="button"
            onClick={() => setShowMoreFilters(!showMoreFilters)}
            className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium transition shadow-2xs ${
              showMoreFilters
                ? 'border-purple-300 bg-purple-50 text-purple-700'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            <SlidersHorizontal className="size-3.5" />
            <span>More Filters</span>
          </button>
        </div>
      </div>

      {/* Expanded More Filters Bar */}
      {showMoreFilters && (
        <div className="flex flex-wrap items-center gap-4 border-b border-purple-100 bg-purple-50/40 p-3.5 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">Submitted Date:</span>
            <select
              value={filters.submittedDate || 'ALL'}
              onChange={(e) => handleFilterUpdate('submittedDate', e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs shadow-2xs"
            >
              <option value="ALL">Anytime</option>
              <option value="today">Today</option>
              <option value="last_7_days">Last 7 Days</option>
              <option value="last_30_days">Last 30 Days</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">Assigned Admin:</span>
            <select
              value={filters.assignedAdmin || 'ALL'}
              onChange={(e) => handleFilterUpdate('assignedAdmin', e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs shadow-2xs"
            >
              <option value="ALL">All Assignees</option>
              <option value="Unassigned">Unassigned</option>
              <option value="Jane Ochieng">Jane Ochieng</option>
              <option value="Peter Mwangi">Peter Mwangi</option>
              <option value="Compliance Team">Compliance Team</option>
            </select>
          </div>

          <button
            type="button"
            onClick={() => {
              onFilterChange && onFilterChange({})
              setShowMoreFilters(false)
            }}
            className="ml-auto inline-flex items-center gap-1 font-semibold text-slate-500 hover:text-slate-800 transition"
          >
            <X className="size-3.5" />
            Clear all
          </button>
        </div>
      )}

      {/* 3. Queue Data Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] border-collapse text-left">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold uppercase tracking-wider text-slate-600">
              <th className="w-10 px-4 py-3.5">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={handleSelectAll}
                  className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                />
              </th>
              <th className="px-3.5 py-3.5">Provider</th>
              <th className="px-3.5 py-3.5">Type</th>
              <th className="px-3.5 py-3.5">Market</th>
              <th className="px-3.5 py-3.5">Verification</th>
              <th className="px-3.5 py-3.5">Submitted</th>
              <th className="px-3.5 py-3.5">Priority</th>
              <th className="px-3.5 py-3.5">Status</th>
              <th className="px-3.5 py-3.5">Assigned To</th>
              <th className="px-4 py-3.5 text-right">Action</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 text-xs">
            {records.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-4 py-16 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <ShieldCheck className="size-9 text-slate-300" />
                    <p className="font-semibold text-slate-800">No verification records found matching your filters.</p>
                    <span className="text-xs text-slate-400">
                      Try clearing filters or search queries to see other records.
                    </span>
                  </div>
                </td>
              </tr>
            ) : (
              records.map((record) => {
                const isSelected = selectedRecordId === record.id
                const isChecked = selectedRowIds.has(record.id)

                return (
                  <tr
                    key={record.id}
                    onClick={() => onSelectRecord && onSelectRecord(record)}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? 'border-l-4 border-l-[#6D28D9] bg-purple-50/70'
                        : isChecked
                          ? 'bg-slate-50 hover:bg-purple-50/30'
                          : 'hover:bg-purple-50/40'
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="w-10 px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => handleToggleRow(record.id, e)}
                        className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                      />
                    </td>

                    {/* Provider */}
                    <td className="px-3.5 py-3.5">
                      <div className="flex items-center gap-3">
                        <img
                          src={record.avatarUrl}
                          alt={record.name}
                          className="size-9 rounded-full border border-slate-200 object-cover shadow-2xs"
                        />
                        <div className="flex flex-col">
                          <Link
                            to={`/providers/${record.providerId}`}
                            onClick={(e) => e.stopPropagation()}
                            className="font-bold text-slate-900 hover:text-purple-700 hover:underline"
                            title="View Provider Profile (ADM-022)"
                          >
                            {record.name}
                          </Link>
                          <Link
                            to={`/providers/${record.providerId}`}
                            onClick={(e) => e.stopPropagation()}
                            className="font-mono text-[11px] text-purple-600 hover:underline"
                            title="View Provider Profile (ADM-022)"
                          >
                            {record.providerId}
                          </Link>
                        </div>
                      </div>
                    </td>

                    {/* Type */}
                    <td className="px-3.5 py-3.5 text-slate-600">
                      <span className="line-clamp-1">{record.type}</span>
                    </td>

                    {/* Market */}
                    <td className="px-3.5 py-3.5 whitespace-nowrap">
                      {renderMarketBadge(record.market)}
                    </td>

                    {/* Verification */}
                    <td className="px-3.5 py-3.5 text-slate-700">
                      <span className="font-medium">{record.verificationType}</span>
                    </td>

                    {/* Submitted */}
                    <td className="px-3.5 py-3.5 whitespace-nowrap text-[11px] text-slate-500">
                      {record.submittedAt}
                    </td>

                    {/* Priority */}
                    <td className="px-3.5 py-3.5 whitespace-nowrap">
                      {renderPriorityBadge(record.priority)}
                    </td>

                    {/* Status */}
                    <td className="px-3.5 py-3.5 whitespace-nowrap">
                      {renderStatusBadge(record.status)}
                    </td>

                    {/* Assigned To */}
                    <td className="px-3.5 py-3.5 whitespace-nowrap">
                      <span
                        className={`text-xs ${
                          record.assignedTo === 'Unassigned'
                            ? 'italic text-slate-400'
                            : 'font-medium text-slate-700'
                        }`}
                      >
                        {record.assignedTo}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          onSelectRecord && onSelectRecord(record)
                        }}
                        className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                          isSelected
                            ? 'bg-[#6D28D9] text-white shadow-xs'
                            : 'border border-purple-200 bg-white text-[#6D28D9] hover:bg-purple-50'
                        }`}
                      >
                        <span>{getActionLabel(record.status)}</span>
                        <ArrowRight className="size-3" />
                      </button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 4. Pagination Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200/80 bg-slate-50/50 px-5 py-3.5 text-xs text-slate-500">
        <div>
          Showing <span className="font-semibold text-slate-800">1–{records.length}</span> of{' '}
          <span className="font-semibold text-slate-800">{totalCount}</span> providers
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span>Rows per page</span>
            <select
              value={rowsPerPage}
              onChange={(e) => setRowsPerPage(Number(e.target.value))}
              className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 shadow-2xs"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700 disabled:opacity-40"
            >
              <ChevronLeft className="size-4" />
            </button>
            <span className="rounded-lg bg-purple-100 px-2.5 py-1 font-bold text-purple-800">
              1
            </span>
            <span className="px-1 text-slate-400">2</span>
            <span className="px-1 text-slate-400">3</span>
            <span className="px-1 text-slate-400">...</span>
            <span className="px-1 text-slate-400">43</span>
            <button
              type="button"
              onClick={() => setCurrentPage((p) => p + 1)}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
