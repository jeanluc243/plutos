import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const metricCards = Array.from({ length: 4 });
const tableRows = Array.from({ length: 5 });

function MetricSkeletons() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {metricCards.map((_, index) => (
        <Card key={index} size="sm" className="min-h-32">
          <CardHeader>
            <Skeleton className="h-3.5 w-24" />
          </CardHeader>
          <CardContent className="space-y-2">
            <Skeleton className="h-7 w-28" />
            <Skeleton className="h-3 w-36" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function DashboardLoading() {
  return (
    <div
      className="min-h-[calc(100dvh-73px)] space-y-5 bg-muted/20 p-4 sm:p-6"
      aria-busy="true"
      aria-label="Chargement de la section"
    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <p className="shimmer shimmer-duration-1500 text-sm text-muted-foreground">
            Chargement des données…
          </p>
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-8 w-28" />
          <Skeleton className="h-8 w-24" />
        </div>
      </div>

      <MetricSkeletons />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-48" />
          </CardHeader>
          <CardContent className="flex h-56 items-end gap-3">
            {[40, 65, 48, 80, 58, 72, 50, 88].map((height, index) => (
              <Skeleton
                key={index}
                className="min-w-0 flex-1"
                style={{ height: `${height}%` }}
              />
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-40" />
          </CardHeader>
          <CardContent className="space-y-5">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between gap-4">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-3 w-10" />
                </div>
                <Skeleton className="h-2 w-full rounded-full" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="space-y-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-3 w-64 max-w-full" />
        </CardHeader>
        <CardContent className="space-y-4">
          {tableRows.map((_, index) => (
            <div key={index} className="grid grid-cols-[1.5fr_1fr_0.7fr] gap-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </div>
          ))}
        </CardContent>
      </Card>

      <span className="sr-only" role="status" aria-live="polite">
        Les données de la section sont en cours de chargement.
      </span>
    </div>
  );
}
