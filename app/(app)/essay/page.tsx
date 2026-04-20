'use client'

import { useEffect, useState } from 'react'
import { getCurrentUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/client'
import { useWarRoomSync } from '@/hooks/useWarRoomSync'
import { useEssayStore } from '@/store/essayStore'
import { ShieldAlert, Activity, FileText, FileEdit } from 'lucide-react'
import StrategicEssayInput from '@/components/essay/StrategicEssayInput'

type Essay = {
  id: number
  title: string
  content: string
  category: string
  score: number | null
  feedback: string | null
  created_at: string
}

type EssayPrompt = {
  id: string
  examType: string
  year: number
  season: number
  set: number
  prompt: string
  modelEssay: string
}

const categories = [
  { key: 'cet4', label: 'CET-4 级战术', icon: '◉' },
  { key: 'cet6', label: 'CET-6 级战术', icon: '◎' },
  { key: 'kaoyan', label: '研究生级战略', icon: '◈' },
]

export default function EssayPage() {
  const [essays, setEssays] = useState<Essay[]>([])
  const [activeTab, setActiveTab] = useState<'write' | 'history' | 'exercises'>('write')
  const [selected, setSelected] = useState<Essay | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const { syncEssayCompletion } = useWarRoomSync()

  const [essayPrompts, setEssayPrompts] = useState<EssayPrompt[]>([])
  const [selectedYear, setSelectedYear] = useState<number | null>(null)
  const [selectedSeason, setSelectedSeason] = useState<number | null>(null)
  const [selectedSet, setSelectedSet] = useState<number | null>(null)
  const [selectedPrompt, setSelectedPrompt] = useState<EssayPrompt | null>(null)
  const [showModelEssay, setShowModelEssay] = useState(false)
  const [decryptingPrompt, setDecryptingPrompt] = useState(false)

  const { resetQuotaIfNeeded, setActiveTopic } = useEssayStore()

  async function loadEssayPrompts() {
    try {
      const res = await fetch('/data/essay-prompts.json')
      if (res.ok) {
        const data = await res.json()
        setEssayPrompts(data)
      }
    } catch {
      // silently ignore
    }
  }

  async function loadEssays(uid: string) {
    try {
      const supabase = createClient()
      const { data } = await supabase.from('essays').select('*').eq('user_id', uid).order('created_at', { ascending: false })
      setEssays(data ?? [])
    } catch {
      // non-critical, silently ignore
    }
  }

  useEffect(() => {
    resetQuotaIfNeeded()
    getCurrentUser().then((user) => {
      if (!user) return
      setUserId(user.id)
      loadEssays(user.id)
    })
    loadEssayPrompts()
  }, [resetQuotaIfNeeded])

  function scoreColor(score: number) {
    if (score >= 85) return 'text-emerald-400'
    if (score >= 70) return 'text-cyan-400'
    if (score >= 60) return 'text-amber-400'
    return 'text-rose-400'
  }

  function handleLoadPrompt(prompt: EssayPrompt) {
    setDecryptingPrompt(true)
    setSelectedPrompt(prompt)
    setShowModelEssay(false)

    // 设置 activeTopic 到 store
    setActiveTopic(prompt.prompt)

    setTimeout(() => {
      setDecryptingPrompt(false)
      setActiveTab('write')
    }, 800)
  }

  // Derived filter values from loaded prompts
  const availableYears = [...new Set(essayPrompts.map(p => p.year))].sort((a, b) => b - a)
  const availableSeasons = selectedYear
    ? [...new Set(essayPrompts.filter(p => p.year === selectedYear).map(p => p.season))].sort((a, b) => a - b)
    : []
  const availableSets = selectedYear && selectedSeason
    ? [...new Set(essayPrompts.filter(p => p.year === selectedYear && p.season === selectedSeason).map(p => p.set))].sort()
    : []
  const filteredPrompts = essayPrompts.filter(p => {
    if (selectedYear && p.year !== selectedYear) return false
    if (selectedSeason && p.season !== selectedSeason) return false
    if (selectedSet && p.set !== selectedSet) return false
    return true
  })

  return (
    <div className="min-h-screen" style={{ background: '#0a0b0f' }}>
      {/* Header */}
      <div className="glass mb-6 border-b border-cyan-500/20 p-4 md:p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded border border-cyan-500/30 bg-cyan-500/10">
            <FileEdit className="h-6 w-6 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">政策输出部</h1>
            <p className="text-sm text-slate-400">Strategic Policy Output Division</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-6 flex gap-2">
          <button
            onClick={() => setActiveTab('write')}
            className={`flex items-center gap-2 border-b-2 px-4 py-2 text-sm font-medium transition ${
              activeTab === 'write' ? 'border-cyan-400 text-cyan-400' : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            <ShieldAlert className="h-4 w-4" />
            战略撰写
          </button>
          <button
            onClick={() => setActiveTab('exercises')}
            className={`flex items-center gap-2 border-b-2 px-4 py-2 text-sm font-medium transition ${
              activeTab === 'exercises' ? 'border-cyan-400 text-cyan-400' : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            <Activity className="h-4 w-4" />
            历年演习
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 border-b-2 px-4 py-2 text-sm font-medium transition ${
              activeTab === 'history' ? 'border-cyan-400 text-cyan-400' : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            <FileText className="h-4 w-4" />
            历史档案
          </button>
        </div>
      </div>

      {/* Main Content */}
      {activeTab === 'write' && (
        <div className="space-y-4">
          {/* Strategic Essay Input Component */}
          <StrategicEssayInput />
        </div>
      )}
      {/* History Tab */}
      {activeTab === 'history' && !selected && (
        <div className="space-y-3">
          {essays.length === 0 && (
            <div className="border border-cyan-500/20 bg-slate-950/50 p-12 text-center backdrop-blur-md" style={{ borderRadius: 0 }}>
              <FileText className="mx-auto mb-3 h-12 w-12 text-slate-600" />
              <p className="text-slate-400">暂无历史政策档案</p>
            </div>
          )}
          {essays.map((essay) => (
            <button
              key={essay.id}
              onClick={() => setSelected(essay)}
              className="w-full border border-cyan-500/20 bg-slate-950/50 p-4 text-left backdrop-blur-md transition hover:border-cyan-500/40 hover:bg-slate-950/70"
              style={{ borderRadius: 0 }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-medium text-white">{essay.title}</h3>
                  <div className="mt-1 flex items-center gap-3 text-xs text-slate-500">
                    <span>{categories.find((c) => c.key === essay.category)?.label}</span>
                    <span>·</span>
                    <span>{new Date(essay.created_at).toLocaleDateString('zh-CN')}</span>
                    <span>·</span>
                    <span>{essay.content.trim().split(/\s+/).filter(Boolean).length} 词</span>
                  </div>
                </div>
                {essay.score != null && (
                  <div className="ml-4 text-right">
                    <div className={`text-2xl font-bold ${scoreColor(essay.score)}`}>{essay.score}</div>
                    <div className="text-xs text-slate-500">分</div>
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Detail View */}
      {activeTab === 'history' && selected && (
        <div>
          <button
            onClick={() => setSelected(null)}
            className="mb-4 border border-cyan-500/30 bg-slate-950/50 px-4 py-2 text-sm text-cyan-400 backdrop-blur-md transition hover:bg-slate-950/70"
            style={{ borderRadius: 0 }}
          >
            ← 返回档案列表
          </button>
          <div className="border border-cyan-500/30 bg-slate-950/80 p-4 md:p-6 backdrop-blur-md" style={{ borderRadius: 0 }}>
            <div className="mb-4 flex items-start justify-between border-b border-cyan-500/20 pb-4">
              <div>
                <h2 className="text-xl font-bold text-white">{selected.title}</h2>
                <div className="mt-1 text-sm text-slate-400">
                  {categories.find((c) => c.key === selected.category)?.label} · {new Date(selected.created_at).toLocaleDateString('zh-CN')}
                </div>
              </div>
              {selected.score != null && (
                <div className="text-center">
                  <div className={`text-4xl font-bold ${scoreColor(selected.score)}`}>{selected.score}</div>
                  <div className="text-xs text-slate-400">分</div>
                </div>
              )}
            </div>

            <div className="mb-4 border border-cyan-500/20 bg-slate-950/50 p-4 font-mono text-sm leading-relaxed text-slate-200" style={{ borderRadius: 0 }}>
              {selected.content}
            </div>

            {selected.feedback && (
              <div className="border-t border-cyan-500/20 pt-4">
                <h3 className="mb-2 font-semibold text-cyan-400">AI 战略评估反馈</h3>
                <div className="whitespace-pre-wrap text-sm leading-relaxed text-slate-300">{selected.feedback}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Exercises Tab */}
      {activeTab === 'exercises' && (
        <div className="space-y-6">
          {/* Decrypting Animation */}
          {decryptingPrompt && (
            <div className="border border-cyan-500/30 bg-slate-950/80 p-8 text-center backdrop-blur-md" style={{ borderRadius: 0 }}>
              <div className="mb-4 text-cyan-400">
                <Activity className="mx-auto h-12 w-12 animate-pulse" />
              </div>
              <div className="font-mono text-sm text-cyan-400">档案解密中...</div>
              <div className="mt-2 text-xs text-slate-500">DECRYPTING ARCHIVE...</div>
            </div>
          )}

          {!decryptingPrompt && (
            <>
              {/* Filter Matrix */}
              <div className="border border-cyan-500/30 bg-slate-950/80 p-6 backdrop-blur-md" style={{ borderRadius: 0 }}>
                <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-white">
                  <Activity className="h-5 w-5 text-cyan-400" />
                  历年演习档案筛选
                </h2>

                <div className="grid gap-4 md:grid-cols-3">
                  {/* Year Filter */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-300">年份 (Year)</label>
                    <select
                      value={selectedYear ?? ''}
                      onChange={(e) => {
                        setSelectedYear(e.target.value ? parseInt(e.target.value) : null)
                        setSelectedSeason(null)
                        setSelectedSet(null)
                      }}
                      className="w-full border border-cyan-500/30 bg-slate-950/80 px-4 py-2 text-sm text-white backdrop-blur-md transition focus:border-cyan-400 focus:outline-none"
                      style={{ borderRadius: 0 }}
                    >
                      <option value="">全部年份</option>
                      {availableYears.map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>

                  {/* Season Filter */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-300">季度 (Season)</label>
                    <select
                      value={selectedSeason ?? ''}
                      onChange={(e) => {
                        setSelectedSeason(e.target.value ? parseInt(e.target.value) : null)
                        setSelectedSet(null)
                      }}
                      disabled={!selectedYear}
                      className="w-full border border-cyan-500/30 bg-slate-950/80 px-4 py-2 text-sm text-white backdrop-blur-md transition focus:border-cyan-400 focus:outline-none disabled:opacity-50"
                      style={{ borderRadius: 0 }}
                    >
                      <option value="">全部季度</option>
                      {availableSeasons.map(season => (
                        <option key={season} value={season}>{season}月</option>
                      ))}
                    </select>
                  </div>

                  {/* Set Filter */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-300">套卷 (Set)</label>
                    <select
                      value={selectedSet ?? ''}
                      onChange={(e) => setSelectedSet(e.target.value ? parseInt(e.target.value) : null)}
                      disabled={!selectedYear || !selectedSeason}
                      className="w-full border border-cyan-500/30 bg-slate-950/80 px-4 py-2 text-sm text-white backdrop-blur-md transition focus:border-cyan-400 focus:outline-none disabled:opacity-50"
                      style={{ borderRadius: 0 }}
                    >
                      <option value="">全部套卷</option>
                      {availableSets.map(set => (
                        <option key={set} value={set}>Set {set}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Prompt List */}
              <div className="grid gap-4 md:grid-cols-2">
                {filteredPrompts.map(prompt => (
                  <div
                    key={prompt.id}
                    className="border border-cyan-500/30 bg-slate-950/80 p-4 backdrop-blur-md transition hover:border-cyan-400"
                    style={{ borderRadius: 0 }}
                  >
                    <div className="mb-3 flex items-start justify-between">
                      <div>
                        <div className="text-sm font-bold text-cyan-400">
                          {prompt.examType.toUpperCase()} · {prompt.year}.{prompt.season < 10 ? '0' + prompt.season : prompt.season} · Set {prompt.set}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          {categories.find(c => c.key === prompt.examType)?.label}
                        </div>
                      </div>
                    </div>

                    <div className="mb-4 line-clamp-3 text-sm text-slate-300">
                      {prompt.prompt.substring(0, 150)}...
                    </div>

                    <button
                      onClick={() => handleLoadPrompt(prompt)}
                      className="w-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-400 transition hover:bg-cyan-500/20"
                      style={{ borderRadius: 0 }}
                    >
                      载入题目
                    </button>
                  </div>
                ))}
              </div>

              {filteredPrompts.length === 0 && (
                <div className="border border-cyan-500/30 bg-slate-950/80 p-8 text-center backdrop-blur-md" style={{ borderRadius: 0 }}>
                  <div className="text-slate-500">暂无符合条件的演习档案</div>
                </div>
              )}

              {/* Model Essay Display */}
              {selectedPrompt && showModelEssay && (
                <div className="border border-cyan-500/30 bg-slate-950/80 p-6 backdrop-blur-md" style={{ borderRadius: 0 }}>
                  <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-white">
                    <FileText className="h-5 w-5 text-cyan-400" />
                    参考范文
                  </h3>
                  <div className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-slate-200">
                    {selectedPrompt.modelEssay}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
