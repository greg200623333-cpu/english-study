'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/client'
import { applyRemoteStudyModeProfile, describeStudyModeError, loadStudyModeProfile, logStudyModeEvent, saveStudyModeProfile } from '@/lib/studyModePersistence'
import { type ExamType, useStudyModeStore } from '@/stores/useStudyModeStore'

type StudyStats = {
  quiz: number
  accuracy: number
  words: number
  essays: number
  events: number
}

type StudyProfile = {
  exam_label: string | null
  selected_exam: ExamType | null
  administrative_power: number | null
  vocabulary_gdp: number | null
  review_deficit: number | null
  skill_balance: { listening: number; speaking: number; reading: number; writing: number } | null
  laws: Record<string, boolean> | null
  updated_at: string | null
}

export default function ProfilePage() {
  const router = useRouter()
  const initializeCampaign = useStudyModeStore((state) => state.initializeCampaign)
  const selectedExam = useStudyModeStore((state) => state.selectedExam)
  const vocabularyGDP = useStudyModeStore((state) => state.vocabularyGDP)
  const administrativePower = useStudyModeStore((state) => state.administrativePower)
  const reviewDeficit = useStudyModeStore((state) => state.reviewDeficit)
  const skillBalance = useStudyModeStore((state) => state.skillBalance)
  const laws = useStudyModeStore((state) => state.laws)
  const hasSsaExchange = useStudyModeStore((state) => state.hasSsaExchange)
  const gdpHistory = useStudyModeStore((state) => state.gdpHistory)
  const resetForUserSwitch = useStudyModeStore((state) => state.resetForUserSwitch)
  const syncVocabularyGDP = useStudyModeStore((state) => state.syncVocabularyGDP)
  const updateReviewDeficit = useStudyModeStore((state) => state.updateReviewDeficit)
  const [user, setUser] = useState<{ id: string; username: string } | null>(null)
  const [profile, setProfile] = useState<StudyProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [pwMsg, setPwMsg] = useState('')
  const [pwError, setPwError] = useState('')
  const [pwLoading, setPwLoading] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [showSelection, setShowSelection] = useState(false)
  const [strategyMsg, setStrategyMsg] = useState('')
  const [stats, setStats] = useState<StudyStats>({ quiz: 0, accuracy: 0, words: 0, essays: 0, events: 0 })

  useEffect(() => {
    async function load() {
      try {
        const user = await getCurrentUser()
        if (!user) { router.push('/login'); return }
        setUser(user)

        const supabase = createClient()
        const remoteProfile = await loadStudyModeProfile(user.id).catch(() => null)
        if (remoteProfile) {
          applyRemoteStudyModeProfile(remoteProfile)
          setProfile(remoteProfile)
        }

        const [quizRes, wordRes, essayRes, eventRes] = await Promise.all([
          supabase.from('quiz_records').select('is_correct').eq('user_id', user.id),
          supabase.from('word_records').select('status').eq('user_id', user.id),
          supabase.from('essays').select('id').eq('user_id', user.id),
          supabase.from('study_mode_events').select('id').eq('user_id', user.id),
        ])

        const quizRecords = quizRes.data ?? []
        const correct = quizRecords.filter((record) => record.is_correct).length
        setStats({
          quiz: quizRecords.length,
          accuracy: quizRecords.length > 0 ? Math.round((correct / quizRecords.length) * 100) : 0,
          words: (wordRes.data ?? []).filter((record) => record.status === 'known').length,
          essays: (essayRes.data ?? []).length,
          events: (eventRes.data ?? []).length,
        })
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [router])

  const activeLawCount = useMemo(() => Object.values(laws ?? {}).filter(Boolean).length, [laws])
  const historyData = hasSsaExchange ? gdpHistory : []
  const isTreasuryInitialized = !(stats.words === 0 && historyData.length === 0)

  async function handleStrategySelect(exam: ExamType) {
    if (!user) return
    const result = initializeCampaign(exam)
    if (!result.ok) {
      setStrategyMsg(result.reason ?? '战略方向切换失败。')
      return
    }

    const issues: string[] = []

    // 切换词书后，先从 word_records 重新计算新词书的 GDP 和赤字，再保存
    try {
      const supabase = createClient()
      const [wordsRes, recordsRes] = await Promise.all([
        supabase.from('words').select('id,tier,category').eq('category', exam),
        supabase.from('word_records').select('word_id,status').eq('user_id', user.id),
      ])
      const wordsMeta = wordsRes.data ?? []
      const wordRecords = recordsRes.data ?? []
      const statusMap = new Map(wordRecords.map((r) => [r.word_id as number, r.status as 'new' | 'learning' | 'known']))
      const assets = wordsMeta.map((w) => {
        const status = statusMap.get(w.id) ?? 'new'
        const difficultyWeight = w.category === 'cet6' ? 1.28 : w.category === 'kaoyan' ? 1.62 : 1
        const masteryLevel = status === 'known' ? 0.92 : status === 'learning' ? 0.56 : 0.18
        return { difficultyWeight, masteryLevel, status }
      })
      const knownCount = assets.filter((a) => a.status === 'known').length
      const learningCount = assets.filter((a) => a.status === 'learning').length
      const hasSsaData = knownCount > 0 || learningCount > 0
      if (hasSsaData) {
        const baseGDP = Math.round(assets.reduce((total, a) => total + 100 * a.difficultyWeight * (0.35 + a.masteryLevel * 0.65), 0))
        syncVocabularyGDP(baseGDP)
        updateReviewDeficit(learningCount * 3)
      }
    } catch {
      // 计算失败不阻断流程
    }

    await saveStudyModeProfile(user.id).catch((error) => {
      const details = describeStudyModeError(error)
      issues.push(`profile=${details}`)
    })

    await logStudyModeEvent(user.id, 'campaign_selected', 'profile', { exam }).catch((error) => {
      const details = describeStudyModeError(error)
      issues.push(`event=${details}`)
    })

    const remoteProfile = await loadStudyModeProfile(user.id).catch((error) => {
      const details = describeStudyModeError(error)
      issues.push(`reload=${details}`)
      return null
    })

    if (remoteProfile) {
      applyRemoteStudyModeProfile(remoteProfile)
      setProfile(remoteProfile)
    }

    setStrategyMsg(issues.length ? `战略方向已在本地更新，但 Supabase 同步失败：${issues.join(' | ')}。` : '战略方向已更新。')
    setShowSelection(false)
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    setPwMsg('')
    setPwError('')
    if (newPassword !== confirmPassword) { setPwError('两次密码不一致'); return }
    if (newPassword.length < 6) { setPwError('密码至少 6 位'); return }
    if (!user) return
    setPwLoading(true)
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword }),
      })
      const data = await res.json()
      if (!res.ok) setPwError(data.error || '修改失败')
      else { setPwMsg('密码修改成功'); setNewPassword(''); setConfirmPassword('') }
    } catch {
      setPwError('网络错误')
    }
    setPwLoading(false)
  }

  async function handleLogout() {
    resetForUserSwitch()
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/')
  }

  async function handleDeleteAccount() {
    if (!user) return
    const res = await fetch('/api/auth/delete-account', { method: 'POST' })
    if (!res.ok) {
      alert('删除失败，请稍后重试')
      return
    }
    resetForUserSwitch()
    router.push('/')
  }

  if (loading) return <div className="flex h-64 items-center justify-center text-slate-500">正在加载指挥官档案...</div>

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {showSelection ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4 backdrop-blur-md">
          <div className="glass-strong w-full max-w-3xl rounded-[2rem] border border-cyan-400/15 p-8">
            <p className="text-xs uppercase tracking-[0.35em] text-cyan-300/80">Campaign Selection</p>
            <h2 className="mt-2 text-3xl font-black text-slate-50">调整战略方向</h2>
            <p className="mt-3 text-sm leading-7 text-slate-400">选择新战略后会更新全局战区参数，词书挂载将在下次进入 SSA 时触发。</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {([
                { key: 'cet4' as const, label: 'CET-4 基础建设' },
                { key: 'cet6' as const, label: 'CET-6 全面扩张' },
                { key: 'kaoyan' as const, label: '考研英语 核心攻坚' },
              ]).map((option) => (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => void handleStrategySelect(option.key)}
                  className={`rounded-xl border px-4 py-3 text-sm font-semibold transition ${selectedExam === option.key ? 'border-cyan-300/35 bg-cyan-300/12 text-cyan-100' : 'border-white/10 bg-white/5 text-slate-300 hover:border-cyan-300/20'}`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <div className="mt-6 flex justify-end">
              <button onClick={() => setShowSelection(false)} className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300">取消</button>
            </div>
          </div>
        </div>
      ) : null}

      <section className="glass-strong rounded-[2rem] border border-cyan-400/15 p-4 md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-gradient-to-br from-cyan-400 to-blue-500 text-2xl font-black text-white md:h-20 md:w-20 md:text-3xl">{user?.username?.[0]?.toUpperCase()}</div>
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-cyan-300/80">Commander Dossier</p>
              <h1 className="mt-2 text-2xl font-black text-slate-50 md:text-3xl">指挥官档案</h1>
              <p className="mt-2 text-sm text-slate-400">{user?.username}</p>
            </div>
          </div>
          <button onClick={() => router.push('/dashboard')} className="rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-300">返回总览</button>
        </div>

        <div className="mt-6 grid gap-4 grid-cols-2 md:grid-cols-5">
          {[
            ['词汇 GDP', isTreasuryInitialized ? vocabularyGDP : '--', '#22d3ee'],
            ['训练题量', isTreasuryInitialized ? stats.quiz : 0, '#8b5cf6'],
            ['执行率', isTreasuryInitialized ? `${stats.accuracy}%` : '--', '#34d399'],
            ['法案生效', isTreasuryInitialized ? activeLawCount : 0, '#fbbf24'],
            ['事件记录', isTreasuryInitialized ? stats.events : 0, '#f97316'],
          ].map(([label, value, color]) => (
            <div key={label as string} className="rounded-[1.5rem] border border-white/8 bg-white/5 p-4">
              <div className="text-sm text-slate-500">{label}</div>
              <div className="mt-2 text-3xl font-black" style={{ color: color as string }}>{value as string | number}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <div className="glass rounded-[1.75rem] border border-white/10 p-4 md:p-6">
          <h2 className="text-xl font-bold text-slate-50">战备画像</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {[
              ['主战方向', isTreasuryInitialized ? (profile?.exam_label ?? '待签署') : '待签署'],
              ['训练赤字', isTreasuryInitialized ? reviewDeficit : 0],
              ['行政力', isTreasuryInitialized ? administrativePower : 0],
              ['上次同步', isTreasuryInitialized ? (profile?.updated_at ? new Date(profile.updated_at).toLocaleString('zh-CN') : '未同步') : '等待首次作战'],
            ].map(([label, value]) => (
              <div key={label as string} className="rounded-2xl border border-white/8 bg-white/5 p-4">
                <div className="text-sm text-slate-500">{label}</div>
                <div className="mt-2 text-xl font-bold text-slate-100">{value as string | number}</div>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm leading-7 text-amber-100">{isTreasuryInitialized ? '战略方向现已支持随时调整，你可以根据备考节奏切换主战路线。' : '财政档案尚未初始化，请先完成首次词汇任务后再查看完整财政摘要。'}</div>
          {strategyMsg ? <div className="mt-4 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-sm text-cyan-100">{strategyMsg}</div> : null}

          <div className="mt-4">
            <button onClick={() => setShowSelection(true)} className="rounded-xl border border-cyan-300/25 bg-cyan-300/10 px-5 py-2.5 text-sm font-semibold text-cyan-100">调整战略方向</button>
          </div>

          <div className="mt-6 space-y-4">
            {[
              ['情报系统 / 听力', isTreasuryInitialized ? skillBalance.listening : 0, '#22d3ee'],
              ['口语联动 / 说', isTreasuryInitialized ? skillBalance.speaking : 0, '#34d399'],
              ['基建系统 / 阅读', isTreasuryInitialized ? skillBalance.reading : 0, '#8b5cf6'],
              ['外交输出 / 写作', isTreasuryInitialized ? skillBalance.writing : 0, '#f97316'],
            ].map(([label, value, color]) => (
              <div key={label as string}>
                <div className="mb-1 flex justify-between text-sm"><span className="text-slate-400">{label}</span><span className="text-slate-500">{value as number}</span></div>
                <div className="h-2 rounded-full bg-white/5"><div className="h-2 rounded-full" style={{ width: `${value as number}%`, background: color as string }} /></div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass rounded-[1.75rem] border border-white/10 p-4 md:p-6">
          <h2 className="text-xl font-bold text-slate-50">账号操作</h2>
          <form onSubmit={handleChangePassword} className="mt-5 space-y-4">
            <div>
              <label className="mb-1.5 block text-sm text-slate-400">新密码</label>
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="input-dark w-full rounded-xl px-4 py-3 text-sm" placeholder="至少 6 位" required />
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-slate-400">确认新密码</label>
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="input-dark w-full rounded-xl px-4 py-3 text-sm" placeholder="再次输入" required />
            </div>
            {pwError ? <div className="rounded-xl border border-rose-400/25 bg-rose-400/10 px-4 py-3 text-sm text-rose-300">{pwError}</div> : null}
            {pwMsg ? <div className="rounded-xl border border-emerald-400/25 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-300">{pwMsg}</div> : null}
            <button type="submit" disabled={pwLoading} className="btn-glow rounded-xl px-6 py-2.5 text-sm font-bold text-white disabled:opacity-50">{pwLoading ? '提交中...' : '更新指挥官密钥'}</button>
          </form>

          <div className="mt-8 border-t border-white/8 pt-6">
            <div className="flex flex-wrap gap-3">
              <button onClick={handleLogout} className="rounded-xl border border-white/10 px-5 py-2.5 text-sm font-medium text-slate-300">退出指挥部</button>
              {!deleteConfirm ? (
                <button onClick={() => setDeleteConfirm(true)} className="rounded-xl border border-rose-400/25 bg-rose-400/10 px-5 py-2.5 text-sm font-medium text-rose-300">删除全部战略档案</button>
              ) : (
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-sm text-rose-300">确认删除全部学习与战情数据？</span>
                  <button onClick={handleDeleteAccount} className="rounded-xl border border-rose-400/35 bg-rose-400/20 px-4 py-2 text-sm font-bold text-rose-200">确认删除</button>
                  <button onClick={() => setDeleteConfirm(false)} className="rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-400">取消</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}







