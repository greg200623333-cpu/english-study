'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

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

  async function loadEssays() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('essays')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    setEssays(data ?? [])
  }

  useEffect(() => { loadEssays() }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim() || content.trim().length < 50) {
      alert('作文内容至少 50 字')
      return
    }
    setSubmitting(true)

    try {
      const res = await fetch('/api/essay/grade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content, category }),
      })
      const { score, feedback, error } = await res.json()
      if (error) throw new Error(error)

      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase.from('essays').insert({
          user_id: user.id,
          title: title || '无标题',
          content,
          category,
          score,
          feedback,
        })
      }

      setTitle('')
      setContent('')
      setActiveTab('history')
      await loadEssays()
    } catch (err) {
      alert('批改失败，请检查 API Key 配置')
    } finally {
      setSubmitting(false)
    }
  }

  const scoreColor = (s: number) =>
    s >= 80 ? 'text-green-600' : s >= 60 ? 'text-yellow-600' : 'text-red-600'

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">作文练习</h1>
        <p className="text-gray-500 mt-1">提交作文，DeepSeek AI 即时批改评分</p>
      </div>

      <div className="flex gap-3 mb-6">
        {(['write', 'history'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab); setSelected(null) }}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              activeTab === tab ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {tab === 'write' ? '✍️ 写作文' : '📋 历史记录'}
          </button>
        ))}
      </div>

      {activeTab === 'write' && (
        <div className="max-w-2xl">
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">标题（选填）</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="作文标题"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">类型</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="px-4 py-2.5 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {categories.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">作文内容</label>
              <textarea
                required
                value={content}
                onChange={e => setContent(e.target.value)}
                rows={12}
                placeholder="在此输入你的英文作文，至少 50 字..."
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-sm"
              />
              <div className="text-xs text-gray-400 mt-1 text-right">{content.trim().split(/\s+/).filter(Boolean).length} 词</div>
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {submitting ? '🤖 AI 批改中...' : '提交批改'}
            </button>
          </form>
        </div>
      )}

      {activeTab === 'history' && !selected && (
        <div className="space-y-3 max-w-2xl">
          {essays.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <div className="text-4xl mb-3">📝</div>
              <p>暂无作文记录，去写一篇吧</p>
            </div>
          ) : essays.map(e => (
            <div
              key={e.id}
              onClick={() => setSelected(e)}
              className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="font-semibold text-gray-900">{e.title}</div>
                {e.score != null && (
                  <span className={`text-2xl font-bold ${scoreColor(e.score)}`}>{e.score}</span>
                )}
              </div>
              <div className="text-sm text-gray-500 line-clamp-2">{e.content}</div>
              <div className="flex items-center gap-3 mt-3 text-xs text-gray-400">
                <span>{categories.find(c => c.key === e.category)?.label}</span>
                <span>{new Date(e.created_at).toLocaleDateString('zh-CN')}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'history' && selected && (
        <div className="max-w-2xl">
          <button onClick={() => setSelected(null)} className="flex items-center gap-1 text-gray-500 hover:text-gray-900 text-sm mb-4">
            ← 返回列表
          </button>
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{selected.title}</h2>
                <div className="text-sm text-gray-400 mt-1">
                  {categories.find(c => c.key === selected.category)?.label} · {new Date(selected.created_at).toLocaleDateString('zh-CN')}
                </div>
              </div>
              {selected.score != null && (
                <div className="text-center">
                  <div className={`text-4xl font-bold ${scoreColor(selected.score)}`}>{selected.score}</div>
                  <div className="text-xs text-gray-400">分</div>
                </div>
              )}
            </div>

            <div className="bg-gray-50 rounded-xl p-4 mb-4 text-sm text-gray-800 leading-relaxed font-mono whitespace-pre-wrap">
              {selected.content}
            </div>

            {selected.feedback && (
              <div className="border-t border-gray-100 pt-4">
                <h3 className="font-semibold text-gray-900 mb-2">AI 批改反馈</h3>
                <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{selected.feedback}</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
