'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, TrendingUp } from 'lucide-react'
import { OralEvaluationResult } from '@/types/evaluation'
import { useEffect, useState } from 'react'

interface Props {
  isOpen: boolean
  onClose: () => void
  result: OralEvaluationResult | null
}

const gradeColors = {
  S: 'from-yellow-500 to-orange-500',
  A: 'from-green-500 to-emerald-500',
  B: 'from-blue-500 to-cyan-500',
  C: 'from-purple-500 to-pink-500',
  D: 'from-gray-500 to-slate-500'
}

const gradeLabels = {
  S: '卓越',
  A: '优秀',
  B: '良好',
  C: '及格',
  D: '需努力'
}

export default function ScoreModal({ isOpen, onClose, result }: Props) {
  const [animatedScores, setAnimatedScores] = useState({
    overall: 0,
    pronunciation: 0,
    fluency: 0,
    accuracy: 0
  })

  useEffect(() => {
    if (!isOpen || !result) return

    const duration = 1500
    const steps = 60
    const interval = duration / steps

    let currentStep = 0

    const timer = setInterval(() => {
      currentStep++
      const progress = currentStep / steps

      setAnimatedScores({
        overall: Math.floor(result.overall.score * progress),
        pronunciation: Math.floor(result.dimensions.pronunciation * progress),
        fluency: Math.floor(result.dimensions.fluency * progress),
        accuracy: Math.floor(result.dimensions.accuracy * progress)
      })

      if (currentStep >= steps) {
        clearInterval(timer)
      }
    }, interval)

    return () => clearInterval(timer)
  }, [isOpen, result])

  if (!result) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-white/10">
              <div className="sticky top-0 bg-slate-900/95 backdrop-blur-sm border-b border-white/10 p-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">练习报告</h2>
                <button
                  onClick={onClose}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring', damping: 15 }}
                    className={`inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-br ${gradeColors[result.overall.grade]} shadow-lg`}
                  >
                    <span className="text-6xl font-bold text-white">
                      {result.overall.grade}
                    </span>
                  </motion.div>
                  <p className="mt-4 text-xl text-slate-300">
                    {gradeLabels[result.overall.grade]}
                  </p>
                  <p className="text-3xl font-bold text-white mt-2">
                    {animatedScores.overall} 分
                  </p>
                </div>

                <div className="bg-white/5 rounded-xl p-6 space-y-4">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    能力维度
                  </h3>

                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-slate-300">发音 Pronunciation</span>
                      <span className="text-white font-semibold">
                        {animatedScores.pronunciation}
                      </span>
                    </div>
                    <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${result.dimensions.pronunciation}%` }}
                        transition={{ duration: 1, delay: 0.3 }}
                        className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-slate-300">流利度 Fluency</span>
                      <span className="text-white font-semibold">
                        {animatedScores.fluency}
                      </span>
                    </div>
                    <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${result.dimensions.fluency}%` }}
                        transition={{ duration: 1, delay: 0.4 }}
                        className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-slate-300">准确性 Accuracy</span>
                      <span className="text-white font-semibold">
                        {animatedScores.accuracy}
                      </span>
                    </div>
                    <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${result.dimensions.accuracy}%` }}
                        transition={{ duration: 1, delay: 0.5 }}
                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                      />
                    </div>
                  </div>
                </div>

                {result.suggestions.length > 0 && (
                  <div className="bg-white/5 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">
                      改进建议
                    </h3>
                    <ul className="space-y-2">
                      {result.suggestions.map((suggestion, index) => (
                        <motion.li
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.6 + index * 0.1 }}
                          className="flex items-start gap-2 text-slate-300"
                        >
                          <span className="text-blue-400 mt-1">•</span>
                          <span>{suggestion}</span>
                        </motion.li>
                      ))}
                    </ul>
                  </div>
                )}

                {result.grammarErrors.length > 0 && (
                  <div className="bg-white/5 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">
                      语法纠错
                    </h3>
                    <div className="space-y-3">
                      {result.grammarErrors.map((error, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.7 + index * 0.1 }}
                          className="bg-slate-800/50 rounded-lg p-4"
                        >
                          <div className="flex items-start gap-2 mb-2">
                            <span className="text-red-400 line-through">
                              {error.original}
                            </span>
                            <span className="text-slate-500">→</span>
                            <span className="text-green-400">
                              {error.corrected}
                            </span>
                          </div>
                          <p className="text-sm text-slate-400">
                            {error.explanation}
                          </p>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={onClose}
                    className="flex-1 bg-white/10 hover:bg-white/20 text-white py-3 rounded-xl transition-colors"
                  >
                    关闭
                  </button>
                  <button
                    onClick={() => {
                      onClose()
                      window.location.reload()
                    }}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl transition-colors"
                  >
                    再练一次
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
