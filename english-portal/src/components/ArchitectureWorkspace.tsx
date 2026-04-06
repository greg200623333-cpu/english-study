import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { generateArchitectureImage } from '../services/imageGeneration'

interface Props {
  onBack: () => void
}

interface Term {
  id: string
  en: string
  zh: string
  desc: string
}

const TERMS: Term[] = [
  { id: 'flying-buttress', en: 'Flying Buttress', zh: '飞扶壁', desc: 'Gothic arch support extending from outer wall' },
  { id: 'oculus', en: 'Oculus', zh: '圆形天窗', desc: 'Circular opening at the apex of a dome' },
  { id: 'cantilever', en: 'Cantilever', zh: '悬臂结构', desc: 'Beam anchored at one end, projecting into space' },
  { id: 'clerestory', en: 'Clerestory', zh: '高侧窗', desc: 'Upper row of windows above an adjoining roof' },
  { id: 'entablature', en: 'Entablature', zh: '檐部', desc: 'Horizontal structure above classical columns' },
  { id: 'atrium', en: 'Atrium', zh: '中庭', desc: 'Large open-roofed central space in a building' },
  { id: 'curtain-wall', en: 'Curtain Wall', zh: '幕墙', desc: 'Non-structural outer cladding of a building' },
  { id: 'colonnade', en: 'Colonnade', zh: '柱廊', desc: 'Row of evenly spaced columns supporting a roof' },
  { id: 'vault', en: 'Groin Vault', zh: '十字拱', desc: 'Intersection of two barrel vaults at right angles' },
  { id: 'fenestration', en: 'Fenestration', zh: '开窗设计', desc: 'Arrangement and design of windows in a building' },
]

type Status = 'idle' | 'loading' | 'success' | 'error'

export default function ArchitectureWorkspace({ onBack }: Props) {
  const [activeTerm, setActiveTerm] = useState<Term | null>(null)
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null)
  const [revisedPrompt, setRevisedPrompt] = useState<string | null>(null)
  const [status, setStatus] = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState<string>('')

  const handleTermClick = async (term: Term) => {
    setActiveTerm(term)
    setImageDataUrl(null)
    setRevisedPrompt(null)
    setErrorMsg('')
    setStatus('loading')

    try {
      const result = await generateArchitectureImage(term.en)
      setImageDataUrl(result.dataUrl)
      setRevisedPrompt(result.revisedPrompt ?? null)
      setStatus('success')
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unknown error')
      setStatus('error')
    }
  }

  const handleGenerate = () => {
    if (activeTerm) handleTermClick(activeTerm)
  }

  return (
    <div className="flex w-full h-full bg-[#0d0e1a]">
      {/* 左侧术语列表 */}
      <motion.aside
        className="w-72 flex-shrink-0 flex flex-col border-r border-white/10 bg-[#0a0b14]"
        initial={{ x: -60, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        {/* 侧边栏顶部 */}
        <div className="p-5 border-b border-white/10">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm mb-4"
          >
            ← 返回主页
          </button>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-lg">🏛</div>
            <div>
              <h2 className="text-white font-semibold text-sm">Architecture</h2>
              <p className="text-gray-500 text-xs">AI Visual Learning</p>
            </div>
          </div>
        </div>

        {/* 使用说明 */}
        <div className="mx-3 mt-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <p className="text-amber-300 text-xs leading-relaxed">
            点击术语 → AI 自动生成对应建筑实景照片
          </p>
        </div>

        {/* 术语列表 */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto mt-2">
          <p className="text-gray-600 text-xs uppercase tracking-wider px-3 py-2">
            Architectural Terms ({TERMS.length})
          </p>
          {TERMS.map((term, i) => (
            <motion.button
              key={term.id}
              onClick={() => handleTermClick(term)}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04, duration: 0.3 }}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.97 }}
              className={`w-full text-left px-3 py-3 rounded-lg transition-all ${
                activeTerm?.id === term.id
                  ? 'bg-amber-500/20 border border-amber-500/30'
                  : 'hover:bg-white/5 border border-transparent'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className={`text-sm font-medium ${
                    activeTerm?.id === term.id ? 'text-amber-300' : 'text-white'
                  }`}>
                    {term.en}
                  </p>
                  <p className="text-gray-500 text-xs mt-0.5">{term.zh}</p>
                </div>
                {activeTerm?.id === term.id && status === 'loading' && (
                  <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin flex-shrink-0 mt-0.5" />
                )}
                {activeTerm?.id === term.id && status === 'success' && (
                  <span className="text-green-400 text-xs flex-shrink-0 mt-0.5">✓</span>
                )}
              </div>
              <p className="text-gray-600 text-xs mt-1 leading-relaxed">{term.desc}</p>
            </motion.button>
          ))}
        </nav>

        {/* 底部状态 */}
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span>Powered by DeepSeek AI</span>
          </div>
        </div>
      </motion.aside>

      {/* 右侧图像展示区 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 顶部信息栏 */}
        <motion.div
          className="flex items-center justify-between px-6 py-3 border-b border-white/10 bg-[#0c0d18]"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <div className="flex items-center gap-3">
            {activeTerm ? (
              <>
                <span className="text-white font-medium">{activeTerm.en}</span>
                <span className="text-gray-500 text-sm">·</span>
                <span className="text-gray-400 text-sm">{activeTerm.zh}</span>
              </>
            ) : (
              <span className="text-gray-500 text-sm">选择左侧术语开始学习</span>
            )}
          </div>
          <button
            onClick={handleGenerate}
            disabled={!activeTerm || status === 'loading'}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              !activeTerm || status === 'loading'
                ? 'bg-gray-700/50 text-gray-500 cursor-not-allowed'
                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30'
            }`}
          >
            {status === 'loading' ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                生成中...
              </>
            ) : (
              <>✨ 重新生成</>
            )}
          </button>
        </motion.div>

        {/* 图像展示主体 */}
        <div className="flex-1 flex items-center justify-center p-8 overflow-hidden">
          <AnimatePresence mode="wait">

            {/* 初始引导状态 */}
            {status === 'idle' && (
              <motion.div
                key="idle"
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <div className="text-8xl mb-6">🏛</div>
                <h3 className="text-white text-xl font-semibold mb-3">选择建筑术语</h3>
                <p className="text-gray-500 text-sm max-w-xs leading-relaxed">
                  从左侧列表点击任意建筑术语，AI 将为你生成对应的真实建筑照片，结合图像深度记忆专业词汇。
                </p>
              </motion.div>
            )}

            {/* 加载状态 */}
            {status === 'loading' && (
              <motion.div
                key="loading"
                className="text-center"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
              >
                <div className="relative w-24 h-24 mx-auto mb-6">
                  <div className="absolute inset-0 rounded-full border-2 border-amber-500/20" />
                  <div className="absolute inset-0 rounded-full border-2 border-t-amber-400 border-r-amber-400 border-b-transparent border-l-transparent animate-spin" />
                  <div className="absolute inset-3 rounded-full border border-t-amber-300 border-transparent animate-spin" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }} />
                  <div className="absolute inset-0 flex items-center justify-center text-2xl">✨</div>
                </div>
                <p className="text-amber-300 text-base font-medium mb-2">
                  AI 正在生成建筑实景...
                </p>
                <p className="text-gray-500 text-sm">
                  {activeTerm?.en} · {activeTerm?.zh}
                </p>
                <p className="text-gray-600 text-xs mt-3">约需 10-30 秒，请稍候</p>
              </motion.div>
            )}

            {/* 图像展示成功状态 */}
            {status === 'success' && imageDataUrl && (
              <motion.div
                key="success"
                className="flex flex-col items-center gap-4 w-full max-w-2xl"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.02 }}
                transition={{ duration: 0.4 }}
              >
                {/* 图像容器 */}
                <div className="relative rounded-2xl overflow-hidden border border-amber-500/20 shadow-2xl w-full">
                  {/* 顶部发光条 */}
                  <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-400 to-transparent z-10" />

                  {/* 将 Base64 dataUrl 直接作为 img src 渲染 */}
                  <img
                    src={imageDataUrl}
                    alt={activeTerm?.en}
                    className="w-full object-cover max-h-[480px]"
                    loading="lazy"
                  />

                  {/* 底部信息浮层 */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-5">
                    <p className="text-white font-bold text-xl">{activeTerm?.en}</p>
                    <p className="text-amber-300 text-sm">{activeTerm?.zh}</p>
                  </div>
                </div>

                {/* 术语解释 */}
                <div className="w-full p-4 rounded-xl bg-white/5 border border-white/10">
                  <p className="text-gray-300 text-sm leading-relaxed">
                    <span className="text-amber-400 font-medium">Definition：</span>
                    {activeTerm?.desc}
                  </p>
                  {revisedPrompt && (
                    <p className="text-gray-600 text-xs mt-2 leading-relaxed">
                      <span className="text-gray-500">AI Prompt：</span>
                      {revisedPrompt}
                    </p>
                  )}
                </div>
              </motion.div>
            )}

            {/* 错误状态 */}
            {status === 'error' && (
              <motion.div
                key="error"
                className="text-center max-w-sm"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <div className="text-5xl mb-4">⚠️</div>
                <p className="text-red-400 font-medium mb-2">图像生成失败</p>
                <p className="text-gray-500 text-sm mb-5 leading-relaxed">{errorMsg}</p>
                <button
                  onClick={handleGenerate}
                  className="px-5 py-2 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 text-sm hover:bg-amber-500/30 transition-colors"
                >
                  重试
                </button>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
