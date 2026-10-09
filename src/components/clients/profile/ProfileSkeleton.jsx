import Skeleton from '../../ui/Skeleton'

export default function ProfileSkeleton() {
  return (
    <div className="@container grid items-start gap-3 xl:grid-cols-[minmax(0,1fr)_290px]" aria-busy="true" aria-label="Loading client profile">
      <div className="min-w-0 space-y-3">
        <Skeleton className="h-[250px] rounded-xl" />
        <div className="grid grid-cols-2 gap-2 @[56rem]:grid-cols-5">{Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-[78px] rounded-xl" />)}</div>
        <div className="grid gap-3 @[56rem]:grid-cols-3">
          <Skeleton className="h-[400px] rounded-xl" />
          <Skeleton className="h-[400px] rounded-xl" />
          <Skeleton className="h-[400px] rounded-xl" />
        </div>
        <div className="grid gap-3 @[56rem]:grid-cols-3">{Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-[190px] rounded-xl" />)}</div>
      </div>
      <div className="space-y-3">
        <Skeleton className="h-[390px] rounded-xl" />
        <Skeleton className="h-[360px] rounded-xl" />
      </div>
    </div>
  )
}
