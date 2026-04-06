import { motion } from 'framer-motion'
import type { Workspace } from '../App'

interface Props {
  onSelect: (w: Workspace) => void
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
    desc: 'Terminology · AI Image Generation · DeepSeek',
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

export default function WelcomeScreen({ onSelect }: Props) {
  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden">
      {/* 背景粒子光晕 */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
      </div>

      {/* 标题区 */}
      <motion.div
        className="text-center mb-16 z-10"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
      >
        <h1 className="text-5xl font-bold tracking-tight bg-gradient-to-r from-white via-indigo-200 to-purple-300 bg-clip-text text-transparent mb-3">
          English Learning Portal
        </h1>
        <p className="text-gray-400 text-lg">选择你的专业沉浸式工作区</p>
      </motion.div>

      {/* 卡片区 */}
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
            onClick={() => onSelect(card.id)}
            className="relative w-72 h-96 rounded-3xl cursor-pointer overflow-hidden"
            style={{
              border: `1px solid ${card.border}`,
              background: 'rgba(255,255,255,0.04)',
              backdropFilter: 'blur(20px)',
            }}
          >
            {/* 渐变背景层 */}
            <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-10`} />

            {/* 顶部光晕线 */}
            <div
              className={`absolute top-0 left-0 right-0 h-px bg-gradient-to-r ${card.gradient} opacity-60`}
            />

            {/* 内容 */}
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
                <p className="text-gray-300 text-base font-medium">{card.subtitle}</p>
              </div>

              <p className="text-gray-500 text-sm leading-relaxed">{card.desc}</p>

              <motion.div
                className={`mt-2 px-6 py-2 rounded-full bg-gradient-to-r ${card.gradient} text-white text-sm font-semibold`}
                whileHover={{ scale: 1.05 }}
              >
                进入工作区 →
              </motion.div>
            </div>

            {/* 悬浮时的内部发光扫描线 */}
            <motion.div
              className={`absolute inset-0 bg-gradient-to-b ${card.gradient} opacity-0`}
              whileHover={{ opacity: 0.05 }}
              transition={{ duration: 0.3 }}
            />
          </motion.div>
        ))}
      </motion.div>

      {/* 底部说明 */}
      <motion.p
        className="absolute bottom-8 text-gray-600 text-sm z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        Powered by DeepSeek AI · React 18 · Vite · Framer Motion
      </motion.p>
    </div>
  )
}
