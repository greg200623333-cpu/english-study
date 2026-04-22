'use client'

import { useMemo, useState, useEffect } from 'react'

type WordStatus = 'new' | 'learning' | 'known'

type SsaWord = {
  id: number
  word: string
  status: WordStatus
  wordType?: 'review' | 'new'
  stability?: number
  difficulty?: number
  next_review?: number
}

type Bucket = {
  key: string
  label: string
  color: string
  glowColor: string
  words: SsaWord[]
  count: number
}

type StrategicStatusBarProps = {
  words: SsaWord[]
  currentWordId?: number | null
  healFlash?: boolean
}

function isCriticalWord(word: SsaWord, currentTime: number | null): boolean {
  if (word.status === 'new') return false
  if (!word.next_review) return false
  if (currentTime === null) return false
  return currentTime > word.next_review + 12 * 60 * 60 * 1000
}

function classifyBucket(word: SsaWord, currentTime: number | null): { key: string; label: string } {
  if (isCriticalWord(word, currentTime)) return { key: 'critical', label: '危急' }
  if (word.status === 'known') return { key: 'mastered', label: '已掌握' }
  if (word.status === 'learning') return { key: 'learning', label: '复习中' }
  return { key: 'new', label: '新词' }
}

const BUCKET_CONFIG: Record<string, { label: string; color: string; glowColor: string; order: number }> = {
  critical:  { label: '危急', color: 'bg-rose-500',    glowColor: 'shadow-[0_0_12px_rgba(244,63,94,0.7)]',  order: 0 },
  learning:  { label: '复习中', color: 'bg-amber-400', glowColor: 'shadow-[0_0_8px_rgba(251,191,36,0.5)]',  order: 1 },
  new:       { label: '新词', color: 'bg-cyan-400',    glowColor: 'shadow-[0_0_8px_rgba(34,211,238,0.5)]',  order: 2 },
  mastered:  { label: '已掌握', color: 'bg-emerald-500', glowColor: 'shadow-[0_0_6px_rgba(16,185,129,0.4)]', order: 3 },
}

const RATING_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  perfect: { bg: 'bg-emerald-500/20 border-emerald-500/40', text: 'text-emerald-400', label: '完美' },
  good:    { bg: 'bg-cyan-500/20 border-cyan-500/40',       text: 'text-cyan-400',    label: '良好' },
  hard:    { bg: 'bg-amber-500/20 border-amber-500/40',     text: 'text-amber-400',   label: '困难' },
  forgot:  { bg: 'bg-rose-500/20 border-rose-500/40',       text: 'text-rose-400',    label: '遗忘' },
}

export function StrategicStatusBar({ words, currentWordId, healFlash = false }: StrategicStatusBarProps) {
  const [currentTime, setCurrentTime] = useState<number | null>(null)

  useEffect(() => {
    setCurrentTime(Date.now())
  }, [])

  const buckets = useMemo<Bucket[]>(() => {
    const bucketMap = new Map<string, Bucket>()

    for (const word of words) {
      const { key } = classifyBucket(word, currentTime)
      const config = BUCKET_CONFIG[key]
      if (!bucketMap.has(key)) {
        bucketMap.set(key, {
          key,
          label: config.label,
          color: config.color,
          glowColor: config.glowColor,
          words: [],
          count: 0,
        })
      }
      const bucket = bucketMap.get(key)!
      bucket.words.push(word)
      bucket.count++
    }

    return Array.from(bucketMap.values()).sort(
      (a, b) => (BUCKET_CONFIG[a.key]?.order ?? 99) - (BUCKET_CONFIG[b.key]?.order ?? 99)
    )
  }, [words, currentTime])

  const total = words.length
  const criticalCount = buckets.find((b) => b.key === 'critical')?.count ?? 0
  const masteredCount = buckets.find((b) => b.key === 'mastered')?.count ?? 0
  const completionPct = total > 0 ? Math.round((masteredCount / total) * 100) : 0

  return (
    <div
      className={`border border-cyan-500/20 bg-slate-950/80 backdrop-blur-md transition-all duration-300 ${healFlash ? 'shadow-[0_0_32px_rgba(16,185,129,0.6)] border-emerald-400/40' : ''}`}
      style={{ borderRadius: 0 }}
    >
      {/* Top bar: label + stats */}
      <div className="flex items-center justify-between border-b border-cyan-500/15 px-4 py-2">
        <div className="flex items-center gap-2">
          <div className="text-[10px] uppercase tracking-[0.35em] text-cyan-300/60">Asset Structure</div>
          <div className="text-[10px] text-slate-500">资产结构分析</div>
        </div>
        <div className="flex items-center gap-4 text-xs">
          {criticalCount > 0 && (
            <span className="flex items-center gap-1.5 text-rose-400">
              <span
                className="h-1.5 w-1.5 rounded-full bg-rose-400"
                style={{ animation: 'pulse 1s cubic-bezier(0.4,0,0.6,1) infinite' }}
              />
              危急 {criticalCount}
            </span>
          )}
          <span className="text-slate-500">
            总资产 <span className="text-slate-300">{total}</span>
          </span>
          <span className="text-slate-500">
            完成度 <span className="text-emerald-400">{completionPct}%</span>
          </span>
        </div>
      </div>

      {/* Energy bar segments */}
      <div className="flex h-3 w-full overflow-hidden">
        {total === 0
          ? <div className="h-full w-full bg-slate-900" />
          : buckets.map((bucket) => {
              const pct = (bucket.count / total) * 100
              return (
                <div
                  key={bucket.key}
                  className={bucket.color}
                  style={{ width: `${pct}%`, transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)' }}
                  title={`${bucket.label}: ${bucket.count} (${pct.toFixed(1)}%)`}
                />
              )
            })}
      </div>

      {/* Bucket legend */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2">
        {buckets.map((bucket) => {
          const pct = total > 0 ? ((bucket.count / total) * 100).toFixed(1) : '0.0'
          const isCritical = bucket.key === 'critical'
          return (
            <div key={bucket.key} className="flex items-center gap-1.5 text-xs">
              <div
                className={`h-2 w-2 rounded-full ${bucket.color} ${isCritical ? bucket.glowColor : ''}`}
                style={isCritical ? { animation: 'pulse 1s cubic-bezier(0.4,0,0.6,1) infinite' } : {}}
              />
              <span className={isCritical ? 'text-rose-300' : 'text-slate-400'}>
                {bucket.label}
              </span>
              <span className={isCritical ? 'text-rose-400 font-mono' : 'text-slate-500 font-mono'}>
                {bucket.count}
              </span>
              <span className="text-slate-600 font-mono">{pct}%</span>
            </div>
          )
        })}

        {/* Current word indicator */}
        {currentWordId && (
          <div className="ml-auto flex items-center gap-1.5 text-xs text-cyan-400/70">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-400" />
            <span className="font-mono">ID:{currentWordId}</span>
          </div>
        )}
      </div>
    </div>
  )
}

/** Compact rating badge shown after card flip */
export function RatingBadge({ rating, manualOverride }: { rating: string | null; manualOverride: boolean }) {
  if (!rating) return null
  const config = RATING_COLORS[rating]
  if (!config) return null

  return (
    <div
      className={`inline-flex items-center gap-2 border px-3 py-1.5 text-xs font-medium ${config.bg} ${config.text}`}
      style={{ borderRadius: 0 }}
    >
      {manualOverride && (
        <span className="text-[10px] uppercase tracking-widest opacity-70">手动</span>
      )}
      <span>{config.label}</span>
      <span className="opacity-50">K 切换</span>
    </div>
  )
}
