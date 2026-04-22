'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useMissionStore } from '@/stores/useMissionStore'

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
  const [correctAnswers, setCorrectAnswers] = useState<Record<number, string>>({}) // 正确答案
  const [selectedBlank, setSelectedBlank] = useState<number | null>(null) // 当前选中的空格
  const [aiAnalysis, setAiAnalysis] = useState<Record<number, string>>({}) // AI解析
  const [loadingAi, setLoadingAi] = useState<Record<number, boolean>>({}) // AI加载状态
  const [showResult, setShowResult] = useState(false)
  const [loading, setLoading] = useState(true)
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
          const data: ClozeQuestion[] = await res.json()
          const clozeQ = data.find(q => q.type === 'cloze')
          if (clozeQ) {
            setQuestion(clozeQ)
            // 收集所有空格的正确答案 - 从explanation字段提取实际的空格号
            const allCloze = data.filter(q => q.type === 'cloze' && q.correctAnswer && q.explanation)
            const answerMap: Record<number, string> = {}
            allCloze.forEach(q => {
              // 从explanation中提取空格号，格式如 "27.【解析】"
              const match = q.explanation?.match(/^(\d+)\.【解析】/)
              if (match) {
                const blankNum = parseInt(match[1])
                answerMap[blankNum] = q.correctAnswer!
              }
            })
            setCorrectAnswers(answerMap)
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
          body: JSON.stringify({ category, type: 'reading_cloze', count: 10 }),
        })
        if (res.ok) {
          const supabase = createClient()
          const { data } = await supabase
            .from('questions')
            .select('*')
            .eq('category', category)
            .eq('type', 'reading_cloze')
            .order('id', { ascending: false })
            .limit(10)
          if (data && data.length > 0) {
            let passage = data.find(q => q.passage)?.passage || ''
            // Ensure passage has exactly 10 [blank] markers
            if (passage) {
              const existingBlanks = (passage.match(/\[blank\]/gi) || []).length
              if (existingBlanks < 10) {
                // Split into words and insert blanks at evenly spaced positions
                const words = passage.split(' ')
                const needed = 10 - existingBlanks
                // Find positions that are not adjacent to existing blanks
                const step = Math.floor(words.length / (needed + 1))
                let inserted = 0
                for (let i = step; i < words.length && inserted < needed; i += step) {
                  if (!words[i].includes('[blank]') && !words[i - 1]?.includes('[blank]')) {
                    words.splice(i, 0, '[blank]')
                    inserted++
                    i++ // account for inserted word
                  }
                }
                passage = words.join(' ')
              }
            }
            const wordBank: WordBankItem[] = []
            const answerMap: Record<number, string> = {}

            const firstWithOptions = data.find(q => q.options && q.options.length > 0)
            if (firstWithOptions) {
              firstWithOptions.options.forEach((opt: string) => {
                const match = opt.match(/^([A-O])[.)]\s*(.+)/)
                if (match) wordBank.push({ letter: match[1], word: match[2] })
              })
            }

            data.forEach((q, idx) => {
              answerMap[26 + idx] = q.answer
            })

            console.log('Data length:', data.length)
            console.log('Answer map:', answerMap)
            console.log('Passage blanks:', (passage.match(/\[blank\]/gi) || []).length)

            setQuestion({
              question: passage,
              options: [],
              wordBank,
              type: 'cloze',
            })
            setCorrectAnswers(answerMap)
          }
        }
      } catch (err) {
        console.error('Auto-generate cloze failed:', err)
      } finally {
        setLoading(false)
        setGenerating(false)
      }
    }
    autoGenerate()
  }, [activeMission, archiveId, category])

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

  function getScore() {
    let correct = 0
    blanks.forEach(num => {
      if (answers[num] === correctAnswers[num]) correct++
    })
    return correct
  }

  async function handleAiAnalysis(blankNum: number) {
    if (aiAnalysis[blankNum] || loadingAi[blankNum]) return

    setLoadingAi(prev => ({ ...prev, [blankNum]: true }))
    try {
      const userAns = answers[blankNum]
      const correct = correctAnswers[blankNum]
      const userWord = wordBank.find(w => w.letter === userAns)?.word
      const correctWord = wordBank.find(w => w.letter === correct)?.word

      const res = await fetch('/api/quiz/solve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          passage: question?.question || '',
          content: `空格 ${blankNum}`,
          answer: `${correct}) ${correctWord}`,
          category,
          type: 'cloze',
          options: wordBank.map(w => `${w.letter}) ${w.word}`),
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setAiAnalysis(prev => ({ ...prev, [blankNum]: data.analysis }))
      } else {
        setAiAnalysis(prev => ({ ...prev, [blankNum]: 'AI 解析失败，请稍后重试' }))
      }
    } catch (err) {
      console.error(err)
      setAiAnalysis(prev => ({ ...prev, [blankNum]: 'AI 解析失败，请稍后重试' }))
    } finally {
      setLoadingAi(prev => ({ ...prev, [blankNum]: false }))
    }
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

  const wordBank = question.wordBank || []
  const blanks = [26, 27, 28, 29, 30, 31, 32, 33, 34, 35]

  // 渲染文章，将 [blank]/(26)/(27)等 替换为可填空的输入框
  function renderPassage() {
    if (!question) return ''
    let blankIndex = 0
    // 支持 [blank]、(26)~(35)、裸露的26~35、____、\n\n 等多种标记
    // 先处理带数字的标记，然后处理 \n\n
    let text = question.question.replace(/\[blank\]|\(([23][0-9])\)|\b([23][0-9])\b|_{3,}/gi, (match, numStr1, numStr2) => {
      const num = numStr1 ? parseInt(numStr1) : numStr2 ? parseInt(numStr2) : 26 + blankIndex
      blankIndex++
      return `__BLANK_${num}__`
    })

    // 处理剩余的 \n\n 作为后续空格（从 blankIndex 继续编号）
    text = text.replace(/\n\n/g, () => {
      const num = 26 + blankIndex
      blankIndex++
      return `__BLANK_${num}__`
    })

    // 将所有 __BLANK_N__ 替换为实际的 HTML
    return text.replace(/__BLANK_(\d+)__/g, (match, numStr) => {
      const num = parseInt(numStr)
      const answer = answers[num] || ''
      if (mode === 'fill') {
        const isSelected = selectedBlank === num
        const cls = isSelected
          ? 'inline-flex items-center justify-center min-w-[80px] px-2 py-1 mx-1 rounded border-2 border-cyan-400 bg-cyan-400/20 text-cyan-200 font-mono text-sm cursor-pointer'
          : 'inline-flex items-center justify-center min-w-[80px] px-2 py-1 mx-1 rounded border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 font-mono text-sm cursor-pointer hover:bg-cyan-500/20'
        return `<span class="${cls}" data-blank="${num}">${answer || `(${num})`}</span>`
      }
      return `<span class="inline-flex items-center justify-center min-w-[80px] px-2 py-1 mx-1 rounded border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 font-mono text-sm">${answer || `(${num})`}</span>`
    })
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
        {mode === 'fill' && (
          <div className="mb-3 text-xs font-semibold" style={{ color: selectedBlank ? '#22d3ee' : '#64748b' }}>
            {selectedBlank ? `已选中空格 (${selectedBlank})，请点击词库中的单词填入` : '请点击文章中的空格，然后从词库中选择单词'}
          </div>
        )}
        <div
          className="text-base leading-relaxed"
          style={{ color: '#e2e8f0' }}
          dangerouslySetInnerHTML={{ __html: renderPassage() }}
          onClick={(e) => {
            const target = e.target as HTMLElement
            if (target.dataset.blank && mode === 'fill') {
              const blank = parseInt(target.dataset.blank)
              setSelectedBlank(prev => prev === blank ? null : blank)
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
              onClick={() => {
                if (mode === 'fill' && selectedBlank) {
                  handleSelectWord(selectedBlank, item.letter)
                  setSelectedBlank(null)
                }
              }}
              className="rounded-lg border px-3 py-2 text-center text-sm transition-all cursor-pointer hover:scale-105"
              style={{
                borderColor: Object.values(answers).includes(item.letter)
                  ? 'rgba(34,211,238,0.5)'
                  : selectedBlank
                    ? 'rgba(34,211,238,0.4)'
                    : 'rgba(255,255,255,0.1)',
                background: Object.values(answers).includes(item.letter)
                  ? 'rgba(34,211,238,0.1)'
                  : selectedBlank
                    ? 'rgba(34,211,238,0.08)'
                    : 'rgba(255,255,255,0.03)',
                color: Object.values(answers).includes(item.letter) ? '#22d3ee' : selectedBlank ? '#e2e8f0' : '#cbd5e1',
                boxShadow: selectedBlank && !Object.values(answers).includes(item.letter) ? '0 0 8px rgba(34,211,238,0.15)' : 'none',
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
                        border: `1px solid ${answers[num] === item.letter ? 'rgba(34,211,238,0.5)' : 'rgba(255,255,255,0.1)'}`,
                        background: answers[num] === item.letter ? 'rgba(34,211,238,0.15)' : 'rgba(255,255,255,0.03)',
                        color: answers[num] === item.letter ? '#22d3ee' : '#94a3b8',
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
          <div className="glass rounded-2xl p-6" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-bold" style={{ color: '#94a3b8' }}>答题结果</span>
              <span className="text-sm font-bold" style={{ color: getScore() >= 8 ? '#34d399' : getScore() >= 6 ? '#fbbf24' : '#f87171' }}>
                {getScore()} / 10
              </span>
            </div>
            <div className="space-y-3">
              {blanks.map(num => {
                const userAns = answers[num]
                const correct = correctAnswers[num]
                const isCorrect = userAns === correct
                const userWord = wordBank.find(w => w.letter === userAns)?.word
                const correctWord = wordBank.find(w => w.letter === correct)?.word
                return (
                  <div key={num} className="rounded-lg" style={{ background: isCorrect ? 'rgba(52,211,153,0.06)' : 'rgba(248,113,113,0.06)' }}>
                    <div className="flex items-center gap-3 px-3 py-2">
                      <span className="w-10 shrink-0 font-mono text-xs" style={{ color: '#64748b' }}>({num})</span>
                      <span className="text-xs font-bold" style={{ color: isCorrect ? '#34d399' : '#f87171' }}>
                        {isCorrect ? '✓' : '✗'}
                      </span>
                      <span className="text-xs" style={{ color: isCorrect ? '#34d399' : '#f87171' }}>
                        {userAns ? `${userAns}) ${userWord}` : '未作答'}
                      </span>
                      {!isCorrect && correct && (
                        <>
                          <span className="text-xs" style={{ color: '#94a3b8' }}>
                            → 正确: {correct}) {correctWord}
                          </span>
                          <button
                            onClick={() => handleAiAnalysis(num)}
                            disabled={loadingAi[num]}
                            className="ml-auto rounded-lg px-3 py-1 text-xs font-semibold transition-all disabled:opacity-50"
                            style={{
                              border: '1px solid rgba(168,85,247,0.3)',
                              background: 'rgba(168,85,247,0.1)',
                              color: '#a78bfa',
                            }}
                          >
                            {loadingAi[num] ? '解析中...' : aiAnalysis[num] ? '已解析' : 'AI 解析'}
                          </button>
                        </>
                      )}
                    </div>
                    {aiAnalysis[num] && (
                      <div className="border-t px-3 py-3 text-xs leading-relaxed" style={{ borderColor: 'rgba(255,255,255,0.06)', color: '#cbd5e1' }}>
                        <div className="mb-1 font-bold" style={{ color: '#a78bfa' }}>AI 解析：</div>
                        <div className="whitespace-pre-wrap">{aiAnalysis[num]}</div>
                      </div>
                    )}
                  </div>
                )
              })}
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
