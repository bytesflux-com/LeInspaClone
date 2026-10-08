import { Link } from 'react-router'
import {
  Mail,
  Phone,
  MapPin,
  Star,
  Building2,
  Calendar,
  CreditCard,
  Banknote,
  Scale,
  Headphones,
  CheckCircle,
  ArrowRight,
} from 'lucide-react'
import CountryFlag from '../ui/CountryFlag'

/* 1. CLIENT ROW */
export function ClientResultRow({ item }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-xl hover:bg-purple-50/25 transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        {/* Avatar */}
        <div className="relative size-10 shrink-0 rounded-full bg-purple-100 flex items-center justify-center overflow-hidden border border-purple-200">
          {item.avatarUrl ? (
            <img src={item.avatarUrl} alt={item.name} className="size-full object-cover" />
          ) : (
            <span className="font-bold text-[#5c2dd5] text-sm">
              {item.name.charAt(0)}
            </span>
          )}
        </div>

        {/* Identity Details */}
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-extrabold text-gray-950 text-sm">{item.name}</h4>
            <span className="rounded-md bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-[#5c2dd5]">
              {item.role || 'Client'}
            </span>
          </div>

          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 flex-wrap">
            {item.email && (
              <span className="inline-flex items-center gap-1">
                <Mail className="size-3 text-gray-400" />
                <span>{item.email}</span>
              </span>
            )}
            {item.phone && (
              <span className="inline-flex items-center gap-1">
                <Phone className="size-3 text-gray-400" />
                <span>{item.phone}</span>
              </span>
            )}
            <span className="inline-flex items-center gap-1 font-medium text-gray-700">
              <CountryFlag code={item.market} className="w-3.5 h-2.5" />
              <span>{item.marketName}</span>
            </span>
            <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              <span>{item.status}</span>
            </span>
            {item.joinedAt && <span className="text-gray-400 text-[11px]">{item.joinedAt}</span>}
          </div>
        </div>
      </div>

      <Link
        to={item.link || '/clients'}
        className="inline-flex items-center justify-center gap-1 rounded-lg border border-purple-200 bg-white px-3 py-1.5 text-xs font-bold text-[#5c2dd5] shadow-2xs hover:bg-[#5c2dd5] hover:text-white transition-all shrink-0 cursor-pointer self-start sm:self-center"
      >
        <span>View Client</span>
        <ArrowRight className="size-3" />
      </Link>
    </div>
  )
}

/* 2. PROVIDER ROW */
export function ProviderResultRow({ item }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-xl hover:bg-purple-50/25 transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        <div className="relative size-10 shrink-0 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden border border-blue-200">
          {item.avatarUrl ? (
            <img src={item.avatarUrl} alt={item.name} className="size-full object-cover" />
          ) : (
            <span className="font-bold text-blue-700 text-sm">{item.name.charAt(0)}</span>
          )}
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h4 className="font-extrabold text-gray-950 text-sm">{item.name}</h4>
            {item.verified && (
              <CheckCircle className="size-3.5 text-[#5c2dd5] fill-[#5c2dd5] text-white" />
            )}
            <span className="text-xs text-gray-500 font-medium">· {item.specialty}</span>
          </div>

          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 flex-wrap">
            {item.rating && (
              <span className="inline-flex items-center gap-1 font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-md">
                <Star className="size-3 fill-amber-400 text-amber-400" />
                <span>{item.rating}</span>
                {item.reviewCount && <span className="font-normal text-gray-500">({item.reviewCount})</span>}
              </span>
            )}
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3 text-gray-400" />
              <span>{item.location}</span>
            </span>
            <span className="inline-flex items-center gap-1 font-medium text-gray-700">
              <CountryFlag code={item.market} className="w-3.5 h-2.5" />
              <span>{item.marketName}</span>
            </span>
            <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              <span>{item.status}</span>
            </span>
            {item.joinedAt && <span className="text-gray-400 text-[11px]">{item.joinedAt}</span>}
          </div>
        </div>
      </div>

      <Link
        to={item.link || '/providers'}
        className="inline-flex items-center justify-center gap-1 rounded-lg border border-purple-200 bg-white px-3 py-1.5 text-xs font-bold text-[#5c2dd5] shadow-2xs hover:bg-[#5c2dd5] hover:text-white transition-all shrink-0 cursor-pointer self-start sm:self-center"
      >
        <span>View Provider</span>
        <ArrowRight className="size-3" />
      </Link>
    </div>
  )
}

/* 3. SPA RESULT ROW */
export function SpaResultRow({ item }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-xl hover:bg-purple-50/25 transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        <div className="relative size-12 shrink-0 rounded-xl bg-purple-50 flex items-center justify-center overflow-hidden border border-purple-100">
          {item.thumbnailUrl ? (
            <img src={item.thumbnailUrl} alt={item.name} className="size-full object-cover" />
          ) : (
            <Building2 className="size-5 text-[#5c2dd5]" />
          )}
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h4 className="font-extrabold text-gray-950 text-sm">{item.name}</h4>
            {item.verified && (
              <CheckCircle className="size-3.5 text-[#5c2dd5] fill-[#5c2dd5] text-white" />
            )}
            <span className="text-xs text-gray-500 font-medium">· {item.category}</span>
          </div>

          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 flex-wrap">
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3 text-gray-400" />
              <span>{item.location}</span>
            </span>
            <span className="inline-flex items-center gap-1 font-medium text-gray-700">
              <CountryFlag code={item.market} className="w-3.5 h-2.5" />
              <span>{item.marketName}</span>
            </span>
            {item.branches && (
              <span className="rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] font-bold text-gray-700">
                {item.branches}
              </span>
            )}
            <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              <span>{item.status}</span>
            </span>
            {item.joinedAt && <span className="text-gray-400 text-[11px]">{item.joinedAt}</span>}
          </div>
        </div>
      </div>

      <Link
        to={item.link || '/businesses'}
        className="inline-flex items-center justify-center gap-1 rounded-lg border border-purple-200 bg-white px-3 py-1.5 text-xs font-bold text-[#5c2dd5] shadow-2xs hover:bg-[#5c2dd5] hover:text-white transition-all shrink-0 cursor-pointer self-start sm:self-center"
      >
        <span>Open Spa</span>
        <ArrowRight className="size-3" />
      </Link>
    </div>
  )
}

/* 4. HOTEL & RESORT ROW */
export function HotelResultRow({ item }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-xl hover:bg-purple-50/25 transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        <div className="relative size-12 shrink-0 rounded-xl bg-purple-50 flex items-center justify-center overflow-hidden border border-purple-100">
          {item.thumbnailUrl ? (
            <img src={item.thumbnailUrl} alt={item.name} className="size-full object-cover" />
          ) : (
            <Building2 className="size-5 text-[#5c2dd5]" />
          )}
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h4 className="font-extrabold text-gray-950 text-sm">{item.name}</h4>
            {item.verified && (
              <CheckCircle className="size-3.5 text-[#5c2dd5] fill-[#5c2dd5] text-white" />
            )}
            <span className="text-xs text-gray-500 font-medium">· {item.category}</span>
          </div>

          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 flex-wrap">
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3 text-gray-400" />
              <span>{item.location}</span>
            </span>
            <span className="inline-flex items-center gap-1 font-medium text-gray-700">
              <CountryFlag code={item.market} className="w-3.5 h-2.5" />
              <span>{item.marketName}</span>
            </span>
            <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              <span>{item.status}</span>
            </span>
            {item.joinedAt && <span className="text-gray-400 text-[11px]">{item.joinedAt}</span>}
          </div>
        </div>
      </div>

      <Link
        to={item.link || '/businesses'}
        className="inline-flex items-center justify-center gap-1 rounded-lg border border-purple-200 bg-white px-3 py-1.5 text-xs font-bold text-[#5c2dd5] shadow-2xs hover:bg-[#5c2dd5] hover:text-white transition-all shrink-0 cursor-pointer self-start sm:self-center"
      >
        <span>Open Property</span>
        <ArrowRight className="size-3" />
      </Link>
    </div>
  )
}

/* 5. BOOKING ROW */
export function BookingResultRow({ item }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-xl hover:bg-purple-50/25 transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-[#5c2dd5] border border-purple-100">
          <Calendar className="size-5" />
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-extrabold text-gray-950 text-sm font-mono">{item.reference}</span>
            <span className="font-bold text-gray-800 text-xs">{item.service}</span>
            <span className="text-gray-500 text-xs">· {item.clientName}</span>
            <span className="rounded-md bg-purple-50 px-1.5 py-0.2 text-[10px] font-bold text-[#5c2dd5]">
              {item.clientRole}
            </span>
          </div>

          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 flex-wrap">
            <span className="inline-flex items-center gap-1 font-medium text-gray-700">
              <CountryFlag code={item.market} className="w-3.5 h-2.5" />
              <span>{item.marketName}</span>
            </span>
            <span>{item.scheduledAt}</span>
            <span className="rounded-md bg-emerald-50 px-2 py-0.2 text-[10px] font-bold text-emerald-700 border border-emerald-200/60">
              {item.status}
            </span>
            <span className="font-black text-gray-950 tabular-nums">{item.amount}</span>
          </div>
        </div>
      </div>

      <Link
        to={item.link || '/bookings'}
        className="inline-flex items-center justify-center gap-1 rounded-lg border border-purple-200 bg-white px-3 py-1.5 text-xs font-bold text-[#5c2dd5] shadow-2xs hover:bg-[#5c2dd5] hover:text-white transition-all shrink-0 cursor-pointer self-start sm:self-center"
      >
        <span>View Booking</span>
        <ArrowRight className="size-3" />
      </Link>
    </div>
  )
}

/* 6. PAYMENT ROW */
export function PaymentResultRow({ item }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-xl hover:bg-purple-50/25 transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
          <CreditCard className="size-5" />
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-extrabold text-gray-950 text-sm font-mono">{item.reference}</span>
            <span className="text-gray-500 text-xs">{item.bookingReference}</span>
            <span className="font-black text-gray-950 text-xs tabular-nums">{item.amount}</span>
            <span className="rounded-md bg-gray-100 px-1.5 py-0.2 text-[10px] font-bold text-gray-700">
              {item.method}
            </span>
          </div>

          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 flex-wrap">
            <span className="inline-flex items-center gap-1 font-medium text-gray-700">
              <CountryFlag code={item.market} className="w-3.5 h-2.5" />
              <span>{item.marketName}</span>
            </span>
            <span className="rounded-md bg-emerald-50 px-2 py-0.2 text-[10px] font-bold text-emerald-700 border border-emerald-200/60">
              {item.status}
            </span>
            <span>{item.date}</span>
          </div>
        </div>
      </div>

      <Link
        to={item.link || '/finance'}
        className="inline-flex items-center justify-center gap-1 rounded-lg border border-purple-200 bg-white px-3 py-1.5 text-xs font-bold text-[#5c2dd5] shadow-2xs hover:bg-[#5c2dd5] hover:text-white transition-all shrink-0 cursor-pointer self-start sm:self-center"
      >
        <span>View Payment</span>
        <ArrowRight className="size-3" />
      </Link>
    </div>
  )
}

/* 7. WITHDRAWAL ROW */
export function WithdrawalResultRow({ item }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-xl hover:bg-purple-50/25 transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700 border border-amber-100">
          <Banknote className="size-5" />
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-extrabold text-gray-950 text-sm font-mono">{item.reference}</span>
            <span className="font-bold text-gray-800 text-xs">{item.recipientName}</span>
            <span className="font-black text-gray-950 text-xs tabular-nums">{item.amount}</span>
          </div>

          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 flex-wrap">
            <span className="inline-flex items-center gap-1 font-medium text-gray-700">
              <CountryFlag code={item.market} className="w-3.5 h-2.5" />
              <span>{item.marketName}</span>
            </span>
            <span className="rounded-md bg-amber-50 px-2 py-0.2 text-[10px] font-bold text-amber-700 border border-amber-200/60">
              {item.status}
            </span>
            <span>{item.date}</span>
          </div>
        </div>
      </div>

      <Link
        to={item.link || '/withdrawals'}
        className="inline-flex items-center justify-center gap-1 rounded-lg border border-purple-200 bg-purple-50/80 px-3 py-1.5 text-xs font-bold text-[#5c2dd5] shadow-2xs hover:bg-[#5c2dd5] hover:text-white transition-all shrink-0 cursor-pointer self-start sm:self-center"
      >
        <span>Review</span>
        <ArrowRight className="size-3" />
      </Link>
    </div>
  )
}

/* 8. DISPUTE ROW */
export function DisputeResultRow({ item }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-xl hover:bg-purple-50/25 transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600 border border-rose-100">
          <Scale className="size-5" />
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-extrabold text-gray-950 text-sm font-mono">{item.reference}</span>
            <span className="text-gray-500 text-xs">{item.bookingReference}</span>
            <span className="rounded-md bg-rose-50 px-1.5 py-0.2 text-[10px] font-bold text-rose-700">
              {item.reason}
            </span>
          </div>

          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 flex-wrap">
            <span className="inline-flex items-center gap-1 font-medium text-gray-700">
              <CountryFlag code={item.market} className="w-3.5 h-2.5" />
              <span>{item.marketName}</span>
            </span>
            <span className="rounded-md bg-amber-50 px-2 py-0.2 text-[10px] font-bold text-amber-700 border border-amber-200/60">
              {item.status}
            </span>
            <span>{item.date}</span>
          </div>
        </div>
      </div>

      <Link
        to={item.link || '/disputes'}
        className="inline-flex items-center justify-center gap-1 rounded-lg border border-purple-200 bg-white px-3 py-1.5 text-xs font-bold text-[#5c2dd5] shadow-2xs hover:bg-[#5c2dd5] hover:text-white transition-all shrink-0 cursor-pointer self-start sm:self-center"
      >
        <span>View Case</span>
        <ArrowRight className="size-3" />
      </Link>
    </div>
  )
}

/* 9. SUPPORT TICKET ROW */
export function SupportResultRow({ item }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-xl hover:bg-purple-50/25 transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-[#5c2dd5] border border-purple-100">
          <Headphones className="size-5" />
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-extrabold text-gray-950 text-sm font-mono">{item.reference}</span>
            <span className="font-bold text-gray-800 text-xs">{item.subject}</span>
            <span className="rounded-md bg-gray-100 px-1.5 py-0.2 text-[10px] font-bold text-gray-700">
              {item.initiatorRole}
            </span>
          </div>

          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 flex-wrap">
            <span className="inline-flex items-center gap-1 font-medium text-gray-700">
              <CountryFlag code={item.market} className="w-3.5 h-2.5" />
              <span>{item.marketName}</span>
            </span>
            <span className="rounded-md bg-purple-50 px-2 py-0.2 text-[10px] font-bold text-[#5c2dd5] border border-purple-200/60">
              {item.status}
            </span>
            <span>{item.date}</span>
          </div>
        </div>
      </div>

      <Link
        to={item.link || '/support'}
        className="inline-flex items-center justify-center gap-1 rounded-lg border border-purple-200 bg-white px-3 py-1.5 text-xs font-bold text-[#5c2dd5] shadow-2xs hover:bg-[#5c2dd5] hover:text-white transition-all shrink-0 cursor-pointer self-start sm:self-center"
      >
        <span>Open Ticket</span>
        <ArrowRight className="size-3" />
      </Link>
    </div>
  )
}

