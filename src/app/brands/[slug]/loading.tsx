import { PageSkeleton, Skeleton } from "@/components/skeleton";

export default function Loading() {
  return (
    <PageSkeleton label="Loading the brand evidence…">
      <Skeleton className="h-4 w-20" />
      <Skeleton className="mt-3 h-7 w-56" />
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
      <Skeleton className="mt-6 h-80 w-full" />
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    </PageSkeleton>
  );
}
