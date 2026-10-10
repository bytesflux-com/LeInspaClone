import React from 'react'
import {
  FileCheck2,
  FileText,
  Clock,
  AlertCircle,
  CheckCircle2,
  Building2,
  Award,
  Users,
} from 'lucide-react'

/**
 * ADM-034: BusinessRequirementTabs
 * Horizontal interactive tab navigation for mandated corporate & operating documents.
 * Shows status pills for each requirement: Approved (green), Under Review (purple), Action Needed (amber).
 */
export default function BusinessRequirementTabs({
  documents = [],
  activeDocId = 'doc-licence',
  onSelectDoc,
}) {
  const getIconForType = (id) => {
    switch (id) {
      case 'doc-reg':
        return <Building2 className="size-4 shrink-0" />
      case 'doc-tax':
        return <Award className="size-4 shrink-0" />
      case 'doc-cr12':
        return <Users className="size-4 shrink-0" />
      case 'doc-licence':
      default:
        return <FileCheck2 className="size-4 shrink-0" />
    }
  }

  const getStatusBadge = (status, isActive) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100/80 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
            <CheckCircle2 className="size-3" />
            Approved
          </span>
        )
      case 'CHANGES_REQUESTED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100/90 px-2 py-0.5 text-[10px] font-bold text-amber-800">
            <Clock className="size-3" />
            Changes Requested
          </span>
        )
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-800">
            <AlertCircle className="size-3" />
            Rejected
          </span>
        )
      case 'UNDER_REVIEW':
      case 'REVIEWING_NOW':
      default:
        return (
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
            isActive
              ? 'bg-purple-100 text-[#6D28D9]'
              : 'bg-purple-50 text-purple-700'
          }`}>
            <span className="size-1.5 rounded-full bg-[#6D28D9] animate-pulse" />
            Reviewing Now
          </span>
        )
    }
  }

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
      {documents.map((doc) => {
        const isActive = doc.id === activeDocId
        return (
          <button
            key={doc.id}
            type="button"
            onClick={() => onSelectDoc?.(doc.id)}
            className={`flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-left transition shrink-0 cursor-pointer shadow-2xs ${
              isActive
                ? 'border-[#6D28D9] bg-white ring-2 ring-purple-600/20 text-[#6D28D9]'
                : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 text-slate-700'
            }`}
          >
            <div className={`flex size-7 items-center justify-center rounded-lg ${
              isActive ? 'bg-purple-50 text-[#6D28D9]' : 'bg-slate-100 text-slate-500'
            }`}>
              {getIconForType(doc.id)}
            </div>

            <div className="flex flex-col">
              <span className={`text-xs font-bold leading-tight ${isActive ? 'text-slate-900' : 'text-slate-700'}`}>
                {doc.title}
              </span>
              <span className="text-[10px] text-slate-400">
                {doc.subtitle || doc.docType}
              </span>
            </div>

            <div className="ml-1">
              {getStatusBadge(doc.status, isActive)}
            </div>
          </button>
        )
      })}
    </div>
  )
}
