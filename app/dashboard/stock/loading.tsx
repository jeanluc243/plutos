import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function StockLoading() {
  return (
    <div className="min-h-[calc(100dvh-73px)] space-y-4 bg-muted/20 p-3 sm:p-5" aria-busy="true">
      <div className="space-y-2"><Skeleton className="h-8 w-52" /><Skeleton className="h-4 w-96 max-w-full" /></div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }).map((_, index) => <Card key={index} size="sm"><CardContent><Skeleton className="h-16 w-full" /></CardContent></Card>)}</div>
      <Card><CardContent className="space-y-4">{Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-12 w-full" />)}</CardContent></Card>
    </div>
  );
}
