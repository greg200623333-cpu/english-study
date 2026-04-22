'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useMissionStore } from '@/stores/useMissionStore'

type TranslationQuestion = {
  set?: number
  number?: number
  part?: string
  section?: string | null
  context?: string
  question: string
  options: string[]
  type?: string
  correctAnswer?: string
  explanation?: string
}

const categoryLabel: Record<string, string> = {
  cet4: '四级 CET-4',
  cet6: '六级 CET-6',
}

export default function TranslationPage() {
  const { category } = useParams<{ category: string }>()
  const router = useRouter()
  const searchParams = useSearchParams()
  const archiveId = searchParams.get('archiveId')

  const [question, setQuestion] = useState<TranslationQuestion | null>(null)
  const [translation, setTranslation] = useState('')
  const [aiResult, setAiResult] = useState<{ score: number; feedback: string; reference: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showReference, setShowReference] = useState(false)
  const [generating, setGenerating] = useState(false)

  const { activeMission } = useMissionStore()

  useEffect(() => {
    async function load() {
      if (!archiveId) {
        setLoading(false)
        return
      }

      try {
        const fileId = archiveId.replace('.', '-')
        const res = await fetch(`/data/${category}-${fileId}.json`)
        if (res.ok) {
          const data: TranslationQuestion[] = await res.json()
          const transQ = data.find(q => q.type === 'translation')
          if (transQ) {
            setQuestion(transQ)
          }
        }
      } catch (err) {
        console.error('加载题目失败:', err)
      }
      setLoading(false)
    }

    load()
  }, [category, archiveId])

  useEffect(() => {
    async function autoGenerate() {
      if (!activeMission?.isAiMode || archiveId || generating) return

      setGenerating(true)
      setLoading(true)
      try {
        const res = await fetch('/api/generate/questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ category, type: 'translation', count: 1 }),
        })
        if (res.ok) {
          const supabase = createClient()
          const { data } = await supabase
            .from('questions')
            .select('*')
            .eq('category', category)
            .eq('type', 'translation')
            .order('id', { ascending: false })
            .limit(1)
          if (data && data.length > 0) {
            const q = data[0]
            setQuestion({
              question: q.content,
              options: [],
              correctAnswer: q.answer,
              explanation: q.explanation,
            })
          }
        }
      } catch (err) {
        console.error('Auto-generate translation failed:', err)
      } finally {
        setLoading(false)
        setGenerating(false)
      }
    }
    autoGenerate()
  }, [activeMission, archiveId, category])

  async function handleSubmit() {
    if (!translation.trim() || !question) return

    setSubmitting(true)
    try {
      const res = await fetch('/api/translation/grade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chinese: question.question,
          translation: translation,
          category,
        }),
      })
      const data = await res.json()
      setAiResult({
        score: data.score || 0,
        feedback: data.feedback || '批改失败',
        reference: data.reference || '',
      })
    } catch (err) {
      console.error('AI批改失败:', err)
      setAiResult({
        score: 0,
        feedback: 'AI批改服务暂时不可用，请稍后重试',
        reference: '',
      })
    }
    setSubmitting(false)
  }

  function handleReset() {
    setTranslation('')
    setAiResult(null)
    setShowReference(false)
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center" style={{ color: '#475569' }}>
        <p>{generating ? 'AI 生成题目中...' : '加载题目中...'}</p>
      </div>
    )
  }

  if (!question) {
    return (
      <div className="py-20 text-center">
        <div className="mb-4 text-5xl">📭</div>
        <p className="mb-2 text-lg font-semibold" style={{ color: '#94a3b8' }}>暂无题目</p>
        <p className="mb-6 text-sm" style={{ color: '#475569' }}>请从刷题页选择真题档案</p>
        <button onClick={() => router.push('/quiz')} className="btn-glow rounded-xl px-6 py-2.5 text-sm font-semibold text-white">
          返回选题
        </button>
      </div>
    )
  }

  const wordCount = translation.trim().split(/\s+/).filter(Boolean).length

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/quiz')} className="text-sm transition-colors" style={{ color: '#475569' }}>← 返回</button>
          <span className="text-sm font-bold" style={{ color: '#a78bfa' }}>{categoryLabel[category] ?? category}</span>
          <span className="rounded-lg px-2 py-0.5 text-xs" style={{ color: '#64748b', background: 'rgba(255,255,255,0.05)' }}>
            翻译 {archiveId ? `· ${archiveId}` : ''}
          </span>
        </div>
        <span className="text-sm" style={{ color: '#475569' }}>字数: {wordCount}</span>
      </div>

      {/* 中文原文 */}
      <div className="glass mb-6 rounded-2xl p-6" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="mb-3 text-sm font-bold" style={{ color: '#94a3b8' }}>📄 中文原文</div>
        <p className="text-base leading-relaxed" style={{ color: '#e2e8f0' }}>{question.question}</p>
      </div>

      {/* 翻译输入框 */}
      {!aiResult && (
        <div className="glass mb-6 rounded-2xl p-6" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="mb-3 text-sm font-bold" style={{ color: '#94a3b8' }}>✍️ 你的翻译</div>
          <textarea
            value={translation}
            onChange={(e) => setTranslation(e.target.value)}
            placeholder="请在此输入你的英文翻译..."
            className="w-full rounded-xl border bg-white/5 px-4 py-3 text-base leading-relaxed outline-none transition-all"
            style={{
              color: '#e2e8f0',
              borderColor: 'rgba(255,255,255,0.08)',
              minHeight: '200px',
              resize: 'vertical'
            }}
            onFocus={(e) => e.target.style.borderColor = 'rgba(139,92,246,0.5)'}
            onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
          />
          <div className="mt-4 flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={!translation.trim() || submitting}
              className="btn-glow rounded-xl px-6 py-3 text-sm font-bold text-white transition-all disabled:opacity-50"
            >
              {submitting ? 'AI 批改中...' : '提交批改'}
            </button>
          </div>
        </div>
      )}

      {/* AI批改结果 */}
      {aiResult && (
        <>
          <div className="glass mb-6 rounded-2xl p-6" style={{ border: '1px solid rgba(139,92,246,0.3)' }}>
            <div className="mb-4 flex items-center justify-between">
              <div className="text-sm font-bold" style={{ color: '#a78bfa' }}>🤖 AI 批改结果</div>
              <div className="text-2xl font-black" style={{ color: '#a78bfa' }}>{aiResult.score} 分</div>
            </div>
            <div className="mb-4 rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="mb-2 text-xs font-bold" style={{ color: '#94a3b8' }}>你的翻译</div>
              <p className="text-sm leading-relaxed" style={{ color: '#cbd5e1' }}>{translation}</p>
            </div>
            <div className="rounded-xl border border-purple-500/20 bg-purple-500/10 p-4">
              <div className="mb-2 text-xs font-bold" style={{ color: '#a78bfa' }}>批改意见</div>
              <p className="whitespace-pre-wrap text-sm leading-relaxed" style={{ color: '#cbd5e1' }}>{aiResult.feedback}</p>
            </div>
          </div>

          {/* 参考译文 */}
          {aiResult.reference && (
            <div className="glass mb-6 rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
              <button
                onClick={() => setShowReference(!showReference)}
                className="flex w-full items-center justify-between px-6 py-4 text-sm font-semibold transition-colors hover:bg-white/5"
                style={{ color: '#94a3b8' }}
              >
                <span>📖 参考译文</span>
                <span>{showReference ? '▲ 收起' : '▼ 展开'}</span>
              </button>
              {showReference && (
                <div className="border-t border-white/6 px-6 py-4">
                  <p className="text-sm leading-relaxed" style={{ color: '#cbd5e1' }}>{aiResult.reference}</p>
                </div>
              )}
            </div>
          )}

          {/* 操作按钮 */}
          <div className="flex gap-3">
            <button
              onClick={handleReset}
              className="flex-1 rounded-xl border border-white/10 bg-white/5 py-3 text-sm font-bold transition-colors hover:border-white/20"
              style={{ color: '#94a3b8' }}
            >
              重新翻译
            </button>
            <button
              onClick={() => router.push('/quiz')}
              className="flex-1 rounded-xl border border-white/10 bg-white/5 py-3 text-sm font-bold transition-colors hover:border-white/20"
              style={{ color: '#94a3b8' }}
            >
              返回选题
            </button>
          </div>
        </>
      )}
    </div>
  )
}
