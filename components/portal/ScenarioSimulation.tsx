'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
}

interface Props {
  onBack: () => void
}

const SCENARIOS = [
  {
    id: 'tech-interview',
    title: '技术面试',
    subtitle: 'Technical Interview',
    icon: '💼',
    systemPrompt: `你现在是一位资深软件工程师，正在用全英文对我进行一场技术面试。
你需要向我提问关于数据结构、算法、系统设计和编码实践的问题。
对我的回答给出建设性的反馈。你的回复必须是全英文，保持专业和简练。
重点考察计算机科学基础知识和解决实际问题的能力。`,
  },
  {
    id: 'code-review',
    title: '代码审查',
    subtitle: 'Code Review Discussion',
    icon: '🔍',
    systemPrompt: `你现在是一位技术主管，正在用全英文主导一场代码审查（Code Review）讨论。
讨论代码质量、最佳实践、性能优化和可维护性。
向我询问关于设计决策的问题，并提出改进建议。你的回复必须是全英文，富有建设性且具有教育意义。`,
  },
  {
    id: 'project-standup',
    title: '每日站会',
    subtitle: 'Daily Standup Meeting',
    icon: '🗣️',
    systemPrompt: `你现在是一位敏捷教练（Scrum Master），正在用全英文主持一场每日站会。
询问我昨天完成了什么，今天计划做什么，以及遇到了哪些阻碍（blockers）。
保持对话聚焦且高效。鼓励清晰的沟通。你的回复必须是全英文。`,
  },
]

export default function ScenarioSimulation({ onBack }: Props) {
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const startScenario = (scenarioId: string) => {
    const scenario = SCENARIOS.find(s => s.id === scenarioId)
    if (!scenario) return

    setSelectedScenario(scenarioId)
    setMessages([
      {
        id: Date.now().toString(),
        role: 'system',
        content: `情景已开始：${scenario.title}`,
        timestamp: new Date(),
      },
      {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `你好！我已准备好开始「${scenario.title}」练习。请先做一个简短的自我介绍，包括你的背景和经历。`,
        timestamp: new Date(),
      },
    ])
  }

  const sendMessage = async () => {
    if (!input.trim() || isLoading || !selectedScenario) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const scenario = SCENARIOS.find(s => s.id === selectedScenario)
      const response = await fetch('/api/portal/scenario-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messages.filter(m => m.role !== 'system').map(m => ({
            role: m.role,
            content: m.content,
          })),
          userMessage: input.trim(),
          systemPrompt: scenario?.systemPrompt,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to get response')
      }

      const data = await response.json()
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message,
        timestamp: new Date(),
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Chat error:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '抱歉，发生了错误，请重试。',
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const resetScenario = () => {
    setSelectedScenario(null)
    setMessages([])
    setInput('')
  }

  if (!selectedScenario) {
    return (
      <div className="flex w-full h-screen" style={{ background: '#0d0e1a' }}>
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <button
            onClick={onBack}
            className="absolute top-6 left-6 flex items-center gap-2 text-sm transition-colors"
            style={{ color: '#64748b' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#f1f5f9')}
            onMouseLeave={e => (e.currentTarget.style.color = '#64748b')}
          >
            ← 返回工作台
          </button>

          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h2 className="text-4xl font-bold mb-3" style={{ color: '#f1f5f9' }}>
              情景模拟
            </h2>
            <p style={{ color: '#64748b' }}>
              情景模拟 · 真实职业场景 · AI 对话练习
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full">
            {SCENARIOS.map((scenario, index) => (
              <motion.button
                key={scenario.id}
                onClick={() => startScenario(scenario.id)}
                className="glass-strong rounded-2xl p-8 text-center transition-all"
                style={{ border: '1px solid rgba(99,102,241,0.3)' }}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{
                  scale: 1.05,
                  boxShadow: '0 0 40px rgba(99,102,241,0.4)',
                  borderColor: 'rgba(99,102,241,0.6)',
                }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="text-5xl mb-4">{scenario.icon}</div>
                <h3 className="text-xl font-bold mb-2" style={{ color: '#f1f5f9' }}>
                  {scenario.title}
                </h3>
                <p className="text-sm" style={{ color: '#a78bfa' }}>
                  {scenario.subtitle}
                </p>
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const currentScenario = SCENARIOS.find(s => s.id === selectedScenario)

  return (
    <div className="flex w-full h-screen" style={{ background: '#0d0e1a' }}>
      {/* 侧边栏 */}
      <motion.aside
        className="flex-shrink-0 flex flex-col p-6"
        style={{ width: 320, borderRight: '1px solid rgba(255,255,255,0.1)', background: '#0a0b14' }}
        initial={{ x: -60, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
      >
        <button
          onClick={resetScenario}
          className="flex items-center gap-2 mb-6 text-sm transition-colors"
          style={{ color: '#64748b' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#f1f5f9')}
          onMouseLeave={e => (e.currentTarget.style.color = '#64748b')}
        >
          ← 切换情景
        </button>

        <div className="glass rounded-xl p-4 mb-6" style={{ border: '1px solid rgba(99,102,241,0.3)' }}>
          <div className="text-4xl mb-3 text-center">{currentScenario?.icon}</div>
          <h3 className="font-bold text-lg mb-1 text-center" style={{ color: '#f1f5f9' }}>
            {currentScenario?.title}
          </h3>
          <p className="text-sm text-center" style={{ color: '#64748b' }}>
            {currentScenario?.subtitle}
          </p>
        </div>

        <div className="glass rounded-xl p-4" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
          <h4 className="font-semibold text-sm mb-2" style={{ color: '#f1f5f9' }}>练习提示</h4>
          <ul className="text-xs space-y-2" style={{ color: '#64748b' }}>
            <li>• 使用完整英文句子回答</li>
            <li>• 注意专业技术术语的表达</li>
            <li>• 保持自然的对话节奏</li>
            <li>• 主动提问和互动</li>
          </ul>
        </div>
      </motion.aside>

      {/* 对话区域 */}
      <div className="flex-1 flex flex-col">
        {/* 消息列表 */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <AnimatePresence>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'system' ? (
                  <div className="glass rounded-lg px-4 py-2 text-xs" style={{ color: '#64748b', border: '1px solid rgba(255,255,255,0.06)' }}>
                    {msg.content}
                  </div>
                ) : (
                  <div
                    className="max-w-2xl rounded-2xl px-5 py-3"
                    style={{
                      background: msg.role === 'user'
                        ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                        : 'rgba(255,255,255,0.06)',
                      border: msg.role === 'user' ? 'none' : '1px solid rgba(255,255,255,0.08)',
                    }}
                  >
                    <p className="text-sm leading-relaxed" style={{ color: '#f1f5f9' }}>
                      {msg.content}
                    </p>
                    <p className="text-xs mt-2 opacity-60">
                      {msg.timestamp.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="glass rounded-2xl px-5 py-3" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="flex gap-2">
                  <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* 输入区域 */}
        <div className="border-t p-6" style={{ borderColor: 'rgba(255,255,255,0.1)', background: '#0a0b14' }}>
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              placeholder="用英文输入你的回复…"
              className="flex-1 input-dark rounded-xl px-4 py-3 text-sm"
              disabled={isLoading}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || isLoading}
              className="btn-glow px-6 py-3 rounded-xl text-white text-sm font-semibold disabled:opacity-50 btn-send"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
