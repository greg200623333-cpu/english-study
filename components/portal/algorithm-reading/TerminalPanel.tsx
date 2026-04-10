'use client'

import { useMemo, useRef, useState } from 'react'

export type QuizItem = {
  id: string
  prompt: string
  answer: string
  hint: string
  cnHint: string     // Chinese concept explanation (sidebar)
  cnConcept: string  // Short Chinese label
}

type TerminalLine = {
  id: string
  type: 'system' | 'success' | 'error' | 'input'
  text: string
}

type Props = {
  quizzes: QuizItem[]
  title?: string
}

function buildBootLines(title?: string): TerminalLine[] {
  return [
    { id: 'boot-0', type: 'system', text: `[boot] 算法终端已就绪 · ${title ?? 'current mission'}` },
    { id: 'boot-1', type: 'system', text: '[hint] 参考左侧中文提示，在右侧填写英文答案后按 Enter 提交。' },
  ]
}

// Render prompt with blank highlighted
function PromptWithBlank({ prompt }: { prompt: string }) {
  const parts = prompt.split(/(_+)/)
  return (
    <span>
      {parts.map((part, i) =>
        /^_+$/.test(part) ? (
          <span key={i} className="mx-1 inline-block min-w-[4rem] border-b-2 border-fuchsia-400 text-center font-bold text-fuchsia-300">
            {'　'.repeat(Math.max(1, Math.floor(part.length / 3)))}
          </span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  )
}

const CONCEPT_COLORS = [
  { border: 'border-cyan-400/30', bg: 'bg-cyan-400/8', label: 'text-cyan-300', text: 'text-cyan-100/80' },
  { border: 'border-fuchsia-400/30', bg: 'bg-fuchsia-400/8', label: 'text-fuchsia-300', text: 'text-fuchsia-100/80' },
  { border: 'border-amber-400/30', bg: 'bg-amber-400/8', label: 'text-amber-300', text: 'text-amber-100/80' },
]

export default function TerminalPanel({ quizzes, title }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [index, setIndex] = useState(0)
  const [input, setInput] = useState('')
  const [lines, setLines] = useState<TerminalLine[]>(() => buildBootLines(title))
  const [shake, setShake] = useState(false)
  const [errorCount, setErrorCount] = useState(0)
  const [isError, setIsError] = useState(false)
  const [showAnswer, setShowAnswer] = useState(false)

  const safeQuizzes = useMemo(
    () =>
      quizzes.length
        ? quizzes
        : [
            {
              id: 'standby',
              prompt: 'No quiz loaded yet. Paste an English algorithm problem and launch AI parsing first.',
              answer: '',
              hint: 'The terminal will unlock after analysis.',
              cnHint: '请先在左侧粘贴英文算法题目，点击「启动 AI 战术解析」后终端将自动解锁。',
              cnConcept: '等待解析',
            },
          ],
    [quizzes]
  )

  const current = useMemo(() => safeQuizzes[index % safeQuizzes.length], [index, safeQuizzes])

  function pushLine(type: TerminalLine['type'], text: string) {
    setLines((prev) => [...prev, { id: `${Date.now()}-${prev.length}`, type, text }])
  }

  function focusInput() {
    requestAnimationFrame(() => inputRef.current?.focus())
  }

  function handleNextQuestion(nextIndex?: number) {
    const targetIndex = typeof nextIndex === 'number' ? nextIndex : (index + 1) % safeQuizzes.length
    setIndex(targetIndex)
    setInput('')
    setErrorCount(0)
    setIsError(false)
    setShowAnswer(false)
    const next = safeQuizzes[targetIndex]
    pushLine('system', `[query] ${next.prompt.replace(/_+/g, '______')}`)
    pushLine('system', `[hint] ${next.hint}`)
    focusInput()
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const normalized = input.trim().toLowerCase()
    if (!normalized || !current.answer) return

    pushLine('input', `$ ${input.trim()}`)

    if (normalized === current.answer.trim().toLowerCase()) {
      setIsError(false)
      setErrorCount(0)
      setShowAnswer(false)
      pushLine('success', `[success] ✓ "${current.answer}" — 答对了，进入下一题。`)
      handleNextQuestion()
      return
    }

    const nextErrorCount = errorCount + 1
    setErrorCount(nextErrorCount)
    setIsError(true)
    setInput('')

    if (nextErrorCount >= 2) {
      setShowAnswer(true)
      pushLine('error', `[error] ✗ 连续错误 ${nextErrorCount} 次 — 正确答案已显示在下方。`)
    } else {
      pushLine('error', `[error] ✗ 答案有误（第 ${nextErrorCount} 次）— 再试一次。`)
    }

    setShake(true)
    setTimeout(() => { setShake(false); setIsError(false) }, 600)
    focusInput()
  }

  const lineColor = (type: TerminalLine['type']) => {
    if (type === 'success') return 'text-emerald-300'
    if (type === 'error') return 'text-rose-300'
    if (type === 'input') return 'text-slate-200'
    return 'text-slate-500'
  }

  const linePrefix = (text: string) => {
    if (text.startsWith('[boot]')) return <><span className="text-emerald-400">[boot]</span>{text.slice(6)}</>
    if (text.startsWith('[hint]')) return <><span className="text-amber-400">[hint]</span>{text.slice(6)}</>
    if (text.startsWith('[query]')) return <><span className="text-cyan-400">[query]</span>{text.slice(7)}</>
    if (text.startsWith('[success]')) return <><span className="text-emerald-300">[success]</span>{text.slice(9)}</>
    if (text.startsWith('[error]')) return <><span className="text-rose-300">[error]</span>{text.slice(7)}</>
    if (text.startsWith('$')) return <><span className="text-emerald-300">$</span>{text.slice(1)}</>
    return <>{text}</>
  }

  return (
    <div id="terminal-drill" className="mt-4 rounded-[1.5rem] border border-white/10 bg-black/70 shadow-[0_0_40px_rgba(15,23,42,0.45)] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 border-b border-white/8 px-5 py-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
          </div>
          <span className="font-mono text-xs text-slate-500">algorithm-terminal</span>
          <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.3em] text-emerald-300">
            Terminal Drill
          </span>
          <span className="text-xs text-slate-500">终端式极客测验</span>
        </div>
        <button
          type="button"
          onClick={() => handleNextQuestion()}
          disabled={safeQuizzes.length <= 1}
          className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 font-mono text-xs text-cyan-200 transition hover:border-cyan-300/35 hover:bg-cyan-400/15 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Quiz {Math.min(index + 1, safeQuizzes.length)} / {safeQuizzes.length}
        </button>
      </div>

      {/* Body: sidebar + terminal */}
      <div className="grid grid-cols-[220px_1fr] divide-x divide-white/8 xl:grid-cols-[260px_1fr]">

        {/* ── Left: Chinese concept sidebar ── */}
        <div className="flex flex-col gap-3 bg-slate-950/60 p-4">
          <div className="mb-1 font-mono text-[10px] uppercase tracking-[0.35em] text-slate-500">中文概念对照</div>

          {/* Current concept card */}
          {(() => {
            const color = CONCEPT_COLORS[index % CONCEPT_COLORS.length]
            return (
              <div className={`rounded-xl border ${color.border} ${color.bg} p-3`}>
                <div className={`mb-1.5 font-mono text-[10px] uppercase tracking-[0.25em] ${color.label}`}>
                  [concept · {String(index + 1).padStart(2, '0')}]
                </div>
                <div className={`text-sm font-bold ${color.label}`}>{current.cnConcept}</div>
                <div className={`mt-2 text-xs leading-5 ${color.text}`}>{current.cnHint}</div>
              </div>
            )
          })()}

          {/* All quiz concepts mini-list */}
          <div className="mt-1 space-y-1.5">
            {safeQuizzes.map((q, i) => {
              const color = CONCEPT_COLORS[i % CONCEPT_COLORS.length]
              const isActive = i === index % safeQuizzes.length
              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => handleNextQuestion(i)}
                  className={`w-full rounded-lg border px-3 py-2 text-left transition ${
                    isActive
                      ? `${color.border} ${color.bg} ${color.label}`
                      : 'border-white/6 bg-white/3 text-slate-500 hover:border-white/12 hover:text-slate-400'
                  }`}
                >
                  <span className="font-mono text-[10px]">[{String(i + 1).padStart(2, '0')}]</span>
                  <span className="ml-2 text-xs">{q.cnConcept}</span>
                </button>
              )
            })}
          </div>

          {/* Answer key hint */}
          <div className="mt-auto rounded-xl border border-fuchsia-400/15 bg-fuchsia-400/5 p-3">
            <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-fuchsia-400/70">[answer format]</div>
            <div className="mt-1.5 text-xs leading-5 text-fuchsia-200/70">
              答案为英文单词或短语，不区分大小写，直接输入后按 Enter 提交。
            </div>
          </div>
        </div>

        {/* ── Right: Terminal ── */}
        <div className="flex flex-col bg-[#020617] p-4 font-mono text-sm">

          {/* Terminal log */}
          <div className="mb-3 min-h-[5rem] space-y-1.5 overflow-y-auto">
            {lines.slice(-6).map((line) => (
              <div key={line.id} className={`text-xs leading-5 ${lineColor(line.type)}`}>
                {linePrefix(line.text)}
              </div>
            ))}
          </div>

          {/* Current question */}
          <div
            className="rounded-xl border px-4 py-3 text-sm leading-7 text-slate-100 transition-all duration-150"
            style={
              shake
                ? { borderColor: 'rgba(251,113,133,0.5)', background: 'rgba(251,113,133,0.07)', transform: 'translateX(-6px)' }
                : isError
                  ? { borderColor: 'rgba(251,113,133,0.35)', background: 'rgba(251,113,133,0.05)' }
                  : { borderColor: 'rgba(34,211,238,0.2)', background: 'rgba(34,211,238,0.05)' }
            }
          >
            <span
              className="mr-2 font-mono text-[10px] uppercase tracking-[0.25em]"
              style={{ color: isError ? 'rgb(251,113,133)' : 'rgb(34,211,238)' }}
            >
              {isError ? '[error]' : '[query]'}
            </span>
            <PromptWithBlank prompt={current.prompt} />
          </div>

          {/* Answer reveal (after 2+ errors) */}
          {showAnswer && (
            <div className="mt-2 flex items-center gap-2 rounded-lg border border-rose-400/25 bg-rose-400/8 px-3 py-2 text-xs">
              <span className="font-mono text-rose-400">[answer]</span>
              <span className="text-slate-400">正确答案为：</span>
              <span className="font-mono font-bold text-rose-300">{current.answer}</span>
            </div>
          )}

          {/* Hint row */}
          <div className="mt-2 flex items-center gap-2 text-xs">
            <span className="font-mono text-amber-400">[hint]</span>
            <span className="text-slate-400">{current.hint}</span>
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="mt-4 flex items-center gap-3">
            <span className={`font-mono ${isError ? 'text-rose-400' : 'text-emerald-300'}`}>$</span>
            <div
              className="flex-1 rounded-lg border px-3 py-2 transition-colors"
              style={
                isError
                  ? { borderColor: 'rgba(251,113,133,0.4)', background: 'rgba(251,113,133,0.05)' }
                  : { borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)' }
              }
            >
              <input
                ref={inputRef}
                autoFocus
                value={input}
                onChange={(e) => { setInput(e.target.value); if (isError) { setIsError(false) } }}
                disabled={!current.answer}
                className="w-full border-none bg-transparent text-slate-100 outline-none placeholder:text-slate-600 disabled:cursor-not-allowed disabled:text-slate-600"
                placeholder={current.answer ? (isError ? '重新输入答案…' : 'Type your answer and press Enter…') : 'Awaiting AI-generated quiz…'}
              />
            </div>
            <button
              type="submit"
              disabled={!current.answer || !input.trim()}
              className={`rounded-lg border px-3 py-2 text-xs transition ${isError ? 'border-rose-400/25 bg-rose-400/10 text-rose-300 hover:bg-rose-400/18' : 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300 hover:bg-emerald-400/18'} disabled:opacity-40`}
            >
              Enter ↵
            </button>
          </form>

          {/* Progress bar */}
          <div className="mt-4 flex items-center gap-2">
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-fuchsia-400 transition-all duration-500"
                style={{ width: `${((index % safeQuizzes.length + 1) / safeQuizzes.length) * 100}%` }}
              />
            </div>
            <span className="font-mono text-[10px] text-slate-500">{index % safeQuizzes.length + 1}/{safeQuizzes.length}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
