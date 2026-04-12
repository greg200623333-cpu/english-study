'use client'

import { motion } from 'framer-motion'
import { Briefcase, Search, Mic, LucideIcon } from 'lucide-react'
import { Scenario } from '@/types/scenario'

interface Props {
  scenario: Scenario
  onSelect: (scenarioId: string) => void
  isSelected: boolean
}

const iconMap: Record<string, LucideIcon> = {
  Briefcase,
  Search,
  Mic,
}

export default function ScenarioCard({ scenario, onSelect, isSelected }: Props) {
  const IconComponent = iconMap[scenario.icon] || Briefcase

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onSelect(scenario.id)}
      className={`
        relative cursor-pointer rounded-2xl p-5 sm:p-6 transition-all duration-300
        bg-white/5 backdrop-blur-sm touch-manipulation
        ${isSelected
          ? 'border-2 border-purple-500/80 shadow-lg shadow-purple-500/20'
          : 'border border-white/10 hover:border-purple-500/50'
        }
      `}
    >
      {/* 图标 */}
      <div className={`
        mb-3 sm:mb-4 inline-flex rounded-xl p-2.5 sm:p-3 transition-colors
        ${isSelected ? 'bg-purple-500/20' : 'bg-white/5'}
      `}>
        <IconComponent className={`h-5 w-5 sm:h-6 sm:w-6 ${isSelected ? 'text-purple-400' : 'text-slate-400'}`} />
      </div>

      {/* 标题 */}
      <h3 className="mb-1 text-base sm:text-lg font-bold text-white">
        {scenario.title}
      </h3>
      <p className="mb-2 sm:mb-3 text-xs sm:text-sm text-purple-400">
        {scenario.subtitle}
      </p>

      {/* 描述 */}
      <p className="text-xs sm:text-sm leading-relaxed text-slate-400">
        {scenario.description}
      </p>

      {/* 选中指示器 */}
      {isSelected && (
        <motion.div
          layoutId="selected-indicator"
          className="absolute -right-1 -top-1 h-3 w-3 sm:h-4 sm:w-4 rounded-full bg-purple-500"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      )}
    </motion.div>
  )
}
