'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'

interface Props {
  onBack: () => void
}

const TERMS = [
  { en: 'Flying Buttress', zh: '飞扶壁', desc: 'External support structure transferring roof thrust' },
  { en: 'Oculus', zh: '圆形天窗', desc: 'Circular opening at dome apex for light' },
  { en: 'Colonnade', zh: '柱廊', desc: 'Row of columns supporting entablature' },
  { en: 'Pediment', zh: '山墙', desc: 'Triangular gable above entrance' },
  { en: 'Vault', zh: '拱顶', desc: 'Arched ceiling structure' },
  { en: 'Cornice', zh: '檐口', desc: 'Horizontal decorative molding' },
  { en: 'Atrium', zh: '中庭', desc: 'Central open courtyard' },
  { en: 'Clerestory', zh: '高侧窗', desc: 'Upper windows for natural light' },
  { en: 'Apse', zh: '半圆壁龛', desc: 'Semicircular recess with dome' },
  { en: 'Portico', zh: '门廊', desc: 'Covered entrance with columns' },
]

type GenerationState = 'idle' | 'loading' | 'success' | 'error'

export default function ArchitectureWorkspace({ onBack }: Props) {
  const [selectedTerm, setSelectedTerm] = useState<string | null>(null)
  const [state, setState] = useState<GenerationState>('idle')
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleGenerate = async (term: string) => {
    setSelectedTerm(term)
    setState('loading')
    setError(null)
    setImageDataUrl(null)

    try {
      const response = await fetch('/api/portal/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ term }),
      })
      if (!response.ok) {
        const errData = await response.json()
        throw new Error(errData.error || 'API request failed')
      }
      const result = await response.json()
      setImageDataUrl(result.dataUrl)
      setState('success')
    } catch (err) {
      console.error('Image generation failed:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
      setState('error')
    }
  }

  return (
    <div className="flex w-full h-screen" style={{ background: '#0d0e1a' }}>
      {/* 左侧术语列表 */}
      <motion.aside
        className="flex-shrink-0 flex flex-col p-6 overflow-y-auto"
        style={{ width: 360, borderRight: '1px solid rgba(255,255,255,0.1)', background: '#0a0b14' }}
        initial={{ x: -60, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-sm transition-colors"
            style={{ color: '#64748b' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#f1f5f9')}
            onMouseLeave={e => (e.currentTarget.style.color = '#64748b')}
          >
            ← Back to Selection
          </button>
          <Link href="/dashboard"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:scale-105"
            style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff' }}>
            <span>📚</span>
            <span>学习模式</span>
          </Link>
        </div>

        <h2 className="text-xl font-bold mb-2" style={{ color: '#f1f5f9' }}>
          Architecture Terminology
        </h2>
        <p className="text-sm mb-6" style={{ color: '#64748b' }}>
          建筑学专业术语 · AI 图像生成
        </p>

        <div className="space-y-2">
          {TERMS.map((term) => (
            <motion.button
              key={term.en}
              onClick={() => handleGenerate(term.en)}
              className="w-full text-left p-4 rounded-xl transition-all"
              style={{
                background: selectedTerm === term.en ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${selectedTerm === term.en ? 'rgba(245,158,11,0.4)' : 'rgba(255,255,255,0.06)'}`,
              }}
              whileHover={{ scale: 1.02, background: 'rgba(245,158,11,0.1)' }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="font-semibold text-sm mb-1" style={{ color: '#f1f5f9' }}>
                {term.en}
              </div>
              <div className="text-xs mb-1" style={{ color: '#f59e0b' }}>
                {term.zh}
              </div>
              <div className="text-xs leading-relaxed" style={{ color: '#64748b' }}>
                {term.desc}
              </div>
            </motion.button>
          ))}
        </div>
      </motion.aside>

      {/* 右侧图像生成区域 */}
      <motion.main
        className="flex-1 flex flex-col items-center justify-center p-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        {state === 'idle' && (
          <div className="text-center">
            <div className="text-6xl mb-4">🏛</div>
            <h3 className="text-2xl font-bold mb-2" style={{ color: '#f1f5f9' }}>
              Select a Term
            </h3>
            <p style={{ color: '#64748b' }}>
              Choose an architectural term from the left to generate AI visualization
            </p>
          </div>
        )}

        {state === 'loading' && (
          <div className="text-center">
            <motion.div
              className="w-16 h-16 border-4 rounded-full mb-6 mx-auto"
              style={{ borderColor: 'rgba(245,158,11,0.2)', borderTopColor: '#f59e0b' }}
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
            <h3 className="text-xl font-bold mb-2" style={{ color: '#f1f5f9' }}>
              Generating Image...
            </h3>
            <p style={{ color: '#64748b' }}>
              Creating visualization for "{selectedTerm}"
            </p>
          </div>
        )}

        {state === 'success' && imageDataUrl && (
          <motion.div
            className="max-w-3xl w-full"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            <div className="rounded-2xl overflow-hidden mb-4"
              style={{ border: '1px solid rgba(245,158,11,0.3)' }}>
              <img
                src={imageDataUrl}
                alt={selectedTerm || ''}
                className="w-full h-auto"
                style={{ display: 'block' }}
              />
            </div>
            <div className="text-center">
              <h3 className="text-2xl font-bold mb-1" style={{ color: '#f1f5f9' }}>
                {selectedTerm}
              </h3>
              <p className="text-sm" style={{ color: '#f59e0b' }}>
                {TERMS.find(t => t.en === selectedTerm)?.zh}
              </p>
            </div>
          </motion.div>
        )}

        {state === 'error' && (
          <div className="text-center max-w-md">
            <div className="text-5xl mb-4">⚠️</div>
            <h3 className="text-xl font-bold mb-2" style={{ color: '#ef4444' }}>
              Generation Failed
            </h3>
            <p className="text-sm mb-4" style={{ color: '#64748b' }}>
              {error || 'An unknown error occurred'}
            </p>
            <button
              onClick={() => selectedTerm && handleGenerate(selectedTerm)}
              className="px-6 py-2 rounded-xl text-sm font-semibold transition-all"
              style={{ background: 'rgba(245,158,11,0.2)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.4)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(245,158,11,0.3)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(245,158,11,0.2)')}
            >
              Retry
            </button>
          </div>
        )}
      </motion.main>
    </div>
  )
}
