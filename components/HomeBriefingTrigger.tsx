'use client'

import { useEffect } from 'react'
import { useStudyModeStore } from '@/stores/useStudyModeStore'
import { SystemBriefingModal } from '@/components/SystemBriefingModal'

const IS_DEV = process.env.NODE_ENV === 'development'
const BRIEFING_KEY = 'ssa_briefing_read'

function safeLS(): Storage | null {
  try { return typeof localStorage !== 'undefined' ? localStorage : null } catch { return null }
}

// 清除所有 ssa_ 开头的缓存，可在浏览器 Console 调用 clearSsaCache()
export function clearSsaCache() {
  const ls = safeLS()
  if (!ls) return
  const keys = Object.keys(ls).filter((k) => k.startsWith('ssa_'))
  keys.forEach((k) => ls.removeItem(k))
  console.log(`[SSA] Cleared ${keys.length} key(s):`, keys)
}

export function HomeBriefingTrigger() {
  const openBriefing = useStudyModeStore((state) => state.openBriefing)

  useEffect(() => {
    // 开发环境下暴露到 window，方便 Console 调用
    if (IS_DEV) {
      (window as typeof window & { clearSsaCache: typeof clearSsaCache }).clearSsaCache = clearSsaCache
    }

    const timer = setTimeout(() => {
      const ls = safeLS()
      // dev 模式每次刷新都弹出；生产环境只弹一次
      const alreadySeen = !IS_DEV && ls?.getItem(BRIEFING_KEY) === 'true'
      if (!alreadySeen) {
        openBriefing()
        try {
          ls?.setItem(BRIEFING_KEY, 'true')
        } catch {
          // 无痕模式或存储已满时静默降级
        }
      }
    }, 800)
    return () => clearTimeout(timer)
  }, [openBriefing])

  return (
    <>
      <SystemBriefingModal />
      <button
        onClick={openBriefing}
        className="group flex items-center gap-2 rounded-xl border border-cyan-400/25 bg-cyan-400/10 px-4 py-2.5 text-sm font-semibold text-cyan-200 transition hover:border-cyan-400/45 hover:bg-cyan-400/18 hover:text-cyan-100"
      >
        <span className="animate-pulse text-base">📡</span>
        <span>战略简报</span>
      </button>
    </>
  )
}
