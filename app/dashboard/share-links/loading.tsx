export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="h-7 w-32 animate-pulse rounded-sm bg-line" />
        <div className="h-9 w-32 animate-pulse rounded-md bg-line" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-16 animate-pulse rounded-md border border-line bg-paper-raised" />
        ))}
      </div>
    </div>
  );
}
