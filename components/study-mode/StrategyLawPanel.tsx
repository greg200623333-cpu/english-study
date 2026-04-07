'use client'

import { LAW_DEFINITIONS, type LawKey, type LawState } from '@/stores/useStudyModeStore'

type StrategyLawPanelProps = {
  laws: LawState
  administrativePower: number
  onToggle: (lawKey: LawKey) => void | Promise<void | { ok: boolean; reason?: string }>
  notice: string
}

export function StrategyLawPanel({ laws, administrativePower, onToggle, notice }: StrategyLawPanelProps) {
  return (
    <section className="glass rounded-[1.75rem] border border-white/10 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-amber-300/80">Strategy & Law Panel</p>
          <h2 className="mt-2 text-2xl font-black text-slate-50">政策控制面板</h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-400">
            开启政策会即时扣除行政力，并把 Buff 写入全局状态，供后续学习流程与阿里云后端同步使用。
          </p>
        </div>
        <div className="rounded-2xl border border-amber-400/15 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
          剩余行政力 {administrativePower}
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {LAW_DEFINITIONS.map((law) => {
          const active = laws[law.key]
          return (
            <div key={law.key} className="rounded-[1.5rem] border border-white/8 bg-white/5 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-50">{law.name}</h3>
                  <p className="mt-2 text-sm leading-7 text-slate-400">{law.description}</p>
                  <div className="mt-4 text-sm text-cyan-200">
                    Buff: {law.buffKey} +{Math.round(law.buffValue * 100)}%
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onToggle(law.key)}
                  className="relative h-8 w-16 rounded-full transition"
                  style={{ background: active ? 'linear-gradient(90deg, #06b6d4, #3b82f6)' : 'rgba(255,255,255,0.12)' }}
                  aria-pressed={active}
                >
                  <span
                    className="absolute top-1 h-6 w-6 rounded-full bg-white shadow-md transition"
                    style={{ left: active ? '2.15rem' : '0.25rem' }}
                  />
                </button>
              </div>
              <div className="mt-5 flex items-center justify-between text-sm">
                <span className="text-slate-500">法案成本</span>
                <span className="rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1 text-amber-200">
                  -{law.cost} 行政力
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {notice ? (
        <div className="mt-5 rounded-2xl border border-cyan-400/15 bg-cyan-400/10 px-4 py-3 text-sm text-cyan-100">
          {notice}
        </div>
      ) : null}
    </section>
  )
}
