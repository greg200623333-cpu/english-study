'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { applyRemoteStudyModeProfile, fetchStudyModeAnalytics, loadStudyModeProfile, type LawRoiRow, type TrendRow, type WinRateRow } from '@/lib/studyModePersistence'

type DashboardStats = {
  totalQuiz: number
  accuracy: number
  wordStats: { known: number; learning: number; new: number }
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

export default function DashboardPage() {
  const [user, setUser] = useState<{ id: string; email: string } | null | undefined>(undefined)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [profile, setProfile] = useState<StudyProfile | null>(null)
  const [trends, setTrends] = useState<TrendRow[]>([])
  const [winRates, setWinRates] = useState<WinRateRow[]>([])
  const [lawRoi, setLawRoi] = useState<LawRoiRow[]>([])

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setUser(null); return }
      setUser({ id: user.id, email: user.email ?? '' })

      const remoteProfile = await loadStudyModeProfile(user.id).catch(() => null)
      if (remoteProfile) {
        applyRemoteStudyModeProfile(remoteProfile)
        setProfile(remoteProfile)
      }

      const [quizRes, wordRes, essayRes, eventRes, analytics] = await Promise.all([
        supabase.from('quiz_records').select('is_correct, created_at').eq('user_id', user.id),
        supabase.from('word_records').select('status').eq('user_id', user.id),
        supabase.from('essays').select('score, category, created_at').eq('user_id', user.id),
        supabase.from('study_mode_events').select('id, event_type, source, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(6),
        fetchStudyModeAnalytics(user.id).catch(() => ({ trends: [], winRates: [], lawRoi: [] })),
      ])

      const quizRecords = quizRes.data ?? []
      const wordRecords = wordRes.data ?? []
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
      const avgScore = essayRecords.length > 0 ? Math.round(essayRecords.reduce((sum, essay) => sum + (essay.score ?? 0), 0) / essayRecords.length) : 0
      const recentEssays = essayRecords.slice(0, 5)

      setStats({ totalQuiz, accuracy, wordStats, avgScore, recentEssays, recentEvents })
      setTrends(analytics.trends)
      setWinRates(analytics.winRates.slice(0, 6))
      setLawRoi(analytics.lawRoi)
    }
    load()
  }, [])

  const lawCount = useMemo(() => Object.values(profile?.laws ?? {}).filter(Boolean).length, [profile])

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
          <div className="rounded-[1.5rem] border border-white/10 bg-white/5 px-5 py-4 text-right"><div className="text-sm text-slate-400">指挥官账号</div><div className="mt-2 text-lg font-bold text-slate-100">{user.email}</div><div className="mt-1 text-xs text-slate-500">战略方向可随时调整</div></div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-4">
          {[
            { label: '词汇 GDP', value: profile?.vocabulary_gdp ?? 0, color: '#22d3ee' },
            { label: '今日赤字', value: profile?.review_deficit ?? 0, color: '#fb7185' },
            { label: '行政力', value: profile?.administrative_power ?? 0, color: '#fbbf24' },
            { label: '生效法案', value: lawCount, color: '#c084fc' },
          ].map((item) => <div key={item.label} className="rounded-[1.5rem] border border-white/8 bg-white/5 p-5"><div className="text-sm text-slate-400">{item.label}</div><div className="mt-3 text-3xl font-black" style={{ color: item.color }}>{item.value}</div></div>)}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="glass rounded-[1.75rem] border border-white/10 p-6">
          <div className="flex items-center justify-between"><h2 className="text-xl font-bold text-slate-50">国家经营指标</h2><div className="text-xs uppercase tracking-[0.25em] text-slate-500">Live</div></div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {[
              { label: '当前主战方向', value: profile?.exam_label ?? '待签署动员令' },
              { label: '距离考试', value: `${profile?.days_to_exam ?? 0} 天` },
              { label: '题目执行率', value: `${stats?.accuracy ?? 0}%` },
              { label: '作文平均分', value: `${stats?.avgScore ?? 0}` },
            ].map((item) => <div key={item.label} className="rounded-2xl border border-white/8 bg-white/5 p-4"><div className="text-sm text-slate-500">{item.label}</div><div className="mt-2 text-2xl font-black text-slate-100">{item.value}</div></div>)}
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {[
              ['掌握词汇', stats?.wordStats.known ?? 0, '#34d399'],
              ['训练题量', stats?.totalQuiz ?? 0, '#8b5cf6'],
              ['作文产出', stats?.recentEssays.length ?? 0, '#f97316'],
            ].map(([label, value, color]) => <div key={label as string} className="rounded-2xl border border-white/8 bg-white/5 p-4 text-center"><div className="text-sm text-slate-500">{label}</div><div className="mt-2 text-3xl font-black" style={{ color: color as string }}>{value as number}</div></div>)}
          </div>
        </div>

        <div className="glass rounded-[1.75rem] border border-white/10 p-6">
          <h2 className="text-xl font-bold text-slate-50">能力配比</h2>
          <div className="mt-5 space-y-4">
            {[
              ['情报系统 / 听力', profile?.skill_balance?.listening ?? 0, '#22d3ee'],
              ['外交输出 / 写作', profile?.skill_balance?.writing ?? 0, '#f97316'],
              ['基建系统 / 阅读', profile?.skill_balance?.reading ?? 0, '#8b5cf6'],
              ['口语联动 / 说', profile?.skill_balance?.speaking ?? 0, '#34d399'],
            ].map(([label, value, color]) => <div key={label as string}><div className="mb-1 flex justify-between text-sm"><span className="text-slate-400">{label}</span><span className="text-slate-500">{value as number}</span></div><div className="h-2 rounded-full bg-white/5"><div className="h-2 rounded-full" style={{ width: `${value as number}%`, background: color as string }} /></div></div>)}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <div className="glass rounded-[1.75rem] border border-white/10 p-6 xl:col-span-1">
          <div className="flex items-center justify-between"><h2 className="text-xl font-bold text-slate-50">近 7 天战情趋势</h2><div className="text-xs text-slate-500">RPC</div></div>
          <div className="mt-5 space-y-3">
            {trends.length ? trends.map((trend) => (
              <div key={trend.day} className="rounded-2xl border border-white/8 bg-white/5 px-4 py-3">
                <div className="flex items-center justify-between text-sm"><span className="font-semibold text-slate-100">{trend.day}</span><span className="text-slate-500">事件 {trend.events}</span></div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-slate-400">
                  <div>题量 {trend.quiz_attempts}</div>
                  <div>作文 {trend.essay_submissions}</div>
                  <div>均准率 {trend.avg_quiz_accuracy ?? 0}%</div>
                  <div>GDP 增量 {trend.gdp_gain}</div>
                </div>
              </div>
            )) : <div className="rounded-2xl border border-white/8 bg-white/5 p-4 text-sm text-slate-400">暂无趋势数据</div>}
          </div>
        </div>

        <div className="glass rounded-[1.75rem] border border-white/10 p-6 xl:col-span-1">
          <div className="flex items-center justify-between"><h2 className="text-xl font-bold text-slate-50">题型胜率</h2><div className="text-xs text-slate-500">RPC</div></div>
          <div className="mt-5 space-y-3">
            {winRates.length ? winRates.map((item) => (
              <div key={`${item.category}_${item.quiz_type}`} className="rounded-2xl border border-white/8 bg-white/5 px-4 py-3">
                <div className="font-semibold text-slate-100">{item.category} / {item.quiz_type}</div>
                <div className="mt-1 flex items-center justify-between text-xs text-slate-500"><span>尝试 {item.attempts}</span><span>胜率 {item.win_rate ?? 0}%</span></div>
              </div>
            )) : <div className="rounded-2xl border border-white/8 bg-white/5 p-4 text-sm text-slate-400">暂无题型胜率数据</div>}
          </div>
        </div>

        <div className="glass rounded-[1.75rem] border border-white/10 p-6 xl:col-span-1">
          <div className="flex items-center justify-between"><h2 className="text-xl font-bold text-slate-50">法案收益</h2><div className="text-xs text-slate-500">RPC</div></div>
          <div className="mt-5 space-y-3">
            {lawRoi.length ? lawRoi.map((law) => (
              <div key={law.law_key} className="rounded-2xl border border-white/8 bg-white/5 px-4 py-3">
                <div className="flex items-center justify-between"><span className="font-semibold text-slate-100">{law.law_key}</span><span className={`text-xs ${law.currently_active ? 'text-emerald-300' : 'text-slate-500'}`}>{law.currently_active ? '生效中' : '未生效'}</span></div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-slate-400">
                  <div>切换次数 {law.toggle_count}</div>
                  <div>记忆收益 {law.estimated_memory_bonus_pct}%</div>
                  <div>复习收益 {law.estimated_review_efficiency_pct}%</div>
                  <div>GDP 收益 {law.estimated_gdp_bonus_pct}%</div>
                </div>
              </div>
            )) : <div className="rounded-2xl border border-white/8 bg-white/5 p-4 text-sm text-slate-400">暂无法案收益数据</div>}
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
    </div>
  )
}


