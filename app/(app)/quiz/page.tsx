'use client'

import { useEffect, useMemo, useState } from 'react'
import { getCurrentUser } from '@/lib/auth'
import { applyRemoteStudyModeProfile, loadStudyModeProfile } from '@/lib/studyModePersistence'
import { CET_EXAMS, KAOYAN_EXAMS, groupBySection, type SubjectCategory } from '@/config/subjects'
import { MissionBriefingModal } from '@/components/study-mode/MissionBriefingModal'

type GenState = { loading: boolean; message: string }

type MissionTarget = {
  subjectId: string
  subjectTitle: string
  category: SubjectCategory
}

type StudyProfile = {
  exam_label: string | null
  selected_exam: string | null
  administrative_power: number | null
  review_deficit: number | null
  skill_balance: { listening: number; speaking: number; reading: number; writing: number } | null
}

export default function QuizPage() {
  const [activeTab, setActiveTab] = useState<'cet' | 'kaoyan'>('cet')
  const [genState, setGenState] = useState<Record<string, GenState>>({})
  const [showGen, setShowGen] = useState(false)
  const [profile, setProfile] = useState<StudyProfile | null>(null)
  const [missionTarget, setMissionTarget] = useState<MissionTarget | null>(null)

  useEffect(() => {
    async function loadProfile() {
      const user = await getCurrentUser()
      if (!user) return
      const remoteProfile = await loadStudyModeProfile(user.id).catch(() => null)
      if (remoteProfile) {
        applyRemoteStudyModeProfile(remoteProfile)
        setProfile(remoteProfile)
      }
    }
    loadProfile()
  }, [])

  async function handleGenerate(category: string, subjectId: string, count = 5) {
    const key = `${category}_${subjectId}`
    setGenState((s) => ({ ...s, [key]: { loading: true, message: '' } }))
    try {
      const res = await fetch('/api/generate/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, type: subjectId, count }),
      })
      const data = await res.json()
      setGenState((s) => ({ ...s, [key]: { loading: false, message: data.message ?? data.error ?? '完成' } }))
    } catch {
      setGenState((s) => ({ ...s, [key]: { loading: false, message: '生成失败' } }))
    }
  }

  const operationReadiness = useMemo(() => {
    const skills = profile?.skill_balance ?? { listening: 0, speaking: 0, reading: 0, writing: 0 }
    return Math.round((skills.listening + skills.reading + skills.writing + skills.speaking) / 4)
  }, [profile])

  const tabs = [
    { key: 'cet',    label: '四六级战区', icon: 'CET' },
    { key: 'kaoyan', label: '考研战区',   icon: 'GRD' },
  ]

  const activeExams = activeTab === 'cet' ? CET_EXAMS : KAOYAN_EXAMS

  return (
    <div className="space-y-6">
      {/* Mission Briefing Modal */}
      <MissionBriefingModal
        open={missionTarget !== null}
        subjectId={missionTarget?.subjectId ?? ''}
        subjectTitle={missionTarget?.subjectTitle ?? ''}
        category={missionTarget?.category ?? 'cet4'}
        onClose={() => setMissionTarget(null)}
      />

      {/* Header */}
      <section className="glass-strong rounded-[2rem] border border-cyan-400/15 p-4 md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-cyan-300/80">Operations Center</p>
            <h1 className="mt-3 text-2xl font-black text-slate-50 md:text-4xl">作战部署台</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-400">所有刷题行为都不再是孤立练习，而是围绕国家经营目标执行的战术行动。按战区、科目与题型部署任务。</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/8 bg-white/5 px-4 py-3 text-sm">
              <div className="text-slate-500">当前主战方向</div>
              <div className="mt-2 font-bold text-slate-100">{profile?.exam_label ?? '待签署动员令'}</div>
            </div>
            <div className="rounded-2xl border border-white/8 bg-white/5 px-4 py-3 text-sm">
              <div className="text-slate-500">战备完成度</div>
              <div className="mt-2 font-bold text-cyan-200">{operationReadiness}%</div>
            </div>
            <div className="rounded-2xl border border-white/8 bg-white/5 px-4 py-3 text-sm">
              <div className="text-slate-500">行政力</div>
              <div className="mt-2 font-bold text-amber-200">{profile?.administrative_power ?? 0}</div>
            </div>
            <div className="rounded-2xl border border-white/8 bg-white/5 px-4 py-3 text-sm">
              <div className="text-slate-500">训练赤字</div>
              <div className="mt-2 font-bold text-rose-200">{profile?.review_deficit ?? 0}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Tab bar */}
      <section className="glass rounded-[1.75rem] border border-white/10 p-4 md:p-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as 'cet' | 'kaoyan')}
                className="rounded-xl px-5 py-2.5 text-sm font-bold transition-all"
                style={
                  activeTab === tab.key
                    ? { background: 'linear-gradient(135deg, #06b6d4, #3b82f6)', color: '#fff' }
                    : { background: 'rgba(255,255,255,0.04)', color: '#64748b', border: '1px solid rgba(255,255,255,0.08)' }
                }
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          {/* Operational briefing line */}
          <div className="hidden flex-1 items-center gap-2 lg:flex">
            <span className="animate-pulse font-mono text-xs text-cyan-400/70">{'>'}</span>
            <p className="font-mono text-[13px] text-slate-400/80">
              系统就绪：点击下方作战科目即可调取
              <span className="text-cyan-400/90">历年真题档案</span>
              {' '}或开启{' '}
              <span className="text-cyan-400/90">AI 强化训练模式</span>
            </p>
          </div>

          <button
            onClick={() => setShowGen((v) => !v)}
            className="rounded-xl border border-cyan-300/25 bg-cyan-300/10 px-4 py-2 text-sm font-medium text-cyan-100"
          >
            {showGen ? '关闭 AI 战术补给' : '开启 AI 战术补给'}
          </button>
        </div>

        {/* Mobile briefing line — shown below the row on small screens */}
        <div className="flex items-center gap-2 border-t border-white/6 pt-3 lg:hidden">
          <span className="animate-pulse font-mono text-xs text-cyan-400/70">{'>'}</span>
          <p className="font-mono text-xs text-slate-400/80">
            点击科目调取<span className="text-cyan-400/90">真题档案</span>或开启<span className="text-cyan-400/90">AI 训练</span>
          </p>
        </div>
      </section>

      {/* Exam cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {activeExams.map((exam) => {
          const sections = groupBySection(exam.subjects)
          return (
            <div key={exam.category} className="glass rounded-[1.75rem] overflow-hidden border border-white/10">
              {/* Exam header */}
              <div className="px-6 py-5" style={{ background: `${exam.color}12`, borderBottom: `1px solid ${exam.color}22` }}>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-black" style={{ color: exam.color }}>{exam.label}</h2>
                    <p className="mt-1 text-sm text-slate-400">{exam.score}</p>
                    {exam.focus && <p className="mt-1 text-xs text-slate-500">{exam.focus}</p>}
                  </div>
                  <span
                    className="rounded-full px-3 py-1 text-xs font-bold"
                    style={{ color: exam.color, background: `${exam.color}18`, border: `1px solid ${exam.color}30` }}
                  >
                    {exam.category.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Sections */}
              <div className="space-y-5 p-5">
                {sections.map((sec) => (
                  <div key={sec.section}>
                    <div className="mb-3 flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-300">{sec.section}</span>
                      <span className="rounded-full bg-white/5 px-2 py-0.5 text-xs text-slate-500">{sec.weight}</span>
                    </div>
                    <div className="space-y-2.5">
                      {sec.subjects.map((subject) => {
                        const key = `${exam.category}_${subject.id}`
                        const state = genState[key]
                        return (
                          <div key={subject.id} className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/5 px-4 py-3">
                            <button
                              type="button"
                              onClick={() => setMissionTarget({ subjectId: subject.id, subjectTitle: subject.title, category: exam.category })}
                              className="min-w-0 flex-1 text-left"
                            >
                              <div className="font-semibold text-slate-100">{subject.title}</div>
                              <div className="mt-1 truncate text-xs text-slate-500">{subject.desc}</div>
                            </button>
                            <div className="flex items-center gap-2">
                              {state?.message ? <span className="text-xs text-slate-400">{state.message}</span> : null}
                              {showGen && (
                                <button
                                  onClick={() => handleGenerate(exam.category, subject.id)}
                                  disabled={state?.loading}
                                  className="rounded-lg px-3 py-1.5 text-xs font-semibold"
                                  style={{ color: exam.color, background: `${exam.color}16`, border: `1px solid ${exam.color}30` }}
                                >
                                  {state?.loading ? '生成中' : 'AI 生成'}
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => setMissionTarget({ subjectId: subject.id, subjectTitle: subject.title, category: exam.category })}
                                className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white"
                                style={{ background: exam.color }}
                              >
                                部署
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
