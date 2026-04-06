'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import type { Workspace } from '@/app/portal/page'

interface Props {
  onSelectWorkspace: (w: Workspace) => void
}

const cards = [
  {
    id: 'computer' as Workspace,
    title: 'Computer Science',
    subtitle: '计算机科学',
    desc: 'C Language · Technical Docs · Monaco Editor',
    icon: '⌨',
    gradient: 'from-indigo-600 via-purple-600 to-blue-700',
    glow: 'rgba(99,102,241,0.6)',
    border: 'rgba(99,102,241,0.4)',
  },
  {
    id: 'architecture' as Workspace,
    title: 'Architecture',
    subtitle: '建筑学',
    desc: 'Terminology · AI Image Generation · Doubao',
    icon: '🏛',
    gradient: 'from-amber-500 via-orange-500 to-rose-600',
    glow: 'rgba(245,158,11,0.6)',
    border: 'rgba(245,158,11,0.4)',
  },
]

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.15 } },
}

const cardVariants = {
  hidden: { opacity: 0, y: 60, scale: 0.9 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.6, ease: 'easeOut' } },
}

export default function WelcomeScreen({ onSelectWorkspace }: Props) {
  return (
    <div className="relative w-full min-h-screen flex flex-col items-center justify-center overflow-hidden"
      style={{ background: '#0d0e1a' }}>

      {/* 背景光晕 */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-10"
          style={{ background: 'radial-gradient(circle, #6366f1, transparent)' }} />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-3xl opacity-10"
          style={{ background: 'radial-gradient(circle, #f59e0b, transparent)' }} />
      </div>

      {/* 返回首页 & 学习模式 */}
      <div className="absolute top-6 left-6 right-6 z-20 flex items-center justify-between">
        <Link href="/"
          className="flex items-center gap-2 text-sm transition-colors"
          style={{ color: '#64748b' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#f1f5f9')}
          onMouseLeave={e => (e.currentTarget.style.color = '#64748b')}>
          ← 返回首页
        </Link>
        <Link href="/dashboard"
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:scale-105"
          style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff' }}>
          <span>📚</span>
          <span>学习模式</span>
        </Link>
      </div>

      {/* 标题 */}
      <motion.div
        className="text-center mb-16 z-10"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
      >
        <h1 className="text-5xl font-bold tracking-tight mb-3"
          style={{ background: 'linear-gradient(to right, #fff, #c7d2fe, #d8b4fe)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Professional Mode
        </h1>
        <p style={{ color: '#94a3b8' }} className="text-lg">选择你的专业沉浸式工作区</p>
      </motion.div>

      {/* 卡片 */}
      <motion.div
        className="flex gap-10 z-10 flex-wrap justify-center px-6"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {cards.map((card) => (
          <motion.div
            key={card.id}
            variants={cardVariants}
            whileHover={{
              scale: 1.06,
              boxShadow: `0 0 60px ${card.glow}, 0 0 120px ${card.glow}40`,
              transition: { duration: 0.25 },
            }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onSelectWorkspace(card.id)}
            className="relative w-72 h-96 rounded-3xl cursor-pointer overflow-hidden"
            style={{
              border: `1px solid ${card.border}`,
              background: 'rgba(255,255,255,0.04)',
              backdropFilter: 'blur(20px)',
            }}
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-10`} />
            <div className={`absolute top-0 left-0 right-0 h-px bg-gradient-to-r ${card.gradient} opacity-60`} />

            <div className="relative z-10 flex flex-col items-center justify-center h-full p-8 text-center gap-5">
              <motion.div
                className="text-7xl"
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              >
                {card.icon}
              </motion.div>

              <div>
                <h2 className="text-2xl font-bold text-white mb-1">{card.title}</h2>
                <p className="text-base font-medium" style={{ color: '#cbd5e1' }}>{card.subtitle}</p>
              </div>

              <p className="text-sm leading-relaxed" style={{ color: '#64748b' }}>{card.desc}</p>

              <motion.div
                className={`mt-2 px-6 py-2 rounded-full bg-gradient-to-r ${card.gradient} text-white text-sm font-semibold`}
                whileHover={{ scale: 1.05 }}
              >
                进入工作区 →
              </motion.div>
            </div>

            <motion.div
              className={`absolute inset-0 bg-gradient-to-b ${card.gradient} opacity-0`}
              whileHover={{ opacity: 0.05 }}
              transition={{ duration: 0.3 }}
            />
          </motion.div>
        ))}
      </motion.div>

      <motion.p
        className="absolute bottom-8 text-sm z-10"
        style={{ color: '#334155' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        Powered by Doubao AI · Next.js · Framer Motion
      </motion.p>
    </div>
  )
}
