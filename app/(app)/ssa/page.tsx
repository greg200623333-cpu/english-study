'use client'

import { useEffect, useState } from 'react'
import { SsaCommandCenter } from '@/components/study-mode/SsaCommandCenter'
import { ErrorBoundary } from '@/components/ErrorBoundary'


export const dynamic = 'force-dynamic'

export default function SsaPage() {
  const [hasMounted, setHasMounted] = useState(false)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHasMounted(true)
  }, [])

  
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

  return (
    <ErrorBoundary level="section">
      <SsaCommandCenter />
    </ErrorBoundary>
  )
}
