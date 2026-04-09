'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  BadgeAlert,
  BrainCircuit,
  BriefcaseBusiness,
  ChevronRight,
  Gauge,
  Lock,
  ShieldAlert,
  Sparkles,
  TrendingUp,
} from 'lucide-react'
import { getCurrentUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/client'
import { saveStudyModeProfile } from '@/lib/studyModePersistence'
import { SelectionModal } from '@/components/study-mode/SelectionModal'
import { StrategyLawPanel } from '@/components/study-mode/StrategyLawPanel'
import { type ExamType, type LawKey, type WordAsset, type WordTier, useStudyModeStore } from '@/stores/useStudyModeStore'
import { calcGDP } from '@/utils/calcGDP'

type WordRow = {
  id: number
  word: string
  meaning: string | null
  phonetic: string | null
  category: string | null
  tier: WordTier | null

}

type AssetBucket = {
  key: string
  label: string
  total: number
  mastered: number
  fading: number
  risk: number
  masteryRate: number
  weight: number
}

type ForecastPoint = {
  label: string
  historical: number
  projected: number
}

const tierMeta: Record<WordTier, { label: string; desc: string }> = {
  core: { label: '核心词汇', desc: '精锐资产池，优先保障高频战术价值。' },
  full: { label: '总词汇', desc: '完整资产池，适合宏观扩张与纵深储备。' },
}

const examMeta: Record<ExamType, string> = {
  cet4: 'CET-4 基础建设',
  cet6: 'CET-6 全面扩张',
  kaoyan: '考研英语 核心攻坚',
}

const bucketPalette = {
  mastered: '#0f8f6f',
  fading: '#d97706',
  risk: '#dc2626',
}

function masteryFromStatus(status: 'new' | 'learning' | 'known') {
  if (status === 'known') return 0.92
  if (status === 'learning') return 0.56
  return 0.18
}

function difficultyFromCategory(category?: string | null) {
  if (!category) return 1
  if (category === 'cet6') return 1.28
  if (category === 'kaoyan') return 1.62
  return 1
}

function classifyWord(word: string, meaning: string | null) {
  const safeWord = word.toLowerCase()
  const safeMeaning = (meaning ?? '').toLowerCase()

  if (safeWord.endsWith('ize') || safeWord.endsWith('ify') || safeMeaning.includes('使') || safeMeaning.includes('化')) {
    return 'Core Verbs'
  }
  if (safeWord.endsWith('tion') || safeWord.endsWith('ment') || safeWord.endsWith('ity') || safeWord.endsWith('ness')) {
    return 'Academic Nouns'
  }
  if (safeWord.endsWith('ive') || safeWord.endsWith('al') || safeWord.endsWith('ous') || safeWord.endsWith('ful')) {
    return 'Strategic Adjectives'
  }
  if (safeWord.includes('milit') || safeWord.includes('war') || safeMeaning.includes('军事') || safeMeaning.includes('战')) {
    return 'Military Terms'
  }
  if (safeWord.endsWith('ly')) {
    return 'Operational Adverbs'
  }
  return 'High-Frequency Reserve'
}

function buildBuckets(rows: WordRow[], statusMap: Map<number, 'new' | 'learning' | 'known'>): AssetBucket[] {
  const buckets = new Map<string, AssetBucket>()

  rows.forEach((row) => {
    const key = classifyWord(row.word, row.meaning)
    const status = statusMap.get(row.id) ?? 'new'
    const current = buckets.get(key) ?? {
      key,
      label: key === 'Core Verbs' ? '核心动词' : key === 'Academic Nouns' ? '学术名词' : key === 'Strategic Adjectives' ? '战略形容词' : key === 'Military Terms' ? '军事术语' : key === 'Operational Adverbs' ? '行动副词' : '高频储备',
      total: 0,
      mastered: 0,
      fading: 0,
      risk: 0,
      masteryRate: 0,
      weight: 0,
    }

    current.total += 1
    if (status === 'known') current.mastered += 1
    else if (status === 'learning') current.fading += 1
    else current.risk += 1
    buckets.set(key, current)
  })

  return Array.from(buckets.values())
    .map((bucket) => ({
      ...bucket,
      masteryRate: bucket.total > 0 ? Math.round((bucket.mastered / bucket.total) * 100) : 0,
      weight: Math.max(1, bucket.total),
    }))
    .sort((a, b) => b.total - a.total)
}

function buildForecast(baseGDP: number, buffs: number) {
  const anchors = ['D-6', 'D-5', 'D-4', 'D-3', 'D-2', 'D-1', '今日']
  return anchors.map((label, index) => {
    const historical = Math.round(baseGDP * (0.72 + index * 0.045))
    const projected = index < anchors.length - 2
      ? historical
      : Math.round(historical * (1 + buffs + 0.04 * (index - 4)))
    return { label, historical, projected }
  })
}

function buildPath(points: number[], width: number, height: number) {
  if (!points.length) return ''
  const max = Math.max(...points)
  const min = Math.min(...points)
  const span = Math.max(1, max - min)
  return points
    .map((point, index) => {
      const x = (index / Math.max(1, points.length - 1)) * width
      const y = height - ((point - min) / span) * height
      return `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`
    })
    .join(' ')
}

function SemiGauge({ value, disabled = false }: { value: number; disabled?: boolean }) {
  const clamped = Math.max(0, Math.min(100, value))
  const radius = 72
  const circumference = Math.PI * radius
  const offset = circumference * (1 - clamped / 100)

  return (
    <div className="relative flex items-center justify-center">
      <svg width="190" height="118" viewBox="0 0 190 118" className="overflow-visible">
        <path d="M 23 95 A 72 72 0 0 1 167 95" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="14" strokeLinecap="round" />
        <motion.path
          d="M 23 95 A 72 72 0 0 1 167 95"
          fill="none"
          stroke={disabled ? 'rgba(148,163,184,0.35)' : 'url(#memoryGauge)'}
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.1, ease: 'easeOut' }}
        />
        <defs>
          <linearGradient id="memoryGauge" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#06b6d4" />
            <stop offset="55%" stopColor="#14b8a6" />
            <stop offset="100%" stopColor="#f59e0b" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute top-9 text-center">
        <div className="text-3xl font-black text-slate-50">{disabled ? 'N/A' : `${clamped}%`}</div>
        <div className="mt-1 text-[11px] uppercase tracking-[0.28em] text-cyan-300/70">记忆稳态</div>
      </div>
    </div>
  )
}

function AssetDistribution({ buckets, isInitialized }: { buckets: AssetBucket[]; isInitialized: boolean }) {
  const total = buckets.reduce((sum, bucket) => sum + bucket.total, 0) || 1

  return (
    <section className="glass rounded-[1.75rem] border border-white/10 p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.3em] text-cyan-300/70">Asset Distribution</div>
          <h3 className="mt-2 text-xl font-black text-slate-50">资产结构分布</h3>
        </div>
        <BriefcaseBusiness className="h-5 w-5 text-cyan-300" />
      </div>
      {isInitialized ? (
        <>
          <div className="mt-5 grid min-h-[21rem] grid-cols-12 gap-3">
            {buckets.slice(0, 6).map((bucket, index) => {
              const width = Math.max(3, Math.round((bucket.total / total) * 12))
              const riskColor = bucket.risk >= bucket.mastered ? bucketPalette.risk : bucket.fading > 0 ? bucketPalette.fading : bucketPalette.mastered
              return (
                <motion.div
                  key={bucket.key}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.06 }}
                  className="relative overflow-hidden rounded-[1.35rem] border border-white/8 p-4"
                  style={{
                    gridColumn: `span ${Math.min(12, width)}`,
                    background: `linear-gradient(135deg, ${riskColor}22, rgba(8,15,20,0.92))`,
                  }}
                >
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.12),transparent_38%)]" />
                  <div className="relative z-10 flex h-full flex-col justify-between">
                    <div>
                      <div className="text-xs uppercase tracking-[0.2em] text-slate-400">{bucket.label}</div>
                      <div className="mt-2 text-2xl font-black text-slate-50">{bucket.total}</div>
                    </div>
                    <div className="space-y-1 text-xs text-slate-300">
                      <div>掌握资产 {bucket.mastered}</div>
                      <div>衰减资产 {bucket.fading}</div>
                      <div>风险资产 {bucket.risk}</div>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
          <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-400">
            <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ background: bucketPalette.mastered }} />已掌握</div>
            <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ background: bucketPalette.fading }} />正在衰减</div>
            <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ background: bucketPalette.risk }} />高危坏账</div>
          </div>
        </>
      ) : (
        <div className="mt-5 flex min-h-[21rem] items-center justify-center rounded-[1.5rem] border border-dashed border-cyan-400/20 bg-slate-950/40 p-6 text-center">
          <div>
            <Lock className="mx-auto h-8 w-8 text-slate-500" />
            <div className="mt-4 text-sm font-semibold text-slate-200">情报分析已锁定</div>
            <div className="mt-2 text-sm leading-6 text-slate-400">需完成首次部署以解锁资产分布情报。</div>
          </div>
        </div>
      )}
    </section>
  )
}

function GrowthForecast({ points, buffRate, isInitialized }: { points: ForecastPoint[]; buffRate: number; isInitialized: boolean }) {
  const historical = points.map((point) => point.historical)
  const projected = points.map((point) => point.projected)
  const pathHistorical = buildPath(historical, 560, 180)
  const pathProjected = buildPath(projected, 560, 180)

  return (
    <section className="glass rounded-[1.75rem] border border-white/10 p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.3em] text-cyan-300/70">Projected Vocabulary GDP</div>
          <h3 className="mt-2 text-xl font-black text-slate-50">词汇 GDP 预测曲线</h3>
        </div>
        <div className="rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1 text-xs text-amber-100">当前 Buff 推演 +{Math.round(buffRate * 100)}%</div>
      </div>
      <div className="relative mt-5 overflow-hidden rounded-[1.5rem] border border-white/8 bg-[linear-gradient(180deg,rgba(34,211,238,0.06),rgba(13,13,13,0.8))] p-4">
        <svg viewBox="0 0 560 220" className="h-[18rem] w-full">
          {[0, 1, 2, 3].map((row) => (
            <line key={row} x1="0" x2="560" y1={20 + row * 50} y2={20 + row * 50} stroke="rgba(255,255,255,0.06)" />
          ))}
          {points.map((point, index) => {
            const x = (index / Math.max(1, points.length - 1)) * 560
            return (
              <g key={point.label}>
                <line x1={x} x2={x} y1="10" y2="200" stroke="rgba(255,255,255,0.04)" />
                <text x={x} y="214" textAnchor="middle" fill="rgba(148,163,184,0.85)" fontSize="11">{point.label}</text>
              </g>
            )
          })}
          <motion.path d={pathHistorical} fill="none" stroke={isInitialized ? '#22d3ee' : 'rgba(148,163,184,0.55)'} strokeWidth="4" strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.2 }} />
          {isInitialized ? <motion.path d={pathProjected} fill="none" stroke="#f59e0b" strokeWidth="3" strokeDasharray="8 8" strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.4, delay: 0.15 }} /> : null}
        </svg>
        {!isInitialized ? (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-950/55 backdrop-blur-[2px]">
            <div className="rounded-[1.25rem] border border-white/10 bg-slate-950/80 px-5 py-4 text-center">
              <Lock className="mx-auto h-7 w-7 text-slate-400" />
              <div className="mt-3 text-sm font-semibold text-slate-200">需完成首次部署以解锁情报分析</div>
              <div className="mt-1 text-xs text-slate-400">当前仅显示零状态基线。</div>
            </div>
          </div>
        ) : null}
      </div>
      <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-400">
        <div className="flex items-center gap-2"><span className="h-0.5 w-6 bg-cyan-300" />{isInitialized ? '历史增长' : '零状态基线'}</div>
        {isInitialized ? <div className="flex items-center gap-2"><span className="h-0.5 w-6 border-t border-dashed border-amber-300" />法案加成预测</div> : null}
      </div>
    </section>
  )
}
function RiskAnalysis({ buckets, onAction }: { buckets: AssetBucket[]; onAction: (label: string) => void }) {
  const alerts = buckets
    .filter((bucket) => bucket.risk > 0 || bucket.fading > 0)
    .slice(0, 4)
    .map((bucket) => ({
      title: `${bucket.label} 出现战略衰减`,
      detail: `${Math.max(bucket.risk, bucket.fading)}% 资产处于不稳定区，建议立即回补。`,
      level: bucket.risk > bucket.fading ? '高危' : '观察',
    }))

  const actions = [
    '追加高频动词再投资',
    '重启学术名词巩固方案',
    '签署衰减冻结法案',
  ]

  return (
    <section className="glass rounded-[1.75rem] border border-white/10 p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.3em] text-amber-300/70">Strategic Risk Analysis</div>
          <h3 className="mt-2 text-xl font-black text-slate-50">战略风险分析</h3>
        </div>
        <ShieldAlert className="h-5 w-5 text-amber-300" />
      </div>
      <div className="mt-5 space-y-3">
        {alerts.length ? alerts.map((alert, index) => (
          <div key={alert.title} className="rounded-[1.25rem] border border-amber-300/15 bg-amber-300/10 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-amber-100">{alert.title}</div>
                <div className="mt-1 text-sm leading-6 text-slate-300">{alert.detail}</div>
              </div>
              <div className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${index === 0 ? 'bg-rose-500/15 text-rose-200' : 'bg-amber-400/15 text-amber-100'}`}>{alert.level}</div>
            </div>
          </div>
        )) : <div className="rounded-[1.25rem] border border-emerald-400/15 bg-emerald-400/10 p-4 text-sm text-emerald-100">前线资产结构稳定，暂无类别级风险预警。</div>}
      </div>
      <div className="mt-6">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-200"><Sparkles className="h-4 w-4 text-cyan-300" />建议投资</div>
        <div className="mt-3 space-y-3">
          {actions.map((action) => (
            <button
              key={action}
              type="button"
              onClick={() => onAction(action)}
              className="flex w-full items-center justify-between rounded-[1.15rem] border border-cyan-300/12 bg-cyan-300/5 px-4 py-3 text-left text-sm text-slate-200 transition hover:border-cyan-300/25 hover:bg-cyan-300/10"
            >
              <span>{action}</span>
              <ChevronRight className="h-4 w-4 text-cyan-300" />
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}

export function VocabularyTreasury() {
  const {
    selectedExam,
    selectedWordTier,
    examLabel,
    hasSeenBriefing,
    administrativePower,
    vocabularyGDP,
    activeBuffs,
    gdpHistory,
    hasSsaExchange,
    laws,
    initializeCampaign,
    setWordTier,
    enactLaw,
  } = useStudyModeStore()

  const [loading, setLoading] = useState(true)
  const [forceSelection, setForceSelection] = useState(false)
  const [notice, setNotice] = useState('')
  const [assets, setAssets] = useState<WordAsset[]>([])
  const [rows, setRows] = useState<WordRow[]>([])


  useEffect(() => {
    async function loadTreasury() {
      if (!selectedExam) {
        setLoading(false)
        setRows([])
        setAssets([])
        return
      }

      setLoading(true)
      const user = await getCurrentUser()
      const supabase = createClient()

      let query = supabase.from('words').select('id,word,meaning,phonetic,category,tier').eq('category', selectedExam).order('id')
      if (selectedWordTier === 'core') query = query.eq('tier', 'core')

      const { data: wordData } = await query
      const words = (wordData ?? []) as WordRow[]
      setRows(words)

      let statusMap = new Map<number, 'new' | 'learning' | 'known'>()
      if (user) {
        const { data: recordData } = await supabase.from('word_records').select('word_id,status').eq('user_id', user.id)
        statusMap = new Map((recordData ?? []).map((item) => [item.word_id as number, item.status as 'new' | 'learning' | 'known']))
      }

      const nextAssets = words.map((word) => {
        const status = statusMap.get(word.id) ?? 'new'
        return {
          id: word.id,
          word: word.word,
          category: word.category ?? selectedExam,
          tier: (word.tier ?? selectedWordTier) as WordTier,
          status,
          difficultyWeight: difficultyFromCategory(word.category),
          masteryLevel: masteryFromStatus(status),
        }
      })

      setAssets(nextAssets)
      setLoading(false)
    }

    void loadTreasury()
  }, [selectedExam, selectedWordTier])

  const assetPoolGDP = useMemo(() => calcGDP(assets), [assets])
  const masteredCount = useMemo(() => assets.filter((asset) => asset.status === 'known').length, [assets])
  const learningCount = useMemo(() => assets.filter((asset) => asset.status === 'learning').length, [assets])
  const memoryHealth = useMemo(() => {
    if (!assets.length) return 0
    const score = assets.reduce((sum, asset) => sum + asset.masteryLevel, 0) / assets.length
    return Math.round(score * 100)
  }, [assets])
  const buckets = useMemo(() => buildBuckets(rows, new Map(assets.map((asset) => [asset.id, asset.status]))), [assets, rows])
  const buffRate = useMemo(() => activeBuffs.gdpBonus + activeBuffs.memoryRate * 0.45 + activeBuffs.reviewEfficiency * 0.3, [activeBuffs])
  const historyData = hasSsaExchange ? gdpHistory : []
  const isInitialized = !(masteredCount === 0 && historyData.length === 0)
  const forecast = useMemo(() => buildForecast(isInitialized ? Math.max(vocabularyGDP, 1200) : 0, buffRate), [buffRate, isInitialized, vocabularyGDP])
  const treasuryLabel = examLabel || (selectedExam ? examMeta[selectedExam] : '待签署动员令')
  const showSelection = forceSelection || (!selectedExam && hasSeenBriefing)

  async function handleCampaignSelect(exam: ExamType) {
    initializeCampaign(exam)
    setForceSelection(false)
    setNotice(`词汇财政部已切换至 ${examMeta[exam]}。`)
  }

  async function handleLawToggle(lawKey: LawKey) {
    const result = enactLaw(lawKey)
    setNotice(result.ok ? '政策面板已更新，宏观 Buff 已重新进入推演。' : result.reason ?? '法案签署失败。')
  }

  return (
    <div className="space-y-6 pb-12">
      <SelectionModal open={showSelection} onSelect={handleCampaignSelect} currentExam={selectedExam} />

      <section className="glass-strong rounded-[2rem] border border-cyan-400/15 p-8">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <div className="text-xs uppercase tracking-[0.35em] text-cyan-300/80">Vocabulary Treasury</div>
            <h1 className="mt-3 text-4xl font-black text-slate-50">词汇财政部</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-400">逐词账本已移交前线勤务局。此处仅保留战略财政视角，用于观察资产结构、增长预测与类别级风险。</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={() => setForceSelection(true)} className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-cyan-300/25 hover:bg-cyan-300/10 hover:text-cyan-100">切换词书</button>
            <button type="button" onClick={async () => { setWordTier(selectedWordTier === 'core' ? 'full' : 'core'); const user = await getCurrentUser(); if (user) void saveStudyModeProfile(user.id).catch(() => {}) }} className="rounded-xl border border-fuchsia-300/20 bg-fuchsia-300/10 px-4 py-2.5 text-sm font-semibold text-fuchsia-100">当前层级：{tierMeta[selectedWordTier].label}</button>
          </div>
        </div>

        <div className="mt-6 grid gap-4 xl:grid-cols-[1.05fr_0.95fr_0.95fr]">
          <div className="rounded-[1.6rem] border border-cyan-300/15 bg-cyan-300/10 p-5">
            <div className="flex items-center justify-between">
              <div className="text-sm text-slate-300">词汇 GDP</div>
              <TrendingUp className="h-5 w-5 text-cyan-300" />
            </div>
            <div className="mt-4 text-4xl font-black text-slate-50">{isInitialized ? vocabularyGDP.toLocaleString() : '--'}</div>
            <div className="mt-3 text-xs text-cyan-100/80">当前词书：{treasuryLabel}</div>
            {loading ? <div className="mt-2 text-xs text-cyan-200/70">正在接入财政资产库...</div> : null}
          </div>
          <div className="rounded-[1.6rem] border border-amber-300/15 bg-amber-300/10 p-5">
            <div className="flex items-center justify-between">
              <div className="text-sm text-slate-300">行政力</div>
              <BadgeAlert className="h-5 w-5 text-amber-300" />
            </div>
            <div className="mt-4 text-4xl font-black text-slate-50">{isInitialized ? administrativePower : 0}</div>
            <div className="mt-3 text-xs text-amber-100/80">{isInitialized ? '法案警报以金色信号呈现，供指挥官即时决策。' : '请先部署词汇任务以获取行政权限。'}</div>
          </div>
          <div className="rounded-[1.6rem] border border-white/10 bg-white/5 p-5">
            <div className="flex items-center justify-between">
              <div className="text-sm text-slate-300">记忆健康度</div>
              <Gauge className="h-5 w-5 text-cyan-300" />
            </div>
            <div className="mt-2 flex items-center justify-center"><SemiGauge value={isInitialized ? memoryHealth : 0} disabled={!isInitialized} /></div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_1.05fr_0.85fr]">
        <AssetDistribution buckets={buckets} isInitialized={isInitialized} />
        <GrowthForecast points={forecast} buffRate={buffRate} isInitialized={isInitialized} />
        <RiskAnalysis buckets={buckets} onAction={(label) => setNotice(`已签发投资建议：${label}。请转入 SSA 或法案面板执行。`)} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="glass rounded-[1.75rem] border border-white/10 p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-xs uppercase tracking-[0.3em] text-cyan-300/70">Treasury Summary</div>
              <h3 className="mt-2 text-xl font-black text-slate-50">财政部摘要</h3>
            </div>
            <BrainCircuit className="h-5 w-5 text-cyan-300" />
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {[
              { label: '掌握资产', value: isInitialized ? masteredCount : 0, tone: 'text-emerald-300' },
              { label: '衰减资产', value: isInitialized ? learningCount : 0, tone: 'text-amber-300' },
              { label: '风险资产', value: isInitialized ? Math.max(0, assets.length - masteredCount - learningCount) : 0, tone: 'text-rose-300' },
            ].map((item) => (
              <div key={item.label} className="rounded-[1.25rem] border border-white/8 bg-white/5 p-4">
                <div className="text-sm text-slate-500">{item.label}</div>
                <div className={`mt-3 text-3xl font-black ${item.tone}`}>{item.value}</div>
              </div>
            ))}
          </div>
          <div className="mt-5 rounded-[1.4rem] border border-amber-300/12 bg-amber-300/8 p-4 text-sm leading-7 text-slate-300">
            当前词库层级为 {tierMeta[selectedWordTier].label}。{tierMeta[selectedWordTier].desc} 若需执行逐词歼灭，请直接从右下角部署 SSA 前线入口。
          </div>
        </div>

        <div className="glass rounded-[1.75rem] border border-white/10 p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-xs uppercase tracking-[0.3em] text-amber-300/70">Policy & Deployment</div>
              <h3 className="mt-2 text-xl font-black text-slate-50">财政部署提示</h3>
            </div>
            <AlertTriangle className="h-5 w-5 text-amber-300" />
          </div>
          <div className="mt-5 space-y-3 text-sm leading-7 text-slate-300">
            <div className="rounded-[1.2rem] border border-white/8 bg-white/5 p-4">建议优先处理高频动词与学术名词的衰减警报，再考虑扩容总词汇资产池。</div>
            <div className="rounded-[1.2rem] border border-white/8 bg-white/5 p-4">如需短期拉升 GDP，优先启用与 `gdpBonus`、`memoryRate` 相关的法案组合。</div>
            <Link href="/ssa" className="flex items-center justify-between rounded-[1.2rem] border border-cyan-300/18 bg-cyan-300/10 p-4 font-semibold text-cyan-100 transition hover:border-cyan-300/30 hover:bg-cyan-300/14">
              <span>转入战略勤务局执行前线歼灭</span>
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <StrategyLawPanel laws={laws} administrativePower={isInitialized ? administrativePower : 0} onToggle={handleLawToggle} notice={notice} />
    </div>
  )
}










