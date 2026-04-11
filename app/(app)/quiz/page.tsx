'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { getCurrentUser } from '@/lib/auth'
import { applyRemoteStudyModeProfile, loadStudyModeProfile } from '@/lib/studyModePersistence'

const CET_TYPES = {
  cet4: {
    label: 'CET-4 基础建设',
    score: '满分 710 · 130 分钟',
    color: '#22d3ee',
    sections: [
      { name: '外交输出', weight: '15%', types: [{ key: 'writing', label: '写作', desc: '先稳住政策输出能力。' }] },
      { name: '情报系统', weight: '35%', types: [{ key: 'listening_news', label: '新闻听力', desc: '快节奏信息截获。' }, { key: 'listening_interview', label: '长对话', desc: '追踪关键角色意图。' }, { key: 'listening_passage', label: '听力短文', desc: '构建完整情报链。' }] },
      { name: '基建系统', weight: '35%', types: [{ key: 'reading_match', label: '信息匹配', desc: '宏观调度与定位。' }, { key: 'reading_choice', label: '仔细阅读', desc: '核心基建能力训练。' }, { key: 'reading_cloze', label: '篇章词汇', desc: '修复词汇链路。' }] },
      { name: '翻译中枢', weight: '15%', types: [{ key: 'translation', label: '翻译', desc: '跨系统语言转换。' }] },
    ],
  },
  cet6: {
    label: 'CET-6 全面扩张',
    score: '满分 710 · 130 分钟',
    color: '#8b5cf6',
    sections: [
      { name: '外交输出', weight: '15%', types: [{ key: 'writing', label: '写作', desc: '更高压的政策表达。' }] },
      { name: '情报系统', weight: '35%', types: [{ key: 'listening_news', label: '新闻听力', desc: '高频信息突袭。' }, { key: 'listening_interview', label: '长对话', desc: '多节点关系解读。' }, { key: 'listening_passage', label: '听力短文', desc: '学术型情报素材。' }] },
      { name: '基建系统', weight: '35%', types: [{ key: 'reading_match', label: '信息匹配', desc: '长文结构治理。' }, { key: 'reading_choice', label: '仔细阅读', desc: '逻辑推断升级。' }, { key: 'reading_cloze', label: '篇章词汇', desc: '熟词僻义专项。' }] },
      { name: '翻译中枢', weight: '15%', types: [{ key: 'translation', label: '翻译', desc: '文化与书面表达转换。' }] },
    ],
  },
}

const KAOYAN_TYPES = {
  kaoyan1: {
    label: '考研英语一 核心攻坚',
    score: '满分 100 · 180 分钟',
    color: '#f97316',
    focus: '学术深度 · 长难句 · 高压逻辑',
    sections: [
      { name: '资源清算', weight: '10 分', types: [{ key: 'cloze', label: '完形填空', desc: '考验整体语义调度。' }] },
      { name: '基建主战场', weight: '40 分', types: [{ key: 'reading', label: '阅读理解', desc: '核心决战区。' }, { key: 'new_type_match', label: '新题型匹配', desc: '篇章重组与排序。' }, { key: 'new_type_summary', label: '英译汉', desc: '拆解长难句结构。' }] },
      { name: '外交输出', weight: '30 分', types: [{ key: 'writing_small', label: '小作文', desc: '短平快政策表达。' }, { key: 'writing_big', label: '大作文', desc: '完整立场输出。' }] },
    ],
  },
  kaoyan2: {
    label: '考研英语二 战略稳推',
    score: '满分 100 · 180 分钟',
    color: '#34d399',
    focus: '应用写作 · 图表分析 · 实用表达',
    sections: [
      { name: '资源清算', weight: '10 分', types: [{ key: 'cloze', label: '完形填空', desc: '控制语境误差。' }] },
      { name: '基建主战场', weight: '40 分', types: [{ key: 'reading', label: '阅读理解', desc: '偏应用文本调度。' }, { key: 'new_type_match', label: '新题型', desc: '结构统筹。' }, { key: 'translation', label: '翻译', desc: '段落级转换。' }] },
      { name: '外交输出', weight: '30 分', types: [{ key: 'writing_small', label: '小作文', desc: '实用文书格式化。' }, { key: 'writing_big', label: '大作文', desc: '图表趋势与论证。' }] },
    ],
  },
}

type GenState = { loading: boolean; message: string }

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

  async function handleGenerate(category: string, type: string, count = 5) {
    const key = `${category}_${type}`
    setGenState((state) => ({ ...state, [key]: { loading: true, message: '' } }))
    try {
      const res = await fetch('/api/generate/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, type, count }),
      })
      const data = await res.json()
      setGenState((state) => ({ ...state, [key]: { loading: false, message: data.message ?? data.error ?? '完成' } }))
    } catch {
      setGenState((state) => ({ ...state, [key]: { loading: false, message: '生成失败' } }))
    }
  }

  const tabs = [
    { key: 'cet', label: '四六级战区', icon: 'CET' },
    { key: 'kaoyan', label: '考研战区', icon: 'GRD' },
  ]

  const operationReadiness = useMemo(() => {
    const skills = profile?.skill_balance ?? { listening: 0, speaking: 0, reading: 0, writing: 0 }
    return Math.round((skills.listening + skills.reading + skills.writing + skills.speaking) / 4)
  }, [profile])

  return (
    <div className="space-y-6">
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

      <section className="glass rounded-[1.75rem] border border-white/10 p-4 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as 'cet' | 'kaoyan')}
                className="rounded-xl px-5 py-2.5 text-sm font-bold transition-all"
                style={activeTab === tab.key ? { background: 'linear-gradient(135deg, #06b6d4, #3b82f6)', color: '#fff' } : { background: 'rgba(255,255,255,0.04)', color: '#64748b', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
          <button onClick={() => setShowGen((value) => !value)} className="rounded-xl border border-cyan-300/25 bg-cyan-300/10 px-4 py-2 text-sm font-medium text-cyan-100">
            {showGen ? '关闭 AI 战术补给' : '开启 AI 战术补给'}
          </button>
        </div>
      </section>

      {activeTab === 'cet' && (
        <div className="grid gap-6 md:grid-cols-2">
          {Object.entries(CET_TYPES).map(([catKey, cat]) => (
            <div key={catKey} className="glass rounded-[1.75rem] overflow-hidden border border-white/10">
              <div className="px-6 py-5" style={{ background: `${cat.color}12`, borderBottom: `1px solid ${cat.color}22` }}>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-black" style={{ color: cat.color }}>{cat.label}</h2>
                    <p className="mt-1 text-sm text-slate-400">{cat.score}</p>
                  </div>
                  <span className="rounded-full px-3 py-1 text-xs font-bold" style={{ color: cat.color, background: `${cat.color}18`, border: `1px solid ${cat.color}30` }}>{catKey.toUpperCase()}</span>
                </div>
              </div>
              <div className="space-y-5 p-5">
                {cat.sections.map((section) => (
                  <div key={section.name}>
                    <div className="mb-3 flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-300">{section.name}</span>
                      <span className="rounded-full bg-white/5 px-2 py-0.5 text-xs text-slate-500">{section.weight}</span>
                    </div>
                    <div className="space-y-2.5">
                      {section.types.map((type) => {
                        const key = `${catKey}_${type.key}`
                        const state = genState[key]
                        return (
                          <div key={type.key} className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/5 px-4 py-3">
                            <Link href={`/quiz/${catKey}/${type.key}`} className="min-w-0 flex-1">
                              <div className="font-semibold text-slate-100">{type.label}</div>
                              <div className="mt-1 truncate text-xs text-slate-500">{type.desc}</div>
                            </Link>
                            <div className="flex items-center gap-2">
                              {state?.message ? <span className="text-xs text-slate-400">{state.message}</span> : null}
                              {showGen ? (
                                <button onClick={() => handleGenerate(catKey, type.key)} disabled={state?.loading} className="rounded-lg px-3 py-1.5 text-xs font-semibold" style={{ color: cat.color, background: `${cat.color}16`, border: `1px solid ${cat.color}30` }}>
                                  {state?.loading ? '生成中' : 'AI 生成'}
                                </button>
                              ) : null}
                              <Link href={`/quiz/${catKey}/${type.key}`} className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white" style={{ background: cat.color }}>
                                部署
                              </Link>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'kaoyan' && (
        <div className="grid gap-6 md:grid-cols-2">
          {Object.entries(KAOYAN_TYPES).map(([catKey, cat]) => (
            <div key={catKey} className="glass rounded-[1.75rem] overflow-hidden border border-white/10">
              <div className="px-6 py-5" style={{ background: `${cat.color}12`, borderBottom: `1px solid ${cat.color}22` }}>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-black" style={{ color: cat.color }}>{cat.label}</h2>
                    <p className="mt-1 text-sm text-slate-400">{cat.score}</p>
                    <p className="mt-1 text-xs text-slate-500">{cat.focus}</p>
                  </div>
                  <span className="rounded-full px-3 py-1 text-xs font-bold" style={{ color: cat.color, background: `${cat.color}18`, border: `1px solid ${cat.color}30` }}>{catKey === 'kaoyan1' ? '英一' : '英二'}</span>
                </div>
              </div>
              <div className="space-y-5 p-5">
                {cat.sections.map((section) => (
                  <div key={section.name}>
                    <div className="mb-3 flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-300">{section.name}</span>
                      <span className="rounded-full bg-white/5 px-2 py-0.5 text-xs text-slate-500">{section.weight}</span>
                    </div>
                    <div className="space-y-2.5">
                      {section.types.map((type) => {
                        const key = `${catKey}_${type.key}`
                        const state = genState[key]
                        return (
                          <div key={type.key} className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/5 px-4 py-3">
                            <Link href={`/quiz/${catKey}/${type.key}`} className="min-w-0 flex-1">
                              <div className="font-semibold text-slate-100">{type.label}</div>
                              <div className="mt-1 truncate text-xs text-slate-500">{type.desc}</div>
                            </Link>
                            <div className="flex items-center gap-2">
                              {state?.message ? <span className="text-xs text-slate-400">{state.message}</span> : null}
                              {showGen ? (
                                <button onClick={() => handleGenerate(catKey, type.key)} disabled={state?.loading} className="rounded-lg px-3 py-1.5 text-xs font-semibold" style={{ color: cat.color, background: `${cat.color}16`, border: `1px solid ${cat.color}30` }}>
                                  {state?.loading ? '生成中' : 'AI 生成'}
                                </button>
                              ) : null}
                              <Link href={`/quiz/${catKey}/${type.key}`} className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white" style={{ background: cat.color }}>
                                部署
                              </Link>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
