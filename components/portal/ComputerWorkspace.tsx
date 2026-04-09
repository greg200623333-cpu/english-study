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

type ToolConfig = {
  id: string
  icon: string
  title: string
  subtitle: string
  description: string
  accentColor: string
  accentAlpha: string
  tags: string[]
  href?: string
  actionLabel?: string
}

const TOOLS: ToolConfig[] = [
  {
    id: 'scenario',
    icon: '🗈',
    title: '情景模拟',
    subtitle: 'Scenario Simulation',
    description: '真实职业场景下的英语对话练习。接入 DeepSeek AI，模拟技术面试、代码评审、每日站会等场景。',
    accentColor: '#6366f1',
    accentAlpha: 'rgba(99,102,241,',
    tags: ['技术面试', '代码评审', '站会沟通'],
    actionLabel: '点击进入工具',
  },
  {
    id: 'docanalysis',
    icon: '📗',
    title: '智能文档解析',
    subtitle: 'AI Doc Analysis',
    description: '导入英文技术文档或开源代码，AI 自动提取高频关键词、专业术语与长难句，并生成个性化学习路径。',
    accentColor: '#22d3ee',
    accentAlpha: 'rgba(34,211,238,',
    tags: ['关键词提取', '术语解析', '学习路径'],
    actionLabel: '点击进入工具',
  },
  {
    id: 'algorithm-reading',
    icon: '🖥',
    title: '算法沉浸阅读',
    subtitle: 'Algorithm Immersive Reading',
    description: '输入全英文算法题干后，AI 自动标注高频逻辑词、生成 C 语言参考实现，并在底部联动终端式极客测验。',
    accentColor: '#c084fc',
    accentAlpha: 'rgba(192,132,252,',
    tags: ['源码级解析', '动态 C Demo', '终端交互测验'],
    href: '/cs/algorithm-reading',
    actionLabel: '点击进入工具',
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
    <div className="flex h-screen w-full" style={{ background: '#0d0e1a' }}>
      <motion.aside
        className="flex flex-shrink-0 flex-col"
        style={{ width: 260, borderRight: '1px solid rgba(255,255,255,0.1)', background: '#0a0b14' }}
        initial={{ x: -60, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        <div className="p-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="mb-4 flex items-center justify-between">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-sm transition-colors"
              style={{ color: '#94a3b8' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#f1f5f9')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
            >
              ← 返回主页
            </button>
            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff' }}
            >
              <span>📎</span>
              <span>学习模式</span>
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl text-lg"
              style={{ background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.3)' }}
            >
              💇
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">计算机专业</h2>
              <p className="text-xs" style={{ color: '#64748b' }}>Computer Science</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wider" style={{ color: '#475569' }}>工具模块</p>
          {TOOLS.map((tool) => {
            const content = (
              <>
                <span className="flex-shrink-0 text-xl">{tool.icon}</span>
                <div className="min-w-0">
                  <div className="truncate text-xs font-semibold" style={{ color: 'inherit' }}>{tool.title}</div>
                  <div className="truncate text-xs" style={{ color: '#475569' }}>{tool.subtitle}</div>
                </div>
              </>
            )

            const className = 'w-full flex items-center gap-3 rounded-xl px-3 py-3 text-left text-sm transition-all'
            const style = { color: '#94a3b8', border: '1px solid transparent' }
            const hoverIn = (el: HTMLAnchorElement | HTMLButtonElement) => {
              el.style.background = tool.accentAlpha + '0.1)'
              el.style.borderColor = tool.accentAlpha + '0.3)'
              el.style.color = '#f1f5f9'
            }
            const hoverOut = (el: HTMLAnchorElement | HTMLButtonElement) => {
              el.style.background = ''
              el.style.borderColor = 'transparent'
              el.style.color = '#94a3b8'
            }

            if (tool.href) {
              return (
                <motion.div key={tool.id} whileHover={{ x: 4 }} whileTap={{ scale: 0.97 }}>
                  <Link
                    href={tool.href}
                    className={className}
                    style={style}
                    onMouseEnter={(e) => hoverIn(e.currentTarget)}
                    onMouseLeave={(e) => hoverOut(e.currentTarget)}
                  >
                    {content}
                  </Link>
                </motion.div>
              )
            }

            return (
              <motion.button
                key={tool.id}
                onClick={() => setActiveTool(tool.id as ActiveTool)}
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.97 }}
                className={className}
                style={style}
                onMouseEnter={(e) => hoverIn(e.currentTarget)}
                onMouseLeave={(e) => hoverOut(e.currentTarget)}
              >
                {content}
              </motion.button>
            )
          })}
        </nav>

        <div className="p-4" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="flex items-center gap-2 text-xs" style={{ color: '#475569' }}>
            <div className="h-2 w-2 animate-pulse rounded-full" style={{ background: '#22c55e' }} />
            <span>Powered by DeepSeek AI</span>
          </div>
        </div>
      </motion.aside>

      <div className="flex flex-1 flex-col items-center justify-center p-12">
        <motion.div
          className="mb-14 text-center"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="mb-3 text-4xl font-extrabold" style={{ color: '#f1f5f9' }}>
            计算机专业英语工作台
          </h1>
          <p className="text-base" style={{ color: '#64748b' }}>
            AI 驱动 · 专业场景 · 沉浸式学习体验
          </p>
        </motion.div>

        <div className="grid w-full max-w-6xl grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3">
          <AnimatePresence>
            {TOOLS.map((tool, i) => {
              const isAlgorithmCard = tool.id === 'algorithm-reading'
              const cardInner = (
                <>
                  <div
                    className="absolute right-0 top-0 h-32 w-32 rounded-full opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-20"
                    style={{ background: tool.accentColor }}
                  />

                  <div
                    className={`relative z-10 flex h-full flex-col ${isAlgorithmCard ? 'items-center justify-center text-center' : ''}`}
                  >
                    <div className={`${isAlgorithmCard ? 'mb-4' : 'mb-5'} text-5xl`}>{tool.icon}</div>

                    <h3 className={`text-2xl font-extrabold ${isAlgorithmCard ? 'mb-2' : 'mb-1'}`} style={{ color: '#f1f5f9' }}>
                      {tool.title}
                    </h3>
                    <p className={`text-sm font-mono ${isAlgorithmCard ? 'mb-5' : 'mb-4'}`} style={{ color: tool.accentColor }}>
                      {tool.subtitle}
                    </p>

                    <p
                      className={`text-sm leading-relaxed ${isAlgorithmCard ? 'mx-auto mb-6 max-w-[20rem]' : 'mb-5'}`}
                      style={{ color: '#94a3b8' }}
                    >
                      {tool.description}
                    </p>

                    <div className={`mb-6 flex flex-wrap gap-2 ${isAlgorithmCard ? 'justify-center' : ''}`}>
                      {tool.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full px-2.5 py-1 text-xs"
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

                    <div className={`flex items-center gap-2 text-sm font-semibold ${isAlgorithmCard ? 'justify-center' : ''}`} style={{ color: tool.accentColor }}>
                      <span>{tool.actionLabel ?? '点击进入工具'}</span>
                      <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
                    </div>
                  </div>
                </>
              )

              const cardClassName = `glass-strong group relative overflow-hidden rounded-2xl p-8 ${isAlgorithmCard ? 'flex h-full items-center justify-center text-center' : 'text-left'}`
              const cardStyle = { border: `1px solid ${tool.accentAlpha}0.25)` }

              const motionProps = {
                initial: { opacity: 0, y: 30 },
                animate: { opacity: 1, y: 0 },
                transition: { delay: i * 0.12 },
                whileHover: {
                  scale: 1.03,
                  boxShadow: `0 0 50px ${tool.accentAlpha}0.3), 0 20px 60px rgba(0,0,0,0.4)`,
                },
                whileTap: { scale: 0.98 },
              }

              if (tool.href) {
                return (
                  <motion.div key={tool.id} {...motionProps}>
                    <Link href={tool.href} className={cardClassName} style={cardStyle}>
                      {cardInner}
                    </Link>
                  </motion.div>
                )
              }

              return (
                <motion.button
                  key={tool.id}
                  onClick={() => setActiveTool(tool.id as ActiveTool)}
                  className={cardClassName}
                  style={cardStyle}
                  {...motionProps}
                >
                  {cardInner}
                </motion.button>
              )
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
