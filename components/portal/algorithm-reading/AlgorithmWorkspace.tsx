'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import Editor from '@monaco-editor/react'
import InstructionOverlay from './InstructionOverlay'
import SmartTooltip from './SmartTooltip'
import TerminalPanel, { type QuizItem } from './TerminalPanel'

type WorkspacePayload = {
  title: string
  summary: string
  highlightedTerms: string[]
  codeSolution: string
  quizzes: QuizItem[]
}

const ONBOARDING_STORAGE_KEY = 'hasFinishedAlgoOnboarding'

const onboardingSteps = [
  {
    selector: '#input-area',
    title: '题干录入区',
    description: '在此处输入英文原题。点击解析，开启 AI 深度学习模式。',
  },
  {
    selector: '.highlighted-term',
    title: '核心逻辑词',
    description: 'AI 已为您解剖出核心逻辑词。悬浮查看它们与代码的映射关系。',
  },
  {
    selector: '.monaco-editor-wrapper',
    title: '代码参考区',
    description: '对照 C 语言参考实现，同步磨炼您的代码功底与专业语感。',
  },
  {
    selector: '#terminal-drill',
    title: '终端测验',
    description: '在终端中输入正确术语完成测验。只有真正的黑客才能通过这里。',
  },
] as const

const defaultProblem = `Longest Increasing Subsequence
Given an integer array nums, return the length of the longest strictly increasing subsequence.
A subsequence is a sequence that can be derived from an array by deleting some or no elements without changing the order of the remaining elements.
You must design an algorithm that runs in O(n log n) time complexity.`

const fallbackPayload: WorkspacePayload = {
  title: 'Longest Increasing Subsequence',
  summary:
    'Focus on subsequence semantics, O(n log n) constraints, binary search replacement logic, and why the tails array preserves the minimum possible ending value for each length.',
  highlightedTerms: ['strictly increasing subsequence', 'O(n log n)', 'binary search', 'tails array'],
  codeSolution: `#include <stdio.h>\n\nint lower_bound(int *arr, int size, int target) {\n  int left = 0;\n  int right = size;\n\n  while (left < right) {\n    int mid = left + (right - left) / 2;\n    if (arr[mid] < target) {\n      left = mid + 1;\n    } else {\n      right = mid;\n    }\n  }\n\n  return left;\n}\n\nint lengthOfLIS(int *nums, int numsSize) {\n  int tails[2500];\n  int size = 0;\n\n  for (int i = 0; i < numsSize; i++) {\n    int pos = lower_bound(tails, size, nums[i]);\n    tails[pos] = nums[i];\n    if (pos == size) {\n      size++;\n    }\n  }\n\n  return size;\n}\n`,
  quizzes: [
    {
      id: 'binary-search',
      prompt: 'Use _____ search to locate the replacement position in O(log n).',
      answer: 'binary',
      hint: 'It repeatedly halves the search interval.',
      cnConcept: '二分查找 · O(log n)',
      cnHint: '在 tails 数组中定位插入位置时，使用二分查找可将每次操作从 O(n) 降至 O(log n)，整体复杂度达到 O(n log n)。',
    },
    {
      id: 'tails-array',
      prompt: 'The algorithm maintains a _____ array to store the smallest tail of each valid length.',
      answer: 'tails',
      hint: 'It stores the optimal ending element for each subsequence length.',
      cnConcept: 'tails 数组维护',
      cnHint: 'tails[i] 保存当前长度为 i+1 的递增子序列末尾的最小值。贪心策略使得 tails 始终有序，从而支持二分查找。',
    },
    {
      id: 'subsequence',
      prompt: 'A valid answer is an increasing _____, where elements need not be adjacent.',
      answer: 'subsequence',
      hint: 'Elements keep their relative order but do not need to stay adjacent.',
      cnConcept: '子序列 vs 子数组',
      cnHint: '子序列（subsequence）保持相对顺序但元素可以不连续；子数组（subarray）要求元素连续。LIS 问题求的是子序列，而非子数组。',
    },
  ],
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function renderHighlightedText(text: string, highlightTerms: string[], onTermClick: (term: string, x: number, y: number) => void) {
  if (!highlightTerms.length) {
    return text
  }

  const matcher = new RegExp(`(${highlightTerms.map(escapeRegExp).join('|')})`, 'gi')
  const parts = text.split(matcher)

  return parts.map((part, index) => {
    const matched = highlightTerms.find((term) => term.toLowerCase() === part.toLowerCase())
    if (!matched) {
      return <span key={`${part}-${index}`}>{part}</span>
    }

    return (
      <button
        key={`${part}-${index}`}
        type="button"
        onMouseUp={(event) => onTermClick(matched, event.clientX, event.clientY + 12)}
        className="highlighted-term rounded-md border border-fuchsia-400/20 bg-fuchsia-400/10 px-1.5 py-0.5 text-fuchsia-200 shadow-[0_0_12px_rgba(192,132,252,0.22)] transition hover:bg-fuchsia-400/16"
      >
        {part}
      </button>
    )
  })
}

export default function AlgorithmWorkspace() {
  const [problemInput, setProblemInput] = useState(defaultProblem)
  const [analysis, setAnalysis] = useState<WorkspacePayload>(fallbackPayload)
  const [isGenerating, setIsGenerating] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [summaryOpen, setSummaryOpen] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [tooltipOpen, setTooltipOpen] = useState(false)
  const [tooltipTerm, setTooltipTerm] = useState('')
  const [tooltipX, setTooltipX] = useState(0)
  const [tooltipY, setTooltipY] = useState(0)
  const [tooltipLoading, setTooltipLoading] = useState(false)
  const [tooltipExplanation, setTooltipExplanation] = useState('')
  const [tooltipCode, setTooltipCode] = useState('')

  const problemParagraphs = useMemo(() => problemInput.split(/\n{1,}/).map((line) => line.trim()).filter(Boolean), [problemInput])

  useEffect(() => {
    const hasFinished = window.localStorage.getItem(ONBOARDING_STORAGE_KEY) === 'true'
    if (!hasFinished) {
      setSummaryOpen(true)
      setShowOnboarding(true)
    }
  }, [])

  function finishOnboarding() {
    window.localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true')
    setShowOnboarding(false)
  }

  async function handleGenerateWorkspace() {
    const trimmedProblem = problemInput.trim()
    if (!trimmedProblem) {
      setErrorMessage('请先输入英文算法题目，再启动 AI 战术解析。')
      return
    }

    setIsGenerating(true)
    setErrorMessage('')

    try {
      const response = await fetch('/api/portal/algorithm-workspace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ problem: trimmedProblem }),
      })

      if (!response.ok) {
        throw new Error('Workspace generation failed')
      }

      const data = (await response.json()) as WorkspacePayload
      setAnalysis({
        title: data.title || 'Algorithm Mission',
        summary: data.summary || fallbackPayload.summary,
        highlightedTerms: Array.isArray(data.highlightedTerms) && data.highlightedTerms.length ? data.highlightedTerms : fallbackPayload.highlightedTerms,
        codeSolution: data.codeSolution || fallbackPayload.codeSolution,
        quizzes: Array.isArray(data.quizzes) && data.quizzes.length ? data.quizzes : fallbackPayload.quizzes,
      })
      setSummaryOpen(true)
    } catch {
      setAnalysis(fallbackPayload)
      setErrorMessage('AI 解析失败，已切换到本地预案。请检查 DeepSeek 配置后重试。')
      setSummaryOpen(true)
    } finally {
      setIsGenerating(false)
    }
  }

  async function openTooltip(term: string, x: number, y: number) {
    setTooltipTerm(term)
    setTooltipX(x)
    setTooltipY(y)
    setTooltipOpen(true)
    setTooltipLoading(true)
    setTooltipExplanation('')
    setTooltipCode('')

    try {
      const response = await fetch('/api/portal/algorithm-tooltip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ term, problemTitle: analysis.title, context: problemParagraphs.join(' ') }),
      })

      if (!response.ok) {
        throw new Error('Tooltip request failed')
      }

      const data = await response.json()
      setTooltipExplanation(data.explanation)
      setTooltipCode(data.codeDemo)
    } catch {
      setTooltipExplanation('该术语通常指算法题中的关键逻辑节点，需要结合上下文理解其在状态转移或数据结构维护中的具体作用。')
      setTooltipCode(`int demo_${term.replace(/\s+/g, '_').toLowerCase()}(void) {\n  /* fallback C demo */\n  return 0;\n}`)
    } finally {
      setTooltipLoading(false)
    }
  }

  function handleReaderMouseUp() {
    const selection = window.getSelection()
    const selectedText = selection?.toString().trim() ?? ''
    if (!selectedText || selectedText.length > 60) return

    const range = selection?.rangeCount ? selection.getRangeAt(0) : null
    const rect = range?.getBoundingClientRect()
    if (!rect) return

    void openTooltip(selectedText, rect.left, rect.bottom + 12)
  }

  return (
    <>
      <main className="min-h-screen overflow-x-hidden px-5 py-5" style={{ background: '#0b0d13' }}>
        <div className="mx-auto flex min-h-[calc(100vh-2.5rem)] max-w-[1800px] flex-col">
          <div className="mb-4 flex items-center justify-between gap-4">
            <Link href="/portal" className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-cyan-300/25 hover:bg-cyan-300/10 hover:text-cyan-100">
              ← 返回工作台
            </Link>
            <div className="rounded-full border border-fuchsia-400/20 bg-fuchsia-400/10 px-4 py-2 text-xs uppercase tracking-[0.35em] text-fuchsia-200/90">
              Algorithm Immersive Reading
            </div>
          </div>

          <div className="flex flex-1 gap-4">
            <section className="glass-strong flex min-h-[44rem] w-[40%] flex-col rounded-[1.75rem] border border-white/10 p-5">
              <div className="mb-4 border-b border-white/8 pb-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-xs uppercase tracking-[0.3em] text-cyan-300/80">Problem Intake</div>
                    <h1 className="mt-2 text-2xl font-black text-slate-50">{analysis.title}</h1>
                  </div>
                  <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-400">
                    DeepSeek annotated
                  </div>
                </div>

                <div id="input-area" className="mt-4 rounded-[1.25rem] border border-white/8 bg-slate-950/60 p-4">
                  <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-slate-500">Paste English problem statement</label>
                  <textarea
                    value={problemInput}
                    onChange={(event) => setProblemInput(event.target.value)}
                    className="h-40 w-full resize-none rounded-[1rem] border border-white/8 bg-[#020617] px-4 py-3 text-sm leading-7 text-slate-200 outline-none transition placeholder:text-slate-500 focus:border-cyan-300/25 focus:bg-slate-950"
                    placeholder="Paste the original English algorithm problem here"
                  />
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm leading-6 text-slate-400">提交后将自动抽取重点术语、生成中文战术摘要、构建 C 语言参考实现与终端测验。</p>
                    <button
                      type="button"
                      onClick={handleGenerateWorkspace}
                      disabled={isGenerating}
                      className="rounded-xl border border-fuchsia-400/25 bg-fuchsia-400/12 px-5 py-2.5 text-sm font-semibold text-fuchsia-100 transition hover:border-fuchsia-300/35 hover:bg-fuchsia-400/20 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isGenerating ? 'AI 解析中...' : '启动 AI 战术解析'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="mb-4 space-y-3">
                <button
                  type="button"
                  onClick={() => setSummaryOpen((open) => !open)}
                  className="flex w-full items-center justify-center gap-3 rounded-[1.25rem] border border-cyan-300/25 bg-cyan-300/12 px-4 py-3 text-sm font-semibold text-cyan-100 shadow-[0_0_24px_rgba(34,211,238,0.12)] backdrop-blur-xl transition hover:border-cyan-200/40 hover:bg-cyan-300/18"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-full border border-cyan-200/20 bg-cyan-200/10 text-lg">
                    💡
                  </span>
                  <span>查看战术要点</span>
                </button>

                {summaryOpen ? (
                  <div className="rounded-[1.5rem] border border-cyan-300/20 bg-slate-950/68 p-4 shadow-[0_18px_45px_rgba(8,15,28,0.28)] backdrop-blur-xl">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-xs uppercase tracking-[0.25em] text-cyan-200/80">Tactical Summary</div>
                        <p className="mt-3 text-sm leading-7 text-slate-100">{analysis.summary}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSummaryOpen(false)}
                        className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-slate-300 transition hover:border-white/20 hover:text-white"
                      >
                        收起
                      </button>
                    </div>
                    {errorMessage ? <p className="mt-3 text-xs text-amber-200">{errorMessage}</p> : null}
                  </div>
                ) : null}
              </div>

              <div onMouseUp={handleReaderMouseUp} className="min-h-[18rem] flex-1 overflow-y-auto pr-2 text-[15px] leading-8 text-slate-300">
                {problemParagraphs.map((paragraph, index) => (
                  <p key={index} className="mb-5 last:mb-0">
                    {renderHighlightedText(paragraph, analysis.highlightedTerms, openTooltip)}
                  </p>
                ))}
              </div>
            </section>

            <section className="glass-strong flex min-h-[44rem] w-[60%] flex-col rounded-[1.75rem] border border-white/10 p-5">
              <div className="mb-4 flex items-center justify-between gap-4 border-b border-white/8 pb-4">
                <div>
                  <div className="text-xs uppercase tracking-[0.3em] text-emerald-300/80">Source Lens</div>
                  <h2 className="mt-2 text-2xl font-black text-slate-50">C Reference Implementation</h2>
                </div>
                <div className="rounded-full border border-emerald-400/15 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-200">
                  AI generated / Monaco / read-only
                </div>
              </div>

              <div className="mb-4 grid gap-3 sm:grid-cols-3">
                {analysis.highlightedTerms.slice(0, 6).map((term) => (
                  <button
                    key={term}
                    type="button"
                    onClick={(event) => void openTooltip(term, event.clientX, event.clientY + 16)}
                    className="highlighted-term rounded-full border border-fuchsia-400/15 bg-fuchsia-400/10 px-3 py-2 text-left text-xs font-semibold text-fuchsia-100 transition hover:border-fuchsia-300/30 hover:bg-fuchsia-400/15"
                  >
                    {term}
                  </button>
                ))}
              </div>

              <div className="monaco-editor-wrapper min-h-0 flex-1 overflow-hidden rounded-[1.25rem] border border-white/8 bg-[#020617]">
                <Editor
                  height="100%"
                  defaultLanguage="c"
                  theme="vs-dark"
                  value={analysis.codeSolution}
                  options={{
                    readOnly: true,
                    minimap: { enabled: false },
                    fontSize: 14,
                    wordWrap: 'on',
                    scrollBeyondLastLine: false,
                    lineNumbersMinChars: 3,
                  }}
                />
              </div>
            </section>
          </div>

          <div className="mt-5">
            <TerminalPanel key={analysis.title} quizzes={analysis.quizzes} title={analysis.title} />
          </div>
        </div>

        <SmartTooltip
          open={tooltipOpen}
          x={tooltipX}
          y={tooltipY}
          term={tooltipTerm}
          loading={tooltipLoading}
          explanation={tooltipExplanation}
          codeDemo={tooltipCode}
          onClose={() => setTooltipOpen(false)}
        />
      </main>

      {showOnboarding ? <InstructionOverlay steps={[...onboardingSteps]} open={showOnboarding} onFinish={finishOnboarding} /> : null}
    </>
  )
}

