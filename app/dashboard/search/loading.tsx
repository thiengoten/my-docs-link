export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="h-7 w-40 animate-pulse rounded-sm bg-line" />
      <div className="space-y-3">
        <div className="h-11 animate-pulse rounded-md border border-line bg-paper-raised" />
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-9 w-20 animate-pulse rounded-full bg-line" />
          ))}
        </div>
      </div>
    </div>
  );
}
