export default function LoadingSkeleton({ rows = 5 }) {
  return (
    <div className="card p-4 space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg shimmer" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-1/3 rounded shimmer" />
            <div className="h-3 w-2/3 rounded shimmer" />
          </div>
        </div>
      ))}
    </div>
  );
}
