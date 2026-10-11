import Skeleton from '../../ui/Skeleton'

export default function AccountSkeleton() {
  return (
    <div className="@container min-w-0 space-y-3" aria-busy="true" aria-label="Loading account actions">
      <Skeleton className="h-[142px] rounded-xl" />
      <div className="grid gap-3 @[56rem]:grid-cols-[1.45fr_1fr]">
        <Skeleton className="h-[148px] rounded-xl" />
        <Skeleton className="h-[148px] rounded-xl" />
      </div>
      <div className="grid gap-3 @[64rem]:grid-cols-[1.22fr_1fr_0.88fr]">
        {Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-[236px] rounded-xl" />)}
      </div>
      <div className="grid gap-3 @[56rem]:grid-cols-[0.95fr_1.1fr_1.05fr]">
        {Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-[190px] rounded-xl" />)}
      </div>
      <div className="grid gap-3 @[56rem]:grid-cols-[1.1fr_1fr]">
        {Array.from({ length: 2 }, (_, i) => <Skeleton key={i} className="h-[240px] rounded-xl" />)}
      </div>
    </div>
  )
}
