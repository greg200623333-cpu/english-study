'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useWarRoomSync } from '@/hooks/useWarRoomSync'

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
  { key: 'cet4', label: '四级作文' },
  { key: 'cet6', label: '六级作文' },
  { key: 'kaoyan', label: '考研作文' },
]

export default function EssayPage() {
  const [essays, setEssays] = useState<Essay[]>([])
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState('cet4')
  const [submitting, setSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState<'write' | 'history'>('write')
  const [selected, setSelected] = useState<Essay | null>(null)
  const { syncEssayCompletion } = useWarRoomSync()

  async function loadEssays() {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return
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
      alert('作文内容至少 50 词')
      return
    }

    setSubmitting(true)

    try {
      const res = await fetch('/api/essay/grade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content: trimmedContent, category }),
      })
      const { score, feedback, error } = await res.json()
      if (error) throw new Error(error)

      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        await supabase.from('essays').insert({
          user_id: user.id,
          title: title || '无标题',
          content: trimmedContent,
          category,
          score,
          feedback,
        })
      }

      syncEssayCompletion({ score: score ?? 0, category, wordCount })
      setTitle('')
      setContent('')
      setActiveTab('history')
      await loadEssays()
    } catch {
      alert('批改失败，请检查 API Key 配置')
    } finally {
      setSubmitting(false)
    }
  }

  const scoreColor = (s: number) => (s >= 80 ? 'text-green-600' : s >= 60 ? 'text-yellow-600' : 'text-red-600')

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">作文练习</h1>
        <p className="mt-1 text-gray-500">提交作文后，AI 批改结果会同步回战情室写作产能与总 GDP</p>
      </div>

      <div className="mb-6 flex gap-3">
        {(['write', 'history'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab)
              setSelected(null)
            }}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {tab === 'write' ? '写作文' : '历史记录'}
          </button>
        ))}
      </div>

      {activeTab === 'write' && (
        <div className="max-w-2xl">
          <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="mb-1.5 block text-sm font-medium text-gray-700">标题（选填）</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="作文标题"
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">类型</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="rounded-xl border border-gray-200 px-4 py-2.5 text-gray-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {categories.map((c) => (
                    <option key={c.key} value={c.key}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">作文内容</label>
              <textarea
                required
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={12}
                placeholder="在此输入你的英文作文，至少 50 词..."
                className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 font-mono text-sm text-gray-900 placeholder-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="mt-1 text-right text-xs text-gray-400">{content.trim().split(/\s+/).filter(Boolean).length} 词</div>
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-blue-600 py-3 font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? 'AI 批改中...' : '提交批改'}
            </button>
          </form>
        </div>
      )}

      {activeTab === 'history' && !selected && (
        <div className="max-w-2xl space-y-3">
          {essays.length === 0 ? (
            <div className="py-16 text-center text-gray-500">
              <div className="mb-3 text-4xl">📝</div>
              <p>暂无作文记录，去写一篇吧</p>
            </div>
          ) : (
            essays.map((essay) => (
              <div
                key={essay.id}
                onClick={() => setSelected(essay)}
                className="cursor-pointer rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="mb-2 flex items-center justify-between">
                  <div className="font-semibold text-gray-900">{essay.title}</div>
                  {essay.score != null && <span className={`text-2xl font-bold ${scoreColor(essay.score)}`}>{essay.score}</span>}
                </div>
                <div className="line-clamp-2 text-sm text-gray-500">{essay.content}</div>
                <div className="mt-3 flex items-center gap-3 text-xs text-gray-400">
                  <span>{categories.find((c) => c.key === essay.category)?.label}</span>
                  <span>{new Date(essay.created_at).toLocaleDateString('zh-CN')}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'history' && selected && (
        <div className="max-w-2xl">
          <button onClick={() => setSelected(null)} className="mb-4 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900">
            ← 返回列表
          </button>
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{selected.title}</h2>
                <div className="mt-1 text-sm text-gray-400">
                  {categories.find((c) => c.key === selected.category)?.label} · {new Date(selected.created_at).toLocaleDateString('zh-CN')}
                </div>
              </div>
              {selected.score != null && (
                <div className="text-center">
                  <div className={`text-4xl font-bold ${scoreColor(selected.score)}`}>{selected.score}</div>
                  <div className="text-xs text-gray-400">分</div>
                </div>
              )}
            </div>

            <div className="mb-4 whitespace-pre-wrap rounded-xl bg-gray-50 p-4 font-mono text-sm leading-relaxed text-gray-800">
              {selected.content}
            </div>

            {selected.feedback && (
              <div className="border-t border-gray-100 pt-4">
                <h3 className="mb-2 font-semibold text-gray-900">AI 批改反馈</h3>
                <div className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">{selected.feedback}</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
