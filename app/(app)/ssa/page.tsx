'use client'

import { useEffect, useState } from 'react'
import { SsaCommandCenter } from '@/components/study-mode/SsaCommandCenter'

// 防止构建时预渲染
export const dynamic = 'force-dynamic'

export default function SsaPage() {
  const [hasMounted, setHasMounted] = useState(false)

  useEffect(() => {
    setHasMounted(true)
  }, [])

  // 在客户端挂载前显示加载状态，避免 Hydration Mismatch
  if (!hasMounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-cyan-300/20 border-t-cyan-300 mx-auto" />
          <p className="text-sm text-slate-400">Loading SSA Command Center...</p>
        </div>
      </div>
    )
  }

  return <SsaCommandCenter />
}
