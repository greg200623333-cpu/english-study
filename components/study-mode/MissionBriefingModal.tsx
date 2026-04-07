'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'

type MissionBriefingModalProps = {
  open: boolean
  onComplete: () => void | Promise<void>
}

const briefingSteps = [
  { step: '01', title: '欢迎来到最高指挥部', body: '在这里，英语备考不再是机械刷题，而是一场关乎国家兴衰的宏观战略演练。' },
  { step: '02', title: '战略指标同步', body: '词汇量等于经济 GDP，阅读 WPM 等于产能基建，复习任务等于财政赤字，行政力则决定你能颁布多少高压法案。' },
  { step: '03', title: '签署动员令', body: '你的每一次记忆、复盘与提速，都会反馈到国家面板。现在，请启动战备部署。' },
]

export function MissionBriefingModal({ open, onComplete }: MissionBriefingModalProps) {
  const [stepIndex, setStepIndex] = useState(0)
  const activeStep = briefingSteps[stepIndex]

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-black/70 px-4 backdrop-blur-md">
      <div className="absolute inset-0 grid-bg opacity-40" />
      <div className="absolute left-1/2 top-1/2 h-[36rem] w-[36rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-500/10 blur-3xl" />
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="glass-strong relative w-full max-w-4xl overflow-hidden rounded-[2rem] border border-cyan-400/20">
        <div className="flex items-center justify-between border-b border-white/10 px-8 py-5">
          <div><p className="text-xs uppercase tracking-[0.35em] text-cyan-300/80">Mission Briefing</p><h2 className="mt-2 text-3xl font-black text-slate-50">大战略备考版</h2></div>
          <div className="text-right text-xs text-slate-400"><div>STEP {activeStep.step}</div><div>{stepIndex + 1} / {briefingSteps.length}</div></div>
        </div>
        <div className="grid min-h-[28rem] gap-6 px-8 py-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="flex flex-col justify-between">
            <AnimatePresence mode="wait">
              <motion.div key={activeStep.step} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -24 }} transition={{ duration: 0.32 }} className="space-y-6">
                <div className="inline-flex items-center rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs text-cyan-200">最高优先级战略简报</div>
                <h3 className="max-w-2xl text-4xl font-black leading-tight text-slate-50">{activeStep.title}</h3>
                <p className="max-w-2xl text-lg leading-8 text-slate-300">{activeStep.body}</p>
              </motion.div>
            </AnimatePresence>
            <div className="mt-10 flex items-center gap-3">{briefingSteps.map((item, index) => <div key={item.step} className="h-1.5 flex-1 rounded-full" style={{ background: index <= stepIndex ? 'linear-gradient(90deg, rgba(34,211,238,1), rgba(59,130,246,1))' : 'rgba(255,255,255,0.08)' }} />)}</div>
          </div>
          <div className="glass rounded-[1.75rem] border border-white/10 p-6">
            <div className="space-y-4 text-sm text-slate-300">
              <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4"><div className="text-xs uppercase tracking-[0.25em] text-emerald-300">GDP</div><div className="mt-2 text-xl font-bold text-slate-50">词汇就是经济底盘</div></div>
              <div className="rounded-2xl border border-sky-400/20 bg-sky-400/10 p-4"><div className="text-xs uppercase tracking-[0.25em] text-sky-300">WPM</div><div className="mt-2 text-xl font-bold text-slate-50">阅读速度决定基建效率</div></div>
              <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 p-4"><div className="text-xs uppercase tracking-[0.25em] text-rose-300">Deficit</div><div className="mt-2 text-xl font-bold text-slate-50">积压复习就是财政赤字</div></div>
              <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4"><div className="text-xs uppercase tracking-[0.25em] text-amber-300">AP</div><div className="mt-2 text-xl font-bold text-slate-50">行政力驱动政策加成</div></div>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between border-t border-white/10 px-8 py-5">
          <button type="button" onClick={() => setStepIndex((current) => Math.max(0, current - 1))} className="rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-400 transition hover:border-white/20 hover:text-slate-200" disabled={stepIndex === 0}>上一步</button>
          {stepIndex < briefingSteps.length - 1 ? <button type="button" onClick={() => setStepIndex((current) => Math.min(briefingSteps.length - 1, current + 1))} className="btn-glow rounded-xl px-5 py-2.5 text-sm font-semibold text-white">继续简报</button> : <button type="button" onClick={() => void onComplete()} className="rounded-xl border border-cyan-300/30 bg-cyan-400/20 px-6 py-2.5 text-sm font-semibold text-cyan-50 shadow-[0_0_30px_rgba(34,211,238,0.35)] transition hover:bg-cyan-400/30">开始部署</button>}
        </div>
      </motion.div>
    </div>
  )
}
