'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Mic, Send, Menu, X, Volume2, VolumeX, Briefcase, Search, Mic as MicIcon, LucideIcon, Award } from 'lucide-react'
import { Scenario, ChatMessage } from '@/types/scenario'
import { useYoudaoChat } from '@/hooks/useYoudaoChat'
import { useAudioRecorder } from '@/hooks/useAudioRecorder'
import { OralEvaluationResult } from '@/types/evaluation'
import MarkdownMessage from './MarkdownMessage'
import ScoreModal from './ScoreModal'

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
  const [voiceOutputEnabled, setVoiceOutputEnabled] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isDesktop, setIsDesktop] = useState(false)
  const [showScoreModal, setShowScoreModal] = useState(false)
  const [evaluationResult, setEvaluationResult] = useState<OralEvaluationResult | null>(null)
  const [isEvaluating, setIsEvaluating] = useState(false)
  const [voice, setVoice] = useState('0') // 音色选择

  // 获取来源参数
  const searchParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '')
  const fromWorkspace = searchParams.get('from') || 'welcome'

  const { messages, isLoading, initializeChat, sendMessage, sendAudioMessage } = useYoudaoChat()
  const {
    recordingState,
    audioBase64,
    startRecording,
    stopRecording,
    clearRecording,
    error: recordError
  } = useAudioRecorder()

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const initializedRef = useRef(false)
  const userAudioRecordsRef = useRef<string[]>([]) // 存储用户的所有音频记录

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
      }
      init()
    }
  }, [scenario.topic, initializeChat])

  // 处理音频录制完成
  useEffect(() => {
    if (audioBase64 && recordingState === 'idle') {
      // 录制完成，发送音频消息
      handleSendAudioMessage(audioBase64)
    }
  }, [audioBase64, recordingState])

  // 显示录制错误
  useEffect(() => {
    if (recordError) {
      alert(recordError)
    }
  }, [recordError])

  // 处理语音按钮点击
  const handleVoiceButtonClick = async () => {
    if (recordingState === 'recording') {
      await stopRecording()
    } else if (recordingState === 'idle') {
      await startRecording()
    }
  }

  // 发送音频消息
  const handleSendAudioMessage = async (audioBase64: string) => {
    // 存储音频记录用于最终评分
    userAudioRecordsRef.current.push(audioBase64)

    // 调用 AI Chat API 发送音频
    await sendAudioMessage(audioBase64, voice)

    // 清除录音数据
    clearRecording()
  }

  // 结束练习并生成报告
  const handleFinishPractice = async () => {
    if (messages.length < 2) {
      alert('请至少进行一轮对话后再结束练习')
      return
    }

    const confirmed = confirm('确定要结束练习并生成报告吗？')
    if (!confirmed) return

    setIsEvaluating(true)

    try {
      // 如果有音频记录，使用最后几条进行评测
      if (userAudioRecordsRef.current.length > 0) {
        // 取最后 3 条音频或全部（如果少于 3 条）
        const audioSamples = userAudioRecordsRef.current.slice(-3)

        // 合并音频或选择最长的一条
        const longestAudio = audioSamples.reduce((longest, current) =>
          current.length > longest.length ? current : longest
        )

        const response = await fetch('/api/youdao/oraleval', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            audio: longestAudio,
            langType: 'en',
            audioType: 'wav'
          })
        })

        const data = await response.json()

        if (data.errorCode === '0' && data.result) {
          // 转换为我们的评分格式
          const score = data.result.overall || 0
          const result: OralEvaluationResult = {
            overall: {
              grade: score >= 90 ? 'S' : score >= 80 ? 'A' : score >= 70 ? 'B' : score >= 60 ? 'C' : 'D',
              score: score
            },
            dimensions: {
              pronunciation: data.result.pronunciation || 0,
              fluency: data.result.fluency || 0,
              accuracy: data.result.integrity || 0
            },
            suggestions: [
              '继续保持练习，多听多说',
              '注意语音语调的自然度',
              '尝试使用更多专业术语'
            ],
            grammarErrors: []
          }

          setEvaluationResult(result)
          setShowScoreModal(true)
        } else {
          throw new Error(data.error || '评测失败')
        }
      } else {
        // 没有音频记录，评分为 0
        const mockResult: OralEvaluationResult = {
          overall: {
            grade: 'D' as const,
            score: 0
          },
          dimensions: {
            pronunciation: 0,
            fluency: 0,
            accuracy: 0
          },
          suggestions: [
            '未检测到语音输入',
            '建议使用语音输入功能进行练习，以获得准确的评分',
            '点击麦克风按钮开始语音对话'
          ],
          grammarErrors: []
        }

        setEvaluationResult(mockResult)
        setShowScoreModal(true)
      }
    } catch (error) {
      console.error('生成报告失败:', error)
      alert('生成报告失败，请重试')
    } finally {
      setIsEvaluating(false)
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
      // 优先使用 TTS URL（来自音频对话）
      if (lastMessage.ttsUrl) {
        playTTSAudio(lastMessage.ttsUrl)
      } else {
        // 降级到文本转语音
        speakText(lastMessage.content)
      }
    }
  }, [messages, voiceOutputEnabled, isLoading])

  // 播放 TTS 音频
  const playTTSAudio = async (ttsUrl: string) => {
    try {
      setIsSpeaking(true)

      // 停止当前播放
      if (audioRef.current) {
        audioRef.current.pause()
      }

      // 如果是 Base64，转换为 Blob URL
      let audioUrl = ttsUrl
      if (ttsUrl.startsWith('data:') || !ttsUrl.startsWith('http')) {
        const base64Data = ttsUrl.includes(',') ? ttsUrl.split(',')[1] : ttsUrl
        const binaryData = atob(base64Data)
        const bytes = new Uint8Array(binaryData.length)
        for (let i = 0; i < binaryData.length; i++) {
          bytes[i] = binaryData.charCodeAt(i)
        }
        const blob = new Blob([bytes], { type: 'audio/mpeg' })
        audioUrl = URL.createObjectURL(blob)
      }

      audioRef.current = new Audio(audioUrl)
      audioRef.current.onended = () => {
        setIsSpeaking(false)
        if (audioUrl.startsWith('blob:')) {
          URL.revokeObjectURL(audioUrl)
        }
      }
      audioRef.current.onerror = () => {
        setIsSpeaking(false)
        if (audioUrl.startsWith('blob:')) {
          URL.revokeObjectURL(audioUrl)
        }
      }

      await audioRef.current.play()
    } catch (error) {
      console.error('TTS 播放失败:', error)
      setIsSpeaking(false)
    }
  }

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
            onClick={() => {
              // 根据来源返回到对应的页面
              if (fromWorkspace === 'computer') {
                // 使用 localStorage 来触发返回到 computer 工作台
                localStorage.setItem('portal_workspace', 'computer')
                router.push('/portal')
              } else {
                router.push('/portal')
              }
            }}
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

            {/* 音色选择 */}
            <div className="mt-4 pt-4 border-t border-white/10">
              <label className="block text-xs font-medium text-slate-400 mb-2">
                AI 音色
              </label>
              <select
                value={voice}
                onChange={(e) => setVoice(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              >
                <option value="0">美式英语 - 女声</option>
                <option value="1">美式英语 - 男声</option>
                <option value="2">英式英语 - 女声</option>
                <option value="3">英式英语 - 男声</option>
              </select>
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

        {/* 结束练习按钮 */}
        <div className="p-4 sm:p-6 border-t border-white/10">
          <button
            onClick={handleFinishPractice}
            disabled={isEvaluating || messages.length < 2}
            className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Award className="w-5 h-5" />
            {isEvaluating ? '生成报告中...' : '结束练习并生成报告'}
          </button>
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
                  className={`flex flex-col ${message.role === 'user' ? 'items-end' : 'items-start'}`}
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

                  {/* 语法错误提示 */}
                  {message.role === 'user' && message.grammarErrors && message.grammarErrors.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-2 max-w-[85%] sm:max-w-[80%]"
                    >
                      <details className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3 text-xs">
                        <summary className="cursor-pointer text-orange-400 font-medium flex items-center gap-2">
                          💡 查看语法建议 ({message.grammarErrors.length})
                        </summary>
                        <div className="mt-2 space-y-2">
                          {message.grammarErrors.map((error, idx) => (
                            <div key={idx} className="text-slate-300">
                              <div className="flex items-center gap-2">
                                <span className="text-red-400 line-through">{error.original}</span>
                                <span className="text-slate-500">→</span>
                                <span className="text-green-400">{error.corrected}</span>
                              </div>
                              <p className="text-slate-400 mt-1">{error.explanation}</p>
                            </div>
                          ))}
                        </div>
                      </details>
                    </motion.div>
                  )}
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
                onClick={handleVoiceButtonClick}
                disabled={isLoading || recordingState === 'processing'}
                className={`
                  flex h-11 w-11 sm:h-12 sm:w-12 min-h-[44px] min-w-[44px] items-center justify-center rounded-xl transition-all flex-shrink-0 touch-manipulation
                  ${recordingState === 'recording'
                    ? 'bg-red-500/20 text-red-400 animate-pulse'
                    : recordingState === 'processing'
                    ? 'bg-yellow-500/20 text-yellow-400'
                    : 'bg-white/5 text-slate-400 hover:bg-white/10 active:bg-white/15'
                  }
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
                aria-label={recordingState === 'recording' ? '停止录音' : '开始录音'}
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
            {recordingState === 'recording' && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-2 text-center text-xs text-red-400"
              >
                🎤 正在录音...请用英语说话
              </motion.p>
            )}
            {recordingState === 'processing' && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-2 text-center text-xs text-yellow-400"
              >
                ⏳ 处理音频中...
              </motion.p>
            )}
          </div>
        </div>
      </div>

      {/* 评分看板 */}
      <ScoreModal
        isOpen={showScoreModal}
        onClose={() => setShowScoreModal(false)}
        result={evaluationResult}
      />
    </div>
  )
}
