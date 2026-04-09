'use client'

import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import type { ExamType } from '@/stores/useStudyModeStore'

type SelectionModalProps = {
  open: boolean
  onSelect: (exam: ExamType) => void | Promise<void>
  currentExam?: ExamType | null
  redirectToSsa?: boolean
}

const options: Array<{
  key: ExamType
  title: string
  subtitle: string
  description: string
  accent: string
  stats: string[]
}> = [
  { key: 'cet4', title: 'CET-4 基础建设', subtitle: '适合尚在搭建词汇与阅读底盘的指挥官', description: '优先补齐词汇 GDP 与基础阅读基建，建立稳定产能。', accent: '#22d3ee', stats: ['词汇财政优先', '低赤字稳增长', '随时可调整'] },
  { key: 'cet6', title: 'CET-6 全面扩张', subtitle: '适合准备从通过线向高分区突破的阶段', description: '在阅读、听力、写作之间平衡资源调度，追求综合扩张。', accent: '#8b5cf6', stats: ['多战线协同', '高频复盘机制', '随时可调整'] },
  { key: 'kaoyan', title: '考研英语 核心攻坚', subtitle: '适合高压环境下的精细化战略备考', description: '强化长难句拆解、阅读逻辑与写作调度，集中火力突破主战场。', accent: '#f97316', stats: ['长线拉锯战', '精读优先级最高', '随时可调整'] },
]

function reportSelectionError(error: unknown) {
  console.error('Campaign selection failed:', error)
}

export function SelectionModal({ open, onSelect, currentExam, redirectToSsa = true }: SelectionModalProps) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState<ExamType | null>(null)

  if (!open) return null

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/80 px-4 backdrop-blur-md">
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="glass-strong w-full max-w-6xl rounded-[2rem] border border-white/10 p-8">
        <div className="mb-8 flex items-end justify-between gap-6">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-cyan-300/80">Campaign Selection</p>
            <h2 className="mt-2 text-3xl font-black text-slate-50">签署备考动员令</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400">选择作战剧本后，系统将初始化国家参数，包括词汇 GDP、考试倒计时、行政力与四维能力底盘。</p>
          </div>
          <div className="rounded-2xl border border-cyan-400/15 bg-cyan-400/10 px-4 py-3 text-sm text-cyan-100">可随时调整战略方向</div>
        </div>

        <div className="mb-6 rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm leading-7 text-amber-100">当前规则：战略方向不再锁定。你可以根据备考节奏随时切换主战路线。</div>

        <div className="grid gap-5 lg:grid-cols-3">
          {options.map((option, index) => {
            const active = currentExam === option.key
            return (
              <motion.button
                key={option.key}
                type="button"
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08 }}
                disabled={submitting !== null}
                onClick={() => {
                  setSubmitting(option.key)
                  Promise.resolve()
                    .then(() => onSelect(option.key))
                    .then(() => {
                      if (redirectToSsa) router.push('/ssa')
                    })
                    .catch(reportSelectionError)
                    .finally(() => setSubmitting(null))
                }}
                className="mode-card-mega rounded-[1.75rem] bg-slate-950/80 p-6 text-left"
                style={{ ['--glow-color-1' as string]: `${option.accent}66`, ['--glow-color-2' as string]: `${option.accent}22` }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.25em] text-slate-500">战略方案</p>
                    <h3 className="mt-3 text-2xl font-black text-slate-50">{option.title}</h3>
                  </div>
                  <div className="h-3 w-3 rounded-full shadow-[0_0_18px_currentColor]" style={{ background: option.accent, color: option.accent }} />
                </div>
                <p className="mt-4 text-sm text-slate-300">{option.subtitle}</p>
                <p className="mt-4 text-sm leading-7 text-slate-400">{option.description}</p>
                <div className="mt-6 space-y-2 text-sm text-slate-200">{option.stats.map((stat) => <div key={stat} className="rounded-xl border border-white/8 bg-white/5 px-3 py-2">{stat}</div>)}</div>
                <div className="mt-8 text-sm font-semibold" style={{ color: option.accent }}>
                  {submitting === option.key ? '战略回传中...' : active ? '当前执行路线' : '确认此战略路线'}
                </div>
              </motion.button>
            )
          })}
        </div>
      </motion.div>
    </div>
  )
}
