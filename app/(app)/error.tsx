'use client'

import { useEffect } from 'react'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 text-center">
      <div className="text-5xl">⚠</div>
      <div>
        <h2 className="text-xl font-bold text-slate-100">战区发生异常</h2>
        <p className="mt-2 text-sm text-slate-400">{error.message || '未知错误，请稍后重试'}</p>
      </div>
      <button
        onClick={reset}
        className="rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-6 py-2.5 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-400/15"
      >
        重新尝试
      </button>
    </div>
  )
}
