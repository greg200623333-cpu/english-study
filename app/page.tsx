'use client'

import Link from 'next/link'
import { useState } from 'react'

export default function Home() {
  const [hoveredCard, setHoveredCard] = useState<'study' | 'pro' | null>(null)

  return (
    <main className="min-h-screen relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0f1419 0%, #1a1d29 50%, #0a0d14 100%)' }}>
      {/* 背景层 - 星空 */}
      <div className="starfield" />

      {/* 背景层 - 动态数字连接线 */}
      <div className="digital-lines" />

      {/* 背景层 - 网格 */}
      <div className="absolute inset-0 grid-bg opacity-30" />

      {/* 顶部导航 */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
              <span className="text-white font-bold">英</span>
            </div>
            <span className="font-bold text-white text-lg">英语学习平台</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/login" className="text-slate-400 hover:text-white text-sm transition-colors">登录</Link>
            <Link href="/register" className="px-5 py-2 rounded-xl text-white text-sm font-semibold"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
              免费注册
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero 区域 */}
      <section className="relative pt-32 pb-20 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 mb-8"
            style={{ border: '1px solid rgba(139,92,246,0.3)' }}>
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#a78bfa' }} />
            <span className="text-sm" style={{ color: '#a78bfa' }}>AI 驱动 · 智能学习</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
            <span style={{ color: '#f1f5f9' }}>重新定义</span>
            <br />
            <span className="gradient-text">英语学习方式</span>
          </h1>

          <p className="text-xl mb-12 max-w-2xl mx-auto" style={{ color: '#94a3b8' }}>
            四六级 · 考研 · 专业英语，一站式 AI 学习平台
          </p>

          <div className="flex items-center justify-center gap-4 mb-20">
            <Link href="/dashboard"
              className="px-8 py-4 rounded-2xl text-white font-bold text-lg transition-all hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 10px 40px rgba(99,102,241,0.3)' }}>
              开始学习 →
            </Link>
            <Link href="/portal"
              className="px-8 py-4 rounded-2xl font-bold text-lg transition-all hover:scale-105 glass"
              style={{ color: '#f1f5f9', border: '1px solid rgba(255,255,255,0.1)' }}>
              专业模式
            </Link>
          </div>
        </div>
      </section>

      {/* 双模式卡片 */}
      <section className="relative px-6 pb-24">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

            {/* 学习模式 */}
            <Link href="/dashboard"
              className={`group relative glass-strong rounded-3xl p-10 transition-all duration-500 ${hoveredCard === 'pro' ? 'opacity-50 scale-95' : 'hover:scale-105'}`}
              style={{ border: '1px solid rgba(99,102,241,0.3)' }}
              onMouseEnter={() => setHoveredCard('study')}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: 'radial-gradient(circle at top, rgba(99,102,241,0.15), transparent)' }} />

              <div className="relative z-10">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
                  style={{ background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.3)' }}>
                  <span className="text-4xl">📚</span>
                </div>

                <h3 className="text-3xl font-bold mb-3" style={{ color: '#f1f5f9' }}>学习模式</h3>
                <p className="text-sm mb-8" style={{ color: '#a78bfa' }}>四六级 · 考研英语</p>

                <div className="space-y-3 mb-8">
                  {['真题刷题系统', '智能错题本', 'AI 作文批改', '词汇记忆曲线'].map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#6366f1' }} />
                      <span className="text-sm" style={{ color: '#cbd5e1' }}>{item}</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: '#6366f1' }}>
                  进入学习中心
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </div>
            </Link>

            {/* 专业模式 */}
            <Link href="/portal"
              className={`group relative glass-strong rounded-3xl p-10 transition-all duration-500 ${hoveredCard === 'study' ? 'opacity-50 scale-95' : 'hover:scale-105'}`}
              style={{ border: '1px solid rgba(168,85,247,0.3)' }}
              onMouseEnter={() => setHoveredCard('pro')}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: 'radial-gradient(circle at top, rgba(168,85,247,0.15), transparent)' }} />

              <div className="relative z-10">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
                  style={{ background: 'rgba(168,85,247,0.2)', border: '1px solid rgba(168,85,247,0.3)' }}>
                  <span className="text-4xl">💼</span>
                </div>

                <h3 className="text-3xl font-bold mb-3" style={{ color: '#f1f5f9' }}>专业模式</h3>
                <p className="text-sm mb-8" style={{ color: '#c084fc' }}>计算机 · 建筑学</p>

                <div className="space-y-3 mb-8">
                  {['情景模拟对话', '智能文档解析', '专业术语库', 'AI 生成意境图'].map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#a855f7' }} />
                      <span className="text-sm" style={{ color: '#cbd5e1' }}>{item}</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: '#a855f7' }}>
                  进入专业领域
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </div>
            </Link>

          </div>
        </div>
      </section>

      {/* 特性展示 */}
      <section className="relative px-6 pb-24">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16" style={{ color: '#f1f5f9' }}>
            为什么选择我们
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: '🤖', title: 'AI 智能辅导', desc: 'DeepSeek 驱动，个性化学习路径' },
              { icon: '📊', title: '数据可视化', desc: '学习进度一目了然，精准定位薄弱点' },
              { icon: '☁️', title: '云端同步', desc: '多设备无缝切换，随时随地学习' },
            ].map((item, i) => (
              <div key={i} className="glass-strong rounded-2xl p-8 text-center transition-all hover:scale-105"
                style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="text-5xl mb-4">{item.icon}</div>
                <h3 className="text-xl font-bold mb-3" style={{ color: '#f1f5f9' }}>{item.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#64748b' }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 学习流程 */}
      <section className="relative px-6 pb-24">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-14" style={{ color: '#f1f5f9' }}>
            四步开启高效备考
          </h2>
          <div className="relative">
            {/* 连接线 */}
            <div className="hidden md:block absolute top-10 left-0 right-0 h-px"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(139,92,246,0.5), rgba(6,182,212,0.5), transparent)', top: '2.5rem' }} />

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { step: '01', icon: '📋', title: '能力评估', desc: 'AI 诊断薄弱项，制定专属计划' },
                { step: '02', icon: '📚', title: '精准刷题', desc: '真题强化训练，动态调整难度' },
                { step: '03', icon: '✍️', title: 'AI 批改', desc: '作文实时评分，即时改进建议' },
                { step: '04', icon: '🏆', title: '突破提分', desc: '追踪进度，查漏补缺直到通关' },
              ].map((item, i) => (
                <div key={i} className="relative flex flex-col items-center text-center group">
                  {/* 步骤圆圈 */}
                  <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-5 relative transition-transform group-hover:scale-110"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(139,92,246,0.3)' }}>
                    <span className="text-3xl">{item.icon}</span>
                    <div className="absolute -top-3 -right-3 w-7 h-7 rounded-full flex items-center justify-center text-xs font-black"
                      style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff' }}>
                      {item.step}
                    </div>
                  </div>
                  <h4 className="font-bold text-base mb-2" style={{ color: '#f1f5f9' }}>{item.title}</h4>
                  <p className="text-xs leading-relaxed" style={{ color: '#64748b' }}>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative px-6 pb-24">
        <div className="max-w-4xl mx-auto text-center glass-strong rounded-3xl p-16"
          style={{ border: '1px solid rgba(139,92,246,0.3)', background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(168,85,247,0.1))' }}>
          <h2 className="text-4xl font-black mb-4 gradient-text">开启你的学习之旅</h2>
          <p className="text-lg mb-8" style={{ color: '#94a3b8' }}>免费注册，立即体验 AI 驱动的智能学习</p>
          <Link href="/register"
            className="inline-block px-12 py-4 rounded-2xl text-white font-bold text-lg transition-all hover:scale-105"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 10px 40px rgba(99,102,241,0.3)' }}>
            免费注册
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative border-t py-8 text-center text-sm"
        style={{ borderColor: 'rgba(255,255,255,0.06)', color: '#475569' }}>
        © 2025 英语学习平台 · Powered by DeepSeek AI
      </footer>
    </main>
  )
}
