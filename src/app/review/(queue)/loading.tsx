import { PageSkeleton, Skeleton } from "@/components/skeleton";

export default function Loading() {
  return (
    <PageSkeleton label="Loading your review queue…">
      <Skeleton className="h-7 w-48" />
      <Skeleton className="mt-3 h-4 w-full max-w-xl" />
      {[0, 1].map((brand) => (
        <div key={brand} className="mt-10">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="mt-4 h-4 w-full max-w-md" />
          <Skeleton className="mt-2 h-4 w-full max-w-md" />
          {[0, 1].map((item) => (
            <Skeleton key={item} className="mt-4 h-32 w-full" />
          ))}
        </div>
      ))}
    </PageSkeleton>
  );
}
