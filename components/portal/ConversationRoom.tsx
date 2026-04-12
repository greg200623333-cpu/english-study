'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Mic, Send, Menu, X, Volume2, VolumeX, Briefcase, Search, Mic as MicIcon, LucideIcon } from 'lucide-react'
import { Scenario, ChatMessage } from '@/types/scenario'
import { useYoudaoChat } from '@/hooks/useYoudaoChat'
import MarkdownMessage from './MarkdownMessage'

interface Props {
  scenario: Scenario
}

const iconMap: Record<string, LucideIcon> = {
  Briefcase,
  Search,
  Mic: MicIcon,
}

export default function ConversationRoom({ scenario }: Props) {
  const router = useRouter()
  const [input, setInput] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [voiceOutputEnabled, setVoiceOutputEnabled] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isDesktop, setIsDesktop] = useState(false)

  const { messages, isLoading, initializeChat, sendMessage } = useYoudaoChat()

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const recognitionRef = useRef<any>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const initializedRef = useRef(false)

  const IconComponent = iconMap[scenario.icon] || Briefcase

  // 检测屏幕尺寸
  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 1024)
    }
    checkDesktop()
    window.addEventListener('resize', checkDesktop)
    return () => window.removeEventListener('resize', checkDesktop)
  }, [])

  // 自动滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // 初始化对话并发送欢迎消息
  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true
      const init = async () => {
        await initializeChat(scenario.topic)
        // AI 自动发送欢迎消息
        // 注意：这里需要直接添加到消息列表，而不是通过 sendMessage
      }
      init()
    }
  }, [scenario.topic, initializeChat])

  // 初始化语音识别
  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = false
      recognitionRef.current.interimResults = false
      recognitionRef.current.lang = 'en-US'

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        setInput(transcript)
        setIsRecording(false)
      }

      recognitionRef.current.onerror = () => {
        setIsRecording(false)
      }

      recognitionRef.current.onend = () => {
        setIsRecording(false)
      }
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [])

  // 语音输入
  const startVoiceInput = () => {
    if (recognitionRef.current && !isRecording) {
      setIsRecording(true)
      recognitionRef.current.start()
    }
  }

  const stopVoiceInput = () => {
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop()
      setIsRecording(false)
    }
  }

  // 语音输出
  const speakText = async (text: string) => {
    if (!voiceOutputEnabled) return

    try {
      setIsSpeaking(true)
      const chunks = text.match(/.{1,100}/g) || [text]

      for (const chunk of chunks) {
        try {
          const response = await fetch(`/api/tts?word=${encodeURIComponent(chunk)}`)

          if (!response.ok) {
            // 静默跳过 API 错误
            continue
          }

          const blob = await response.blob()

          if (blob.size === 0) {
            // 静默跳过空数据
            continue
          }

          const url = URL.createObjectURL(blob)

          await new Promise<void>((resolve, reject) => {
            const audio = new Audio(url)
            audioRef.current = audio
            let timeoutId: NodeJS.Timeout | null = null

            const cleanup = () => {
              if (timeoutId) clearTimeout(timeoutId)
              URL.revokeObjectURL(url)
            }

            audio.oncanplaythrough = () => {
              audio.play().catch(err => {
                // 静默处理播放错误
                cleanup()
                reject(err)
              })
            }

            audio.onended = () => {
              cleanup()
              resolve()
            }

            audio.onerror = (e) => {
              // 静默处理加载错误
              cleanup()
              reject(e)
            }

            timeoutId = setTimeout(() => {
              if (audio.paused) {
                // 静默处理超时
                cleanup()
                reject(new Error('Audio timeout'))
              }
            }, 10000)
          })
        } catch (chunkError) {
          // 静默跳过单个片段的错误
          continue
        }
      }
    } catch (error) {
      // 静默处理整体错误
    } finally {
      setIsSpeaking(false)
    }
  }

  // 发送消息
  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return

    const userInput = input.trim()
    setInput('')

    await sendMessage(userInput)
  }

  // 监听新消息，自动播放 AI 回复
  useEffect(() => {
    if (!voiceOutputEnabled || messages.length === 0) return

    const lastMessage = messages[messages.length - 1]
    if (lastMessage && lastMessage.role === 'assistant' && !isLoading) {
      speakText(lastMessage.content)
    }
  }, [messages, voiceOutputEnabled, isLoading])

  return (
    <div className="flex h-screen bg-gradient-to-br from-[#0a0a0f] to-[#1a1a2e]">
      {/* 移动端遮罩 */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* 左侧边栏 */}
      <motion.aside
        initial={false}
        animate={{
          x: isDesktop ? 0 : (sidebarOpen ? 0 : '-100%')
        }}
        className="fixed lg:static inset-y-0 left-0 z-50 w-80 bg-[#0a0a0f]/95 backdrop-blur-xl border-r border-white/10 flex flex-col"
      >
        {/* 返回按钮 */}
        <div className="p-4 sm:p-6 border-b border-white/10">
          <button
            onClick={() => router.push('/portal')}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-medium">切换情景</span>
          </button>

          {/* 移动端关闭按钮 */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden absolute top-4 right-4 p-2 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 当前场景卡片 */}
        <div className="p-4 sm:p-6">
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-5 border border-white/10">
            <div className="flex items-start gap-4">
              <div className="bg-purple-500/20 rounded-xl p-3 flex-shrink-0">
                <IconComponent className="w-6 h-6 text-purple-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-white mb-1">{scenario.title}</h3>
                <p className="text-sm text-purple-400">{scenario.subtitle}</p>
              </div>
            </div>
          </div>
        </div>

        {/* 练习提示 */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-white flex items-center gap-2">
              <div className="w-1 h-4 bg-purple-500 rounded-full" />
              练习提示
            </h4>
            <ul className="space-y-3 text-sm text-slate-400 list-disc list-inside">
              {scenario.practiceTips.map((tip, index) => (
                <li key={index} className="leading-relaxed">
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </motion.aside>

      {/* 右侧对话区 */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* 顶部栏 */}
        <div className="border-b border-white/10 p-4 sm:p-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {/* 移动端汉堡菜单 */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-slate-400 hover:text-white transition-colors flex-shrink-0"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* 场景标签 */}
            <div className="bg-purple-500/10 border border-purple-500/30 rounded-full px-4 py-1.5 flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
              <span className="text-xs sm:text-sm text-purple-400 font-medium truncate">
                情景已开始：{scenario.title}
              </span>
            </div>
          </div>

          {/* 语音输出开关 */}
          <button
            onClick={() => setVoiceOutputEnabled(!voiceOutputEnabled)}
            className={`
              flex items-center gap-1 sm:gap-2 rounded-xl px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium transition-all flex-shrink-0 min-h-[44px] touch-manipulation
              ${voiceOutputEnabled
                ? 'bg-purple-500/20 text-purple-400'
                : 'bg-white/5 text-slate-400 hover:bg-white/10'
              }
            `}
          >
            {voiceOutputEnabled ? (
              <>
                <Volume2 className="h-4 w-4" />
                <span className="hidden sm:inline">语音输出</span>
              </>
            ) : (
              <>
                <VolumeX className="h-4 w-4" />
                <span className="hidden sm:inline">静音</span>
              </>
            )}
          </button>
        </div>

        {/* 对话区域 */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="max-w-4xl mx-auto space-y-3 sm:space-y-4">
            <AnimatePresence>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`
                      max-w-[85%] sm:max-w-[80%] rounded-2xl px-3 sm:px-4 py-2.5 sm:py-3
                      ${message.role === 'user'
                        ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white'
                        : message.role === 'assistant'
                        ? 'bg-[#1a1a2e] text-white border border-white/10'
                        : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                      }
                    `}
                  >
                    <div className="text-sm leading-relaxed break-words">
                      {message.role === 'assistant' ? (
                        <MarkdownMessage content={message.content} />
                      ) : (
                        <p className="whitespace-pre-wrap">{message.content}</p>
                      )}
                    </div>
                    <p className="mt-1.5 sm:mt-2 text-xs opacity-60">
                      {message.timestamp.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* 加载指示器 */}
            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start"
              >
                <div className="rounded-2xl bg-[#1a1a2e] px-4 py-3 border border-white/10">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 animate-bounce rounded-full bg-purple-400" style={{ animationDelay: '0ms' }} />
                    <div className="h-2 w-2 animate-bounce rounded-full bg-purple-400" style={{ animationDelay: '150ms' }} />
                    <div className="h-2 w-2 animate-bounce rounded-full bg-purple-400" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </motion.div>
            )}

            {/* 语音播放指示器 */}
            {isSpeaking && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-center"
              >
                <div className="flex items-center gap-2 rounded-full bg-purple-500/20 px-4 py-2 text-sm text-purple-400">
                  <Volume2 className="h-4 w-4 animate-pulse" />
                  <span>正在播放...</span>
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* 输入区域 */}
        <div className="border-t border-white/10 p-3 sm:p-4 bg-[#0a0a0f]">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-2 sm:gap-3">
              {/* 语音输入按钮 */}
              <button
                onClick={isRecording ? stopVoiceInput : startVoiceInput}
                disabled={isLoading}
                className={`
                  flex h-11 w-11 sm:h-12 sm:w-12 min-h-[44px] min-w-[44px] items-center justify-center rounded-xl transition-all flex-shrink-0 touch-manipulation
                  ${isRecording
                    ? 'bg-red-500/20 text-red-400 animate-pulse'
                    : 'bg-white/5 text-slate-400 hover:bg-white/10 active:bg-white/15'
                  }
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
                aria-label={isRecording ? '停止录音' : '开始录音'}
              >
                <Mic className="h-5 w-5" />
              </button>

              {/* 文字输入框 */}
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                placeholder="输入你的回复（英文）..."
                disabled={isLoading}
                className="
                  flex-1 rounded-xl bg-white/5 px-3 sm:px-4 py-2.5 sm:py-3 text-sm text-white placeholder-slate-500
                  border border-white/10 backdrop-blur-sm
                  focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/20
                  disabled:opacity-50 disabled:cursor-not-allowed
                  min-h-[44px]
                "
              />

              {/* 发送按钮 */}
              <button
                onClick={handleSendMessage}
                disabled={!input.trim() || isLoading}
                className="
                  flex h-11 w-11 sm:h-12 sm:w-12 min-h-[44px] min-w-[44px] items-center justify-center rounded-xl flex-shrink-0 touch-manipulation
                  bg-gradient-to-r from-purple-500 to-indigo-500
                  text-white transition-all hover:shadow-lg hover:shadow-purple-500/50 active:scale-95
                  disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none disabled:active:scale-100
                "
                aria-label="发送消息"
              >
                <Send className="h-5 w-5" />
              </button>
            </div>

            {/* 提示文字 */}
            {isRecording && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-2 text-center text-xs text-red-400"
              >
                🎤 正在录音...请用英语说话
              </motion.p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
