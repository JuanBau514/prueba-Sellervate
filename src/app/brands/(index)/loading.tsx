import { PageSkeleton, Skeleton } from "@/components/skeleton";

export default function Loading() {
  return (
    <PageSkeleton label="Loading your brands…">
      <Skeleton className="h-7 w-32" />
      <Skeleton className="mt-3 h-4 w-full max-w-lg" />
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    </PageSkeleton>
  );
}
