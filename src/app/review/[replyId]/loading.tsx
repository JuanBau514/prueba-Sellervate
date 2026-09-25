import { PageSkeleton, Skeleton } from "@/components/skeleton";

export default function Loading() {
  return (
    <PageSkeleton label="Loading the reply and the brand procedure…">
      <Skeleton className="h-4 w-44" />
      <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-6">
          <Skeleton className="h-7 w-56" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-56 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    </PageSkeleton>
  );
}
