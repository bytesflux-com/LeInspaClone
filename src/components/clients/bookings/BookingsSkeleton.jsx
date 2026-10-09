import Skeleton from '../../ui/Skeleton'

export default function BookingsSkeleton() {
  return (
    <div className="@container grid items-start gap-3 xl:grid-cols-[minmax(0,1fr)_300px]" aria-busy="true" aria-label="Loading client bookings">
      <div className="min-w-0 space-y-3">
        <Skeleton className="h-[142px] rounded-xl" />
        <div className="grid grid-cols-2 gap-2.5 @[40rem]:grid-cols-3 @[64rem]:grid-cols-6">
          {Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-[74px] rounded-xl" />)}
        </div>
        <div className="space-y-3 rounded-xl border border-[#e6e1f3] bg-white p-3">
          <Skeleton className="h-9 w-2/3" />
          <Skeleton className="h-9" />
          {Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-[70px]" />)}
        </div>
      </div>
      <Skeleton className="hidden h-[720px] rounded-xl xl:block" />
    </div>
  )
}
