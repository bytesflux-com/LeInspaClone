import Skeleton from '../../ui/Skeleton'

// Mirrors the ADM-017 grid so the page does not jump when data arrives.
export default function LoyaltySkeleton() {
  return (
    <div className="@container min-w-0" aria-busy="true" aria-label="Loading referrals and loyalty">
      <div className="grid gap-3 @[64rem]:grid-cols-[minmax(0,642fr)_minmax(0,338fr)_minmax(0,275fr)]">
        <Skeleton className="h-[148px] @[64rem]:col-span-2" />
        <div className="space-y-3 @[64rem]:col-start-3 @[64rem]:row-span-2 @[64rem]:row-start-1">
          <Skeleton className="h-[132px]" />
          <Skeleton className="h-[150px]" />
        </div>
        <Skeleton className="h-[178px] @[64rem]:col-start-1 @[64rem]:row-start-2" />
        <Skeleton className="h-[178px] @[64rem]:col-start-2 @[64rem]:row-start-2" />
        <div className="space-y-3 @[64rem]:col-start-1 @[64rem]:row-start-3">
          <Skeleton className="h-[330px]" />
          <Skeleton className="h-[270px]" />
        </div>
        <div className="space-y-3 @[64rem]:col-span-2 @[64rem]:col-start-2 @[64rem]:row-start-3">
          <Skeleton className="h-[116px]" />
          <Skeleton className="h-[110px]" />
          <Skeleton className="h-[290px]" />
          <Skeleton className="h-[100px]" />
        </div>
      </div>
    </div>
  )
}
