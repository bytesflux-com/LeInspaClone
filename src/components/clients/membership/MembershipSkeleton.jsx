import Skeleton from '../../ui/Skeleton'

export default function MembershipSkeleton() {
  return (
    <div className="@container min-w-0 space-y-3" aria-busy="true" aria-label="Loading client membership">
      <Skeleton className="h-[142px] rounded-xl" />
      <div className="grid gap-3 @[64rem]:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)_minmax(0,1fr)]">
        <Skeleton className="h-[270px] rounded-xl" />
        <Skeleton className="h-[270px] rounded-xl" />
        <Skeleton className="h-[270px] rounded-xl" />
      </div>
      <Skeleton className="h-[130px] rounded-xl" />
      <div className="grid gap-3 @[64rem]:grid-cols-2">
        <Skeleton className="h-[300px] rounded-xl" />
        <Skeleton className="h-[300px] rounded-xl" />
      </div>
      <div className="grid gap-3 @[64rem]:grid-cols-2">
        <Skeleton className="h-[200px] rounded-xl" />
        <Skeleton className="h-[200px] rounded-xl" />
      </div>
    </div>
  )
}
