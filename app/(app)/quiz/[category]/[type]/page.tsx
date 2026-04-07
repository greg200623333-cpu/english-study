'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useWarRoomSync } from '@/hooks/useWarRoomSync'
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
  cet4: '四级 CET-4',
  cet6: '六级 CET-6',
  kaoyan1: '考研英语一',
  kaoyan2: '考研英语二',
}

const typeLabel: Record<string, string> = {
  writing: '写作',
  listening_news: '新闻听力',
  listening_interview: '长对话',
  listening_passage: '听力短文',
  reading_match: '信息匹配',
  reading_choice: '仔细阅读',
  reading_cloze: '篇章词汇',
  translation: '翻译',
  cloze: '完形填空',
  reading: '阅读理解',
  new_type_match: '新题型匹配',
  new_type_summary: '英译汉',
  writing_small: '小作文',
  writing_big: '大作文',
}

const diffColor = ['', '#34d399', '#fbbf24', '#f87171']
const diffLabel = ['', '简单', '中等', '困难']

export default function QuizTypePage() {
  const { category, type } = useParams<{ category: string; type: string }>()
  const router = useRouter()
  const isListening = useMemo(() => LISTENING_TYPES.includes(type), [type])
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
  const { syncQuizAttempt } = useWarRoomSync()

  useEffect(() => {
    if (isListening) {
      setLoading(false)
      return
    }

    async function load() {
      const supabase = createClient()
      const { data } = await supabase.from('questions').select('*').eq('category', category).eq('type', type).limit(10)
      if (data) setQuestions(data)
      setLoading(false)
    }

    load()
  }, [category, isListening, type])

  async function handleSelect(option: string) {
    if (selected) return
    setSelected(option)
    setShowResult(true)

    const current = questions[index]
    const isCorrect = option[0] === current.answer
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      await supabase.from('quiz_records').insert({
        user_id: user.id,
        question_id: current.id,
        user_answer: option[0],
        is_correct: isCorrect,
      })
    }

    const nextScore = { correct: score.correct + (isCorrect ? 1 : 0), total: score.total + 1 }
    setScore(nextScore)

    await syncQuizAttempt({
      type,
      category,
      correct: isCorrect ? 1 : 0,
      total: 1,
      passageWordCount: current.passage?.split(/\s+/).filter(Boolean).length ?? 0,
    })
  }

  async function handleAiSolve() {
    const current = questions[index]
    setAiLoading(true)
    setAiAnalysis('')
    try {
      const res = await fetch('/api/quiz/solve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          passage: current.passage,
          content: current.content,
          options: current.options,
          answer: current.answer,
          category,
          type,
        }),
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
    if (index + 1 >= questions.length) {
      setFinished(true)
    } else {
      setIndex((value) => value + 1)
      setSelected(null)
      setShowResult(false)
      setAiAnalysis('')
    }
  }

  if (isListening) {
    return <ListeningPage />
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center" style={{ color: '#475569' }}>
        <p>加载题目中...</p>
      </div>
    )
  }

  if (questions.length === 0) {
    return (
      <div className="py-20 text-center">
        <div className="mb-4 text-5xl">📭</div>
        <p className="mb-2 text-lg font-semibold" style={{ color: '#94a3b8' }}>暂无题目</p>
        <p className="mb-6 text-sm" style={{ color: '#475569' }}>请先在刷题页点击「AI 生成题目」</p>
        <button onClick={() => router.push('/quiz')} className="btn-glow rounded-xl px-6 py-2.5 text-sm font-semibold text-white">
          返回选题
        </button>
      </div>
    )
  }

  if (finished) {
    return (
      <div className="mx-auto max-w-lg py-20 text-center">
        <div className="mb-6 text-6xl">🎉</div>
        <h2 className="gradient-text mb-2 text-3xl font-extrabold">练习完成</h2>
        <p className="mb-4" style={{ color: '#64748b' }}>本次得分：{score.correct} / {score.total}</p>
        <div className="gradient-text mb-8 text-6xl font-extrabold">{Math.round((score.correct / score.total) * 100)}%</div>
        <div className="flex justify-center gap-3">
          <button
            onClick={() => {
              setIndex(0)
              setScore({ correct: 0, total: 0 })
              setSelected(null)
              setShowResult(false)
              setFinished(false)
              setAiAnalysis('')
            }}
            className="btn-glow rounded-xl px-6 py-3 font-bold text-white"
          >
            再练一次
          </button>
          <button
            onClick={() => router.push('/quiz')}
            className="glass rounded-xl px-6 py-3 font-bold"
            style={{ color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            返回选题
          </button>
        </div>
      </div>
    )
  }

  const q = questions[index]
  const options: string[] = q.options ?? []

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/quiz')} className="text-sm transition-colors" style={{ color: '#475569' }}>← 返回</button>
          <span className="text-sm font-bold" style={{ color: '#a78bfa' }}>{categoryLabel[category] ?? category}</span>
          <span className="rounded-lg px-2 py-0.5 text-xs" style={{ color: '#64748b', background: 'rgba(255,255,255,0.05)' }}>
            {typeLabel[type] ?? type}
          </span>
          {q.difficulty > 0 && (
            <span className="rounded-lg px-2 py-0.5 text-xs font-bold" style={{ color: diffColor[q.difficulty], background: `${diffColor[q.difficulty]}15` }}>
              {diffLabel[q.difficulty]}
            </span>
          )}
        </div>
        <span className="text-sm" style={{ color: '#475569' }}>{index + 1} / {questions.length}</span>
      </div>

      <div className="mb-6 h-1 w-full rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <div className="h-1 rounded-full transition-all" style={{ width: `${((index + 1) / questions.length) * 100}%`, background: 'linear-gradient(90deg, #7c3aed, #06b6d4)' }} />
      </div>

      {q.passage && (
        <div className="glass mb-4 overflow-hidden rounded-2xl" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
          <button
            onClick={() => setShowPassage((value) => !value)}
            className="flex w-full items-center justify-between px-5 py-3 text-sm font-semibold"
            style={{ color: '#94a3b8', borderBottom: showPassage ? '1px solid rgba(255,255,255,0.06)' : 'none' }}
          >
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

      <div className="glass mb-4 rounded-2xl p-6" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
        <p className="mb-6 text-base leading-relaxed" style={{ color: '#e2e8f0' }}>{q.content}</p>
        {options.length > 0 ? (
          <div className="space-y-3">
            {options.map((opt) => {
              const letter = opt[0]
              let borderColor = 'rgba(255,255,255,0.08)'
              let background = 'rgba(255,255,255,0.03)'
              let color = '#94a3b8'

              if (showResult) {
                if (letter === q.answer) {
                  borderColor = 'rgba(52,211,153,0.5)'
                  background = 'rgba(52,211,153,0.08)'
                  color = '#34d399'
                } else if (opt === selected) {
                  borderColor = 'rgba(248,113,113,0.5)'
                  background = 'rgba(248,113,113,0.08)'
                  color = '#f87171'
                } else {
                  color = '#334155'
                }
              }

              return (
                <button
                  key={opt}
                  onClick={() => handleSelect(opt)}
                  disabled={!!selected}
                  className="w-full rounded-xl px-4 py-3 text-left text-sm font-medium transition-all"
                  style={{ border: `1px solid ${borderColor}`, background, color }}
                >
                  {opt}
                </button>
              )
            })}
          </div>
        ) : (
          <div className="rounded-xl px-4 py-3 text-sm" style={{ color: '#64748b', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            主观题，请参考解析
          </div>
        )}
      </div>

      {showResult && (
        <div
          className="mb-4 rounded-2xl p-5"
          style={{
            background: selected?.[0] === q.answer ? 'rgba(52,211,153,0.08)' : 'rgba(248,113,113,0.08)',
            border: `1px solid ${selected?.[0] === q.answer ? 'rgba(52,211,153,0.3)' : 'rgba(248,113,113,0.3)'}`,
          }}
        >
          <div className="mb-2 text-sm font-bold" style={{ color: selected?.[0] === q.answer ? '#34d399' : '#f87171' }}>
            {selected?.[0] === q.answer ? '✓ 回答正确' : `✗ 正确答案：${q.answer}`}
          </div>
          <div className="text-sm leading-relaxed" style={{ color: '#94a3b8' }}>{q.explanation}</div>
        </div>
      )}

      {showResult && (
        <div className="mb-4">
          {!aiAnalysis ? (
            <button
              onClick={handleAiSolve}
              disabled={aiLoading}
              className="w-full rounded-xl py-3 text-sm font-bold transition-all disabled:opacity-50"
              style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)', color: '#a78bfa' }}
            >
              {aiLoading ? 'AI 深度解析中...' : 'AI 深度解题'}
            </button>
          ) : (
            <div className="glass rounded-2xl p-5" style={{ border: '1px solid rgba(139,92,246,0.25)' }}>
              <div className="mb-3 text-sm font-bold" style={{ color: '#a78bfa' }}>AI 深度解析</div>
              <div className="whitespace-pre-wrap text-sm leading-relaxed" style={{ color: '#cbd5e1' }}>{aiAnalysis}</div>
            </div>
          )}
        </div>
      )}

      {(showResult || options.length === 0) && (
        <button onClick={handleNext} className="btn-glow w-full rounded-xl py-3 text-sm font-bold text-white">
          {index + 1 >= questions.length ? '查看结果' : '下一题 →'}
        </button>
      )}
    </div>
  )
}
