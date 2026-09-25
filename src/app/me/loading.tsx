import { PageSkeleton, Skeleton } from "@/components/skeleton";

export default function Loading() {
  return (
    <PageSkeleton label="Loading your feedback…">
      <Skeleton className="h-7 w-44" />
      <Skeleton className="mt-3 h-4 w-full max-w-lg" />
      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
      </div>
      {[0, 1, 2].map((item) => (
        <Skeleton key={item} className="mt-4 h-32 w-full" />
      ))}
    </PageSkeleton>
  );
}
