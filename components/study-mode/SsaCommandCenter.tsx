'use client'

import { AnimatePresence, motion } from 'framer-motion'
import Link from 'next/link'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getCurrentUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/client'
import { type ExamType, type WordTier, useStudyModeStore } from '@/stores/useStudyModeStore'
import { RatingBadge, StrategicStatusBar } from '@/components/study-mode/StrategicStatusBar'
import { calculateNextReview, rateFromResponseTime, GRADUATION_STABILITY } from '@/lib/ssaReviewAlgorithm'
import { saveStudyModeProfile } from '@/lib/studyModePersistence'

type SsaWord = {
  id: number
  word: string
  phonetic: string | null
  meaning: string | null
  category: string | null
  tier: WordTier
  status: 'new' | 'learning' | 'known'
  wordType: 'review' | 'new'
  frequency: number
  rootHint: string
  example: string | null
  stability: number
  difficulty: number
  last_review: number
  next_review: number
}

type TechModalWord = Pick<SsaWord, 'word' | 'rootHint' | 'frequency' | 'meaning'>

type WordRow = {
  id: number
  word: string
  phonetic: string | null
  meaning: string | null
  example: string | null
  category: string | null
  tier: WordTier | null
}


const CAMPAIGN_OPTIONS: { key: ExamType; label: string }[] = [
  { key: 'cet4', label: 'CET-4' },
  { key: 'cet6', label: 'CET-6' },
  { key: 'kaoyan', label: '考研英语' },
]

function getFallbackWords(): SsaWord[] {
  const NOW = Date.now()
  return [
    { id: 1, word: 'consistent', phonetic: '/kənˈsɪstənt/', meaning: '一致的；持续稳定的', category: 'cet6', tier: 'core', status: 'new', wordType: 'new', frequency: 92, rootHint: 'sist / stand', example: 'Consistent practice builds strategic memory.', stability: 1, difficulty: 1.5, last_review: NOW, next_review: NOW },
    { id: 2, word: 'allocate', phonetic: '/ˈæləkeɪt/', meaning: '分配；调拨', category: 'cet6', tier: 'core', status: 'learning', wordType: 'review', frequency: 84, rootHint: 'loc / place', example: 'The ministry allocates funds to reading infrastructure.', stability: 2, difficulty: 1.5, last_review: NOW, next_review: NOW },
    { id: 3, word: 'possession', phonetic: '/pəˈzeʃən/', meaning: '拥有；财产', category: 'cet4', tier: 'full', status: 'new', wordType: 'new', frequency: 78, rootHint: 'sess / hold', example: 'Vocabulary possession requires repeated review.', stability: 1, difficulty: 1.5, last_review: NOW, next_review: NOW },
    { id: 4, word: 'compile', phonetic: '/kəmˈpaɪl/', meaning: '编译；汇编', category: 'kaoyan', tier: 'full', status: 'new', wordType: 'new', frequency: 75, rootHint: 'pil / pile', example: 'Compile your language assets into active output.', stability: 1, difficulty: 1.5, last_review: NOW, next_review: NOW },
    { id: 5, word: 'recursion', phonetic: '/rɪˈkɜːʒən/', meaning: '递归', category: 'kaoyan', tier: 'core', status: 'learning', wordType: 'review', frequency: 88, rootHint: 'curs / run', example: 'Recursion revisits smaller subproblems.', stability: 2, difficulty: 1.5, last_review: NOW, next_review: NOW },
  ]
}

function toStatusLabel(status: SsaWord['status']) {
  if (status === 'known') return 'Mastered'
  if (status === 'learning') return 'Learning'
  return 'Unlearned'
}

function statusShell(status: SsaWord['status']) {
  if (status === 'known') return 'border-slate-200/30 bg-[linear-gradient(135deg,rgba(148,163,184,0.24),rgba(15,23,42,0.88))] shadow-[0_0_36px_rgba(148,163,184,0.16)]'
  if (status === 'learning') return 'border-cyan-300/30 bg-slate-900/88 shadow-[0_0_34px_rgba(0,242,255,0.16)]'
  return 'border-white/10 bg-slate-950/88 shadow-[0_0_28px_rgba(15,23,42,0.45)]'
}

function inferRootHint(word: string) {
  if (word.includes('tion')) return 'tion / action'
  if (word.includes('sist')) return 'sist / stand'
  if (word.includes('loc')) return 'loc / place'
  if (word.includes('sess')) return 'sess / hold'
  return 'lex / semantic unit'
}

function buildRadarPoints(frequency: number) {
  return [
    { axis: '真题频度', value: frequency },
    { axis: '词根价值', value: Math.max(52, Math.min(96, frequency - 6)) },
    { axis: '阅读穿透', value: Math.max(48, Math.min(94, frequency + 4)) },
    { axis: '写作联动', value: Math.max(42, Math.min(88, frequency - 10)) },
  ]
}

function toFrequency(index: number) {
  return Math.max(58, 96 - (index % 12) * 3)
}

function ParticleBurst({ active }: { active: boolean }) {
  if (!active) return null

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[2rem]">
      {Array.from({ length: 18 }).map((_, index) => {
        const left = 12 + (index % 6) * 14
        const top = 12 + Math.floor(index / 6) * 26
        const x = (index % 2 === 0 ? 1 : -1) * (40 + (index % 5) * 16)
        const y = -90 + Math.floor(index / 3) * 26
        const rotate = -50 + index * 9

        return (
          <motion.span
            key={index}
            initial={{ opacity: 0.95, x: 0, y: 0, scale: 1, rotate: 0 }}
            animate={{ opacity: 0, x, y, scale: 0.2, rotate }}
            transition={{ duration: 0.45, ease: 'easeOut', delay: index * 0.01 }}
            className="absolute h-3 w-3 rounded-[4px] border border-cyan-200/40 bg-cyan-300/20 shadow-[0_0_16px_rgba(0,242,255,0.35)]"
            style={{ left: `${left}%`, top: `${top}%` }}
          />
        )
      })}
    </div>
  )
}

function TechLabModal({ word, onClose }: { word: TechModalWord | null; onClose: () => void }) {
  if (!word) return null

  const points = buildRadarPoints(word.frequency)
  const polygon = points
    .map((point, index) => {
      const angle = (Math.PI * 2 * index) / points.length - Math.PI / 2
      const radius = point.value * 0.8
      const x = 120 + Math.cos(angle) * radius
      const y = 120 + Math.sin(angle) * radius
      return `${x},${y}`
    })
    .join(' ')

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/78 p-6 backdrop-blur-sm">
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="glass-strong w-full max-w-4xl rounded-[2rem] border border-cyan-300/15 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-[0.35em] text-cyan-300/70">Combat Lab</div>
            <h2 className="mt-3 text-3xl font-black text-slate-50">{word.word}</h2>
            <p className="mt-2 max-w-xl text-sm leading-7 text-slate-400">词根科技树与真题考频雷达用于判断该词的战略价值与投入优先级。</p>
          </div>
          <button onClick={onClose} className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300">关闭</button>
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[1.5rem] border border-white/8 bg-white/5 p-5">
            <div className="text-xs uppercase tracking-[0.25em] text-slate-500">Root Tree</div>
            <div className="mt-5 space-y-4">
              <div className="rounded-2xl border border-cyan-300/15 bg-cyan-300/10 p-4">
                <div className="text-sm font-semibold text-cyan-100">词根核心</div>
                <div className="mt-2 text-2xl font-black text-slate-50">{word.rootHint}</div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {['semantic drift', 'academic transfer', 'reading recall', 'output stability'].map((node, index) => (
                  <div key={node} className="rounded-xl border border-white/8 bg-slate-950/50 p-4">
                    <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Node {index + 1}</div>
                    <div className="mt-2 text-sm font-semibold text-slate-200">{node}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-white/8 bg-white/5 p-5">
            <div className="text-xs uppercase tracking-[0.25em] text-slate-500">Frequency Radar</div>
            <div className="mt-5 flex items-center justify-center">
              <svg viewBox="0 0 240 240" className="h-72 w-72">
                {[30, 55, 80].map((radius) => (
                  <circle key={radius} cx="120" cy="120" r={radius} fill="none" stroke="rgba(148,163,184,0.14)" />
                ))}
                {points.map((point, index) => {
                  const angle = (Math.PI * 2 * index) / points.length - Math.PI / 2
                  const x = 120 + Math.cos(angle) * 86
                  const y = 120 + Math.sin(angle) * 86
                  return (
                    <g key={point.axis}>
                      <line x1="120" y1="120" x2={x} y2={y} stroke="rgba(148,163,184,0.18)" />
                      <text x={x} y={y} fill="rgba(226,232,240,0.86)" fontSize="10" textAnchor="middle">
                        {point.axis}
                      </text>
                    </g>
                  )
                })}
                <polygon points={polygon} fill="rgba(0,242,255,0.22)" stroke="rgba(0,242,255,0.72)" strokeWidth="2" />
              </svg>
            </div>
            <div className="rounded-2xl border border-white/8 bg-slate-950/50 p-4 text-sm text-slate-300">
              <div className="font-semibold text-slate-100">战略注解</div>
              <div className="mt-2 leading-7">{word.meaning ?? '暂无释义'}。该词的真题价值为 {word.frequency}/100，建议优先投入于阅读理解与作文输出联动。</div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

function WordbookMountModal({
  open,
  selectedExam,
  activeTier,
  onTierChange,
  onExamChange,
  onConfirm,
  mounting,
}: {
  open: boolean
  selectedExam: ExamType | null
  activeTier: WordTier
  onTierChange: (tier: WordTier) => void
  onExamChange: (exam: ExamType) => void
  onConfirm: () => void
  mounting: boolean
}) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center bg-slate-950/90 px-4 backdrop-blur-md">
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="glass-strong w-full max-w-4xl rounded-[2rem] border border-cyan-300/20 p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-[0.36em] text-cyan-300/70">SSA Mount Protocol</div>
            <h2 className="mt-3 text-3xl font-black text-slate-50">词书挂载确认</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400">进入战略勤务局前，请先完成词书挂载。系统将同步 GDP 映射、资产结构和前线词卡序列。</p>
          </div>
          <div className="rounded-xl border border-cyan-300/20 bg-cyan-300/10 px-3 py-2 text-xs text-cyan-100">入场拦截生效中</div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {CAMPAIGN_OPTIONS.map((option) => {
            const active = selectedExam === option.key
            return (
              <button
                key={option.key}
                type="button"
                onClick={() => onExamChange(option.key)}
                className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition ${active ? 'border-cyan-300/35 bg-cyan-300/12 text-cyan-100' : 'border-white/10 bg-white/5 text-slate-300 hover:border-cyan-300/20'}`}
              >
                {option.label}
              </button>
            )
          })}
        </div>

        <div className="mt-6 rounded-[1.5rem] border border-white/10 bg-slate-950/60 p-2">
          <div className="grid grid-cols-2 gap-2">
            {([
              { key: 'core' as const, label: '核心词汇', desc: '高频核心资产，优先用于稳住主战线。' },
              { key: 'full' as const, label: '总词汇', desc: '全量资产盘点，适合做总量扩张。' },
            ]).map((tab) => {
              const active = activeTier === tab.key
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => onTierChange(tab.key)}
                  className={`rounded-[1.2rem] px-4 py-4 text-left transition ${active ? 'border border-cyan-300/30 bg-[linear-gradient(135deg,rgba(34,211,238,0.22),rgba(8,47,73,0.45))]' : 'border border-white/8 bg-white/5 hover:border-cyan-300/18'}`}
                >
                  <div className="text-sm font-semibold text-slate-100">{tab.label}</div>
                  <div className="mt-2 text-xs leading-6 text-slate-400">{tab.desc}</div>
                </button>
              )
            })}
          </div>
        </div>

        <button
          type="button"
          onClick={onConfirm}
          disabled={!selectedExam || mounting}
          className="mt-6 w-full rounded-xl border border-cyan-300/25 bg-cyan-300/12 px-4 py-3 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-300/18 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {mounting ? '挂载中：正在同步资产面板...' : '确认挂载并进入 SSA'}
        </button>
      </motion.div>
    </div>
  )
}

function WingCard({ word, side }: { word: SsaWord | null; side: 'left' | 'right' }) {
  if (!word) {
    return <div className="hidden h-[24rem] w-[15rem] rounded-[2rem] border border-white/5 bg-white/[0.02] xl:block" />
  }

  return (
    <motion.div
      key={`${side}-${word.id}`}
      initial={{ opacity: 0, x: side === 'left' ? -60 : 60, scale: 0.78 }}
      animate={{ opacity: 0.35, x: 0, scale: 0.84 }}
      className="hidden h-[24rem] w-[15rem] rounded-[2rem] border border-white/8 bg-slate-950/70 p-5 text-slate-400 xl:block"
      style={{ transformOrigin: side === 'left' ? 'right center' : 'left center' }}
    >
      <div className="text-xs uppercase tracking-[0.32em]">待支援</div>
      <div className="mt-8 text-3xl font-black text-slate-300">{word.word}</div>
      <div className="mt-3 text-sm">{word.phonetic ?? 'phonetic pending'}</div>
      <div className="mt-8 h-px bg-white/8" />
      <div className="mt-6 text-xs uppercase tracking-[0.22em] text-slate-500">{side === 'left' ? 'Previous' : 'Next'} Cell</div>
    </motion.div>
  )
}

export function SsaCommandCenter() {
  const supabase = createClient()
  const {
    selectedExam,
    selectedWordTier,
    vocabularyGDP,
    activeBuffs,
    comboCount,
    targetGDP,
    currentGDP,
    ssaMountRequired,
    dailyWordTarget,
    reviewDeficit,
    registerSsaGain,
    syncWordAssets,
    syncReviewDeficitFromLearning,
    syncGdpMapping,
    initializeCampaign,
    setWordTier,
    setSsaMountRequired,
    updateReviewDeficit,
    syncSsaPoolMeta,
    setDailyWordTarget,
    _hasHydrated,
  } = useStudyModeStore()
  const [words, setWords] = useState<SsaWord[]>([])
  const [index, setIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [revealed, setRevealed] = useState(false)
  const [deploying, setDeploying] = useState(false)
  const [techLabWord, setTechLabWord] = useState<TechModalWord | null>(null)
  const [poolMeta, setPoolMeta] = useState({ loaded: 0, hasMore: false })
  const [mountModalOpen, setMountModalOpen] = useState(false)
  const [mountingBook, setMountingBook] = useState(false)
  const [pendingTier, setPendingTier] = useState<WordTier>('core')
  const [pendingExam, setPendingExam] = useState<ExamType | null>(null)
  const [hasMountedWordbook, setHasMountedWordbook] = useState(false)
  const [combatFeed, setCombatFeed] = useState<string[]>([
    '战略勤务局已接管前线序列。',
    '按 [Space] 翻译，按 [Enter/J] 占领，按 [Tab/K] 进入实验室。',
  ])
  const userIdRef = useRef<string | null>(null)
  const statusMapRef = useRef(new Map<number, { status: 'new' | 'learning' | 'known'; stability: number; difficulty: number; last_review: number; next_review: number }>())
  const flipStartRef = useRef<number | null>(null)
  const pendingUpdatesRef = useRef<Array<{ wordId: number; stability: number; difficulty: number; last_review: number; next_review: number }>>([])
  const reviewStatsRef = useRef({ dueCount: 0, totalLearned: 0, avgStability: 0 })
  const isSyncingRef = useRef(false)
  const reviewDeficitRef = useRef(reviewDeficit)
  const syncPendingReviewsRef = useRef<() => Promise<void>>(async () => {})
  const [reviewRating, setReviewRating] = useState<'perfect' | 'good' | 'hard' | 'forgot' | null>(null)
  const [manualOverride, setManualOverride] = useState(false)
  const [healFlash, setHealFlash] = useState(false)
  const [allWordbookWords, setAllWordbookWords] = useState<SsaWord[]>([])
  const [wordbookStats, setWordbookStats] = useState({ unseenCount: 0, dueCount: 0 })
  const [ttsPlaying, setTtsPlaying] = useState(false)

  // Keep reviewDeficitRef in sync so mountWordbook (a useCallback) can read the latest value
  useEffect(() => { reviewDeficitRef.current = reviewDeficit }, [reviewDeficit])

  const focused = words[index] ?? null
  const leftWing = words[index - 1] ?? null
  const rightWing = words[index + 1] ?? null

  const screenFilter = useMemo(() => {
    const contrast = 1 + activeBuffs.focusRate * 0.35
    const brightness = 1 + activeBuffs.memoryRate * 0.2
    return `contrast(${contrast}) brightness(${brightness}) saturate(1.08)`
  }, [activeBuffs.focusRate, activeBuffs.memoryRate])

  const reviewStats = useMemo(() => {
    const now = Date.now()
    // Use allWordbookWords so DUE/CR/STB stay consistent with StrategicStatusBar
    const source = allWordbookWords.length > 0 ? allWordbookWords : words
    const dueCount = source.filter(w => w.next_review > 0 && w.next_review <= now).length
    const learnedRecords = source.filter(w => w.status === 'known' || w.status === 'learning')
    const totalLearned = learnedRecords.length
    const avgStability = learnedRecords.length > 0
      ? learnedRecords.reduce((sum, w) => sum + w.stability, 0) / learnedRecords.length
      : 0
    const casualtyRate = totalLearned > 0 ? ((dueCount / totalLearned) * 100).toFixed(1) : '0.0'
    const estTime = Math.ceil(dueCount * 0.15)
    return {
      due: dueCount,
      cr: casualtyRate,
      est: estTime,
      stb: avgStability.toFixed(1),
    }
  }, [allWordbookWords, words])

  useEffect(() => {
    setMountModalOpen(ssaMountRequired)
    setPendingTier(selectedWordTier)
    setPendingExam(selectedExam)
  }, [ssaMountRequired, selectedWordTier, selectedExam])

  // Auto-reload words once Zustand has hydrated from localStorage
  const hasMountedRef = useRef(false)
  useEffect(() => {
    if (!_hasHydrated) return
    if (hasMountedRef.current) return
    hasMountedRef.current = true

    // Initialize words with fallback if needed
    if (words.length === 0) {
      setWords(getFallbackWords())
    }

    if (!ssaMountRequired && selectedExam) {
      void mountWordbook(selectedExam, selectedWordTier).then(() => setHasMountedWordbook(true))
    } else {
      // No wordbook selected yet — stop the loading spinner
      setLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [_hasHydrated])

  // Re-build session queue when daily target changes (only after a wordbook is mounted)
  const prevDailyTargetRef = useRef(dailyWordTarget)
  useEffect(() => {
    if (prevDailyTargetRef.current === dailyWordTarget) return
    prevDailyTargetRef.current = dailyWordTarget
    if (selectedExam && hasMountedWordbook) {
      void mountWordbook(selectedExam, selectedWordTier)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dailyWordTarget])

  function pushFeed(message: string) {
    setCombatFeed((current) => [message, ...current].slice(0, 18))
  }

  async function playTts(word: string) {
    if (ttsPlaying) return
    setTtsPlaying(true)
    try {
      const res = await fetch(`/api/tts?word=${encodeURIComponent(word)}`)
      if (!res.ok) return
      const buffer = await res.arrayBuffer()
      const ctx = new AudioContext()
      const decoded = await ctx.decodeAudioData(buffer)
      const source = ctx.createBufferSource()
      source.buffer = decoded
      source.connect(ctx.destination)
      source.onended = () => { setTtsPlaying(false); void ctx.close() }
      source.start()
    } catch {
      setTtsPlaying(false)
    }
  }

  const toSsaWord = useCallback((row: WordRow, absoluteIndex: number, wordType: 'review' | 'new' = 'new'): SsaWord => {
    const now = Date.now()
    const rec = statusMapRef.current.get(row.id)
    return {
      id: row.id,
      word: row.word,
      phonetic: row.phonetic ?? null,
      meaning: row.meaning ?? null,
      example: row.example ?? null,
      category: row.category ?? null,
      tier: (row.tier ?? 'full') as WordTier,
      status: rec?.status ?? 'new',
      wordType,
      frequency: toFrequency(absoluteIndex),
      rootHint: inferRootHint(row.word),
      stability: rec?.stability ?? 1,
      difficulty: rec?.difficulty ?? 1.5,
      last_review: rec?.last_review ?? 0,
      next_review: rec?.next_review ?? 0,
    }
  }, [])

  const persistStatus = useCallback(async (wordId: number, status: 'new' | 'learning' | 'known') => {
    const prev = statusMapRef.current.get(wordId)
    statusMapRef.current.set(wordId, { ...(prev ?? { stability: 1, difficulty: 1.5, last_review: 0, next_review: 0 }), status })
    if (!userIdRef.current) return
    const { error } = await supabase.from('word_records').upsert({ user_id: userIdRef.current, word_id: wordId, status, updated_at: new Date().toISOString() }, { onConflict: 'user_id,word_id' })
    if (error) pushFeed(`[警告] 状态写入失败 word_id=${wordId}: ${error.message}`)
  }, [supabase])

  const mountWordbook = useCallback(async (exam: ExamType, tier: WordTier) => {
    setLoading(true)
    setIndex(0)
    setRevealed(false)
    setDeploying(false)

    // Flush any pending SRS writes before querying, so DB reflects latest progress
    await syncPendingReviewsRef.current()

    const user = await getCurrentUser()
    userIdRef.current = user?.id ?? null

    // Replay any SRS updates that survived component unmount via SPA navigation.
    // handleMastered writes records synchronously to localStorage; syncPendingReviews
    // only flushes the in-memory pendingUpdatesRef which is lost on unmount.
    // Reading localStorage here ensures DB is up-to-date before we query it.
    if (user?.id) {
      const lsKey = `SSA_ACTIVE_SESSION_${user.id}`
      const stored = localStorage.getItem(lsKey)
      if (stored) {
        try {
          const records: Array<{ wordId: number; stability: number; difficulty: number; last_review: number; next_review: number }> = JSON.parse(stored)
          if (records.length > 0) {
            const supabaseFlush = createClient()
            const failedIds: number[] = []
            for (const r of records) {
              const { error } = await supabaseFlush.from('word_records').upsert({
                user_id: user.id,
                word_id: r.wordId,
                stability: r.stability,
                difficulty: r.difficulty,
                last_review: r.last_review,
                next_review: r.next_review,
                updated_at: new Date().toISOString(),
              }, { onConflict: 'user_id,word_id' })
              if (error) {
                failedIds.push(r.wordId)
                console.error('[SSA localStorage replay] upsert error', { wordId: r.wordId, error })
              }
            }
            if (failedIds.length === 0) {
              localStorage.removeItem(lsKey)
              pushFeed(`已从本地缓存恢复 ${records.length} 条 SRS 记录并同步至数据库。`)
            } else {
              pushFeed(`[警告] 本地缓存恢复失败 ${failedIds.length}/${records.length} 条。请检查控制台错误。`)
            }
          }
        } catch {
          // ignore malformed localStorage data
        }
      }
    }

    const supabase = createClient()
    const fallbackWords = getFallbackWords()
    const now = Date.now()
    const quota = dailyWordTarget

    // Step 1: load all words for this exam/tier
    let wordQuery = supabase
      .from('words')
      .select('id,word,phonetic,meaning,example,category,tier')
      .eq('category', exam)
      .order('id')
    if (tier === 'core') wordQuery = wordQuery.eq('tier', 'core')
    const { data: allWordRows, error: wordError } = await wordQuery

    if (wordError) {
      setWords(fallbackWords)
      setPoolMeta({ loaded: fallbackWords.length, hasMore: false })
      syncSsaPoolMeta({ loadedCount: fallbackWords.length, hasMore: false })
      pushFeed('线上词库接入失败，已降级到离线演示序列。')
      setLoading(false)
      return
    }

    const wordRows = allWordRows ?? []
    const wordMap = new Map(wordRows.map(w => [w.id, w as WordRow]))
    const allWordIds = [...wordMap.keys()]

    // Step 2: load per-user SRS records for this wordbook
    let statusMap = new Map<number, { status: 'new' | 'learning' | 'known'; stability: number; difficulty: number; last_review: number; next_review: number }>()
    let isNewToThisWordbook = false
    if (user && allWordIds.length) {
      const { data: recordRows, error: recordError } = await supabase
        .from('word_records')
        .select('word_id, status, stability, difficulty, last_review, next_review')
        .eq('user_id', user.id)
        .in('word_id', allWordIds)
      if (recordError) {
        pushFeed(`[诊断] word_records 读取失败: ${recordError.message} (code=${recordError.code})`)
        console.error('[SSA mountWordbook] word_records select error', recordError)
      }
      const rows = recordRows ?? []
      statusMap = new Map(rows.map(r => [r.word_id as number, {
        status: r.status as 'new' | 'learning' | 'known',
        stability: (r.stability as number) ?? 1,
        difficulty: (r.difficulty as number) ?? 1.5,
        last_review: (r.last_review as number) ?? 0,
        next_review: (r.next_review as number) ?? 0,
      }]))
      pushFeed(`[诊断] word_records 读取完成：共 ${rows.length} 条记录，user_id=${user.id.slice(0, 8)}…`)
      // Only "new to this wordbook" if not mid-sync, no error, and truly no records exist in DB
      isNewToThisWordbook = !isSyncingRef.current && !recordError && rows.length === 0
    }
    statusMapRef.current = statusMap

    // Step 3: separate due review words (next_review <= now) from unseen words
    const dueIds = allWordIds
      .filter(id => {
        const rec = statusMap.get(id)
        return rec && rec.next_review > 0 && rec.next_review <= now
      })
      .sort((a, b) => statusMap.get(a)!.next_review - statusMap.get(b)!.next_review)  // most overdue first

    const unseenIds = allWordIds.filter(id => !statusMap.has(id))

    // Step 4: build session queue — review words first, fill remainder with new words
    const reviewSlots = dueIds.slice(0, quota)
    const newSlots = unseenIds.slice(0, Math.max(0, quota - reviewSlots.length))

    const sessionQueue: SsaWord[] = [
      ...reviewSlots.map((id, i) => toSsaWord(wordMap.get(id)!, i, 'review')),
      ...newSlots.map((id, i) => toSsaWord(wordMap.get(id)!, reviewSlots.length + i, 'new')),
    ]

    const nextWords = sessionQueue.length ? sessionQueue : fallbackWords
    setWords(nextWords)
    setPoolMeta({ loaded: nextWords.length, hasMore: false })
    syncSsaPoolMeta({ loadedCount: nextWords.length, hasMore: false })

    // Build full wordbook word list for StrategicStatusBar (all words, not just session)
    const fullWordbookWords: SsaWord[] = wordRows.map((row, i) => toSsaWord(row as WordRow, i, statusMap.get(row.id)?.next_review && statusMap.get(row.id)!.next_review <= now ? 'review' : 'new'))
    setAllWordbookWords(fullWordbookWords)
    setWordbookStats({ unseenCount: unseenIds.length, dueCount: dueIds.length })

    // Sync GDP mapping based on all words in this wordbook
    const knownCount = [...statusMap.values()].filter(r => r.status === 'known').length
    syncGdpMapping({ targetGDP: allWordIds.length, currentGDP: knownCount })

    // Sync word assets
    const assets = wordRows.map((w, i) => {
      const rec = statusMap.get(w.id)
      return {
        id: w.id,
        word: w.word,
        category: w.category ?? 'general',
        tier: (w.tier ?? 'full') as WordTier,
        difficultyWeight: w.category === 'cet6' ? 1.35 : w.category?.startsWith('kaoyan') ? 1.65 : 1,
        masteryLevel: rec?.status === 'known' ? 0.92 : rec?.status === 'learning' ? 0.58 : 0.2,
        status: rec?.status ?? 'new',
      }
    })
    syncWordAssets(assets)

    // Compute review deficit
    const isFirstLaunch = isNewToThisWordbook
    if (isFirstLaunch) {
      updateReviewDeficit(0)
      pushFeed('检测到新账号/战略首次启动：今日赤字已强制初始化为 0。')
    } else {
      const learningCount = [...statusMap.values()].filter(r => r.status === 'learning').length
      const dailyDeficit = Math.max(0, quota - newSlots.length)
      const totalDeficit = learningCount * 3 + dailyDeficit
      updateReviewDeficit(totalDeficit)
      pushFeed(`今日赤字更新：复习积压 ${learningCount} 项 + 每日目标缺口 ${dailyDeficit} = ${totalDeficit} pts`)
    }

    // Compute review stats for the panel
    const totalLearned = [...statusMap.values()].filter(r => r.status === 'known' || r.status === 'learning').length
    const learnedRecords = [...statusMap.values()].filter(r => r.status === 'known' || r.status === 'learning')
    const avgStability = learnedRecords.length > 0
      ? learnedRecords.reduce((sum, r) => sum + r.stability, 0) / learnedRecords.length
      : 0
    reviewStatsRef.current = { dueCount: dueIds.length, totalLearned, avgStability }

    pushFeed(`词书挂载完成：${exam} / ${tier === 'core' ? '核心词汇' : '总词汇'}，复习 ${reviewSlots.length} + 新词 ${newSlots.length} = ${nextWords.length} 项。`)
    setLoading(false)
  }, [supabase, syncSsaPoolMeta, toSsaWord, syncWordAssets, syncGdpMapping, updateReviewDeficit, dailyWordTarget])

  async function handleConfirmWordbook() {
    if (!pendingExam) return
    setMountingBook(true)
    initializeCampaign(pendingExam)
    setWordTier(pendingTier)
    await mountWordbook(pendingExam, pendingTier)
    setHasMountedWordbook(true)
    setMountModalOpen(false)
    setSsaMountRequired(false)
    setMountingBook(false)
  }

  const syncPendingReviews = useCallback(async () => {
    if (pendingUpdatesRef.current.length === 0 || !userIdRef.current) return
    isSyncingRef.current = true
    const updates = [...pendingUpdatesRef.current]
    pendingUpdatesRef.current = []
    const supabase = createClient()
    try {
      const failedIds: number[] = []
      for (const u of updates) {
        const { error } = await supabase.from('word_records').upsert({
          user_id: userIdRef.current,
          word_id: u.wordId,
          stability: u.stability,
          difficulty: u.difficulty,
          last_review: u.last_review,
          next_review: u.next_review,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id,word_id' })
        if (error) {
          failedIds.push(u.wordId)
          console.error('[SSA syncPendingReviews] upsert error', { wordId: u.wordId, error })
        }
      }
      if (failedIds.length > 0) {
        pushFeed(`[警告] SRS 同步失败 ${failedIds.length} 条（word_ids: ${failedIds.slice(0, 5).join(',')}）。请检查 RLS 策略或网络连接。`)
      } else if (userIdRef.current) {
        localStorage.removeItem(`SSA_ACTIVE_SESSION_${userIdRef.current}`)
      }
    } finally {
      isSyncingRef.current = false
    }
  }, [])
  // Keep the ref current so mountWordbook can call it without a circular dependency
  syncPendingReviewsRef.current = syncPendingReviews

  useEffect(() => {
    const handleBeforeUnload = () => {
      void syncPendingReviews()
    }
    const handleVisibilityChange = () => {
      if (document.hidden) {
        void syncPendingReviews()
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      void syncPendingReviews()
      window.removeEventListener('beforeunload', handleBeforeUnload)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [syncPendingReviews])

  const handleMastered = useCallback(async (word: SsaWord) => {
    if (deploying) return
    setDeploying(true)
    setRevealed(false)

    const responseTime = flipStartRef.current ? Date.now() - flipStartRef.current : 3000
    flipStartRef.current = null
    const autoRating = rateFromResponseTime(responseTime)
    const finalRating = manualOverride && reviewRating ? reviewRating : autoRating
    setReviewRating(finalRating)

    const { stability, difficulty, next_review } = calculateNextReview(
      { stability: word.stability, difficulty: word.difficulty },
      finalRating,
    )
    const last_review = Date.now()

    // Update in-memory SRS cache
    statusMapRef.current.set(word.id, {
      status: finalRating === 'forgot' ? 'learning' : 'known',
      stability,
      difficulty,
      last_review,
      next_review,
    })

    const pendingRecord = { wordId: word.id, stability, difficulty, last_review, next_review }
    pendingUpdatesRef.current.push(pendingRecord)

    if (userIdRef.current) {
      const key = `SSA_ACTIVE_SESSION_${userIdRef.current}`
      const stored = localStorage.getItem(key)
      const records = stored ? JSON.parse(stored) : []
      records.push({ ...pendingRecord, synced: false })
      localStorage.setItem(key, JSON.stringify(records))
    }

    if (pendingUpdatesRef.current.length >= 5) {
      await syncPendingReviews()
    }

    const isForgot = finalRating === 'forgot'
    const isGraduated = !isForgot && stability >= GRADUATION_STABILITY
    const newStatus = isForgot ? ('learning' as const) : ('known' as const)
    const nextCombo = isForgot ? 0 : comboCount + 1
    const dailyCompleted = nextCombo >= 5
    const gain = isForgot ? 0 : Number((0.18 + word.frequency / 1000 + activeBuffs.gdpBonus * 0.6).toFixed(2))

    const updatedWord: SsaWord = { ...word, status: newStatus, wordType: 'review', stability, difficulty, last_review, next_review }

    // forgot → move word to end of queue; graduated → remove from session entirely
    let nextWords: SsaWord[]
    if (isForgot) {
      nextWords = [...words.filter(w => w.id !== word.id), updatedWord]
    } else if (isGraduated) {
      nextWords = words.filter(w => w.id !== word.id)
    } else {
      nextWords = words.map(item => item.id === word.id ? updatedWord : item)
    }

    setWords(nextWords)
    // Keep full wordbook in sync so StrategicStatusBar reflects real distribution
    setAllWordbookWords(prev => {
      const updated = prev.map(w => w.id === word.id ? { ...w, status: newStatus, stability, difficulty, last_review, next_review } : w)
      // Schedule GDP sync after render — cannot call Zustand set inside a React state updater
      window.setTimeout(() => {
        syncGdpMapping({
          targetGDP: updated.length,
          currentGDP: updated.filter(w => w.status === 'known').length,
        })
      }, 0)
      return updated
    })
    if (gain > 0) registerSsaGain(gain, { combo: nextCombo, dailyCompleted })
    syncReviewDeficitFromLearning(nextWords.filter(item => item.status === 'learning').length, { source: 'recon' })

    const ratingLabel = finalRating === 'perfect' ? '完美' : finalRating === 'good' ? '良好' : finalRating === 'hard' ? '困难' : '遗忘·重入队列'
    if (isGraduated) {
      pushFeed(`🎖 [ELITE] [${word.word}] 稳定性突破 ${stability.toFixed(0)}d — 已晋入战略储备库，永久锁定。`)
    } else {
      pushFeed(`[${word.word}] ${isForgot ? '遗忘 — 已加入队列末尾' : '已占领'} — ${ratingLabel} · 稳定性 ${stability.toFixed(1)}d${gain > 0 ? ` · GDP +${gain.toFixed(2)}%` : ''}`)
    }

    // Trigger heal flash when a review word is successfully conquered
    if (!isForgot && word.wordType === 'review') {
      setHealFlash(true)
      window.setTimeout(() => setHealFlash(false), 800)
    }
    await persistStatus(word.id, newStatus)

    setManualOverride(false)

    window.setTimeout(() => {
      setIndex(current => {
        if (isForgot) {
          // word removed from current pos and appended to end; next word is now at current index
          return current >= nextWords.length - 1 ? 0 : current
        }
        if (isGraduated) {
          // word removed entirely; stay at same index (next word slides in), or wrap if at end
          return nextWords.length === 0 ? 0 : Math.min(current, nextWords.length - 1)
        }
        if (current + 1 < nextWords.length) return current + 1
        return nextWords.length > 1 ? 0 : current
      })
      setDeploying(false)
      setReviewRating(null)
    }, 520)
  }, [activeBuffs.gdpBonus, comboCount, deploying, manualOverride, reviewRating, persistStatus, registerSsaGain, syncGdpMapping, syncReviewDeficitFromLearning, syncPendingReviews, words])

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (!focused || techLabWord || deploying) return

      if (event.code === 'Space') {
        event.preventDefault()
        if (!revealed) {
          flipStartRef.current = Date.now()
        }
        setRevealed((value) => !value)
      }

      if (event.key === 'Enter' || event.key.toLowerCase() === 'j') {
        event.preventDefault()
        void handleMastered(focused)
      }

      if (event.key.toLowerCase() === 'k') {
        event.preventDefault()
        if (!revealed) return
        const cycle = ['perfect', 'good', 'hard', 'forgot'] as const
        setReviewRating((prev) => {
          const currentIndex = prev ? cycle.indexOf(prev) : -1
          return cycle[(currentIndex + 1) % cycle.length]
        })
        setManualOverride(true)
        pushFeed(`评级手动调整为：${['完美','良好','困难','遗忘'][(['perfect','good','hard','forgot'].indexOf(reviewRating ?? '') + 1) % 4]}`)
      }

      if (event.key === 'Tab') {
        event.preventDefault()
        setTechLabWord({ word: focused.word, rootHint: focused.rootHint, frequency: focused.frequency, meaning: focused.meaning })
        pushFeed(`作战实验室已接入 [${focused.word}] 的词根科技树。`)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [focused, handleMastered, techLabWord, revealed, reviewRating, deploying])

  async function handleLearning(word: SsaWord) {
    const nextWords = words.map((item) => (item.id === word.id ? { ...item, status: 'learning' as const } : item))
    setWords(nextWords)
    setAllWordbookWords(prev => {
      const updated = prev.map(w => w.id === word.id ? { ...w, status: 'learning' as const } : w)
      window.setTimeout(() => {
        syncGdpMapping({
          targetGDP: updated.length,
          currentGDP: updated.filter(w => w.status === 'known').length,
        })
      }, 0)
      return updated
    })
    syncReviewDeficitFromLearning(nextWords.filter((item) => item.status === 'learning').length, { source: 'recon' })
    pushFeed(`词汇 [${word.word}] 已进入侦察推进状态。`)
    await persistStatus(word.id, 'learning')
  }

  // Wait for Zustand hydration before rendering
  if (!_hasHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-cyan-300/20 border-t-cyan-300 mx-auto" />
          <p className="text-sm text-slate-400">Initializing SSA Command Center...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <WordbookMountModal
        open={mountModalOpen}
        selectedExam={pendingExam}
        activeTier={pendingTier}
        onTierChange={setPendingTier}
        onExamChange={setPendingExam}
        onConfirm={handleConfirmWordbook}
        mounting={mountingBook}
      />

      <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden" style={{ filter: screenFilter }}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(0,242,255,0.12),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.08),transparent_28%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:32px_32px] opacity-30" />

        <div className="relative z-10 flex min-h-[calc(100vh-4rem)] flex-col">
          <section className="border-b border-cyan-300/10 bg-slate-950/55 px-5 py-5 backdrop-blur-xl md:px-8 md:py-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="text-xs uppercase tracking-[0.4em] text-cyan-300/70">Strategic Service Agency</div>
                <h1 className="mt-3 text-3xl font-black text-slate-50 md:text-5xl">战略勤务局</h1>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-400">沉浸式词汇作战中心。当前战区遵循 {selectedWordTier === 'core' ? '核心词汇' : '总词汇'} 调度，按键即可完成翻译、占领与科技树分析。</p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                    <div className="text-[10px] uppercase tracking-[0.3em] text-slate-500">词书切换</div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {CAMPAIGN_OPTIONS.map((option) => {
                        const active = selectedExam === option.key
                        return (
                          <button
                            key={option.key}
                            type="button"
                            onClick={() => {
                              initializeCampaign(option.key)
                              setPendingExam(option.key)
                              void mountWordbook(option.key, selectedWordTier).then(() => {
                                setSsaMountRequired(false)
                                if (userIdRef.current) void saveStudyModeProfile(userIdRef.current).catch(() => {}).catch(() => {})
                              })
                            }}
                            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${active ? 'border border-cyan-300/25 bg-cyan-300/15 text-cyan-100' : 'border border-white/10 bg-white/5 text-slate-400 hover:border-cyan-300/20 hover:text-cyan-100'}`}
                          >
                            {option.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                    <div className="text-[10px] uppercase tracking-[0.3em] text-slate-500">词库层级</div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {[
                        { key: 'core' as const, label: '核心词汇' },
                        { key: 'full' as const, label: '总词汇' },
                      ].map((option) => {
                        const active = selectedWordTier === option.key
                        return (
                          <button
                            key={option.key}
                            type="button"
                            onClick={() => {
                              setWordTier(option.key)
                              setPendingTier(option.key)
                              if (selectedExam) void mountWordbook(selectedExam, option.key).then(() => {
                                setSsaMountRequired(false)
                                if (userIdRef.current) void saveStudyModeProfile(userIdRef.current).catch(() => {}).catch(() => {})
                              })
                            }}
                            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${active ? 'border border-fuchsia-300/25 bg-fuchsia-300/15 text-fuchsia-100' : 'border border-white/10 bg-white/5 text-slate-400 hover:border-fuchsia-300/20 hover:text-fuchsia-100'}`}
                          >
                            {option.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Link href="/dashboard" className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-cyan-300/25 hover:bg-cyan-300/10 hover:text-cyan-100">返回指挥部</Link>
                <div className="rounded-[1.25rem] border border-cyan-300/15 bg-cyan-300/10 px-4 py-3 text-right">
                  <div className="text-xs uppercase tracking-[0.25em] text-cyan-200/75">Vocabulary GDP</div>
                  <div className="mt-2 text-3xl font-black text-slate-50">{vocabularyGDP.toFixed(2)}</div>
                  <div className="mt-2 text-xs text-cyan-100/80">Current/Target GDP: {currentGDP}/{targetGDP}</div>
                </div>
              </div>
            </div>
          </section>

          <section className="grid flex-1 gap-0 xl:grid-cols-[minmax(0,1.3fr)_420px]">
            <div className="flex min-h-[520px] flex-col border-b border-white/8 px-4 py-5 md:px-8 md:py-8 xl:border-b-0 xl:border-r">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-xs uppercase tracking-[0.35em] text-cyan-300/70">Combat Sequence</div>
                  <div className="mt-2 text-lg font-bold text-slate-50">词汇歼灭序列</div>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Space 翻译 / Enter-J 占领 / K 调级 / Tab 实验室</span>
                  <span className="rounded-full border border-cyan-300/10 bg-cyan-300/5 px-3 py-1 text-cyan-100">已装载 {poolMeta.loaded}</span>
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">{poolMeta.hasMore ? '可继续增援' : '已抵达战区末端'}</span>
                </div>
              </div>

              {loading ? (
                <div className="flex flex-1 items-center justify-center rounded-[1.75rem] border border-white/8 bg-white/5 text-slate-400">正在调度前线词汇资产...</div>
              ) : (
                <div className="relative flex flex-1 items-center justify-center overflow-hidden rounded-[2rem] border border-cyan-300/10 bg-[radial-gradient(circle_at_center,rgba(0,242,255,0.08),transparent_46%)] px-3 py-6 md:px-8">
                  <div className="absolute inset-y-0 left-0 w-24 bg-[linear-gradient(to_right,rgba(2,6,23,0.9),transparent)]" />
                  <div className="absolute inset-y-0 right-0 w-24 bg-[linear-gradient(to_left,rgba(2,6,23,0.9),transparent)]" />
                  <div className="relative z-10 flex w-full items-center justify-center gap-5 xl:gap-8">
                    <WingCard word={leftWing} side="left" />

                    <div className="relative flex h-[31rem] w-full max-w-[28rem] items-center justify-center md:h-[33rem] md:max-w-[30rem]">
                      <AnimatePresence mode="wait">
                        {focused ? (
                          <motion.div
                            key={focused.id}
                            initial={{ opacity: 0, scale: 0.78, y: 72, z: -160, rotateX: 18 }}
                            animate={{ opacity: 1, scale: 1, y: 0, z: 0, rotateX: 0 }}
                            exit={{ opacity: 0, scale: 0.7, y: -34, z: 100, rotateZ: deploying ? 10 : 0, filter: 'blur(14px)' }}
                            transition={{ duration: 0.52, ease: [0.2, 1, 0.32, 1] }}
                            style={{ transformStyle: 'preserve-3d', perspective: 1400 }}
                            className={`relative h-[29rem] w-full rounded-[2rem] border p-6 md:h-[31rem] md:p-7 ${statusShell(focused.status)}`}
                          >
                            <motion.div animate={{ opacity: [0.32, 0.75, 0.32] }} transition={{ duration: 2.4, repeat: Infinity }} className="absolute inset-0 rounded-[2rem] border border-cyan-300/20 shadow-[0_0_32px_rgba(0,242,255,0.14)]" />
                            <motion.div animate={{ opacity: [0.18, 0.36, 0.18] }} transition={{ duration: 4, repeat: Infinity }} className="absolute inset-x-8 top-0 h-28 bg-[linear-gradient(to_bottom,rgba(0,242,255,0.24),transparent)] blur-2xl" />
                            <ParticleBurst active={deploying} />

                            <div className="relative z-10 flex h-full flex-col justify-between">
                              <div className="flex items-center justify-between gap-3">
                                <span className="rounded-full border border-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-slate-300">{toStatusLabel(focused.status)}</span>
                                {focused.wordType === 'review'
                                  ? <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-amber-300">[Reinforce]</span>
                                  : <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-cyan-300">[Scout]</span>
                                }
                                <div className="text-right">
                                  <div className="text-[10px] uppercase tracking-[0.28em] text-cyan-300/70">Current Target</div>
                                  <div className="mt-1 text-xs text-cyan-300/80">Freq {focused.frequency}</div>
                                </div>
                              </div>

                              <motion.div animate={{ rotateY: revealed ? 180 : 0 }} transition={{ duration: 0.45 }} style={{ transformStyle: 'preserve-3d' }} className="relative mt-6 flex-1">
                                <div className="absolute inset-0 [backface-visibility:hidden]">
                                  <div className="mt-10 text-center md:mt-12">
                                    <div className="text-4xl font-black tracking-[0.04em] text-slate-50 md:text-6xl">{focused.word}</div>
                                    <div className="mt-4 flex items-center justify-center gap-3">
                                      <span className="text-base text-slate-400 md:text-lg">{focused.phonetic ?? 'phonetic pending'}</span>
                                      <button
                                        type="button"
                                        onClick={() => void playTts(focused.word)}
                                        disabled={ttsPlaying}
                                        className="flex h-8 w-8 items-center justify-center rounded-full border border-cyan-400/30 bg-cyan-400/10 text-cyan-300 transition hover:bg-cyan-400/20 disabled:opacity-40"
                                        title="点读发音"
                                      >
                                        {ttsPlaying ? (
                                          <svg className="h-4 w-4 animate-pulse" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" /></svg>
                                        ) : (
                                          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" /></svg>
                                        )}
                                      </button>
                                    </div>
                                  </div>
                                  <div className="mt-12 rounded-[1.5rem] border border-white/8 bg-white/5 p-5 text-sm leading-7 text-slate-300">
                                    当前目标保持加密状态。按 <span className="text-cyan-200">Space</span> 展开释义，按 <span className="text-cyan-200">Enter / J</span> 执行占领。
                                  </div>
                                  <div className="mt-5 grid grid-cols-3 gap-3 text-center text-xs text-slate-500">
                                    <div className="rounded-xl border border-white/8 bg-slate-950/35 px-3 py-2">前线词卡</div>
                                    <div className="rounded-xl border border-white/8 bg-slate-950/35 px-3 py-2">焦点战位</div>
                                    <div className="rounded-xl border border-white/8 bg-slate-950/35 px-3 py-2">资产化回流</div>
                                  </div>
                                </div>
                                <div className="absolute inset-0 rounded-[1.5rem] border border-cyan-300/15 bg-slate-950/75 p-5 [backface-visibility:hidden] [transform:rotateY(180deg)]">
                                  <div className="text-xs uppercase tracking-[0.28em] text-cyan-300/70">Decoded Intel</div>
                                  <div className="mt-4 text-2xl font-black text-slate-50">{focused.meaning ?? '暂无释义'}</div>
                                  <div className="mt-5 text-sm leading-7 text-slate-400">{focused.example ?? '暂无例句'}</div>
                                  <div className="mt-5 rounded-xl border border-fuchsia-300/15 bg-fuchsia-300/10 px-4 py-3 text-sm text-fuchsia-100">词根科技：{focused.rootHint}</div>
                                </div>
                              </motion.div>

                              {revealed && (
                                <div className="absolute bottom-[4.5rem] left-1/2 -translate-x-1/2">
                                  <RatingBadge rating={reviewRating} manualOverride={manualOverride} />
                                </div>
                              )}
                              <div className="grid grid-cols-3 gap-3">
                                <button
                                  onClick={() => {
                                    if (!revealed) flipStartRef.current = Date.now()
                                    setRevealed((value) => !value)
                                  }}
                                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-sm font-semibold text-slate-200"
                                >Space 翻译</button>
                                <button onClick={() => void handleMastered(focused)} className="rounded-xl border border-cyan-300/20 bg-cyan-300/10 px-3 py-3 text-sm font-semibold text-cyan-100">Enter / J 歼灭</button>
                                <button
                                  onClick={() => {
                                    if (!revealed) return
                                    const cycle = ['perfect', 'good', 'hard', 'forgot'] as const
                                    setReviewRating((prev) => {
                                      const i = prev ? cycle.indexOf(prev) : -1
                                      return cycle[(i + 1) % cycle.length]
                                    })
                                    setManualOverride(true)
                                  }}
                                  className="rounded-xl border border-fuchsia-300/20 bg-fuchsia-300/10 px-3 py-3 text-sm font-semibold text-fuchsia-100"
                                >K 调级</button>
                              </div>
                            </div>
                          </motion.div>
                        ) : null}
                      </AnimatePresence>
                    </div>

                    <WingCard word={rightWing} side="right" />
                  </div>

                </div>
              )}

              <div className="mt-6 px-4 md:px-8">
                <StrategicStatusBar words={allWordbookWords.length > 0 ? allWordbookWords : words} currentWordId={focused?.id} healFlash={healFlash} />
              </div>
            </div>

            <aside className="flex flex-col gap-6 px-4 py-5 md:px-8 md:py-8 xl:px-6">
              <section className="glass rounded-[2rem] border border-white/10 p-6">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs uppercase tracking-[0.35em] text-cyan-300/70">Combat Feed</div>
                    <div className="mt-2 text-lg font-bold text-slate-50">实时战报流</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={async () => {
                        const user = await getCurrentUser()
                        if (!user) { pushFeed('[诊断] getCurrentUser 返回 null — 未登录或 session 失效'); return }
                        pushFeed(`[诊断] user.id = ${user.id}`)
                        const sb = createClient()
                        // Test read
                        const { data: readData, error: readErr } = await sb.from('word_records').select('id').eq('user_id', user.id).limit(1)
                        if (readErr) pushFeed(`[诊断] READ 失败: ${readErr.message} (${readErr.code})`)
                        else pushFeed(`[诊断] READ 成功，返回 ${readData?.length ?? 0} 条`)
                        // Test write (upsert a dummy record with word_id=1)
                        const { error: writeErr } = await sb.from('word_records').upsert({ user_id: user.id, word_id: 1, status: 'new', updated_at: new Date().toISOString() }, { onConflict: 'user_id,word_id' })
                        if (writeErr) pushFeed(`[诊断] WRITE 失败: ${writeErr.message} (${writeErr.code})`)
                        else pushFeed('[诊断] WRITE 成功 ✓')
                      }}
                      className="rounded-full border border-yellow-300/20 bg-yellow-300/10 px-3 py-1 text-xs text-yellow-200 hover:bg-yellow-300/20"
                    >诊断 DB</button>
                    <div className="rounded-full border border-rose-300/15 bg-rose-300/10 px-3 py-1 text-xs text-rose-100">赤字警戒 {words.filter((word) => word.status === 'learning').length}</div>
                  </div>
                </div>
                <div className="mt-5 h-[18rem] overflow-hidden rounded-[1.5rem] border border-white/8 bg-[#020617] p-4 font-mono text-sm xl:h-[22rem]">
                  <div className="h-full space-y-3 overflow-y-auto pr-2 text-slate-300">
                    {combatFeed.map((line, lineIndex) => (
                      <motion.div key={`${line}-${lineIndex}`} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} className="border-b border-white/6 pb-3">
                        {line}
                      </motion.div>
                    ))}
                  </div>
                </div>
              </section>

              <section className="glass rounded-[2rem] border border-white/10 p-6">
                <div className="text-xs uppercase tracking-[0.35em] text-cyan-300/70">Daily Target</div>
                <div className="mt-2 text-lg font-bold text-slate-50">每日单词目标</div>
                <div className="mt-4 space-y-4">
                  <div>
                    <label className="text-sm text-slate-400">每日背诵单词数</label>
                    <input
                      type="number"
                      min="1"
                      max="200"
                      value={dailyWordTarget}
                      onChange={(e) => setDailyWordTarget(Number(e.target.value))}
                      className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950/50 px-4 py-3 text-lg font-bold text-slate-100 focus:border-cyan-300/30 focus:outline-none"
                    />
                  </div>
                  {selectedExam && wordbookStats.unseenCount > 0 && (
                    <div className="rounded-xl border border-emerald-300/15 bg-emerald-300/10 p-4">
                      <div className="text-sm text-emerald-100/80">预计完成天数</div>
                      <div className="mt-2 text-3xl font-black text-white">
                        {Math.ceil(wordbookStats.unseenCount / Math.max(1, dailyWordTarget - wordbookStats.dueCount))} 天
                      </div>
                      <div className="mt-2 text-xs text-emerald-100/60">
                        未学 {wordbookStats.unseenCount} 词 ÷ 每日新词 {Math.max(1, dailyWordTarget - wordbookStats.dueCount)} 个/天
                        {wordbookStats.dueCount > 0 && <span className="ml-1 text-amber-300/80">+ 需要复习 {wordbookStats.dueCount} 词</span>}
                      </div>
                    </div>
                  )}
                  <div className="rounded-xl border border-white/8 bg-slate-950/50 px-4 py-3 text-xs leading-6 text-slate-400">
                    每日单词目标将影响今日赤字和 GDP 的计算。建议根据自己的时间和能力合理设置。
                  </div>
                </div>
              </section>

              <section className="glass rounded-[2rem] border border-white/10 p-6">
                <div className="text-xs uppercase tracking-[0.35em] text-slate-500">Review Status</div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {[
                    ['DUE', reviewStats.due, reviewStats.due > 0 ? 'text-cyan-300' : 'text-emerald-300'],
                    ['CR', `${reviewStats.cr}%`, 'text-amber-300'],
                    ['EST', `${reviewStats.est}m`, 'text-slate-300'],
                    ['STB', `${reviewStats.stb}d`, 'text-blue-300'],
                  ].map(([label, value, colorClass]) => (
                    <div key={label} className="rounded-2xl border border-white/8 bg-white/5 p-4">
                      <div className="text-sm text-slate-500">{label}</div>
                      <div className={`mt-2 text-2xl font-black ${colorClass} ${label === 'DUE' && reviewStats.due > 0 ? 'animate-pulse' : ''}`}>{value}</div>
                      {label === 'DUE' && reviewStats.due === 0 && <div className="mt-1 text-[10px] uppercase tracking-wider text-emerald-400">[SECURED]</div>}
                    </div>
                  ))}
                </div>
                <div className="mt-4 rounded-2xl border border-cyan-300/10 bg-cyan-300/5 px-4 py-3 text-xs leading-6 text-slate-400">
                  DUE: 待复习词数 · CR: 战损率 (到期/已学) · EST: 预计耗时 · STB: 全局稳定性
                </div>
              </section>
            </aside>
          </section>
        </div>
      </div>

      <AnimatePresence>
        {techLabWord ? <TechLabModal word={techLabWord} onClose={() => setTechLabWord(null)} /> : null}
      </AnimatePresence>
    </>
  )
}













