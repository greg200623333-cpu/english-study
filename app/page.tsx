import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen grid-bg" style={{ background: '#0a0b0f' }}>

      <nav className="fixed top-0 left-0 right-0 z-50 glass" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center btn-glow">
              <span className="text-white font-bold text-sm relative z-10">英</span>
            </div>
            <span className="font-bold text-white text-base md:text-lg tracking-tight">英语学习平台</span>
          </div>
          <div className="flex items-center gap-3 md:gap-6">
            <div className="hidden md:flex items-center gap-6">
              <Link href="/quiz" className="text-slate-400 hover:text-white text-sm font-medium transition-colors">刷题</Link>
              <Link href="/words" className="text-slate-400 hover:text-white text-sm font-medium transition-colors">单词</Link>
              <Link href="/essay" className="text-slate-400 hover:text-white text-sm font-medium transition-colors">作文</Link>
              <Link href="/login" className="text-slate-400 hover:text-white text-sm font-medium transition-colors">登录</Link>
            </div>
            <Link href="/login" className="md:hidden text-slate-400 hover:text-white text-sm font-medium transition-colors">登录</Link>
            <Link href="/register" className="btn-glow px-4 md:px-5 py-2 rounded-xl text-white text-sm font-semibold">
              免费注册
            </Link>
          </div>
        </div>
      </nav>

      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">

        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-20"
            style={{ background: 'radial-gradient(circle, #7c3aed, transparent)' }} />
          <div className="absolute top-1/3 right-1/4 w-80 h-80 rounded-full blur-3xl opacity-15"
            style={{ background: 'radial-gradient(circle, #06b6d4, transparent)' }} />
          <div className="absolute bottom-1/4 left-1/2 w-64 h-64 rounded-full blur-3xl opacity-10"
            style={{ background: 'radial-gradient(circle, #8b5cf6, transparent)' }} />
        </div>

        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[
            { top: '15%', left: '8%', size: 60, delay: '0s', opacity: 0.15 },
            { top: '25%', right: '6%', size: 40, delay: '1s', opacity: 0.1 },
            { top: '60%', left: '5%', size: 30, delay: '2s', opacity: 0.12 },
            { top: '70%', right: '8%', size: 50, delay: '0.5s', opacity: 0.08 },
            { top: '40%', left: '15%', size: 20, delay: '3s', opacity: 0.2 },
            { top: '50%', right: '15%', size: 25, delay: '1.5s', opacity: 0.15 },
          ].map((p, i) => (
            <div key={i} className="absolute rounded-full float"
              style={{
                top: p.top, left: (p as any).left, right: (p as any).right,
                width: p.size, height: p.size,
                background: i % 2 === 0
                  ? 'linear-gradient(135deg, rgba(139,92,246,0.3), rgba(6,182,212,0.1))'
                  : 'linear-gradient(135deg, rgba(6,182,212,0.2), rgba(139,92,246,0.1))',
                border: '1px solid rgba(139,92,246,0.2)',
                animationDelay: p.delay,
                opacity: p.opacity,
              }} />
          ))}
        </div>

        <div className="relative z-10 text-center max-w-4xl mx-auto px-4 md:px-8">
          <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 mb-6 md:mb-8"
            style={{ border: '1px solid rgba(139,92,246,0.3)' }}>
            <span className="glow-dot" />
            <span className="text-xs md:text-sm font-medium" style={{ color: '#a78bfa' }}>四六级 · 考研英语 · AI 驱动</span>
          </div>

          <h1 className="text-4xl md:text-7xl font-extrabold mb-4 md:mb-6 leading-tight tracking-tight">
            <span style={{ color: '#f1f5f9' }}>备考更高效</span>
            <br />
            <span className="gradient-text">AI 驱动英语学习</span>
          </h1>

          <p className="text-base md:text-xl mb-8 md:mb-12 max-w-2xl mx-auto leading-relaxed" style={{ color: '#94a3b8' }}>
            刷题、背单词、AI 批改作文，全面覆盖四六级与考研英语备考需求
            <span className="hidden md:inline"><br />让每一分钟的学习都精准有效</span>
          </p>

          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center mb-12 md:mb-20 px-4 sm:px-0">
            <Link href="/register"
              className="btn-glow px-8 md:px-10 py-3 md:py-4 rounded-2xl text-white font-bold text-base md:text-lg text-center">
              免费开始学习
            </Link>
            <Link href="/dashboard"
              className="glass px-8 md:px-10 py-3 md:py-4 rounded-2xl font-bold text-base md:text-lg transition-all text-center"
              style={{ color: '#e2e8f0', border: '1px solid rgba(255,255,255,0.1)' }}>
              游客体验 →
            </Link>
          </div>

          <div className="flex justify-center gap-8 md:gap-16">
            {[
              { num: '1000+', label: '题库题目', color: '#a78bfa' },
              { num: '500+', label: '核心词汇', color: '#22d3ee' },
              { num: 'AI', label: '智能批改', color: '#34d399' },
              { num: '3', label: '考试类型', color: '#f472b6' },
            ].map(s => (
              <div key={s.label} className="text-center">
                <div className="text-3xl font-extrabold mb-1" style={{ color: s.color }}>{s.num}</div>
                <div className="text-sm" style={{ color: '#64748b' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 md:px-8 py-16 md:py-24">
        <div className="text-center mb-10 md:mb-16">
          <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 mb-4"
            style={{ border: '1px solid rgba(34,211,238,0.2)' }}>
            <span className="text-xs font-medium" style={{ color: '#22d3ee' }}>CORE FEATURES</span>
          </div>
          <h2 className="text-2xl md:text-4xl font-bold mb-3" style={{ color: '#f1f5f9' }}>全面覆盖备考需求</h2>
          <p className="text-sm md:text-base" style={{ color: '#64748b' }}>四大核心功能，助你高效备考</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5">
          {[
            { icon: '📝', title: '刷题练习', desc: '四六级 & 考研真题模拟，即时解析', href: '/quiz', accent: '#8b5cf6', tag: 'QUIZ' },
            { icon: '📚', title: '单词学习', desc: '核心词汇卡片翻转，记忆状态追踪', href: '/words', accent: '#22d3ee', tag: 'VOCAB' },
            { icon: '✍️', title: 'AI 作文', desc: 'DeepSeek AI 即时评分，修改建议', href: '/essay', accent: '#34d399', tag: 'ESSAY' },
            { icon: '📊', title: '学习进度', desc: '正确率、单词量数据全面追踪', href: '/dashboard', accent: '#f472b6', tag: 'STATS' },
          ].map((item) => (
            <Link key={item.title} href={item.href}
              className="glass card-hover rounded-2xl p-4 md:p-6 group block"
              style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex items-center justify-between mb-3 md:mb-5">
                <div className="text-2xl md:text-4xl">{item.icon}</div>
                <span className="text-xs font-bold px-1.5 md:px-2 py-0.5 md:py-1 rounded-lg hidden sm:block"
                  style={{ color: item.accent, background: `${item.accent}15`, border: `1px solid ${item.accent}30` }}>
                  {item.tag}
                </span>
              </div>
              <h3 className="font-bold text-sm md:text-lg mb-1 md:mb-2" style={{ color: '#f1f5f9' }}>{item.title}</h3>
              <p className="text-xs md:text-sm leading-relaxed mb-2 md:mb-4" style={{ color: '#64748b' }}>{item.desc}</p>
              <div className="text-xs md:text-sm font-medium opacity-60 group-hover:opacity-100 transition-opacity"
                style={{ color: item.accent }}>开始使用 →</div>
            </Link>
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 md:px-8 pb-16 md:pb-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-5">
          {[
            { icon: '🤖', title: 'DeepSeek AI 驱动', desc: '接入最新 DeepSeek 大模型，智能出题、作文批改全面 AI 化', accent: '#8b5cf6' },
            { icon: '⚡', title: '实时反馈', desc: '答题即时解析，作文秒级批改，不让等待打断学习心流', accent: '#22d3ee' },
            { icon: '📈', title: '进度可视化', desc: '学习数据全面追踪，正确率趋势、单词掌握度一目了然', accent: '#34d399' },
          ].map(item => (
            <div key={item.title} className="glass card-hover rounded-2xl p-5 md:p-6"
              style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="text-2xl md:text-3xl mb-3 md:mb-4">{item.icon}</div>
              <h3 className="font-bold text-base md:text-lg mb-2" style={{ color: '#f1f5f9' }}>{item.title}</h3>
              <p className="text-xs md:text-sm leading-relaxed" style={{ color: '#64748b' }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 md:px-8 pb-16 md:pb-24">
        <div className="relative rounded-2xl md:rounded-3xl overflow-hidden p-8 md:p-16 text-center"
          style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.2), rgba(6,182,212,0.1))', border: '1px solid rgba(139,92,246,0.3)' }}>
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-20"
              style={{ background: 'radial-gradient(circle, #7c3aed, transparent)' }} />
            <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full blur-3xl opacity-15"
              style={{ background: 'radial-gradient(circle, #06b6d4, transparent)' }} />
          </div>
          <div className="relative z-10">
            <h2 className="text-2xl md:text-4xl font-extrabold mb-3 md:mb-4 gradient-text">立即开始你的备考之旅</h2>
            <p className="mb-6 md:mb-8 text-sm md:text-lg" style={{ color: '#94a3b8' }}>免费注册，解锁全部功能，AI 助力高效备考</p>
            <Link href="/register"
              className="btn-glow inline-block px-8 md:px-12 py-3 md:py-4 rounded-2xl text-white font-bold text-base md:text-lg">
              免费注册
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t py-6 md:py-8 text-center text-xs md:text-sm"
        style={{ borderColor: 'rgba(255,255,255,0.06)', color: '#475569' }}>
        © 2025 英语学习平台 · 四六级 & 考研英语备考 · Powered by DeepSeek AI
      </footer>
    </main>
  )
}
