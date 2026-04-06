'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import ListeningPage from './listening/page'

const LISTENING_TYPES = ['listening_news', 'listening_interview', 'listening_passage']

type Question = {
  id: number
  content: string
  passage: string | null
  options: string[]
  answer: string
  explanation: string
  type: string
  difficulty: number
}

const categoryLabel: Record<string, string> = {
  cet4: '四级 CET-4', cet6: '六级 CET-6',
  kaoyan1: '考研英语一', kaoyan2: '考研英语二',
}
const typeLabel: Record<string, string> = {
  writing: '写作', listening_news: '新闻听力', listening_interview: '长对话',
  listening_passage: '听力短文', reading_match: '信息匹配', reading_choice: '仔细阅读',
  reading_cloze: '篇章词汇', translation: '翻译', cloze: '完形填空',
  reading: '阅读理解', new_type_match: '新题型', new_type_summary: '英译汉',
  writing_small: '小作文', writing_big: '大作文',
}
const diffColor = ['', '#34d399', '#fbbf24', '#f87171']
const diffLabel = ['', '简单', '中等', '困难']

export default function QuizTypePage() {
  const { category, type } = useParams<{ category: string; type: string }>()
  const router = useRouter()

  if (LISTENING_TYPES.includes(type)) {
    return <ListeningPage />
  }
  const [questions, setQuestions] = useState<Question[]>([])
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [score, setScore] = useState({ correct: 0, total: 0 })
  const [loading, setLoading] = useState(true)
  const [finished, setFinished] = useState(false)
  const [aiAnalysis, setAiAnalysis] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [showPassage, setShowPassage] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data } = await supabase
        .from('questions').select('*')
        .eq('category', category).eq('type', type).limit(10)
      if (data) setQuestions(data)
      setLoading(false)
    }
    load()
  }, [category, type])

  async function handleSelect(option: string) {
    if (selected) return
    setSelected(option)
    setShowResult(true)
    const q = questions[index]
    const isCorrect = option[0] === q.answer
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('quiz_records').insert({
        user_id: user.id, question_id: q.id,
        user_answer: option[0], is_correct: isCorrect,
      })
    }
    setScore(s => ({ correct: s.correct + (isCorrect ? 1 : 0), total: s.total + 1 }))
  }

  async function handleAiSolve() {
    const q = questions[index]
    setAiLoading(true)
    setAiAnalysis('')
    try {
      const res = await fetch('/api/quiz/solve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passage: q.passage, content: q.content, options: q.options, answer: q.answer, category, type }),
      })
      const data = await res.json()
      setAiAnalysis(data.analysis ?? data.error ?? '解析失败')
    } catch {
      setAiAnalysis('AI 解题失败，请重试')
    } finally {
      setAiLoading(false)
    }
  }

  function handleNext() {
    if (index + 1 >= questions.length) { setFinished(true) }
    else { setIndex(i => i + 1); setSelected(null); setShowResult(false); setAiAnalysis('') }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64" style={{ color: '#475569' }}>
      <p>加载题目中...</p>
    </div>
  )

  if (questions.length === 0) return (
    <div className="text-center py-20">
      <div className="text-5xl mb-4">📭</div>
      <p className="text-lg font-semibold mb-2" style={{ color: '#94a3b8' }}>暂无题目</p>
      <p className="text-sm mb-6" style={{ color: '#475569' }}>请先在刷题页点击「AI 生成题目」</p>
      <button onClick={() => router.push('/quiz')} className="btn-glow px-6 py-2.5 rounded-xl text-white font-semibold text-sm">
        返回选题
      </button>
    </div>
  )

  if (finished) return (
    <div className="max-w-lg mx-auto text-center py-20">
      <div className="text-6xl mb-6">🎉</div>
      <h2 className="text-3xl font-extrabold mb-2 gradient-text">练习完成！</h2>
      <p className="mb-4" style={{ color: '#64748b' }}>本次得分：{score.correct} / {score.total}</p>
      <div className="text-6xl font-extrabold mb-8 gradient-text">
        {Math.round((score.correct / score.total) * 100)}%
      </div>
      <div className="flex gap-3 justify-center">
        <button onClick={() => { setIndex(0); setScore({ correct: 0, total: 0 }); setSelected(null); setShowResult(false); setFinished(false); setAiAnalysis('') }}
          className="btn-glow px-6 py-3 rounded-xl text-white font-bold">再练一次</button>
        <button onClick={() => router.push('/quiz')}
          className="glass px-6 py-3 rounded-xl font-bold"
          style={{ color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)' }}>返回选题</button>
      </div>
    </div>
  )

  const q = questions[index]
  const options: string[] = q.options ?? []

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/quiz')} className="text-sm transition-colors" style={{ color: '#475569' }}>← 返回</button>
          <span className="text-sm font-bold" style={{ color: '#a78bfa' }}>{categoryLabel[category]}</span>
          <span className="text-xs px-2 py-0.5 rounded-lg" style={{ color: '#64748b', background: 'rgba(255,255,255,0.05)' }}>
            {typeLabel[type] ?? type}
          </span>
          {q.difficulty > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-lg font-bold"
              style={{ color: diffColor[q.difficulty], background: `${diffColor[q.difficulty]}15` }}>
              {diffLabel[q.difficulty]}
            </span>
          )}
        </div>
        <span className="text-sm" style={{ color: '#475569' }}>{index + 1} / {questions.length}</span>
      </div>

      <div className="w-full rounded-full h-1 mb-6" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <div className="h-1 rounded-full transition-all"
          style={{ width: `${((index + 1) / questions.length) * 100}%`, background: 'linear-gradient(90deg, #7c3aed, #06b6d4)' }} />
      </div>

      {q.passage && (
        <div className="glass rounded-2xl mb-4 overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
          <button onClick={() => setShowPassage(v => !v)}
            className="w-full flex items-center justify-between px-5 py-3 text-sm font-semibold"
            style={{ color: '#94a3b8', borderBottom: showPassage ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
            <span>📄 阅读原文</span>
            <span>{showPassage ? '▲ 收起' : '▼ 展开'}</span>
          </button>
          {showPassage && (
            <div className="px-5 py-4 text-sm leading-relaxed" style={{ color: '#cbd5e1', maxHeight: '280px', overflowY: 'auto' }}>
              {q.passage}
            </div>
          )}
        </div>
      )}

      <div className="glass rounded-2xl p-6 mb-4" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
        <p className="text-base leading-relaxed mb-6" style={{ color: '#e2e8f0' }}>{q.content}</p>
        {options.length > 0 ? (
          <div className="space-y-3">
            {options.map(opt => {
              const letter = opt[0]
              let borderColor = 'rgba(255,255,255,0.08)'
              let bg = 'rgba(255,255,255,0.03)'
              let color = '#94a3b8'
              if (showResult) {
                if (letter === q.answer) { borderColor = 'rgba(52,211,153,0.5)'; bg = 'rgba(52,211,153,0.08)'; color = '#34d399' }
                else if (opt === selected) { borderColor = 'rgba(248,113,113,0.5)'; bg = 'rgba(248,113,113,0.08)'; color = '#f87171' }
                else { color = '#334155' }
              }
              return (
                <button key={opt} onClick={() => handleSelect(opt)} disabled={!!selected}
                  className="w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all"
                  style={{ border: `1px solid ${borderColor}`, background: bg, color }}>
                  {opt}
                </button>
              )
            })}
          </div>
        ) : (
          <div className="text-sm px-4 py-3 rounded-xl" style={{ color: '#64748b', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            主观题，请参考解析
          </div>
        )}
      </div>

      {showResult && (
        <div className="rounded-2xl p-5 mb-4"
          style={{
            background: selected?.[0] === q.answer ? 'rgba(52,211,153,0.08)' : 'rgba(248,113,113,0.08)',
            border: `1px solid ${selected?.[0] === q.answer ? 'rgba(52,211,153,0.3)' : 'rgba(248,113,113,0.3)'}`,
          }}>
          <div className="font-bold mb-2 text-sm" style={{ color: selected?.[0] === q.answer ? '#34d399' : '#f87171' }}>
            {selected?.[0] === q.answer ? '✓ 回答正确' : `✗ 正确答案：${q.answer}`}
          </div>
          <div className="text-sm leading-relaxed" style={{ color: '#94a3b8' }}>{q.explanation}</div>
        </div>
      )}

      {showResult && (
        <div className="mb-4">
          {!aiAnalysis ? (
            <button onClick={handleAiSolve} disabled={aiLoading}
              className="w-full py-3 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
              style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)', color: '#a78bfa' }}>
              {aiLoading ? '🤖 AI 深度解析中...' : '🤖 AI 深度解题'}
            </button>
          ) : (
            <div className="glass rounded-2xl p-5" style={{ border: '1px solid rgba(139,92,246,0.25)' }}>
              <div className="text-sm font-bold mb-3" style={{ color: '#a78bfa' }}>🤖 AI 深度解析</div>
              <div className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: '#cbd5e1' }}>{aiAnalysis}</div>
            </div>
          )}
        </div>
      )}

      {(showResult || options.length === 0) && (
        <button onClick={handleNext} className="btn-glow w-full py-3 rounded-xl text-white font-bold text-sm">
          {index + 1 >= questions.length ? '查看结果' : '下一题 →'}
        </button>
      )}
    </div>
  )
}
