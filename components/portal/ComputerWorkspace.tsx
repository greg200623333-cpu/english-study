'use client'

import Link from 'next/link'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ScenarioSimulation from './ScenarioSimulation'
import DocAnalysis from './DocAnalysis'

interface Props {
  onBack: () => void
}

type ActiveTool = null | 'scenario' | 'docanalysis'

const TOOLS = [
  {
    id: 'scenario' as const,
    icon: '💼',
    title: '情景模拟',
    subtitle: 'Scenario Simulation',
    description: '真实职业情境下的英语对话练习。接入 DeepSeek AI，模拟技术面试、代码评审、每日站会等场景。',
    accentColor: '#6366f1',
    accentAlpha: 'rgba(99,102,241,',
    tags: ['技术面试', '代码评审', '站会沟通'],
  },
  {
    id: 'docanalysis' as const,
    icon: '📡',
    title: '智能文档解析',
    subtitle: 'AI Doc Analysis',
    description: '导入英文技术文档或开源代码，AI 自动提取高频关键词、专业术语与长难句，生成个性化学习路径。',
    accentColor: '#22d3ee',
    accentAlpha: 'rgba(34,211,238,',
    tags: ['关键词提取', '术语解析', '学习路径'],
  },
]

export default function ComputerWorkspace({ onBack }: Props) {
  const [activeTool, setActiveTool] = useState<ActiveTool>(null)

  if (activeTool === 'scenario') {
    return <ScenarioSimulation onBack={() => setActiveTool(null)} />
  }

  if (activeTool === 'docanalysis') {
    return <DocAnalysis onBack={() => setActiveTool(null)} />
  }

  return (
    <div className="flex w-full h-screen" style={{ background: '#0d0e1a' }}>
      {/* 侧边栏 */}
      <motion.aside
        className="flex-shrink-0 flex flex-col"
        style={{ width: 260, borderRight: '1px solid rgba(255,255,255,0.1)', background: '#0a0b14' }}
        initial={{ x: -60, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        <div className="p-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-sm transition-colors"
              style={{ color: '#94a3b8' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#f1f5f9')}
              onMouseLeave={e => (e.currentTarget.style.color = '#94a3b8')}
            >
              ← 返回主页
            </button>
            <Link href="/dashboard"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff' }}>
              <span>📚</span>
              <span>学习模式</span>
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
              style={{ background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.3)' }}>
              💻
            </div>
            <div>
              <h2 className="text-white font-bold text-sm">计算机专业</h2>
              <p className="text-xs" style={{ color: '#64748b' }}>Computer Science</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          <p className="text-xs uppercase tracking-wider px-3 py-2 font-semibold" style={{ color: '#475569' }}>工具模块</p>
          {TOOLS.map(tool => (
            <motion.button
              key={tool.id}
              onClick={() => setActiveTool(tool.id)}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.97 }}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm text-left transition-all"
              style={{ color: '#94a3b8', border: '1px solid transparent' }}
              onMouseEnter={e => {
                const el = e.currentTarget
                el.style.background = tool.accentAlpha + '0.1)'
                el.style.borderColor = tool.accentAlpha + '0.3)'
                el.style.color = '#f1f5f9'
              }}
              onMouseLeave={e => {
                const el = e.currentTarget
                el.style.background = ''
                el.style.borderColor = 'transparent'
                el.style.color = '#94a3b8'
              }}
            >
              <span className="text-xl flex-shrink-0">{tool.icon}</span>
              <div className="min-w-0">
                <div className="font-semibold text-xs truncate" style={{ color: 'inherit' }}>{tool.title}</div>
                <div className="text-xs truncate" style={{ color: '#475569' }}>{tool.subtitle}</div>
              </div>
            </motion.button>
          ))}
        </nav>

        <div className="p-4" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="flex items-center gap-2 text-xs" style={{ color: '#475569' }}>
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#22c55e' }} />
            <span>Powered by DeepSeek AI</span>
          </div>
        </div>
      </motion.aside>

      {/* 主内容区 — 工具选择欢迎界面 */}
      <div className="flex-1 flex flex-col items-center justify-center p-12">
        <motion.div
          className="text-center mb-14"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl font-extrabold mb-3" style={{ color: '#f1f5f9' }}>
            计算机专业英语工作台
          </h1>
          <p className="text-base" style={{ color: '#64748b' }}>
            AI 驱动 · 专业场景 · 沉浸式学习体验
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
          <AnimatePresence>
            {TOOLS.map((tool, i) => (
              <motion.button
                key={tool.id}
                onClick={() => setActiveTool(tool.id)}
                className="glass-strong rounded-2xl p-8 text-left relative overflow-hidden group"
                style={{ border: `1px solid ${tool.accentAlpha}0.25)` }}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.12 }}
                whileHover={{
                  scale: 1.03,
                  boxShadow: `0 0 50px ${tool.accentAlpha}0.3), 0 20px 60px rgba(0,0,0,0.4)`,
                }}
                whileTap={{ scale: 0.98 }}
              >
                {/* 背景光晕 */}
                <div
                  className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-500"
                  style={{ background: tool.accentColor }}
                />

                <div className="relative z-10">
                  <div className="text-5xl mb-5">{tool.icon}</div>

                  <h3 className="text-2xl font-extrabold mb-1" style={{ color: '#f1f5f9' }}>
                    {tool.title}
                  </h3>
                  <p className="text-sm mb-4 font-mono" style={{ color: tool.accentColor }}>
                    {tool.subtitle}
                  </p>

                  <p className="text-sm leading-relaxed mb-5" style={{ color: '#94a3b8' }}>
                    {tool.description}
                  </p>

                  <div className="flex flex-wrap gap-2 mb-6">
                    {tool.tags.map(tag => (
                      <span
                        key={tag}
                        className="text-xs px-2.5 py-1 rounded-full"
                        style={{
                          background: tool.accentAlpha + '0.1)',
                          color: tool.accentColor,
                          border: `1px solid ${tool.accentAlpha}0.3)`,
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div
                    className="flex items-center gap-2 text-sm font-semibold"
                    style={{ color: tool.accentColor }}
                  >
                    <span>进入工具</span>
                    <span className="group-hover:translate-x-1 transition-transform inline-block">→</span>
                  </div>
                </div>
              </motion.button>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
