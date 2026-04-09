'use client'

import { useMemo, useRef, useState } from 'react'

export type QuizItem = {
  id: string
  prompt: string
  answer: string
  hint: string
}

type TerminalLine = {
  id: string
  type: 'system' | 'success' | 'error'
  text: string
}

type Props = {
  quizzes: QuizItem[]
  title?: string
}

function buildBootLines(title?: string): TerminalLine[] {
  return [
    { id: 'boot', type: 'system', text: `[boot] Algorithm terminal ready for ${title ?? 'current mission'}.` },
    { id: 'hint', type: 'system', text: '[hint] Fill the blank in English and press Enter.' },
  ]
}

export default function TerminalPanel({ quizzes, title }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [index, setIndex] = useState(0)
  const [input, setInput] = useState('')
  const [lines, setLines] = useState<TerminalLine[]>(() => buildBootLines(title))

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
    pushLine('system', `[hint] ${safeQuizzes[targetIndex].hint}`)
    focusInput()
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const normalized = input.trim().toLowerCase()
    if (!normalized || !current.answer) return

    pushLine('system', `> ${input.trim()}`)

    if (normalized === current.answer.trim().toLowerCase()) {
      pushLine('success', '[success] Correct!')
      handleNextQuestion()
      return
    }

    pushLine('error', '[error] Try again.')
    setInput('')
    focusInput()
  }

  function handleQuizClick() {
    if (safeQuizzes.length <= 1) return
    handleNextQuestion()
  }

  return (
    <div id="terminal-drill" className="glass-strong mt-4 rounded-[1.5rem] border border-white/10 bg-black/70 p-4 shadow-[0_0_40px_rgba(15,23,42,0.45)]">
      <div className="mb-3 flex items-center justify-between gap-4 border-b border-white/8 pb-3">
        <div>
          <div className="text-xs uppercase tracking-[0.35em] text-emerald-300/80">Terminal Drill</div>
          <div className="mt-1 text-sm text-slate-400">终端式极客测验</div>
        </div>
        <button
          type="button"
          onClick={handleQuizClick}
          className="rounded-full border border-emerald-400/15 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-200 transition hover:border-emerald-300/30 hover:bg-emerald-400/15 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={safeQuizzes.length <= 1}
        >
          Quiz {Math.min(index + 1, safeQuizzes.length)} / {safeQuizzes.length}
        </button>
      </div>

      <div className="rounded-2xl border border-white/8 bg-[#020617] p-4 font-mono text-sm text-slate-200">
        <div className="mb-4 flex items-center gap-2 text-xs text-slate-500">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
          <span className="ml-2">algorithm-terminal</span>
        </div>

        <div className="space-y-2">
          {lines.slice(-6).map((line) => (
            <div
              key={line.id}
              className={
                line.type === 'success'
                  ? 'text-emerald-300'
                  : line.type === 'error'
                    ? 'text-rose-300'
                    : 'text-slate-400'
              }
            >
              {line.text}
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-xl border border-cyan-400/15 bg-cyan-400/5 px-3 py-3 text-slate-100">
          {current.prompt}
        </div>

        <div className="mt-2 text-xs text-slate-500">Hint: {current.hint}</div>

        <form onSubmit={handleSubmit} className="mt-4 flex items-center gap-3">
          <span className="text-emerald-300">$</span>
          <div className="flex-1 rounded-lg border border-white/6 bg-white/3 px-3 py-2">
            <input
              ref={inputRef}
              autoFocus
              value={input}
              onChange={(event) => setInput(event.target.value)}
              disabled={!current.answer}
              className="w-full border-none bg-transparent text-slate-100 outline-none placeholder:text-slate-500 disabled:cursor-not-allowed disabled:text-slate-500"
              placeholder={current.answer ? 'Type your answer and press Enter' : 'Awaiting AI-generated quiz'}
            />
          </div>
        </form>
      </div>
    </div>
  )
}

