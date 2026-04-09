'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'

type InstructionStep = {
  selector: string
  title: string
  description: string
}

type SpotlightRect = {
  top: number
  left: number
  width: number
  height: number
}

type Props = {
  open: boolean
  steps: InstructionStep[]
  onFinish: () => void
}

const PADDING = 14

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function readSpotlightRect(selector: string): SpotlightRect | null {
  const element = document.querySelector(selector)
  if (!element) return null

  const rect = element.getBoundingClientRect()
  return {
    top: Math.max(12, rect.top - PADDING),
    left: Math.max(12, rect.left - PADDING),
    width: rect.width + PADDING * 2,
    height: rect.height + PADDING * 2,
  }
}

export default function InstructionOverlay({ open, steps, onFinish }: Props) {
  const [stepIndex, setStepIndex] = useState(0)
  const [spotlight, setSpotlight] = useState<SpotlightRect | null>(null)

  const currentStep = steps[stepIndex]

  useEffect(() => {
    if (!open) return

    const updateSpotlight = () => {
      const rect = readSpotlightRect(currentStep.selector)
      setSpotlight(rect)
    }

    updateSpotlight()
    window.addEventListener('resize', updateSpotlight)
    window.addEventListener('scroll', updateSpotlight, true)

    return () => {
      window.removeEventListener('resize', updateSpotlight)
      window.removeEventListener('scroll', updateSpotlight, true)
    }
  }, [currentStep.selector, open])

  const panelStyle = useMemo(() => {
    const viewportWidth = typeof window === 'undefined' ? 1440 : window.innerWidth
    const viewportHeight = typeof window === 'undefined' ? 900 : window.innerHeight
    const panelWidth = Math.min(420, viewportWidth - 32)

    if (!spotlight) {
      return {
        top: Math.max(24, viewportHeight - 240),
        left: 16,
        width: panelWidth,
      }
    }

    const preferredTop = spotlight.top + spotlight.height + 18
    const fallbackTop = spotlight.top - 196
    const top = preferredTop + 180 <= viewportHeight ? preferredTop : Math.max(24, fallbackTop)
    const left = clamp(spotlight.left, 16, viewportWidth - panelWidth - 16)

    return { top, left, width: panelWidth }
  }, [spotlight])

  function handleNext() {
    if (stepIndex >= steps.length - 1) {
      onFinish()
      return
    }

    setStepIndex((current) => current + 1)
  }

  if (!open || !currentStep) return null

  return (
    <AnimatePresence>
      <motion.div key="algo-onboarding" className="fixed inset-0 z-[120]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        {spotlight ? (
          <>
            <div className="absolute left-0 top-0 right-0 bg-slate-950/70" style={{ height: spotlight.top }} />
            <div className="absolute left-0 bg-slate-950/70" style={{ top: spotlight.top, width: spotlight.left, height: spotlight.height }} />
            <div className="absolute right-0 bg-slate-950/70" style={{ top: spotlight.top, left: spotlight.left + spotlight.width, height: spotlight.height }} />
            <div className="absolute left-0 right-0 bg-slate-950/70" style={{ top: spotlight.top + spotlight.height, bottom: 0 }} />
            <motion.div
              className="absolute rounded-[1.5rem] border border-indigo-300/70 shadow-[0_0_36px_rgba(99,102,241,0.28)] pointer-events-none"
              initial={false}
              animate={{ top: spotlight.top, left: spotlight.left, width: spotlight.width, height: spotlight.height }}
              transition={{ type: 'spring', stiffness: 260, damping: 28 }}
            />
          </>
        ) : (
          <div className="absolute inset-0 bg-slate-950/70" />
        )}

        <div className="absolute inset-0 pointer-events-none">
          <motion.div
            initial={{ y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 16, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="pointer-events-auto rounded-[1.5rem] border p-5 shadow-[0_20px_60px_rgba(15,23,42,0.52)]"
            style={{ top: panelStyle.top, left: panelStyle.left, width: panelStyle.width, position: 'absolute', background: '#0f172a', borderColor: '#1e293b' }}
          >
            <div className="text-xs uppercase tracking-[0.28em] text-indigo-300/80">Algorithm Onboarding</div>
            <div className="mt-3 text-lg font-black text-slate-100">{currentStep.title}</div>
            <p className="mt-3 text-sm leading-7 text-slate-200">{currentStep.description}</p>
            <div className="mt-5 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={onFinish}
                className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:border-slate-500 hover:text-white"
              >
                跳过
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="rounded-xl px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110"
                style={{ backgroundImage: 'linear-gradient(to right, #6366f1, #a855f7)' }}
              >
                {stepIndex === steps.length - 1 ? '完成' : '下一步'}
              </button>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

