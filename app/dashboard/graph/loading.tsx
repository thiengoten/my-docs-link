export default function Loading() {
  return (
    <div className="flex h-[calc(100dvh-8rem)] flex-col gap-4">
      <div className="space-y-2">
        <div className="h-7 w-40 animate-pulse rounded-sm bg-line" />
        <div className="h-4 w-80 max-w-full animate-pulse rounded-sm bg-line" />
      </div>
      <div className="flex-1 animate-pulse rounded-md border border-line bg-paper-raised" />
    </div>
  );
}
