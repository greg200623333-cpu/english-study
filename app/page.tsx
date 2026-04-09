import Link from 'next/link'
import { HomeOnboardingFlow } from '@/components/HomeOnboardingFlow'

const strategicSignals = [
  { label: '词汇 GDP', desc: '单词不再是孤立记忆，而是国家经济底盘。', color: '#22d3ee' },
  { label: '阅读基建', desc: 'WPM、理解率与长文调度共同决定基建速度。', color: '#8b5cf6' },
  { label: '法案系统', desc: '行政力不是摆设，它会直接影响全局 Buff。', color: '#fbbf24' },
  { label: '赤字治理', desc: '复习积压会反噬全局节奏，必须实时处理。', color: '#fb7185' },
]

const strategicFlow = [
  { step: '01', title: '进入最高指挥部', desc: '完成简报，理解 GDP、基建、赤字与行政力映射。' },
  { step: '02', title: '签署战略方向', desc: '选择 CET-4、CET-6 或考研主战路线，并立即初始化战区参数。' },
  { step: '03', title: '部署训练任务', desc: '在作战部署台安排情报、基建、外交与翻译任务。' },
  { step: '04', title: '回收战果', desc: '词汇、刷题、作文与法案收益全部回流到国家面板。' },
]

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden" style={{ background: '#06080d' }}>
      <div className="marble-texture" />
      <div className="moonlight-glow" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.12),transparent_35%),radial-gradient(circle_at_bottom,rgba(59,130,246,0.12),transparent_40%)]" />

      <nav className="glass fixed left-0 right-0 top-0 z-50 border-b border-white/8">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="btn-glow flex h-10 w-10 items-center justify-center rounded-xl">
              <span className="relative z-10 text-sm font-bold text-white">英</span>
            </div>
            <div>
              <div className="text-lg font-bold text-white">大战略备考平台</div>
              <div className="text-xs text-slate-500">Study Mode: War Room Edition</div>
            </div>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm text-slate-400 transition hover:text-white">登录</Link>
            <Link href="/register" className="rounded-xl border border-cyan-300/20 bg-cyan-300/10 px-5 py-2 text-sm font-semibold text-cyan-100">注册指挥官</Link>
          </div>
        </div>
      </nav>

      <section className="relative px-6 pb-20 pt-32">
        <div className="mx-auto max-w-7xl">
          <div className="grid items-center gap-10 xl:grid-cols-[1.1fr_0.9fr]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-200">
                战略备考系统已全面接管学习区
              </div>
              <h1 className="mt-8 max-w-5xl text-5xl font-black leading-tight text-slate-50 md:text-7xl">
                把英语备考
                <br />
                改造成一场 <span className="gradient-text">国家经营战争模拟</span>
              </h1>
              <p className="mt-8 max-w-3xl text-lg leading-8 text-slate-300">
                进入学习区后，默认看到的不再是普通刷题页面，而是最高指挥部、作战部署台、词汇财政部、政策输出部与法案系统。
                你的每次训练都会回流到 GDP、基建、赤字、事件流与战略曲线。
              </p>
              <div className="mt-10 flex flex-wrap gap-4">
                <HomeOnboardingFlow />
                <Link href="/portal" className="glass rounded-2xl px-8 py-4 text-lg font-bold text-slate-100" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>专业模式</Link>
              </div>
              <div className="mt-6 text-sm text-slate-500">提示：个人战略方向现在支持按备考节奏随时调整。</div>
            </div>

            <div className="glass-strong rounded-[2rem] border border-white/10 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs uppercase tracking-[0.3em] text-slate-500">Command Preview</div>
                  <div className="mt-2 text-2xl font-black text-slate-50">首页战略面板</div>
                </div>
                <div className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-200">Live</div>
              </div>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {strategicSignals.map((signal) => (
                  <div key={signal.label} className="rounded-[1.5rem] border border-white/8 bg-white/5 p-5">
                    <div className="text-sm font-semibold" style={{ color: signal.color }}>{signal.label}</div>
                    <div className="mt-3 text-sm leading-7 text-slate-400">{signal.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative px-6 pb-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <p className="text-xs uppercase tracking-[0.35em] text-cyan-300/80">Flow</p>
            <h2 className="mt-4 text-4xl font-black text-slate-50">四步进入大战略备考闭环</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {strategicFlow.map((item) => (
              <div key={item.step} className="glass rounded-[1.75rem] border border-white/10 p-6">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-cyan-300/10 text-sm font-black text-cyan-200">{item.step}</div>
                <h3 className="mt-5 text-xl font-bold text-slate-50">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative px-6 pb-24">
        <div className="mx-auto max-w-5xl rounded-[2rem] border border-cyan-400/20 bg-[linear-gradient(135deg,rgba(34,211,238,0.12),rgba(59,130,246,0.08))] p-12 text-center backdrop-blur-md">
          <p className="text-xs uppercase tracking-[0.35em] text-cyan-300/80">Begin Command</p>
          <h2 className="mt-4 text-4xl font-black text-slate-50">签署你的第一份动员令</h2>
          <p className="mx-auto mt-4 max-w-3xl text-lg leading-8 text-slate-300">学习区首页、部署台、词汇部、作文部和个人档案都已统一进入战略叙事。下一步就是正式开局。</p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link href="/register" className="btn-glow rounded-2xl px-8 py-4 text-lg font-bold text-white">立即注册</Link>
            <Link href="/dashboard" className="glass rounded-2xl px-8 py-4 text-lg font-bold text-slate-100" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>直接进入指挥部</Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/8 py-8 text-center text-sm text-slate-500">© 2026 大战略备考平台 · Strategy Mode Active</footer>
    </main>
  )
}

