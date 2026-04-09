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
  const [showMonitors, setShowMonitors] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const { syncEssayCompletion } = useWarRoomSync()

  const wordCount = content.trim().split(/\s+/).filter(Boolean).length
  const isReady = wordCount >= 50
  const readinessPercent = Math.min(100, (wordCount / 50) * 100)

  useEffect(() => {
    getCurrentUser().then((user) => {
      if (!user) return
      setUserId(user.id)
      loadEssays(user.id)
    })
  }, [])

  async function loadEssays(uid: string) {
    try {
      const supabase = createClient()
      const { data } = await supabase.from('essays').select('*').eq('user_id', uid).order('created_at', { ascending: false })
      setEssays(data ?? [])
    } catch {
      // non-critical, silently ignore
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmedContent = content.trim()
    const wc = trimmedContent.split(/\s+/).filter(Boolean).length

    if (!trimmedContent || wc < 50) {
      alert('战略政策内容至少需要 50 词')
      return
    }
    if (!userId) {
      alert('请先登录')
      return
    }

    setScanning(true)
    setSubmitting(true)

    try {
      // Save first to prevent data loss if grading fails
      const supabase = createClient()
      const { data: saved, error: saveError } = await supabase.from('essays').insert({
        user_id: userId,
        title: title || '无代号政策',
        content: trimmedContent,
        category,
        score: null,
        feedback: null,
      }).select('id').single()

      if (saveError) throw new Error('保存失败')

      // Then grade
      const res = await fetch('/api/essay/grade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content: trimmedContent, category }),
      })
      const { score, feedback, error } = await res.json()
      if (error) throw new Error(error)

      // Update with grade results
      await supabase.from('essays').update({ score, feedback }).eq('id', saved.id)

      syncEssayCompletion({ score: score ?? 0, category, wordCount: wc })

      setTitle('')
      setContent('')
      await loadEssays(userId)
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
        <div className="space-y-4">
          {/* Mobile Monitor Toggle Button */}
          <button
            type="button"
            onClick={() => setShowMonitors(!showMonitors)}
            className="flex w-full items-center justify-between border border-cyan-500/30 bg-slate-950/80 px-4 py-3 text-sm font-medium text-cyan-400 backdrop-blur-md transition hover:bg-slate-950/90 lg:hidden"
            style={{ borderRadius: 0 }}
          >
            <span className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              状态监控面板
            </span>
            <span className="text-xs">{showMonitors ? '▲ 收起' : '▼ 展开'}</span>
          </button>

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
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  {categories.map((cat) => (
                    <button
                      key={cat.key}
                      type="button"
                      onClick={() => setCategory(cat.key)}
                      className={`border px-4 py-2.5 text-sm font-medium transition ${
                        category === cat.key
                          ? 'border-cyan-400 bg-cyan-500/10 text-cyan-400'
                          : 'border-slate-700 bg-slate-900/50 text-slate-400 hover:border-slate-600 hover:text-slate-300'
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
                  政策内容 (Policy Content)
                </label>

                <div className="relative overflow-hidden border border-cyan-500/30 bg-slate-950/90 backdrop-blur-md" style={{ borderRadius: 0 }}>
                  {/* Grid Background Overlay */}
                  <div
                    className="pointer-events-none absolute inset-0 opacity-10"
                    style={{
                      backgroundImage: 'linear-gradient(#00e5ff 1px, transparent 1px), linear-gradient(90deg, #00e5ff 1px, transparent 1px)',
                      backgroundSize: '20px 20px',
                    }}
                  />

                  {/* L-shaped Corner Borders */}
                  <div className="pointer-events-none absolute left-0 top-0 h-6 w-6 border-l-2 border-t-2 border-cyan-400" />
                  <div className="pointer-events-none absolute right-0 top-0 h-6 w-6 border-r-2 border-t-2 border-cyan-400" />
                  <div className="pointer-events-none absolute bottom-0 left-0 h-6 w-6 border-b-2 border-l-2 border-cyan-400" />
                  <div className="pointer-events-none absolute bottom-0 right-0 h-6 w-6 border-b-2 border-r-2 border-cyan-400" />

                  {/* Scanning Line (only when submitting) */}
                  {scanning && <div className="absolute left-0 right-0 top-0 z-20 h-0.5 bg-cyan-400 shadow-[0_0_10px_#00E5FF] animate-scan" />}

                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="输入战略政策内容... (最少 50 词)"
                    rows={8}
                    className="relative z-10 w-full bg-transparent p-6 font-mono text-sm leading-relaxed text-white placeholder-slate-600 focus:outline-none sm:rows-12"
                    style={{
                      caretColor: '#00e5ff',
                      caretShape: 'block',
                    }}
                  />

                  {/* Word Count Footer */}
                  <div className="relative z-10 flex items-center justify-between border-t border-cyan-500/20 bg-slate-950/50 px-4 py-2 text-xs">
                    <span className="text-slate-500">字数统计</span>
                    <span className={`font-mono ${wordCount >= 50 ? 'text-cyan-400' : 'text-amber-400'}`}>
                      {wordCount} / 50 词
                    </span>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting || !isReady}
                className="flex w-full items-center justify-center gap-2 border border-cyan-500/50 bg-cyan-500/10 px-6 py-3 font-medium text-cyan-400 transition hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-40"
                style={{ borderRadius: 0 }}
              >
                <Send className="h-4 w-4" />
                {submitting ? '执行中...' : '提交政策'}
              </button>
            </form>
          </div>

          {/* Right: Status Monitors */}
          <div className={`space-y-4 ${showMonitors ? 'block' : 'hidden'} lg:block`}>
            {/* Monitor 1: Strategic Environment */}
            <div className="border border-cyan-500/30 bg-slate-950/80 p-4 backdrop-blur-md" style={{ borderRadius: 0 }}>
              <div className="mb-3 flex items-center gap-2 border-b border-cyan-500/20 pb-2">
                <Activity className="h-4 w-4 text-cyan-400" />
                <h3 className="text-sm font-medium text-cyan-400">战略环境监测</h3>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">当前干预规模</span>
                  <span className="font-mono text-white">{categories.find((c) => c.key === category)?.label}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">政策代号</span>
                  <span className="font-mono text-white">{title || '未设定'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">系统状态</span>
                  <span className="font-mono text-emerald-400">在线</span>
                </div>
              </div>
            </div>

            {/* Monitor 2: Parameter Analysis */}
            <div className="border border-cyan-500/30 bg-slate-950/80 p-4 backdrop-blur-md" style={{ borderRadius: 0 }}>
              <div className="mb-3 flex items-center gap-2 border-b border-cyan-500/20 pb-2">
                <Zap className="h-4 w-4 text-cyan-400" />
                <h3 className="text-sm font-medium text-cyan-400">指令参数分析</h3>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">内容长度</span>
                  <span className={`font-mono ${wordCount >= 50 ? 'text-emerald-400' : 'text-amber-400'}`}>{wordCount} 词</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">最低要求</span>
                  <span className="font-mono text-slate-500">50 词</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">完成度</span>
                  <span className="font-mono text-cyan-400">{readinessPercent.toFixed(0)}%</span>
                </div>
              </div>
            </div>

            {/* Monitor 3: Execution Readiness */}
            <div className="border border-cyan-500/30 bg-slate-950/80 p-4 backdrop-blur-md" style={{ borderRadius: 0 }}>
              <div className="mb-3 flex items-center gap-2 border-b border-cyan-500/20 pb-2">
                <ShieldAlert className="h-4 w-4 text-cyan-400" />
                <h3 className="text-sm font-medium text-cyan-400">执行就绪状态</h3>
              </div>
              <div className="flex items-center gap-3">
                <div
                  className={`h-3 w-3 rounded-full ${isReady ? 'bg-emerald-400 shadow-[0_0_10px_#34d399]' : 'bg-rose-400 shadow-[0_0_10px_#fb7185]'}`}
                  style={{
                    animation: isReady ? 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' : 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                  }}
                />
                <span className={`text-xs font-medium ${isReady ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {isReady ? '就绪 - 可执行' : '待命 - 内容不足'}
                </span>
              </div>
            </div>
          </div>
        </div>
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
          <div className="border border-cyan-500/30 bg-slate-950/80 p-6 backdrop-blur-md" style={{ borderRadius: 0 }}>
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
    </div>
  )
}
