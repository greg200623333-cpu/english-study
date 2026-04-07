'use client'

import ReactECharts from 'echarts-for-react'
import type { GdpHistoryPoint } from '@/stores/useStudyModeStore'

type WarRoomDashboardProps = {
  examLabel: string
  daysToExam: number
  vocabularyGDP: number
  administrativePower: number
  reviewDeficit: number
  gdpHistory: GdpHistoryPoint[]
  skillBalance: {
    listening: number
    speaking: number
    reading: number
    writing: number
  }
  activeBuffs: {
    memoryRate: number
    reviewEfficiency: number
    focusRate: number
    gdpBonus: number
  }
  readingOps: {
    elapsedSeconds: number
    isTracking: boolean
    wordCount: number
    correctAnswers: number
    totalQuestions: number
    onWordCountChange: (value: number) => void
    onCorrectAnswersChange: (value: number) => void
    onTotalQuestionsChange: (value: number) => void
    onStart: () => void
    onFinish: () => void
    latestAssessment: {
      wpm: number
      accuracy: number
      contributionScore: number
      warningMessage: string
      isSuspicious: boolean
    } | null
  }
}

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`
}

export function WarRoomDashboard({
  examLabel,
  daysToExam,
  vocabularyGDP,
  administrativePower,
  reviewDeficit,
  gdpHistory,
  skillBalance,
  activeBuffs,
  readingOps,
}: WarRoomDashboardProps) {
  const gdpOption = {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis' },
    grid: { left: 24, right: 12, top: 20, bottom: 24, containLabel: true },
    xAxis: {
      type: 'category',
      data: gdpHistory.map((item) => item.label),
      axisLabel: { color: '#94a3b8' },
      axisLine: { lineStyle: { color: 'rgba(255,255,255,0.08)' } },
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: '#94a3b8' },
      splitLine: { lineStyle: { color: 'rgba(255,255,255,0.08)' } },
    },
    series: [
      {
        type: 'line',
        smooth: true,
        data: gdpHistory.map((item) => item.value),
        lineStyle: { color: '#22d3ee', width: 3 },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(34,211,238,0.35)' },
              { offset: 1, color: 'rgba(34,211,238,0.02)' },
            ],
          },
        },
        symbolSize: 8,
        itemStyle: { color: '#67e8f9' },
      },
    ],
  }

  const radarOption = {
    backgroundColor: 'transparent',
    radar: {
      indicator: [
        { name: '听', max: 100 },
        { name: '说', max: 100 },
        { name: '读', max: 100 },
        { name: '写', max: 100 },
      ],
      splitArea: {
        areaStyle: {
          color: ['rgba(255,255,255,0.02)', 'rgba(255,255,255,0.04)'],
        },
      },
      axisName: { color: '#cbd5e1' },
      splitLine: { lineStyle: { color: 'rgba(255,255,255,0.08)' } },
      axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } },
    },
    series: [
      {
        type: 'radar',
        data: [
          {
            value: [skillBalance.listening, skillBalance.speaking, skillBalance.reading, skillBalance.writing],
            areaStyle: { color: 'rgba(139,92,246,0.28)' },
            lineStyle: { color: '#8b5cf6', width: 2 },
            itemStyle: { color: '#c084fc' },
          },
        ],
      },
    ],
  }

  const deficitDanger = reviewDeficit >= 18

  return (
    <section className="space-y-6">
      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="glass-strong rounded-[1.75rem] border border-cyan-400/10 p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-cyan-300/80">War Room Dashboard</p>
              <h1 className="mt-3 text-4xl font-black text-slate-50">{examLabel || '待签署动员令'}</h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400">
                用国家经营视角管理你的英语备考资源，词汇增长、阅读基建、法案签署和赤字控制全部在此统一调度。
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-right text-sm">
              <div className="text-slate-400">距离考试</div>
              <div className="mt-1 text-3xl font-black text-amber-300">{daysToExam || '--'} 天</div>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/10 p-4">
              <div className="text-xs uppercase tracking-[0.25em] text-emerald-200">Vocabulary GDP</div>
              <div className="mt-3 text-3xl font-black text-white">{vocabularyGDP.toLocaleString()}</div>
              <div className="mt-2 text-sm text-emerald-100">词汇资产决定国家总产值</div>
            </div>
            <div className="rounded-2xl border border-amber-400/15 bg-amber-400/10 p-4">
              <div className="text-xs uppercase tracking-[0.25em] text-amber-200">Administrative Power</div>
              <div className="mt-3 text-3xl font-black text-white">{administrativePower}</div>
              <div className="mt-2 text-sm text-amber-100">用于签署高压政策与动员法案</div>
            </div>
            <div className="rounded-2xl border border-rose-400/15 bg-rose-400/10 p-4">
              <div className="flex items-center justify-between text-xs uppercase tracking-[0.25em] text-rose-200">
                <span>今日赤字</span>
                <span className={deficitDanger ? 'animate-pulse text-rose-100' : 'text-rose-100/70'}>
                  {deficitDanger ? '警报' : '稳定'}
                </span>
              </div>
              <div className="mt-3 flex items-center gap-3">
                <div
                  className={`h-3 w-3 rounded-full ${deficitDanger ? 'animate-pulse' : ''}`}
                  style={{
                    background: deficitDanger ? '#fb7185' : '#22c55e',
                    boxShadow: deficitDanger
                      ? '0 0 18px rgba(251,113,133,0.85)'
                      : '0 0 18px rgba(34,197,94,0.65)',
                  }}
                />
                <div className="text-3xl font-black text-white">{reviewDeficit}</div>
              </div>
              <div className="mt-2 text-sm text-rose-100">待复习任务积压量</div>
            </div>
          </div>
        </div>

        <div className="glass rounded-[1.75rem] border border-white/10 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-50">全局 Buff 面板</h2>
            <div className="text-xs uppercase tracking-[0.25em] text-slate-500">Realtime</div>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            {[
              ['记忆率', formatPercent(activeBuffs.memoryRate)],
              ['复习效率', formatPercent(activeBuffs.reviewEfficiency)],
              ['专注率', formatPercent(activeBuffs.focusRate)],
              ['GDP 增幅', formatPercent(activeBuffs.gdpBonus)],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-white/8 bg-white/5 px-4 py-3">
                <div className="text-sm text-slate-400">{label}</div>
                <div className="mt-2 text-2xl font-black text-cyan-100">{value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="glass rounded-[1.75rem] border border-white/10 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-50">GDP 增长曲线</h2>
            <div className="text-xs text-slate-500">词汇资产趋势</div>
          </div>
          <ReactECharts option={gdpOption} style={{ height: 320 }} />
        </div>

        <div className="glass rounded-[1.75rem] border border-white/10 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-50">产能雷达图</h2>
            <div className="text-xs text-slate-500">听说读写均衡度</div>
          </div>
          <ReactECharts option={radarOption} style={{ height: 320 }} />
        </div>
      </div>

      <div className="glass rounded-[1.75rem] border border-white/10 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-50">阅读基建追踪</h2>
            <p className="mt-2 text-sm text-slate-400">
              自动计时并计算 WPM、理解率与基建贡献分，同时过滤异常极速或超短时长数据。
            </p>
          </div>
          <div className="rounded-2xl border border-cyan-400/15 bg-cyan-400/10 px-4 py-3 text-sm text-cyan-100">
            已计时 {readingOps.elapsedSeconds} 秒
          </div>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-4">
          <label className="rounded-2xl border border-white/8 bg-white/5 p-4 text-sm text-slate-300">
            阅读词数
            <input
              type="number"
              min={50}
              value={readingOps.wordCount}
              onChange={(event) => readingOps.onWordCountChange(Number(event.target.value))}
              className="input-dark mt-3 w-full rounded-xl px-3 py-2"
            />
          </label>
          <label className="rounded-2xl border border-white/8 bg-white/5 p-4 text-sm text-slate-300">
            答对题数
            <input
              type="number"
              min={0}
              value={readingOps.correctAnswers}
              onChange={(event) => readingOps.onCorrectAnswersChange(Number(event.target.value))}
              className="input-dark mt-3 w-full rounded-xl px-3 py-2"
            />
          </label>
          <label className="rounded-2xl border border-white/8 bg-white/5 p-4 text-sm text-slate-300">
            总题数
            <input
              type="number"
              min={1}
              value={readingOps.totalQuestions}
              onChange={(event) => readingOps.onTotalQuestionsChange(Number(event.target.value))}
              className="input-dark mt-3 w-full rounded-xl px-3 py-2"
            />
          </label>
          <div className="rounded-2xl border border-white/8 bg-white/5 p-4 text-sm text-slate-300">
            <div>计时控制</div>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={readingOps.onStart}
                className="btn-glow flex-1 rounded-xl px-4 py-2 font-semibold text-white"
                disabled={readingOps.isTracking}
              >
                开始
              </button>
              <button
                type="button"
                onClick={readingOps.onFinish}
                className="rounded-xl border border-cyan-300/20 bg-cyan-400/10 px-4 py-2 font-semibold text-cyan-100"
              >
                结算
              </button>
            </div>
          </div>
        </div>

        {readingOps.latestAssessment && (
          <div className="mt-5 grid gap-4 lg:grid-cols-4">
            <div className="rounded-2xl border border-sky-400/15 bg-sky-400/10 p-4">
              <div className="text-sm text-sky-100/80">WPM</div>
              <div className="mt-2 text-3xl font-black text-white">{readingOps.latestAssessment.wpm}</div>
            </div>
            <div className="rounded-2xl border border-violet-400/15 bg-violet-400/10 p-4">
              <div className="text-sm text-violet-100/80">Accuracy</div>
              <div className="mt-2 text-3xl font-black text-white">{readingOps.latestAssessment.accuracy}%</div>
            </div>
            <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/10 p-4">
              <div className="text-sm text-emerald-100/80">基建贡献分</div>
              <div className="mt-2 text-3xl font-black text-white">{readingOps.latestAssessment.contributionScore}</div>
            </div>
            <div
              className="rounded-2xl border p-4"
              style={{
                borderColor: readingOps.latestAssessment.isSuspicious ? 'rgba(251,113,133,0.25)' : 'rgba(34,197,94,0.2)',
                background: readingOps.latestAssessment.isSuspicious ? 'rgba(251,113,133,0.12)' : 'rgba(34,197,94,0.12)',
              }}
            >
              <div className="text-sm text-slate-100/80">工程质检</div>
              <div className="mt-2 text-sm leading-6 text-slate-100">{readingOps.latestAssessment.warningMessage}</div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
