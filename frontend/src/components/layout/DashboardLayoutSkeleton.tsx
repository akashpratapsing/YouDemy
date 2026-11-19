import { Skeleton } from '@/components/ui/skeleton';

export function DashboardLayoutSkeleton() {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="flex gap-6">
        <Skeleton className="hidden h-[90vh] w-64 rounded-xl lg:block" />
        <div className="flex-1 space-y-6">
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-8 w-56" />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[0, 1, 2, 3].map((item) => <Skeleton key={item} className="h-32 rounded-xl" />)}
          </div>
          <Skeleton className="h-72 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
