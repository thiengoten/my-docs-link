export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="h-7 w-24 animate-pulse rounded-sm bg-line" />
      <div className="divide-y divide-line rounded-md border border-line bg-paper-raised shadow-1">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex h-11 items-center px-4">
            <div className="h-4 w-32 animate-pulse rounded-sm bg-line" />
          </div>
        ))}
      </div>
    </div>
  );
}
