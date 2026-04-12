'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'

type WordBankItem = {
  letter: string
  word: string
}

type ClozeQuestion = {
  set?: number
  number?: number
  part?: string
  section?: string
  context?: string
  question: string
  options: string[]
  wordBank?: WordBankItem[]
  correctAnswer?: string
  explanation?: string
  type?: string
}

const categoryLabel: Record<string, string> = {
  cet4: '四级 CET-4',
  cet6: '六级 CET-6',
}

export default function ClozePage() {
  const { category } = useParams<{ category: string }>()
  const router = useRouter()
  const searchParams = useSearchParams()
  const archiveId = searchParams.get('archiveId')

  const [question, setQuestion] = useState<ClozeQuestion | null>(null)
  const [mode, setMode] = useState<'fill' | 'select'>('fill') // fill=整篇填空, select=逐题选择
  const [answers, setAnswers] = useState<Record<number, string>>({}) // 26-35的答案
  const [showResult, setShowResult] = useState(false)
  const [loading, setLoading] = useState(true)

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
          const data: ClozeQuestion[] = await res.json()
          const clozeQ = data.find(q => q.type === 'cloze')
          if (clozeQ) {
            setQuestion(clozeQ)
          }
        }
      } catch (err) {
        console.error('加载题目失败:', err)
      }
      setLoading(false)
    }

    load()
  }, [category, archiveId])

  function handleSelectWord(blank: number, letter: string) {
    setAnswers(prev => ({ ...prev, [blank]: letter }))
  }

  function handleSubmit() {
    setShowResult(true)
  }

  function handleReset() {
    setAnswers({})
    setShowResult(false)
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center" style={{ color: '#475569' }}>
        <p>加载题目中...</p>
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

  const wordBank = question.wordBank || []
  const blanks = [26, 27, 28, 29, 30, 31, 32, 33, 34, 35]

  // 渲染文章，将数字26-35替换为可填空的输入框或下拉选择
  function renderPassage() {
    let text = question.question
    blanks.forEach(num => {
      const answer = answers[num] || ''
      const placeholder = mode === 'fill'
        ? `<span class="inline-flex items-center justify-center min-w-[80px] px-2 py-1 mx-1 rounded border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 font-mono text-sm cursor-pointer hover:bg-cyan-500/20" data-blank="${num}">${answer || `(${num})`}</span>`
        : `<span class="inline-flex items-center justify-center min-w-[80px] px-2 py-1 mx-1 rounded border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 font-mono text-sm">${answer || `(${num})`}</span>`
      text = text.replace(new RegExp(`\\b${num}\\b`, 'g'), placeholder)
    })
    return text
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/quiz')} className="text-sm transition-colors" style={{ color: '#475569' }}>← 返回</button>
          <span className="text-sm font-bold" style={{ color: '#a78bfa' }}>{categoryLabel[category] ?? category}</span>
          <span className="rounded-lg px-2 py-0.5 text-xs" style={{ color: '#64748b', background: 'rgba(255,255,255,0.05)' }}>
            篇章词汇 {archiveId ? `· ${archiveId}` : ''}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMode('fill')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${mode === 'fill' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-slate-400 hover:text-slate-300'}`}
          >
            整篇模式
          </button>
          <button
            onClick={() => setMode('select')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${mode === 'select' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-slate-400 hover:text-slate-300'}`}
          >
            逐题模式
          </button>
        </div>
      </div>

      {/* 文章段落 */}
      <div className="glass mb-6 rounded-2xl p-6" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
        <div
          className="text-base leading-relaxed"
          style={{ color: '#e2e8f0' }}
          dangerouslySetInnerHTML={{ __html: renderPassage() }}
          onClick={(e) => {
            const target = e.target as HTMLElement
            if (target.dataset.blank && mode === 'fill') {
              const blank = parseInt(target.dataset.blank)
              const letter = prompt(`请输入空格 ${blank} 的答案字母 (A-O):`)
              if (letter && /^[A-O]$/i.test(letter)) {
                handleSelectWord(blank, letter.toUpperCase())
              }
            }
          }}
        />
      </div>

      {/* 词库 */}
      <div className="glass mb-6 rounded-2xl p-6" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="mb-4 text-sm font-bold" style={{ color: '#94a3b8' }}>词库 Word Bank</div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
          {wordBank.map(item => (
            <div
              key={item.letter}
              className="rounded-lg border px-3 py-2 text-center text-sm transition-all"
              style={{
                borderColor: Object.values(answers).includes(item.letter) ? 'rgba(34,211,238,0.5)' : 'rgba(255,255,255,0.1)',
                background: Object.values(answers).includes(item.letter) ? 'rgba(34,211,238,0.1)' : 'rgba(255,255,255,0.03)',
                color: Object.values(answers).includes(item.letter) ? '#22d3ee' : '#cbd5e1',
              }}
            >
              <div className="font-mono font-bold">{item.letter})</div>
              <div className="mt-1">{item.word}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 逐题选择模式 */}
      {mode === 'select' && (
        <div className="glass mb-6 rounded-2xl p-6" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="mb-4 text-sm font-bold" style={{ color: '#94a3b8' }}>选择答案</div>
          <div className="space-y-4">
            {blanks.map(num => (
              <div key={num} className="flex items-center gap-3">
                <span className="w-12 text-sm font-mono" style={{ color: '#64748b' }}>({num})</span>
                <div className="flex flex-wrap gap-2">
                  {wordBank.map(item => (
                    <button
                      key={item.letter}
                      onClick={() => handleSelectWord(num, item.letter)}
                      disabled={showResult}
                      className="rounded-lg px-3 py-1.5 text-xs font-semibold transition-all disabled:opacity-50"
                      style={{
                        borderColor: answers[num] === item.letter ? 'rgba(34,211,238,0.5)' : 'rgba(255,255,255,0.1)',
                        background: answers[num] === item.letter ? 'rgba(34,211,238,0.15)' : 'rgba(255,255,255,0.03)',
                        color: answers[num] === item.letter ? '#22d3ee' : '#94a3b8',
                        border: '1px solid',
                      }}
                    >
                      {item.letter}) {item.word}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 提交按钮 */}
      {!showResult && (
        <button
          onClick={handleSubmit}
          disabled={Object.keys(answers).length < 10}
          className="btn-glow w-full rounded-xl py-3 text-sm font-bold text-white disabled:opacity-50"
        >
          提交答案
        </button>
      )}

      {/* 结果显示 */}
      {showResult && (
        <div className="space-y-4">
          <div className="glass rounded-2xl p-6" style={{ border: '1px solid rgba(34,211,238,0.3)', background: 'rgba(34,211,238,0.08)' }}>
            <div className="mb-2 text-sm font-bold" style={{ color: '#22d3ee' }}>
              ✓ 已提交答案
            </div>
            <div className="text-sm" style={{ color: '#94a3b8' }}>
              请查看答案解析了解正确答案
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={handleReset} className="btn-glow flex-1 rounded-xl py-3 text-sm font-bold text-white">
              重新作答
            </button>
            <button onClick={() => router.push('/quiz')} className="glass flex-1 rounded-xl py-3 text-sm font-bold" style={{ color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)' }}>
              返回选题
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
