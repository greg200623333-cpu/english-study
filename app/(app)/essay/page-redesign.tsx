'use client'

import { useEffect, useState } from 'react'
import { getCurrentUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/client'
import { useWarRoomSync } from '@/hooks/useWarRoomSync'
import { ShieldAlert, Terminal, Send, Activity, Radio, Zap, FileText } from 'lucide-react'

type Essay = {
  id: number
  title: string
  content: string
  category: string
  score: number | null
  feedback: string | null
  created_at: string
}

const categories = [
  { key: 'cet4', label: 'CET-4 级战术', icon: '◉' },
  { key: 'cet6', label: 'CET-6 级战术', icon: '◎' },
  { key: 'kaoyan', label: '研究生级战略', icon: '◈' },
]

export default function EssayPage() {
  const [essays, setEssays] = useState<Essay[]>([])
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState('cet4')
  const [submitting, setSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState<'write' | 'history'>('write')
  const [selected, setSelected] = useState<Essay | null>(null)
  const [scanning, setScanning] = useState(false)
  const { syncEssayCompletion } = useWarRoomSync()

  const wordCount = content.trim().split(/\s+/).filter(Boolean).length
  const isReady = wordCount >= 50
  const readinessPercent = Math.min(100, (wordCount / 50) * 100)

  async function loadEssays() {
    const user = await getCurrentUser()
    if (!user) return
    const supabase = createClient()
    const { data } = await supabase.from('essays').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
    setEssays(data ?? [])
  }

  useEffect(() => {
    loadEssays()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmedContent = content.trim()
    const wordCount = trimmedContent.split(/\s+/).filter(Boolean).length

    if (!trimmedContent || wordCount < 50) {
      alert('战略政策内容至少需要 50 词')
      return
    }

    setScanning(true)
    setSubmitting(true)

    try {
      const res = await fetch('/api/essay/grade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content: trimmedContent, category }),
      })
      const { score, feedback, error } = await res.json()
      if (error) throw new Error(error)

      const user = await getCurrentUser()
      if (user) {
        const supabase = createClient()
        await supabase.from('essays').insert({
          user_id: user.id,
          title: title || '无代号政策',
          content: trimmedContent,
          category,
          score,
          feedback,
        })
      }

      syncEssayCompletion({ score: score ?? 0, category, wordCount })

      setTitle('')
      setContent('')
      await loadEssays()
      setActiveTab('history')
    } catch (err) {
      alert(err instanceof Error ? err.message : '执行失败')
    } finally {
      setTimeout(() => setScanning(false), 1500)
      setSubmitting(false)
    }
  }

  function scoreColor(score: number) {
    if (score >= 85) return 'text-emerald-400'
    if (score >= 70) return 'text-cyan-400'
    if (score >= 60) return 'text-amber-400'
    return 'text-rose-400'
  }

  return (
    <div className="min-h-screen" style={{ background: '#0a0b0f' }}>
      {/* Header */}
      <div className="glass mb-6 border-b border-cyan-500/20 p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded border border-cyan-500/30 bg-cyan-500/10">
            <Terminal className="h-6 w-6 text-cyan-400" />
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
        <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
          {/* Left/Center: Input Terminal */}
          <div className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Policy Code Input */}
              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-300">
                  <Radio className="h-4 w-4 text-cyan-400" />
                  政策代号 (Policy Code)
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="输入政策识别代号..."
                  className="w-full border border-cyan-500/30 bg-slate-950/80 px-4 py-3 font-mono text-sm text-white placeholder-slate-600 backdrop-blur-md transition focus:border-cyan-400 focus:outline-none"
                  style={{ borderRadius: 0 }}
                />
              </div>

              {/* Intervention Scale Selector */}
              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-300">
                  <Zap className="h-4 w-4 text-cyan-400" />
                  干预规模 (Intervention Scale)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat.key}
                      type="button"
                      onClick={() => setCategory(cat.key)}
                      className={`border px-4 py-3 text-sm font-medium transition ${
                        category === cat.key
                          ? 'border-cyan-400 bg-cyan-500/20 text-cyan-300'
                          : 'border-slate-700 bg-slate-900/50 text-slate-400 hover:border-slate-600 hover:bg-slate-800/50'
                      }`}
                      style={{ borderRadius: 0 }}
                    >
                      <span className="mr-2">{cat.icon}</span>
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Terminal Input Box */}
              <div className="relative">
                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-300">
                  <Terminal className="h-4 w-4 text-cyan-400" />
                  战略政策撰写 (Strategic Policy Drafting)
                </label>

                {/* L-shaped Corner Borders */}
                <div className="relative">
                  {/* Top-left corner */}
                  <div className="absolute left-0 top-0 h-4 w-4 border-l-2 border-t-2 border-cyan-400" />
                  {/* Top-right corner */}
                  <div className="absolute right-0 top-0 h-4 w-4 border-r-2 border-t-2 border-cyan-400" />
                  {/* Bottom-left corner */}
                  <div className="absolute bottom-0 left-0 h-4 w-4 border-b-2 border-l-2 border-cyan-400" />
                  {/* Bottom-right corner */}
                  <div className="absolute bottom-0 right-0 h-4 w-4 border-b-2 border-r-2 border-cyan-400" />

                  {/* Status Indicator Light */}
                  <div className="absolute right-4 top-4 z-10 flex items-center gap-2">
                    <div
                      className={`h-2 w-2 rounded-full ${isReady ? 'bg-emerald-400' : 'bg-rose-400 animate-pulse'}`}
                    />
                    <span className="text-xs font-mono text-slate-500">
                      {wordCount}/50
                    </span>
                  </div>

                  {/* Scanning Line */}
                  {scanning && (
                    <div className="absolute left-0 right-0 top-0 z-20 h-0.5 bg-cyan-400 shadow-[0_0_10px_#00E5FF] animate-scan" />
                  )}

                  {/* Textarea with Grid Background */}
                  <div className="relative">
                    <div
                      className="pointer-events-none absolute inset-0 opacity-10"
                      style={{
                        backgroundImage: 'linear-gradient(#00E5FF 1px, transparent 1px), linear-gradient(90deg, #00E5FF 1px, transparent 1px)',
                        backgroundSize: '20px 20px',
                      }}
                    />
                    <textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="// 开始撰写战略政策内容...&#10;// 最低要求: 50 词&#10;// 系统将自动进行逻辑稳健度分析"
                      rows={16}
                      className="relative w-full border border-cyan-500/30 bg-slate-950/80 p-6 font-mono text-sm leading-relaxed text-white placeholder-slate-700 backdrop-blur-md transition focus:border-cyan-400 focus:outline-none"
                      style={{
                        borderRadius: 0,
                        caretColor: '#00E5FF',
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting || !isReady}
                className="group relative w-full overflow-hidden border border-cyan-500/50 bg-cyan-500/10 py-4 font-bold text-cyan-300 transition hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-40"
                style={{ borderRadius: 0 }}
              >
                <div className="relative z-10 flex items-center justify-center gap-2">
                  <Send className="h-5 w-5" />
                  {submitting ? '正在执行全球广播...' : '执行全球广播 (Execute Global Broadcast)'}
                </div>
                {!submitting && (
                  <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                )}
              </button>
            </form>
          </div>

          {/* Right Sidebar: Status Monitors */}
          <div className="space-y-4">
            {/* Panel A: Strategic Environment Monitor */}
            <div className="border border-cyan-500/20 bg-slate-950/60 p-4 backdrop-blur-md">
              <div className="mb-3 flex items-center gap-2 border-b border-cyan-500/20 pb-2">
                <Activity className="h-4 w-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-cyan-300">战略环境监测</h3>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">系统状态</span>
                  <span className="font-mono text-emerald-400">OPERATIONAL</span>
                </div>
                <div className="h-16 border border-cyan-500/20 bg-slate-900/50 p-2">
                  <div className="font-mono text-[10px] leading-tight text-cyan-500/60">
                    0xA3F2 0x89BC 0x4D1E 0xF7A9<br />
                    0x2C84 0xB6F3 0x91D7 0x5E2A<br />
                    0x7F4B 0xC8E1 0x3A96 0xD5F8
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="h-1 flex-1 bg-cyan-500/30" />
                  <div className="h-1 flex-1 bg-cyan-500/50" />
                  <div className="h-1 flex-1 bg-cyan-500/70" />
                  <div className="h-1 flex-1 bg-cyan-500" />
                </div>
              </div>
            </div>

            {/* Panel B: Command Parameter Analysis */}
            <div className="border border-cyan-500/20 bg-slate-950/60 p-4 backdrop-blur-md">
              <div className="mb-3 flex items-center gap-2 border-b border-cyan-500/20 pb-2">
                <ShieldAlert className="h-4 w-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-cyan-300">指令参数分析</h3>
              </div>
              <div className="space-y-3">
                <div>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="text-slate-400">字数统计</span>
                    <span className="font-mono text-white">{wordCount} WORDS</span>
                  </div>
                  <div className="h-1 bg-slate-800">
                    <div
                      className="h-full bg-gradient-to-r from-rose-500 via-amber-500 to-emerald-500 transition-all"
                      style={{ width: `${Math.min(100, (wordCount / 200) * 100)}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="text-slate-400">逻辑稳健度</span>
                    <span className="font-mono text-cyan-400">
                      {wordCount < 50 ? 'INSUFFICIENT' : wordCount < 100 ? 'MODERATE' : 'ROBUST'}
                    </span>
                  </div>
                  <div className="grid grid-cols-10 gap-0.5">
                    {Array.from({ length: 10 }).map((_, i) => (
                      <div
                        key={i}
                        className={`h-2 ${i < Math.floor(wordCount / 20) ? 'bg-cyan-500' : 'bg-slate-800'}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Panel C: Execution Readiness */}
            <div className="border border-cyan-500/20 bg-slate-950/60 p-4 backdrop-blur-md">
              <div className="mb-3 flex items-center gap-2 border-b border-cyan-500/20 pb-2">
                <Zap className="h-4 w-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-cyan-300">执行就绪状态</h3>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">准备度</span>
                  <span className={`font-mono font-bold ${isReady ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {readinessPercent.toFixed(0)}%
                  </span>
                </div>
                <div className="h-2 bg-slate-800">
                  <div
                    className={`h-full transition-all ${isReady ? 'bg-emerald-500' : 'bg-rose-500'}`}
                    style={{ width: `${readinessPercent}%` }}
                  />
                </div>
                <div className="text-center text-xs font-mono text-slate-500">
                  {isReady ? '✓ READY FOR BROADCAST' : '⚠ AWAITING MINIMUM THRESHOLD'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && !selected && (
        <div className="space-y-3">
          {essays.length === 0 ? (
            <div className="border border-cyan-500/20 bg-slate-950/60 p-12 text-center backdrop-blur-md">
              <Terminal className="mx-auto mb-3 h-12 w-12 text-slate-700" />
              <p className="text-slate-500">暂无历史政策档案</p>
            </div>
          ) : (
            essays.map((essay) => (
              <button
                key={essay.id}
                onClick={() => setSelected(essay)}
                className="w-full border border-cyan-500/20 bg-slate-950/60 p-4 text-left backdrop-blur-md transition hover:border-cyan-400/50 hover:bg-slate-900/60"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-bold text-white">{essay.title}</h3>
                    <div className="mt-1 text-xs text-slate-500">
                      {categories.find((c) => c.key === essay.category)?.label} · {new Date(essay.created_at).toLocaleDateString('zh-CN')}
                    </div>
                  </div>
                  {essay.score != null && (
                    <div className={`text-2xl font-bold ${scoreColor(essay.score)}`}>
                      {essay.score}
                    </div>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      )}

      {/* Detail View */}
      {activeTab === 'history' && selected && (
        <div>
          <button
            onClick={() => setSelected(null)}
            className="mb-4 text-sm text-cyan-400 hover:text-cyan-300"
          >
            ← 返回档案列表
          </button>
          <div className="border border-cyan-500/20 bg-slate-950/60 p-6 backdrop-blur-md">
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
                  <div className="text-xs text-slate-500">战术评级</div>
                </div>
              )}
            </div>

            <div className="mb-4 border border-cyan-500/20 bg-slate-900/50 p-4 font-mono text-sm leading-relaxed text-slate-300">
              {selected.content}
            </div>

            {selected.feedback && (
              <div className="border-t border-cyan-500/20 pt-4">
                <h3 className="mb-2 flex items-center gap-2 font-semibold text-cyan-300">
                  <Activity className="h-4 w-4" />
                  AI 战术分析反馈
                </h3>
                <div className="whitespace-pre-wrap text-sm leading-relaxed text-slate-400">{selected.feedback}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CSS for Scanning Animation */}
      <style jsx>{`
        @keyframes scan {
          0% {
            top: 0;
          }
          100% {
            top: 100%;
          }
        }
        .animate-scan {
          animation: scan 1.5s linear infinite;
        }
      `}</style>
    </div>
  )
}
