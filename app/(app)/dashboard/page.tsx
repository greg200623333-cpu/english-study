'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { type ExamType, useStudyModeStore } from '@/stores/useStudyModeStore'
import { GdpTicker } from '@/components/study-mode/GdpTicker'
import { MissionBriefingModal } from '@/components/study-mode/MissionBriefingModal'
import { SelectionModal } from '@/components/study-mode/SelectionModal'
import { applyRemoteStudyModeProfile, fetchStudyModeAnalytics, loadStudyModeProfile, saveStudyModeProfile, type LawRoiRow, type TrendRow, type WinRateRow } from '@/lib/studyModePersistence'

type TierCompletion = {
  total: number
  known: number
  learning: number
  completionRate: number
}

type DashboardStats = {
  totalQuiz: number
  accuracy: number
  wordStats: { known: number; learning: number; new: number }
  completion: {
    core: TierCompletion
    full: TierCompletion
  }
  avgScore: number
  recentEssays: { score: number | null; category: string; created_at: string }[]
  recentEvents: { id: number; event_type: string; source: string; created_at: string }[]
}

type StudyProfile = {
  selected_exam: string | null
  exam_label: string | null
  days_to_exam: number | null
  administrative_power: number | null
  vocabulary_gdp: number | null
  review_deficit: number | null
  skill_balance: { listening: number; speaking: number; reading: number; writing: number } | null
  laws: Record<string, boolean> | null
}

const eventLabel: Record<string, string> = {
  briefing_seen: '已阅读战前简报',
  campaign_selected: '已更新主战方向',
  law_toggled: '法案状态已变更',
  reading_assessment: '完成阅读基建评估',
  word_status_updated: '词汇资产状态调整',
  quiz_completion: '完成作战训练',
  essay_completion: '完成政策输出',
}

function buildTierCompletion(wordIds: number[], statusMap: Map<number, 'new' | 'learning' | 'known'>): TierCompletion {
  const total = wordIds.length
  let known = 0
  let learning = 0

  wordIds.forEach((id) => {
    const status = statusMap.get(id) ?? 'new'
    if (status === 'known') known += 1
    if (status === 'learning') learning += 1
  })

  return {
    total,
    known,
    learning,
    completionRate: total > 0 ? Math.round((known / total) * 100) : 0,
  }
}

export default function DashboardPage() {
  const selectedWordTier = useStudyModeStore((state) => state.selectedWordTier)
  const vocabularyGDP = useStudyModeStore((state) => state.vocabularyGDP)
  const selectedExam = useStudyModeStore((state) => state.selectedExam)
  const examLabel = useStudyModeStore((state) => state.examLabel)
  const administrativePower = useStudyModeStore((state) => state.administrativePower)
  const reviewDeficit = useStudyModeStore((state) => state.reviewDeficit)
  const skillBalance = useStudyModeStore((state) => state.skillBalance)
  const laws = useStudyModeStore((state) => state.laws)
  const daysToExam = useStudyModeStore((state) => state.daysToExam)
  const ssaLoadedCount = useStudyModeStore((state) => state.ssaLoadedCount)

  const [riskAnalysis, setRiskAnalysis] = useState<string | null>(null)
  const [riskLoading, setRiskLoading] = useState(false)
  const ssaHasMore = useStudyModeStore((state) => state.ssaHasMore)
  const baseAssets = useStudyModeStore((state) => state.baseAssets)
  const sessionGains = useStudyModeStore((state) => state.sessionGains)
  const lastSessionGain = useStudyModeStore((state) => state.lastSessionGain)
  const hasSsaExchange = useStudyModeStore((state) => state.hasSsaExchange)
  const gdpHistory = useStudyModeStore((state) => state.gdpHistory)
  const acknowledgeSessionGain = useStudyModeStore((state) => state.acknowledgeSessionGain)
  const pendingDeficitNotice = useStudyModeStore((state) => state.pendingDeficitNotice)
  const dismissDeficitNotice = useStudyModeStore((state) => state.dismissDeficitNotice)
  const hasSeenBriefing = useStudyModeStore((state) => state.hasSeenBriefing)
  const setHasSeenBriefing = useStudyModeStore((state) => state.setHasSeenBriefing)
  const initializeCampaign = useStudyModeStore((state) => state.initializeCampaign)
  const _hasHydrated = useStudyModeStore((state) => state._hasHydrated)
  const [user, setUser] = useState<{ id: string; username: string } | null | undefined>(undefined)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [profile, setProfile] = useState<StudyProfile | null>(null)
  const [trends, setTrends] = useState<TrendRow[]>([])
  const [winRates, setWinRates] = useState<WinRateRow[]>([])
  const [lawRoi, setLawRoi] = useState<LawRoiRow[]>([])
  const [showBriefing, setShowBriefing] = useState(false)
  const [showSelection, setShowSelection] = useState(false)

  // Auto-trigger briefing for new users redirected from register
  useEffect(() => {
    if (!user || !_hasHydrated) return
    const params = new URLSearchParams(window.location.search)
    if (params.get('onboarding') === '1' && !hasSeenBriefing) {
      setShowBriefing(true)
    }
  }, [user, _hasHydrated, hasSeenBriefing])

  function handleBriefingComplete() {
    setHasSeenBriefing(true)
    setShowBriefing(false)
    setShowSelection(true)
  }

  function handleExamSelect(exam: ExamType) {
    initializeCampaign(exam)
    setShowSelection(false)
    if (user) void saveStudyModeProfile(user.id).catch(() => {})
  }

  useEffect(() => {
    async function load() {
      // 获取 session
      const sessionRes = await fetch('/api/auth/session')
      if (!sessionRes.ok) {
        setUser(null)
        return
      }
      const { user: sessionUser } = await sessionRes.json()
      if (!sessionUser) {
        setUser(null)
        return
      }
      setUser({ id: sessionUser.id, username: sessionUser.username })

      const supabase = createClient()
      const remoteProfile = await loadStudyModeProfile(sessionUser.id).catch(() => null)
      if (remoteProfile) {
        applyRemoteStudyModeProfile(remoteProfile)
        setProfile(remoteProfile)
      }

      // Use the exam from remote profile or current store state
      const activeExam = remoteProfile?.selected_exam ?? selectedExam
      const wordsQuery = activeExam
        ? supabase.from('words').select('id,tier,category').eq('category', activeExam)
        : supabase.from('words').select('id,tier,category')

      const [quizRes, wordRes, wordsMetaRes, essayRes, eventRes, analytics] = await Promise.all([
        supabase.from('quiz_records').select('is_correct, created_at').eq('user_id', sessionUser.id),
        supabase.from('word_records').select('word_id,status').eq('user_id', sessionUser.id),
        wordsQuery,
        supabase.from('essays').select('score, category, created_at').eq('user_id', sessionUser.id),
        supabase.from('study_mode_events').select('id, event_type, source, created_at').eq('user_id', sessionUser.id).order('created_at', { ascending: false }).limit(6),
        fetchStudyModeAnalytics(sessionUser.id).catch(() => ({ trends: [], winRates: [], lawRoi: [] })),
      ])

      const quizRecords = quizRes.data ?? []
      const wordRecords = wordRes.data ?? []
      const wordsMeta = wordsMetaRes.data ?? []
      const essayRecords = essayRes.data ?? []
      const recentEvents = eventRes.data ?? []
      const totalQuiz = quizRecords.length
      const correctQuiz = quizRecords.filter((record) => record.is_correct).length
      const accuracy = totalQuiz > 0 ? Math.round((correctQuiz / totalQuiz) * 100) : 0
      const wordStats = {
        known: wordRecords.filter((record) => record.status === 'known').length,
        learning: wordRecords.filter((record) => record.status === 'learning').length,
        new: wordRecords.filter((record) => record.status === 'new').length,
      }
      const statusMap = new Map(wordRecords.map((record) => [record.word_id, record.status as 'new' | 'learning' | 'known']))
      const coreIds = wordsMeta.filter((word) => (word.tier ?? 'full') === 'core').map((word) => word.id)
      const fullIds = wordsMeta.map((word) => word.id)
      const completion = {
        core: buildTierCompletion(coreIds, statusMap),
        full: buildTierCompletion(fullIds, statusMap),
      }
      const avgScore = essayRecords.length > 0 ? Math.round(essayRecords.reduce((sum, essay) => sum + (essay.score ?? 0), 0) / essayRecords.length) : 0
      const recentEssays = essayRecords.slice(0, 5)

      setStats({ totalQuiz, accuracy, wordStats, completion, avgScore, recentEssays, recentEvents })
      setTrends(analytics.trends)
      setWinRates(analytics.winRates.slice(0, 6))
      setLawRoi(analytics.lawRoi)
    }
    void load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedExam, selectedWordTier])

  async function runRiskAnalysis() {
    if (!selectedExam || !stats) return
    setRiskLoading(true)
    try {
      const res = await fetch('/api/dashboard/risk-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exam: examLabel || selectedExam,
          totalQuiz: stats.totalQuiz,
          accuracy: stats.accuracy,
          wordStats: stats.wordStats,
          reviewDeficit,
          laws,
          skillBalance,
          daysToExam,
          avgScore: stats.avgScore,
        }),
      })
      const data = await res.json()
      setRiskAnalysis(data.analysis ?? '分析生成失败')
    } catch {
      setRiskAnalysis('分析请求失败，请稍后重试。')
    } finally {
      setRiskLoading(false)
    }
  }

  const lawCount = useMemo(() => Object.values(laws ?? {}).filter(Boolean).length, [laws])
  const currentTierLabel = selectedWordTier === 'core' ? '核心词汇' : '总词汇'
  const currentExamLabel = examLabel || (selectedExam === 'cet4' ? 'CET-4 基础建设' : selectedExam === 'cet6' ? 'CET-6 全面扩张' : selectedExam === 'kaoyan' ? '考研英语 核心攻坚' : '待签署动员令')
  const historyData = hasSsaExchange ? gdpHistory : []
  const isTreasuryInitialized = !!selectedExam
  const abilityTotal = skillBalance.listening + skillBalance.speaking + skillBalance.reading + skillBalance.writing
  const isInitialAbilityState = abilityTotal === 0
  const shouldShowAssessmentBanner = isInitialAbilityState && reviewDeficit === 0
  if (user === undefined) {
    return <div className="space-y-4 animate-pulse"><div className="h-10 w-64 rounded-2xl bg-white/5" /><div className="grid gap-4 lg:grid-cols-4">{[...Array(4)].map((_, index) => <div key={index} className="h-32 rounded-[1.5rem] bg-white/5" />)}</div></div>
  }

  if (!user) {
    return (
      <div className="space-y-6">
        <section className="glass-strong rounded-[2rem] border border-cyan-400/15 p-8">
          <p className="text-xs uppercase tracking-[0.35em] text-cyan-300/80">Supreme Command</p>
          <h1 className="mt-3 text-4xl font-black text-slate-50">学习区已切换为大战略备考版</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-400">登录后才会解锁国家档案、法案系统、战情事件流和全局战略进度同步。</p>
          <div className="mt-6 flex gap-3"><Link href="/login" className="btn-glow rounded-xl px-6 py-3 text-sm font-semibold text-white">进入最高指挥部</Link><Link href="/register" className="glass rounded-xl px-6 py-3 text-sm font-semibold text-slate-200" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>注册新指挥官</Link></div>
        </section>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <section className="glass-strong rounded-[2rem] border border-cyan-400/15 p-8">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-cyan-300/80">Supreme Command</p>
            <h1 className="mt-3 text-4xl font-black text-slate-50">最高指挥部总览</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-400">这里是学习区默认首页。词汇 GDP、法案、作战训练、政策输出和赤字走势都在这里统一汇总。</p>
          </div>
          <div className="flex w-full flex-col items-stretch gap-3 sm:w-auto sm:items-end">
            <div className="flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowBriefing(true)}
                className="rounded-xl border border-cyan-300/20 bg-cyan-300/10 px-4 py-2.5 text-sm font-semibold text-cyan-100 transition hover:border-cyan-300/35 hover:bg-cyan-300/15"
              >
                查看简报
              </button>
              <Link href="/" className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-cyan-300/25 hover:bg-cyan-300/10 hover:text-cyan-100">返回首页</Link>
              <Link href="/portal" className="rounded-xl border border-amber-300/25 bg-amber-300/10 px-4 py-2.5 text-sm font-bold text-amber-100 shadow-[0_0_24px_rgba(251,191,36,0.12)] transition hover:border-amber-200/40 hover:bg-amber-300/15">进入专业模式</Link>
            </div>
            <div className="rounded-[1.5rem] border border-white/10 bg-white/5 px-5 py-4 text-right">
              <div className="text-sm text-slate-400">指挥官账号</div>
              <div className="mt-2 text-lg font-bold text-slate-100">{user.username}</div>
              <div className="mt-1 text-xs text-slate-500">战略方向可随时调整</div>
              <div className="mt-1 text-xs text-cyan-200">当前词库层级：{currentTierLabel}</div>
            </div>
          </div>
        </div>

        {shouldShowAssessmentBanner ? (
          <div className="mt-6 rounded-[1.5rem] border border-amber-300/20 bg-amber-300/10 px-5 py-4 text-sm text-amber-100">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="font-semibold">欢迎来到最高指挥部！您的战力模型尚未激活。</div>
                <div className="mt-1 text-amber-100/80">为了精准下达战略，请先完成【战力评估】（水平测试）。</div>
              </div>
              <Link href="/quiz" className="rounded-xl border border-amber-200/30 bg-amber-200/10 px-4 py-2 text-sm font-semibold text-amber-50 transition hover:bg-amber-200/15">前往战力评估</Link>
            </div>
          </div>
        ) : null}
        {pendingDeficitNotice ? (
          <div className="mt-6 rounded-[1.5rem] border border-rose-400/25 bg-rose-400/10 px-5 py-4 text-sm text-rose-100">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="font-semibold">首次赤字警报</div>
                <div className="mt-1 text-rose-100/85">{pendingDeficitNotice}</div>
              </div>
              <button onClick={dismissDeficitNotice} className="rounded-xl border border-rose-200/25 bg-rose-200/10 px-4 py-2 text-sm font-semibold text-rose-50 transition hover:bg-rose-200/15">收到</button>
            </div>
          </div>
        ) : null}
        <div className="mt-6 grid gap-4 lg:grid-cols-4">
          <div className="rounded-[1.5rem] border border-cyan-300/15 bg-cyan-300/10 p-5">
            <div className="text-sm text-slate-300">词汇 GDP</div>
            <div className="mt-3">
              <GdpTicker value={isTreasuryInitialized ? vocabularyGDP : 0} gain={isTreasuryInitialized ? lastSessionGain : 0} waiting={!isTreasuryInitialized} onGainShown={acknowledgeSessionGain} />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-cyan-100/80">
              <div className="rounded-xl border border-white/8 bg-slate-950/30 px-3 py-2">Base Assets<br />{isTreasuryInitialized ? Math.round(baseAssets).toLocaleString() : '--'}</div>
              <div className="rounded-xl border border-white/8 bg-slate-950/30 px-3 py-2">Session Gains<br />{isTreasuryInitialized ? `+${Math.round(sessionGains).toLocaleString()}` : '--'}</div>
            </div>
          </div>
          {[
            { label: '今日赤字', value: `${isTreasuryInitialized ? reviewDeficit : 0} pts`, color: isTreasuryInitialized && reviewDeficit > 0 ? '#fb7185' : '#34d399' },
            { label: '行政力', value: isTreasuryInitialized ? administrativePower : 0, color: '#fbbf24' },
            { label: '生效法案', value: isTreasuryInitialized ? lawCount : 0, color: '#c084fc' },
          ].map((item) => <div key={item.label} className="rounded-[1.5rem] border border-white/8 bg-white/5 p-5"><div className="text-sm text-slate-400">{item.label}</div><div className="mt-3 text-3xl font-black" style={{ color: item.color }}>{item.value}</div>{item.label === '今日赤字' ? <div className="mt-2 text-xs text-slate-500">{reviewDeficit > 0 ? '复习逾期与遗忘会推高财政赤字。' : '当前财政健康，暂无复习负债。'}</div> : null}</div>)}
        </div>

      </section>
      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="glass rounded-[1.75rem] border border-white/10 p-6">
          <div className="flex items-center justify-between"><h2 className="text-xl font-bold text-slate-50">国家经营指标</h2><div className="text-xs uppercase tracking-[0.25em] text-slate-500">Live</div></div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {[
              { label: '当前主战方向', value: isTreasuryInitialized ? (profile?.exam_label ?? currentExamLabel) : '待签署动员令' },
              { label: '当前词库层级', value: isTreasuryInitialized ? currentTierLabel : '--' },
              { label: '距离考试', value: isTreasuryInitialized ? `${daysToExam} 天` : '--' },
              { label: '题目执行率', value: isTreasuryInitialized ? `${stats?.accuracy ?? 0}%` : '--' },
            ].map((item) => <div key={item.label} className="rounded-2xl border border-white/8 bg-white/5 p-4"><div className="text-sm text-slate-500">{item.label}</div><div className="mt-2 text-2xl font-black text-slate-100">{item.value}</div></div>)}
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[
              ['掌握词汇', isTreasuryInitialized ? (stats?.wordStats.known ?? 0) : 0, '#34d399'],
              ['核心完成率', isTreasuryInitialized ? `${stats?.completion.core.completionRate ?? 0}%` : '--', '#22d3ee'],
              ['总词完成率', isTreasuryInitialized ? `${stats?.completion.full.completionRate ?? 0}%` : '--', '#8b5cf6'],
              ['作文平均分', isTreasuryInitialized ? `${stats?.avgScore ?? 0}` : '--', '#f97316'],
            ].map(([label, value, color]) => <div key={label as string} className="rounded-2xl border border-white/8 bg-white/5 p-4 text-center"><div className="text-sm text-slate-500">{label}</div><div className="mt-2 text-3xl font-black" style={{ color: color as string }}>{value as string | number}</div></div>)}
          </div>

          <div className="mt-4 rounded-2xl border border-cyan-300/12 bg-cyan-300/5 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-cyan-100">SSA 前线摘要</div>
                <div className="mt-1 text-xs text-slate-500">战略勤务局当前接入的词书、词库层级与装载状态</div>
              </div>
              <Link href="/ssa" className="text-sm text-cyan-200">进入前线</Link>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {[
                { label: '当前词书', value: isTreasuryInitialized ? currentExamLabel : '等待前线接入' },
                { label: '词库层级', value: isTreasuryInitialized ? currentTierLabel : '--' },
                { label: '装载状态', value: isTreasuryInitialized ? `${ssaLoadedCount} 项 / ${ssaHasMore ? '可继续增援' : '已到末端'}` : '0 项 / 待部署' },
              ].map((item) => (
                <div key={item.label} className="rounded-xl border border-white/8 bg-slate-950/30 px-4 py-3">
                  <div className="text-xs uppercase tracking-[0.22em] text-slate-500">{item.label}</div>
                  <div className="mt-2 text-sm font-semibold text-slate-100">{item.value}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {[
              { label: '核心词汇', stat: isTreasuryInitialized ? stats?.completion.core : undefined, accent: '#22d3ee' },
              { label: '总词汇', stat: isTreasuryInitialized ? stats?.completion.full : undefined, accent: '#8b5cf6' },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border border-white/8 bg-white/5 p-4">
                <div className="flex items-center justify-between"><div className="text-sm font-semibold" style={{ color: item.accent }}>{item.label}</div><div className="text-xs text-slate-500">完成 {item.stat?.known ?? 0} / {item.stat?.total ?? 0}</div></div>
                <div className="mt-3 h-2 rounded-full bg-white/5"><div className="h-2 rounded-full" style={{ width: `${item.stat?.completionRate ?? 0}%`, background: item.accent }} /></div>
                <div className="mt-3 flex items-center justify-between text-xs text-slate-500"><span>推进中 {item.stat?.learning ?? 0}</span><span>{item.stat?.completionRate ?? 0}%</span></div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass rounded-[1.75rem] border border-white/10 p-6">
          <h2 className="text-xl font-bold text-slate-50">能力配比</h2>
          <div className="relative mt-5 space-y-4">
            {[
              ['情报系统 / 听力', isTreasuryInitialized && !isInitialAbilityState ? skillBalance.listening : 0, '#22d3ee'],
              ['外交输出 / 写作', isTreasuryInitialized && !isInitialAbilityState ? skillBalance.writing : 0, '#f97316'],
              ['基建系统 / 阅读', isTreasuryInitialized && !isInitialAbilityState ? skillBalance.reading : 0, '#8b5cf6'],
              ['口语联动 / 说', isTreasuryInitialized && !isInitialAbilityState ? skillBalance.speaking : 0, '#34d399'],
            ].map(([label, value, color]) => <div key={label as string}><div className="mb-1 flex justify-between text-sm"><span className="text-slate-400">{label}</span><span className="text-slate-500">{isInitialAbilityState ? '--' : value as number}</span></div><div className="h-2 rounded-full bg-slate-800"><div className="h-2 rounded-full" style={{ width: `${value as number}%`, background: isInitialAbilityState ? '#1f2937' : color as string }} /></div></div>)}
            {isInitialAbilityState ? (
              <div className="absolute inset-0 flex items-center justify-center rounded-[1.25rem] bg-slate-950/68 text-center backdrop-blur-[2px]">
                <div className="max-w-xs">
                  <div className="text-base font-semibold text-slate-200">情报资料缺失</div>
                  <div className="mt-2 text-sm leading-6 text-slate-400">请指挥官先进行战力评估（水平测试）以解锁具体能力模型。</div>
                  <Link href="/quiz" className="mt-4 inline-flex rounded-xl border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-300/15">立即评估</Link>
                </div>
              </div>
            ) : null}
          </div>
        </div>

      </section>
      <section className="grid gap-6 xl:grid-cols-3">
        <div className="glass rounded-[1.75rem] border border-white/10 p-6 xl:col-span-1">
          <div className="flex items-center justify-between"><h2 className="text-xl font-bold text-slate-50">近 7 天战情趋势</h2><div className="text-xs text-slate-500">RPC</div></div>
          <div className="mt-5 space-y-3">
            {isTreasuryInitialized && trends.length ? trends.map((trend) => (
              <div key={trend.day} className="rounded-2xl border border-white/8 bg-white/5 px-4 py-3">
                <div className="flex items-center justify-between text-sm"><span className="font-semibold text-slate-100">{trend.day}</span><span className="text-slate-500">事件 {trend.events}</span></div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-slate-400">
                  <div>题量 {trend.quiz_attempts}</div>
                  <div>作文 {trend.essay_submissions}</div>
                  <div>均准率 {trend.avg_quiz_accuracy ?? 0}%</div>
                  <div>GDP 增量 {trend.gdp_gain}</div>
                </div>
              </div>
            )) : <div className="rounded-2xl border border-dashed border-cyan-400/20 bg-white/5 p-4 text-sm text-slate-400">{isTreasuryInitialized ? '暂无趋势数据' : '等待首次作战数据录入...'}</div>}
          </div>
        </div>

        <div className="glass rounded-[1.75rem] border border-white/10 p-6 xl:col-span-1">
          <div className="flex items-center justify-between"><h2 className="text-xl font-bold text-slate-50">题型胜率</h2><div className="text-xs text-slate-500">RPC</div></div>
          <div className="mt-5 space-y-3">
            {isTreasuryInitialized && winRates.length ? winRates.map((item) => (
              <div key={`${item.category}_${item.quiz_type}`} className="rounded-2xl border border-white/8 bg-white/5 px-4 py-3">
                <div className="font-semibold text-slate-100">{item.category} / {item.quiz_type}</div>
                <div className="mt-1 flex items-center justify-between text-xs text-slate-500"><span>尝试 {item.attempts}</span><span>胜率 {item.win_rate ?? 0}%</span></div>
              </div>
            )) : <div className="rounded-2xl border border-dashed border-cyan-400/20 bg-white/5 p-4 text-sm text-slate-400">{isTreasuryInitialized ? '暂无题型胜率数据' : '等待前线题型战报接入...'}</div>}
          </div>
        </div>

        <div className="glass rounded-[1.75rem] border border-white/10 p-6 xl:col-span-1">
          <div className="flex items-center justify-between"><h2 className="text-xl font-bold text-slate-50">法案收益</h2><div className="text-xs text-slate-500">RPC</div></div>
          <div className="mt-5 space-y-3">
            {isTreasuryInitialized && lawRoi.length ? lawRoi.map((law) => (
              <div key={law.law_key} className="rounded-2xl border border-white/8 bg-white/5 px-4 py-3">
                <div className="flex items-center justify-between"><span className="font-semibold text-slate-100">{law.law_key}</span><span className={`text-xs ${law.currently_active ? 'text-emerald-300' : 'text-slate-500'}`}>{law.currently_active ? '生效中' : '未生效'}</span></div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-slate-400">
                  <div>切换次数 {law.toggle_count}</div>
                  <div>记忆收益 {law.estimated_memory_bonus_pct}%</div>
                  <div>复习收益 {law.estimated_review_efficiency_pct}%</div>
                  <div>GDP 收益 {law.estimated_gdp_bonus_pct}%</div>
                </div>
              </div>
            )) : <div className="rounded-2xl border border-dashed border-cyan-400/20 bg-white/5 p-4 text-sm text-slate-400">{isTreasuryInitialized ? '暂无法案收益数据' : '法案收益将在首次部署后建立口径。'}</div>}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="glass rounded-[1.75rem] border border-white/10 p-6">
          <div className="flex items-center justify-between"><h2 className="text-xl font-bold text-slate-50">最近战情事件</h2><Link href="/profile" className="text-sm text-cyan-200">查看档案</Link></div>
          <div className="mt-5 space-y-3">
            {stats?.recentEvents.length ? stats.recentEvents.map((event) => <div key={event.id} className="rounded-2xl border border-white/8 bg-white/5 px-4 py-3"><div className="flex items-center justify-between gap-4"><div><div className="font-semibold text-slate-100">{eventLabel[event.event_type] ?? event.event_type}</div><div className="mt-1 text-xs text-slate-500">来源：{event.source}</div></div><div className="text-xs text-slate-500">{new Date(event.created_at).toLocaleString('zh-CN')}</div></div></div>) : <div className="rounded-2xl border border-white/8 bg-white/5 p-4 text-sm text-slate-400">尚未形成事件流，先去签署动员令并开始训练。</div>}
          </div>
        </div>

        <div className="glass rounded-[1.75rem] border border-white/10 p-6">
          <div className="flex items-center justify-between"><h2 className="text-xl font-bold text-slate-50">战略快捷入口</h2><div className="text-xs uppercase tracking-[0.25em] text-slate-500">Actions</div></div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {[
              { href: '/words', title: '词汇财政部', desc: '维护 GDP 与复习赤字', accent: '#22d3ee' },
              { href: '/quiz', title: '作战部署台', desc: '按题型展开战术训练', accent: '#8b5cf6' },
              { href: '/essay', title: '政策输出部', desc: '作文批改与写作战线', accent: '#f97316' },
              { href: '/profile', title: '指挥官档案', desc: '查看战绩、密码与账户', accent: '#34d399' },
            ].map((item) => <Link key={item.href} href={item.href} className="rounded-[1.5rem] border border-white/8 bg-white/5 p-5 transition hover:-translate-y-1 hover:border-white/15"><div className="text-sm font-semibold" style={{ color: item.accent }}>{item.title}</div><div className="mt-2 text-sm leading-7 text-slate-400">{item.desc}</div></Link>)}
          </div>
        </div>
      </section>

      <section className="glass-strong rounded-[2rem] border border-rose-400/15 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-rose-300/80">Strategic Risk Analysis</p>
            <h2 className="mt-3 text-xl font-bold text-slate-50">国家战略风险分析</h2>
            <p className="mt-2 text-sm text-slate-400">由 DeepSeek 生成的备考战略风险评估简报，综合当前词汇、训练与能力数据。</p>
          </div>
          <button
            onClick={() => void runRiskAnalysis()}
            disabled={riskLoading || !selectedExam || !stats}
            className="rounded-xl border border-rose-300/25 bg-rose-300/10 px-5 py-2.5 text-sm font-semibold text-rose-100 transition hover:bg-rose-300/15 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {riskLoading ? '分析中...' : riskAnalysis ? '重新分析' : '发起战略评估'}
          </button>
        </div>
        <div className="mt-5 rounded-[1.5rem] border border-white/8 bg-[#020617] p-5 text-sm leading-7 text-slate-300">
          {riskLoading ? (
            <div className="space-y-3">
              <div className="text-xs uppercase tracking-[0.32em] text-rose-300/70">Analyzing</div>
              <div className="text-slate-400">国家战略风险分析官正在综合战情数据，生成备考风险简报...</div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/8">
                <div className="h-full w-1/3 animate-[shimmer_1.2s_linear_infinite] bg-[linear-gradient(90deg,rgba(251,113,133,0),rgba(251,113,133,0.8),rgba(251,113,133,0))]" />
              </div>
            </div>
          ) : riskAnalysis ? (
            <div className="whitespace-pre-wrap">{riskAnalysis}</div>
          ) : (
            <div className="text-slate-500">点击「发起战略评估」按钮，生成基于当前战情数据的风险简报。需要先完成词书挂载并有战训数据。</div>
          )}
        </div>
      </section>

      <MissionBriefingModal open={showBriefing} onComplete={handleBriefingComplete} />
      <SelectionModal open={showSelection} onSelect={handleExamSelect} currentExam={selectedExam} redirectToSsa={false} />
    </div>
  )
}














