export function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div className={`space-y-2 ${className}`}>
      <div className="skeleton aspect-[2/3] rounded" />
      <div className="skeleton h-3 rounded w-3/4" />
      <div className="skeleton h-3 rounded w-1/2" />
    </div>
  );
}

export function SkeletonText({ className = "" }: { className?: string }) {
  return <div className={`skeleton h-4 rounded ${className}`} />;
}

export function SkeletonRow({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
