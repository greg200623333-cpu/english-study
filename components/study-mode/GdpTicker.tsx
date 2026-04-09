'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'

type Props = {
  value: number
  gain: number
  waiting: boolean
  onGainShown?: () => void
}

export function GdpTicker({ value, gain, waiting, onGainShown }: Props) {
  const previousValueRef = useRef(value)
  const [displayValue, setDisplayValue] = useState(value)

  useEffect(() => {
    const from = previousValueRef.current
    const to = value
    previousValueRef.current = value

    if (from === to) {
      return
    }

    let frame = 0
    const start = performance.now()
    const duration = 820

    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - progress, 3)
      const nextValue = from + (to - from) * eased
      setDisplayValue(nextValue)
      if (progress < 1) {
        frame = window.requestAnimationFrame(tick)
      }
    }

    frame = window.requestAnimationFrame(tick)
    return () => window.cancelAnimationFrame(frame)
  }, [value])

  useEffect(() => {
    if (gain <= 0) return
    const timeout = window.setTimeout(() => {
      onGainShown?.()
    }, 1800)
    return () => window.clearTimeout(timeout)
  }, [gain, onGainShown])

  return (
    <div className="relative">
      <div className="text-3xl font-black text-cyan-300">{Math.round(displayValue).toLocaleString()}</div>
      <AnimatePresence>
        {gain > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.9 }}
            animate={{ opacity: 1, y: -20, scale: 1 }}
            exit={{ opacity: 0, y: -38 }}
            className="pointer-events-none absolute -top-1 right-0 text-sm font-bold text-emerald-300 drop-shadow-[0_0_12px_rgba(74,222,128,0.55)]"
          >
            +{Math.round(gain)}
          </motion.div>
        ) : null}
      </AnimatePresence>
      <div className="mt-2 text-xs text-slate-500">
        {waiting ? '等待前线情报接入...' : '前线收益持续回流中'}
      </div>
    </div>
  )
}
