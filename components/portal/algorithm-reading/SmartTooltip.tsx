'use client'

type Props = {
  open: boolean
  x: number
  y: number
  term: string
  loading: boolean
  explanation: string
  codeDemo: string
  onClose: () => void
}

export default function SmartTooltip({ open, x, y, term, loading, explanation, codeDemo, onClose }: Props) {
  if (!open) return null

  const viewportWidth = typeof window === 'undefined' ? 1440 : window.innerWidth
  const viewportHeight = typeof window === 'undefined' ? 900 : window.innerHeight
  const tooltipWidth = 384
  const tooltipMaxHeight = Math.round(viewportHeight * 0.8)
  const left = Math.max(16, Math.min(x, viewportWidth - tooltipWidth - 16))
  const centeredTop = Math.max(24, Math.round((viewportHeight - tooltipMaxHeight) / 2))
  const upwardTop = Math.max(24, y - tooltipMaxHeight + 48)
  const top = Math.min(Math.max(24, upwardTop), centeredTop + 120)

  return (
    <div
      className="fixed z-50 w-[24rem] max-w-[calc(100vw-2rem)]"
      style={{ left, top, maxHeight: '80vh' }}
    >
      <div className="glass-strong flex max-h-[80vh] flex-col rounded-[1.5rem] border border-fuchsia-400/20 bg-slate-950/90 p-4 shadow-[0_0_40px_rgba(192,132,252,0.18)] backdrop-blur-xl">
        <div className="mb-3 flex items-start justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-[0.3em] text-fuchsia-300/80">Smart Tooltip</div>
            <div className="mt-2 text-lg font-black text-slate-50">{term}</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/10 px-2 py-1 text-xs text-slate-400 transition hover:border-white/20 hover:text-slate-200"
          >
            close
          </button>
        </div>

        {loading ? (
          <div className="rounded-xl border border-white/8 bg-white/5 px-4 py-4 text-sm text-slate-400">
            AI 正在生成中文释义与 C Demo...
          </div>
        ) : (
          <div className="flex-1 space-y-4 overflow-y-auto pr-1 text-sm [scrollbar-color:rgba(192,132,252,0.5)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-fuchsia-400/40 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:w-1.5">
            <div className="rounded-xl border border-cyan-400/15 bg-cyan-400/10 p-4">
              <div className="text-xs uppercase tracking-[0.25em] text-cyan-200/80">Definition</div>
              <div className="mt-2 leading-7 text-slate-200">{explanation}</div>
            </div>

            <div className="rounded-xl border border-emerald-400/15 bg-[#020617] p-4">
              <div className="mb-2 text-xs uppercase tracking-[0.25em] text-emerald-200/80">Dynamic C Demo</div>
              <pre className="max-h-[36vh] overflow-x-auto overflow-y-auto pr-1 text-xs leading-6 text-emerald-200 [scrollbar-color:rgba(16,185,129,0.45)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-emerald-400/35 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar]:w-1.5">
                <code>{codeDemo}</code>
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
