import { Skeleton } from "@/components/feedback/Skeleton";

export function RouteLoadingState() {
  return (
    <main
      aria-busy="true"
      aria-label="Loading page"
      className="relative grid min-h-dvh place-items-center overflow-hidden bg-surface-subtle px-6"
    >
      <div
        aria-label="Page loading progress"
        aria-valuemax={100}
        aria-valuemin={0}
        className="fixed inset-x-0 top-0 z-[60] h-1 overflow-hidden bg-brand/10"
        role="progressbar"
      >
        <span className="route-progress block h-full w-1/3 bg-brand" />
      </div>

      <section className="w-full max-w-md space-y-8" role="status">
        <span className="sr-only">Loading page content</span>
        <div className="space-y-3">
          <Skeleton className="mx-auto h-12 w-3/4 rounded-xl" />
          <Skeleton className="mx-auto h-4 w-1/2 rounded-full" />
        </div>
        <Skeleton className="mx-auto size-40 rounded-full" />
        <Skeleton className="mx-auto h-12 w-40 rounded-full" />
      </section>
    </main>
  );
}
