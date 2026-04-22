'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'

export function StrategicFab() {
  const pathname = usePathname()
  const router = useRouter()
  const [hovered, setHovered] = useState(false)
  const [deploying, setDeploying] = useState(false)

  if (pathname === '/ssa' || pathname === '/quiz') {
    return null
  }

  function handleDeploy() {
    if (deploying) return
    setDeploying(true)
    window.setTimeout(() => {
      setDeploying(false)
      router.push('/ssa')
    }, 620)
  }

  return (
    <>
      <div className="fixed bottom-24 right-4 z-50 md:bottom-10 md:right-10">
        <motion.button
          type="button"
          onClick={handleDeploy}
          onHoverStart={() => setHovered(true)}
          onHoverEnd={() => setHovered(false)}
          whileHover={{ scale: 1.03, y: -2 }}
          whileTap={{ scale: 0.97 }}
          className="group relative h-[84px] w-[84px] md:h-[96px] md:w-[96px]"
          aria-label="执行词汇疆域扩张"
        >
          <motion.span
            className="absolute inset-[-10px] rounded-[1.9rem] border border-cyan-300/15"
            animate={{ opacity: [0.18, 0.55, 0.18], scale: [0.95, 1.05, 1.12] }}
            transition={{ duration: 2.6, repeat: Infinity, ease: 'easeOut' }}
          />
          <span
            className="absolute inset-0 rounded-[1.7rem] border bg-slate-950/80 shadow-[0_0_38px_rgba(0,242,255,0.14)] backdrop-blur-xl transition-all duration-300 group-hover:border-cyan-300/80 group-hover:shadow-[0_0_52px_rgba(0,242,255,0.22)]"
            style={{
              clipPath: 'polygon(16% 0%, 100% 0%, 100% 84%, 84% 100%, 0% 100%, 0% 16%)',
              borderColor: 'rgba(0,242,255,0.5)',
            }}
          />
          <span className="absolute inset-[8px] rounded-[1.35rem] border border-cyan-300/12" style={{ clipPath: 'polygon(14% 0%, 100% 0%, 100% 86%, 86% 100%, 0% 100%, 0% 14%)' }} />
          <motion.span
            className="absolute inset-[10px] rounded-[1.3rem] bg-[conic-gradient(from_0deg,transparent_0deg,rgba(0,242,255,0.35)_60deg,transparent_120deg)]"
            animate={{ rotate: 360 }}
            transition={{ duration: 3.2, repeat: Infinity, ease: 'linear' }}
          />
          <span className="absolute inset-[18px] rounded-[1rem] bg-[radial-gradient(circle_at_center,rgba(0,242,255,0.18),transparent_70%)]" />

          <span className="relative z-10 flex h-full w-full flex-col items-center justify-center text-cyan-100">
            <span className="text-[10px] uppercase tracking-[0.34em] text-cyan-300/75">Deploy</span>
            <span className="mt-1 text-xl font-black md:text-2xl">SSA</span>
          </span>

          <AnimatePresence>
            {hovered ? (
              <motion.div
                initial={{ opacity: 0, y: 10, x: 10 }}
                animate={{ opacity: 1, y: 0, x: 0 }}
                exit={{ opacity: 0, y: 8, x: 6 }}
                className="absolute bottom-[106%] right-0 whitespace-nowrap rounded-xl border border-cyan-300/20 bg-slate-950/90 px-4 py-2 text-xs font-semibold text-cyan-100 shadow-[0_0_24px_rgba(0,242,255,0.12)]"
              >
                执行：词汇疆域扩张
              </motion.div>
            ) : null}
          </AnimatePresence>
        </motion.button>
      </div>

      <AnimatePresence>
        {deploying ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] overflow-hidden bg-slate-950"
          >
            <div className="absolute inset-0 bg-[linear-gradient(rgba(0,242,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(0,242,255,0.08)_1px,transparent_1px)] bg-[size:44px_44px] opacity-35" />
            <motion.div
              initial={{ scaleX: 0, opacity: 0.2 }}
              animate={{ scaleX: 1, opacity: 1 }}
              transition={{ duration: 0.45, ease: [0.2,1,0.3,1] }}
              className="absolute inset-x-0 top-1/2 h-px origin-center bg-cyan-300/70 shadow-[0_0_24px_rgba(0,242,255,0.55)]"
            />
            <motion.div
              initial={{ y: '-25%' }}
              animate={{ y: '125%' }}
              transition={{ duration: 0.62, ease: 'linear' }}
              className="absolute inset-x-0 top-0 h-44 bg-[linear-gradient(to_bottom,rgba(0,242,255,0.32),transparent)]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <div className="rounded-[2rem] border border-cyan-300/25 bg-slate-950/72 px-8 py-7 text-center text-cyan-100 shadow-[0_0_48px_rgba(0,242,255,0.14)] backdrop-blur-xl">
                <div className="text-xs uppercase tracking-[0.4em] text-cyan-300/70">Strategic Sync</div>
                <div className="mt-3 text-3xl font-black">接入战略勤务局</div>
                <div className="mt-2 text-sm text-slate-400">前线词汇资产与作战序列正在同步...</div>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  )
}
