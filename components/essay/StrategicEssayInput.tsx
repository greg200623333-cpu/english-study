'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FileText, Image, Upload, Loader2, AlertCircle, CheckCircle2, Zap, Shield, X } from 'lucide-react'
import { useEssayStore } from '@/store/essayStore'
import { createClient } from '@/lib/supabase/client'
import { getCurrentUser } from '@/lib/auth'
import { useWarRoomSync } from '@/hooks/useWarRoomSync'

type Mode = 'text' | 'image'
type Category = 'cet4' | 'cet6' | 'kaoyan'

interface AnalysisResult {
  score: number
  grammarErrors: Array<{
    type: string
    original: string
    corrected: string
    position: number
    explanation: string
  }>
  improvedVersion: string
  strategicAdvice: string
  dimensions?: {
    grammar: number
    vocabulary: number
    structure: number
    content: number
  }
}

const categories = [
  { key: 'cet4' as Category, label: 'CET-4', icon: '◉' },
  { key: 'cet6' as Category, label: 'CET-6', icon: '◎' },
  { key: 'kaoyan' as Category, label: '考研', icon: '◈' },
]

export default function StrategicEssayInput() {
  const [mode, setMode] = useState<Mode>('text')
  const [category, setCategory] = useState<Category>('cet4')
  const [topicTitle, setTopicTitle] = useState('')
  const [textContent, setTextContent] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showPulse, setShowPulse] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const contentInputRef = useRef<HTMLTextAreaElement>(null)
  const titleInputRef = useRef<HTMLTextAreaElement>(null)

  const { dailyImageQuota, decrementImageQuota, activeTopic, clearTopic, getPolicyCode } = useEssayStore()
  const { syncEssayCompletion } = useWarRoomSync()

  const wordCount = textContent.trim().split(/\s+/).filter(Boolean).length
  const isReady = mode === 'text' ? wordCount >= 50 : imageFile !== null
  const policyCode = getPolicyCode(topicTitle || activeTopic)

  // 载入 activeTopic 并自动聚焦
  useEffect(() => {
    if (activeTopic) {
      setTopicTitle(activeTopic)
      setShowPulse(true)

      // 自动调整题目框高度
      setTimeout(() => {
        if (titleInputRef.current) {
          titleInputRef.current.style.height = 'auto'
          titleInputRef.current.style.height = titleInputRef.current.scrollHeight + 'px'
        }
      }, 50)

      // 自动聚焦到内容输入框
      setTimeout(() => {
        contentInputRef.current?.focus()
      }, 100)

      // 2秒后停止脉冲效果
      setTimeout(() => {
        setShowPulse(false)
      }, 2000)
    }
  }, [activeTopic])

  // 压缩图片
  const compressImage = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new window.Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          let width = img.width
          let height = img.height

          // 限制最大尺寸
          const maxSize = 2048
          if (width > maxSize || height > maxSize) {
            if (width > height) {
              height = (height / width) * maxSize
              width = maxSize
            } else {
              width = (width / height) * maxSize
              height = maxSize
            }
          }

          canvas.width = width
          canvas.height = height

          const ctx = canvas.getContext('2d')
          if (!ctx) {
            reject(new Error('无法创建 canvas context'))
            return
          }

          ctx.drawImage(img, 0, 0, width, height)

          // 转换为 base64，质量 0.8
          const base64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1]

          // 检查大小（base64 编码后约为原始大小的 4/3）
          const sizeInMB = (base64.length * 3) / 4 / 1024 / 1024
          if (sizeInMB > 4) {
            reject(new Error('压缩后图片仍超过 4MB，请使用更小的图片'))
            return
          }

          resolve(base64)
        }
        img.onerror = () => reject(new Error('图片加载失败'))
        img.src = e.target?.result as string
      }
      reader.onerror = () => reject(new Error('文件读取失败'))
      reader.readAsDataURL(file)
    })
  }

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 验证文件类型
    if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
      setError('仅支持 JPG/PNG 格式')
      return
    }

    // 验证文件大小（原始文件不超过 10MB）
    if (file.size > 10 * 1024 * 1024) {
      setError('图片文件过大，请选择小于 10MB 的图片')
      return
    }

    setImageFile(file)
    setError(null)

    // 生成预览
    const reader = new FileReader()
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  // 保存作文到数据库
  const saveEssayToDatabase = async (essayData: AnalysisResult) => {
    try {
      const user = await getCurrentUser()
      if (!user) {
        console.error('[saveEssay] User not logged in')
        return
      }

      const currentWordCount = mode === 'text' ? wordCount : 120 // 图像模式估算字数

      const supabase = createClient()
      const { error } = await supabase.from('essays').insert({
        user_id: user.id,
        category,
        title: topicTitle || '未命名作文',
        content: mode === 'text' ? textContent : '(图像扫描)',
        score: essayData.score,
        feedback: JSON.stringify({
          grammarErrors: essayData.grammarErrors,
          improvedVersion: essayData.improvedVersion,
          strategicAdvice: essayData.strategicAdvice,
          dimensions: essayData.dimensions
        })
      })

      if (error) {
        console.error('[saveEssay] Database error:', error)
        return
      }

      // 同步到 WarRoom - 更新写作能力和词汇GDP
      await syncEssayCompletion({
        score: essayData.score,
        category,
        wordCount: currentWordCount
      })
      console.log('[saveEssay] Essay saved and synced to WarRoom successfully')
    } catch (err) {
      console.error('[saveEssay] Error:', err)
    }
  }

  const handleTextAnalysis = async () => {
    if (wordCount < 50) {
      setError('文本内容至少需要 50 个单词')
      return
    }

    setAnalyzing(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/essay/check-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: textContent, category })
      })

      if (!response.ok) {
        throw new Error('分析失败')
      }

      const data = await response.json()
      setResult(data)

      // 保存到数据库
      await saveEssayToDatabase(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : '情报分析失败，请重试')
    } finally {
      setAnalyzing(false)
    }
  }

  const handleImageAnalysis = async () => {
    if (!imageFile) {
      setError('请先上传图片')
      return
    }

    if (dailyImageQuota <= 0) {
      setError('今日照片扫描额度已用完')
      return
    }

    setAnalyzing(true)
    setError(null)
    setResult(null)

    try {
      // 压缩图片
      const base64Image = await compressImage(imageFile)

      const response = await fetch('/api/essay/check-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64Image, category })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '扫描失败')
      }

      const data = await response.json()
      setResult(data)
      decrementImageQuota()

      // 保存到数据库
      await saveEssayToDatabase(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : '图像扫描失败，请重试')
    } finally {
      setAnalyzing(false)
    }
  }

  const handleAnalyze = () => {
    if (mode === 'text') {
      handleTextAnalysis()
    } else {
      handleImageAnalysis()
    }
  }

  // 计算参数完整度
  const titleProgress = topicTitle ? 100 : 0
  const contentProgress = mode === 'text'
    ? Math.min((wordCount / 120) * 100, 100)
    : imageFile ? 100 : 0
  const categoryProgress = 100
  const overallProgress = Math.round((titleProgress + contentProgress + categoryProgress) / 3)

  return (
    <div className="grid grid-cols-12 gap-6">
      {/* Left Column: Input Stack (col-span-9) */}
      <div className="col-span-9 flex flex-col">
        {/* Mode Tabs */}
        <div className="mb-4 flex gap-4">
          <button
            onClick={() => setMode('text')}
            className={`flex items-center gap-2 border px-6 py-3 font-mono text-sm font-medium transition ${
              mode === 'text'
                ? 'border-cyan-500 bg-cyan-500/20 text-cyan-400'
                : 'border-cyan-500/30 bg-slate-950/50 text-slate-400 hover:border-cyan-500/50 hover:text-cyan-300'
            }`}
            style={{ borderRadius: 0 }}
          >
            <FileText className="h-4 w-4" />
            文本协议
          </button>
          <button
            onClick={() => setMode('image')}
            className={`flex items-center gap-2 border px-6 py-3 font-mono text-sm font-medium transition ${
              mode === 'image'
                ? 'border-purple-500 bg-purple-500/20 text-purple-400'
                : 'border-cyan-500/30 bg-slate-950/50 text-slate-400 hover:border-cyan-500/50 hover:text-cyan-300'
            }`}
            style={{ borderRadius: 0 }}
          >
            <Image className="h-4 w-4" />
            图像扫描
          </button>
        </div>

        {/* Title Box */}
        <div
          className={`border border-cyan-500/30 bg-[#0a0a0c] p-4 backdrop-blur-md transition-all duration-300 ${
            showPulse ? 'border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.3)]' : ''
          }`}
          style={{ borderRadius: 0, borderBottom: 0 }}
        >
          <div className="flex items-start gap-3">
            <span className="font-mono text-xs text-cyan-400/70 pt-1">[SUBJECT_INTEL]</span>
            <textarea
              ref={titleInputRef}
              value={topicTitle}
              onChange={(e) => setTopicTitle(e.target.value)}
              placeholder="输入作文题目..."
              rows={1}
              className="flex-1 resize-none bg-transparent font-mono text-sm text-white placeholder-slate-600 focus:outline-none overflow-hidden"
              disabled={analyzing}
              style={{ minHeight: '1.5rem' }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement
                target.style.height = 'auto'
                target.style.height = target.scrollHeight + 'px'
              }}
            />
            {topicTitle && (
              <button
                onClick={() => {
                  setTopicTitle('')
                  clearTopic()
                }}
                className="text-slate-500 transition hover:text-slate-300 pt-1"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          {topicTitle && (
            <div className="mt-2 flex items-center gap-2 border-t border-cyan-500/20 pt-2">
              <span className="font-mono text-xs text-slate-500">Policy Code:</span>
              <span className="font-mono text-xs text-cyan-400">{policyCode}</span>
            </div>
          )}
        </div>

        {/* Spacer */}
        <div className="h-4" />

        {/* Content Box */}
        <div className="relative flex-1 overflow-hidden border border-cyan-500/30 bg-slate-950/90 backdrop-blur-md" style={{ borderRadius: 0, minHeight: '50vh' }}>
          {/* Grid Background */}
          <div
            className="pointer-events-none absolute inset-0 opacity-10"
            style={{
              backgroundImage: 'linear-gradient(#00e5ff 1px, transparent 1px), linear-gradient(90deg, #00e5ff 1px, transparent 1px)',
              backgroundSize: '20px 20px',
            }}
          />

          {/* Corner Borders */}
          <div className="pointer-events-none absolute left-0 top-0 h-8 w-8 border-l-2 border-t-2 border-cyan-400" />
          <div className="pointer-events-none absolute right-0 top-0 h-8 w-8 border-r-2 border-t-2 border-cyan-400" />
          <div className="pointer-events-none absolute bottom-0 left-0 h-8 w-8 border-b-2 border-l-2 border-cyan-400" />
          <div className="pointer-events-none absolute bottom-0 right-0 h-8 w-8 border-b-2 border-r-2 border-cyan-400" />

          {/* Scanning Line */}
          {analyzing && (
            <motion.div
              className="absolute left-0 right-0 top-0 z-20 h-0.5 bg-cyan-400 shadow-[0_0_10px_#00E5FF]"
              animate={{ y: [0, 400, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            />
          )}

          <div className="relative z-10 flex h-full min-h-[50vh] flex-col p-6">

          {/* Text Mode */}
          {mode === 'text' && (
            <div className="flex flex-1 flex-col">
              <textarea
                ref={contentInputRef}
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                placeholder="输入战略政策内容... (最少 50 词)"
                className="flex-1 resize-none bg-transparent font-mono text-sm leading-relaxed text-white placeholder-slate-600 focus:outline-none"
                disabled={analyzing}
              />

              {/* Word Count */}
              <div className="mt-4 flex justify-end">
                <div className={`font-mono text-xs ${wordCount >= 50 ? 'text-cyan-400' : 'text-slate-500'}`}>
                  {wordCount} / 50 词
                </div>
              </div>
            </div>
          )}

          {/* Image Mode */}
          {mode === 'image' && (
            <div className="flex flex-1 flex-col items-center justify-center">
              {!imagePreview ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="flex w-full max-w-2xl cursor-pointer flex-col items-center justify-center border-2 border-dashed border-purple-500/50 bg-purple-500/5 p-12 transition hover:border-purple-500 hover:bg-purple-500/10"
                  style={{ borderRadius: 0, minHeight: '40vh' }}
                >
                  <Upload className="mb-4 h-16 w-16 text-purple-400" />
                  <p className="mb-2 font-mono text-sm text-purple-300">点击上传手写作文图片</p>
                  <p className="text-xs text-slate-500">支持 JPG/PNG 格式，最大 10MB</p>
                  <p className="mt-4 text-xs text-yellow-500">💡 请在充足光线下垂直拍摄手写文稿</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/jpg"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                </div>
              ) : (
                <div className="relative w-full max-w-2xl">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full border border-purple-500/30"
                    style={{ borderRadius: 0 }}
                  />
                  <button
                    onClick={() => {
                      setImageFile(null)
                      setImagePreview(null)
                    }}
                    className="absolute right-2 top-2 border border-red-500/50 bg-red-500/20 px-3 py-1 text-xs text-red-400 transition hover:bg-red-500/30"
                    style={{ borderRadius: 0 }}
                  >
                    移除
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

        {/* Toolbar */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
        {/* Category Selector */}
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-cyan-400" />
          <span className="font-mono text-xs text-slate-400">战略分级:</span>
          <div className="flex gap-2">
            {categories.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setCategory(cat.key)}
                className={`border px-3 py-1.5 font-mono text-xs font-medium transition ${
                  category === cat.key
                    ? 'border-cyan-400 bg-cyan-500/20 text-cyan-400'
                    : 'border-slate-700 bg-slate-900/50 text-slate-400 hover:border-slate-600 hover:text-slate-300'
                }`}
                style={{ borderRadius: 0 }}
              >
                <span className="mr-1">{cat.icon}</span>
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Image Quota Display */}
        {mode === 'image' && (
          <div className="flex items-center gap-2 font-mono text-xs text-slate-400">
            <Zap className="h-4 w-4 text-yellow-400" />
            今日扫描额度: <span className="text-yellow-400">{dailyImageQuota}/5</span>
          </div>
        )}

        {/* Analyze Button */}
        <button
          onClick={handleAnalyze}
          disabled={!isReady || analyzing}
          className={`flex items-center gap-2 border px-6 py-3 font-mono text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${
            mode === 'text'
              ? 'border-cyan-500 bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 disabled:hover:bg-cyan-500/20'
              : 'border-purple-500 bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 disabled:hover:bg-purple-500/20'
          }`}
          style={{ borderRadius: 0 }}
        >
          {analyzing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              正在分析情报...
            </>
          ) : (
            <>
              <Zap className="h-4 w-4" />
              启动战术分析
            </>
          )}
        </button>
      </div>

      {/* Error Display */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-2 border border-red-500/50 bg-red-500/10 p-4 font-mono text-sm text-red-400"
            style={{ borderRadius: 0 }}
          >
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Result Display */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="space-y-4"
          >
            {/* Score Card */}
            <div className="border border-cyan-500/30 bg-slate-950/80 p-6 backdrop-blur-md" style={{ borderRadius: 0 }}>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="flex items-center gap-2 font-mono text-lg font-bold text-white">
                  <CheckCircle2 className="h-5 w-5 text-cyan-400" />
                  战术评估完成
                </h3>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm text-slate-400">综合评分:</span>
                  <span className="font-mono text-3xl font-bold text-cyan-400">{result.score}</span>
                  <span className="font-mono text-sm text-slate-400">/ 100</span>
                </div>
              </div>

              {/* Dimensions */}
              {result.dimensions && (
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  {Object.entries(result.dimensions).map(([key, value]) => (
                    <div key={key} className="border border-cyan-500/20 bg-slate-900/50 p-3" style={{ borderRadius: 0 }}>
                      <div className="mb-1 font-mono text-xs text-slate-400">
                        {key === 'grammar' && '语法'}
                        {key === 'vocabulary' && '词汇'}
                        {key === 'structure' && '结构'}
                        {key === 'content' && '内容'}
                      </div>
                      <div className="font-mono text-xl font-bold text-cyan-400">{value}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Grammar Errors */}
            {result.grammarErrors && result.grammarErrors.length > 0 && (
              <div className="border border-yellow-500/30 bg-slate-950/80 p-6 backdrop-blur-md" style={{ borderRadius: 0 }}>
                <h3 className="mb-4 flex items-center gap-2 font-mono text-lg font-bold text-white">
                  <AlertCircle className="h-5 w-5 text-yellow-400" />
                  检测到 {result.grammarErrors.length} 处需要改进
                </h3>
                <div className="space-y-3">
                  {result.grammarErrors.slice(0, 5).map((error, idx) => (
                    <div key={idx} className="border-l-2 border-yellow-500/50 bg-yellow-500/5 p-3">
                      <div className="mb-1 font-mono text-xs text-yellow-400">{error.type}</div>
                      <div className="mb-2 flex items-center gap-2 text-sm">
                        <span className="text-red-400 line-through">{error.original}</span>
                        <span className="text-slate-500">→</span>
                        <span className="text-green-400">{error.corrected}</span>
                      </div>
                      <div className="font-mono text-xs text-slate-400">{error.explanation}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Strategic Advice */}
            <div className="border border-cyan-500/30 bg-slate-950/80 p-6 backdrop-blur-md" style={{ borderRadius: 0 }}>
              <h3 className="mb-4 flex items-center gap-2 font-mono text-lg font-bold text-white">
                <FileText className="h-5 w-5 text-cyan-400" />
                战略建议
              </h3>
              <div className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-slate-300">
                {result.strategicAdvice}
              </div>
            </div>

            {/* Improved Version */}
            {result.improvedVersion && (
              <div className="border border-green-500/30 bg-slate-950/80 p-6 backdrop-blur-md" style={{ borderRadius: 0 }}>
                <h3 className="mb-4 flex items-center gap-2 font-mono text-lg font-bold text-white">
                  <CheckCircle2 className="h-5 w-5 text-green-400" />
                  改进版本
                </h3>
                <div className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-slate-300">
                  {result.improvedVersion}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      </div>

      {/* Right Column: Status Panels (col-span-3) */}
      <div className="col-span-3 flex flex-col gap-4">
        {/* Panel 1: 战略环境监测 */}
        <div className="border border-cyan-900/50 bg-black/40 p-4 backdrop-blur-md" style={{ borderRadius: 0 }}>
          <div className="mb-3 flex items-center gap-2">
            <div className="h-2 w-2 animate-pulse rounded-full bg-cyan-400" />
            <h3 className="font-mono text-xs font-bold text-cyan-400">战略环境监测</h3>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between font-mono">
              <span className="text-slate-500">系统状态</span>
              <span className="text-green-400">ONLINE</span>
            </div>
            <div className="flex justify-between font-mono">
              <span className="text-slate-500">模式</span>
              <span className="text-cyan-400">{mode === 'text' ? 'TEXT' : 'IMAGE'}</span>
            </div>
            <div className="flex justify-between font-mono">
              <span className="text-slate-500">分级</span>
              <span className="text-cyan-400">{category.toUpperCase()}</span>
            </div>
            {activeTopic && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-2 border border-cyan-500/30 bg-cyan-500/10 px-2 py-1 text-center font-mono text-[10px] text-cyan-400"
              >
                DATA_INJECTED
              </motion.div>
            )}
          </div>
        </div>

        {/* Panel 2: 指令参数分析 */}
        <div className="border border-cyan-900/50 bg-black/40 p-4 backdrop-blur-md" style={{ borderRadius: 0 }}>
          <div className="mb-3 flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-yellow-400" />
            <h3 className="font-mono text-xs font-bold text-yellow-400">指令参数分析</h3>
          </div>
          <div className="space-y-3 text-xs">
            {/* Title Progress */}
            <div>
              <div className="mb-1 flex justify-between font-mono">
                <span className="text-slate-500">题目</span>
                <span className="text-cyan-400">{titleProgress}%</span>
              </div>
              <div className="h-1 bg-slate-800">
                <motion.div
                  className="h-full bg-cyan-400"
                  initial={{ width: 0 }}
                  animate={{ width: `${titleProgress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>

            {/* Content Progress */}
            <div>
              <div className="mb-1 flex justify-between font-mono">
                <span className="text-slate-500">内容</span>
                <span className="text-cyan-400">{Math.round(contentProgress)}%</span>
              </div>
              <div className="h-1 bg-slate-800">
                <motion.div
                  className="h-full bg-cyan-400"
                  initial={{ width: 0 }}
                  animate={{ width: `${contentProgress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>

            {/* Category Progress */}
            <div>
              <div className="mb-1 flex justify-between font-mono">
                <span className="text-slate-500">分级</span>
                <span className="text-cyan-400">{categoryProgress}%</span>
              </div>
              <div className="h-1 bg-slate-800">
                <div className="h-full w-full bg-cyan-400" />
              </div>
            </div>

            {/* Overall */}
            <div className="border-t border-cyan-900/50 pt-2">
              <div className="mb-1 flex justify-between font-mono">
                <span className="text-slate-400">综合完整度</span>
                <span className="text-cyan-400 font-bold">{overallProgress}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Panel 3: 执行就绪状态 */}
        <div className="border border-cyan-900/50 bg-black/40 p-4 backdrop-blur-md" style={{ borderRadius: 0 }}>
          <div className="mb-3 flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${isReady ? 'bg-green-400 animate-pulse' : 'bg-slate-600'}`} />
            <h3 className="font-mono text-xs font-bold text-slate-400">执行就绪状态</h3>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between font-mono">
              <span className="text-slate-500">最低字数</span>
              <span className={wordCount >= 50 ? 'text-green-400' : 'text-slate-600'}>
                {mode === 'text' ? (wordCount >= 50 ? '✓' : '✗') : '—'}
              </span>
            </div>
            <div className="flex items-center justify-between font-mono">
              <span className="text-slate-500">图像上传</span>
              <span className={imageFile ? 'text-green-400' : 'text-slate-600'}>
                {mode === 'image' ? (imageFile ? '✓' : '✗') : '—'}
              </span>
            </div>
            <div className="flex items-center justify-between font-mono">
              <span className="text-slate-500">分级选择</span>
              <span className="text-green-400">✓</span>
            </div>
            {mode === 'image' && (
              <div className="mt-2 border-t border-cyan-900/50 pt-2 font-mono">
                <span className="text-slate-500">扫描额度</span>
                <span className={`ml-2 ${dailyImageQuota > 0 ? 'text-yellow-400' : 'text-red-400'}`}>
                  {dailyImageQuota}/5
                </span>
              </div>
            )}
            <div className="mt-3 border-t border-cyan-900/50 pt-2 text-center">
              <div className={`font-mono text-sm font-bold ${isReady ? 'text-green-400' : 'text-slate-600'}`}>
                {isReady ? 'READY' : 'STANDBY'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
