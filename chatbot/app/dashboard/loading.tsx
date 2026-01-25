import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';

export default function DashboardLoading() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header Skeleton */}
      <div className="border-b bg-background">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-96" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-9 w-24" />
              <Skeleton className="h-9 w-24" />
              <Skeleton className="h-9 w-24" />
            </div>
          </div>
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="container mx-auto flex-1 space-y-6 px-4 py-8">
        {/* Overview Section */}
        <section className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="p-6">
              <Skeleton className="h-32 w-full" />
            </Card>
            <Card className="p-6 md:col-span-2">
              <Skeleton className="h-32 w-full" />
            </Card>
          </div>
          <div className="grid gap-4 md:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="p-6">
                <Skeleton className="h-24 w-full" />
              </Card>
            ))}
          </div>
        </section>

        {/* Content Gaps Skeleton */}
        <Card className="p-6">
          <Skeleton className="mb-4 h-6 w-48" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </Card>

        {/* Recommendations Skeleton */}
        <Card className="p-6">
          <Skeleton className="mb-4 h-6 w-48" />
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
