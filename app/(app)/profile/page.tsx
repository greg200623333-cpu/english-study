'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { SelectionModal } from '@/components/study-mode/SelectionModal'
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
  const [user, setUser] = useState<{ id: string; email: string } | null>(null)
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
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUser({ id: user.id, email: user.email ?? '' })

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
      setLoading(false)
    }
    load()
  }, [router])

  const activeLawCount = useMemo(() => Object.values(profile?.laws ?? {}).filter(Boolean).length, [profile])

  async function handleStrategySelect(exam: ExamType) {
    if (!user) return
    const result = initializeCampaign(exam)
    if (!result.ok) {
      setStrategyMsg(result.reason ?? '战略方向切换失败。')
      return
    }

    try {
      await saveStudyModeProfile(user.id)
      await logStudyModeEvent(user.id, 'campaign_selected', 'profile', { exam })
      const remoteProfile = await loadStudyModeProfile(user.id).catch(() => null)
      if (remoteProfile) {
        applyRemoteStudyModeProfile(remoteProfile)
        setProfile(remoteProfile)
      }
      setStrategyMsg('战略方向已更新。')
    } catch (error) {
      const details = describeStudyModeError(error)
      console.error('Failed to persist strategy selection:', details, error)
      setStrategyMsg(`战略方向已在本地更新，但 Supabase 同步失败：${details}。请先执行最新 supabase/schema.sql 后再试。`)
    } finally {
      setShowSelection(false)
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    setPwMsg('')
    setPwError('')
    if (newPassword !== confirmPassword) { setPwError('两次密码不一致'); return }
    if (newPassword.length < 6) { setPwError('密码至少 6 位'); return }
    setPwLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) setPwError(error.message)
    else { setPwMsg('密码修改成功'); setNewPassword(''); setConfirmPassword('') }
    setPwLoading(false)
  }

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.refresh()
    router.push('/')
  }

  async function handleDeleteAccount() {
    const supabase = createClient()
    if (!user) return
    await Promise.all([
      supabase.from('study_mode_events').delete().eq('user_id', user.id),
      supabase.from('study_mode_profiles').delete().eq('user_id', user.id),
      supabase.from('quiz_records').delete().eq('user_id', user.id),
      supabase.from('word_records').delete().eq('user_id', user.id),
      supabase.from('essays').delete().eq('user_id', user.id),
    ])
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) return <div className="flex h-64 items-center justify-center text-slate-500">正在加载指挥官档案...</div>

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <SelectionModal open={showSelection} onSelect={handleStrategySelect} currentExam={selectedExam} />

      <section className="glass-strong rounded-[2rem] border border-cyan-400/15 p-8">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-[1.5rem] bg-gradient-to-br from-cyan-400 to-blue-500 text-3xl font-black text-white">{user?.email?.[0]?.toUpperCase()}</div>
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-cyan-300/80">Commander Dossier</p>
              <h1 className="mt-2 text-3xl font-black text-slate-50">指挥官档案</h1>
              <p className="mt-2 text-sm text-slate-400">{user?.email}</p>
            </div>
          </div>
          <button onClick={() => router.push('/dashboard')} className="rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-300">返回总览</button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {[
            ['词汇 GDP', profile?.vocabulary_gdp ?? 0, '#22d3ee'],
            ['训练题量', stats.quiz, '#8b5cf6'],
            ['执行率', `${stats.accuracy}%`, '#34d399'],
            ['法案生效', activeLawCount, '#fbbf24'],
            ['事件记录', stats.events, '#f97316'],
          ].map(([label, value, color]) => (
            <div key={label as string} className="rounded-[1.5rem] border border-white/8 bg-white/5 p-4">
              <div className="text-sm text-slate-500">{label}</div>
              <div className="mt-2 text-3xl font-black" style={{ color: color as string }}>{value as string | number}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <div className="glass rounded-[1.75rem] border border-white/10 p-6">
          <h2 className="text-xl font-bold text-slate-50">战备画像</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {[
              ['主战方向', profile?.exam_label ?? '待签署'],
              ['训练赤字', profile?.review_deficit ?? 0],
              ['行政力', profile?.administrative_power ?? 0],
              ['上次同步', profile?.updated_at ? new Date(profile.updated_at).toLocaleString('zh-CN') : '未同步'],
            ].map(([label, value]) => (
              <div key={label as string} className="rounded-2xl border border-white/8 bg-white/5 p-4">
                <div className="text-sm text-slate-500">{label}</div>
                <div className="mt-2 text-xl font-bold text-slate-100">{value as string | number}</div>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm leading-7 text-amber-100">战略方向现已支持随时调整，你可以根据备考节奏切换主战路线。</div>
          {strategyMsg ? <div className="mt-4 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-sm text-cyan-100">{strategyMsg}</div> : null}

          <div className="mt-4">
            <button onClick={() => setShowSelection(true)} className="rounded-xl border border-cyan-300/25 bg-cyan-300/10 px-5 py-2.5 text-sm font-semibold text-cyan-100">调整战略方向</button>
          </div>

          <div className="mt-6 space-y-4">
            {[
              ['情报系统 / 听力', profile?.skill_balance?.listening ?? 0, '#22d3ee'],
              ['口语联动 / 说', profile?.skill_balance?.speaking ?? 0, '#34d399'],
              ['基建系统 / 阅读', profile?.skill_balance?.reading ?? 0, '#8b5cf6'],
              ['外交输出 / 写作', profile?.skill_balance?.writing ?? 0, '#f97316'],
            ].map(([label, value, color]) => (
              <div key={label as string}>
                <div className="mb-1 flex justify-between text-sm"><span className="text-slate-400">{label}</span><span className="text-slate-500">{value as number}</span></div>
                <div className="h-2 rounded-full bg-white/5"><div className="h-2 rounded-full" style={{ width: `${value as number}%`, background: color as string }} /></div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass rounded-[1.75rem] border border-white/10 p-6">
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



