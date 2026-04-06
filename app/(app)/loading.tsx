export default function Loading() {
  return (
    <div className="animate-pulse space-y-4 max-w-3xl">
      <div className="h-8 w-48 rounded-xl" style={{ background: 'rgba(255,255,255,0.06)' }} />
      <div className="h-4 w-32 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)' }} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-28 rounded-2xl" style={{ background: 'rgba(255,255,255,0.04)' }} />
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
        <div className="h-48 rounded-2xl" style={{ background: 'rgba(255,255,255,0.04)' }} />
        <div className="h-48 rounded-2xl" style={{ background: 'rgba(255,255,255,0.04)' }} />
      </div>
    </div>
  )
}
