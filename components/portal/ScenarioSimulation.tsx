'use client'

import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { SCENARIOS } from '@/types/scenario'
import ScenarioCard from './ScenarioCard'

interface Props {
  onBack: () => void
}

export default function ScenarioSimulation({ onBack }: Props) {
  const router = useRouter()

  const handleScenarioSelect = (scenarioId: string) => {
    router.push(`/portal/scenario/${scenarioId}`)
  }

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-6 sm:p-8" style={{ background: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 100%)' }}>
      {/* 背景径向渐变虚影 */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
        <div className="w-[800px] h-[800px] bg-purple-500/10 rounded-full blur-[120px]" />
      </div>

      {/* 返回按钮 - 固定在左上角 */}
      <button
        onClick={onBack}
        className="absolute top-6 left-6 flex h-10 w-10 min-h-[44px] min-w-[44px] items-center justify-center rounded-xl transition-all hover:bg-white/5 touch-manipulation z-10"
      >
        <ArrowLeft className="h-5 w-5 text-slate-400" />
      </button>

      {/* 主内容区域 */}
      <div className="relative z-10 w-full max-w-6xl">
        {/* 标题部分 - 居中 */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12 sm:mb-16"
        >
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-3">情景模拟</h1>
          <p className="text-base sm:text-lg text-slate-400">选择一个场景开始练习</p>
        </motion.div>

        {/* 场景卡片网格 - 居中 */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3 lg:gap-8">
          {SCENARIOS.map((scenario, index) => (
            <motion.div
              key={scenario.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <ScenarioCard
                scenario={scenario}
                onSelect={handleScenarioSelect}
                isSelected={false}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
