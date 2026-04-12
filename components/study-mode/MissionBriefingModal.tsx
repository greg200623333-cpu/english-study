'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { categoryColor, type SubjectCategory } from '@/config/subjects'
import { useMissionStore, type MissionConfig, type MissionDifficulty } from '@/stores/useMissionStore'

// ─── Archive mock data ────────────────────────────────────────────

type ArchiveStatus = 'completed' | 'in_progress' | 'new'

type ArchiveEntry = {
  yearCode: string
  display: string
  subtitle: string
  status: ArchiveStatus
}

// 真实档案：2024年12月真题（3套）
const REAL_ARCHIVES_2024_12: ArchiveEntry[] = [
  { yearCode: '2024.12-set1', display: 'ARCHIVE: 2024.12-01', subtitle: '2024年12月 第1套', status: 'new' },
  { yearCode: '2024.12-set2', display: 'ARCHIVE: 2024.12-02', subtitle: '2024年12月 第2套', status: 'new' },
  { yearCode: '2024.12-set3', display: 'ARCHIVE: 2024.12-03', subtitle: '2024年12月 第3套', status: 'new' },
]

const MOCK_ARCHIVES: Record<string, ArchiveEntry[]> = {
  reading_choice: REAL_ARCHIVES_2024_12,
  listening_passage: REAL_ARCHIVES_2024_12,
  listening_news: REAL_ARCHIVES_2024_12,
  listening_interview: REAL_ARCHIVES_2024_12,
  reading_match: REAL_ARCHIVES_2024_12,
  reading_cloze: REAL_ARCHIVES_2024_12,
}

const DEFAULT_ARCHIVES: ArchiveEntry[] = REAL_ARCHIVES_2024_12

// ─── Props ────────────────────────────────────────────────────────

export type MissionBriefingProps = {
  open: boolean
  subjectId: string
  subjectTitle: string
  category: SubjectCategory
  onClose: () => void
}

// ─── Status badge ─────────────────────────────────────────────────

const STATUS_META: Record<ArchiveStatus, { label: string; classes: string }> = {
  completed:   { label: '已占领', classes: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25' },
  in_progress: { label: '侦察中', classes: 'bg-amber-500/15  text-amber-300  border-amber-500/25'  },
  new:         { label: '未触达', classes: 'bg-slate-700/60  text-slate-400  border-slate-600/30'  },
}

function StatusBadge({ status }: { status: ArchiveStatus }) {
  const m = STATUS_META[status]
  return (
    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${m.classes}`}>
      {m.label}
    </span>
  )
}

// ─── Mode toggle ──────────────────────────────────────────────────

function ModeToggle({ isAi, accentColor, onChange }: { isAi: boolean; accentColor: string; onChange: (v: boolean) => void }) {
  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={() => onChange(false)}
        className={`relative flex-1 rounded-xl border px-4 py-3 text-left transition-all duration-200 ${
          !isAi ? 'text-slate-100' : 'border-white/8 bg-white/4 text-slate-500 hover:border-white/15 hover:text-slate-300'
        }`}
        style={!isAi ? { borderColor: `${accentColor}60`, background: `${accentColor}12` } : {}}
      >
        <div className="flex items-center gap-2">
          {!isAi && <span className="h-1.5 w-1.5 rounded-full shadow-[0_0_6px_rgba(34,211,238,0.8)]" style={{ background: accentColor }} />}
          <span className="text-xs font-black uppercase tracking-widest">Historical</span>
        </div>
        <div className="mt-1 text-[11px] leading-5 opacity-75">真题模式 — 严格基于历年真题</div>
      </button>

      <button
        type="button"
        onClick={() => onChange(true)}
        className={`relative flex-1 rounded-xl border px-4 py-3 text-left transition-all duration-200 ${
          isAi ? 'border-purple-500/50 bg-purple-500/12 text-purple-100' : 'border-white/8 bg-white/4 text-slate-500 hover:border-white/15 hover:text-slate-300'
        }`}
      >
        <div className="flex items-center gap-2">
          {isAi && (
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-purple-400 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-purple-400" />
            </span>
          )}
          <span className="text-xs font-black uppercase tracking-widest">Neural</span>
        </div>
        <div className="mt-1 text-[11px] leading-5 opacity-75">AI 模式 — 动态生成模拟题</div>
      </button>
    </div>
  )
}

// ─── Archive card ─────────────────────────────────────────────────

function ArchiveCard({ entry, selected, accentColor, onSelect }: {
  entry: ArchiveEntry
  selected: boolean
  accentColor: string
  onSelect: () => void
}) {
  return (
    <motion.button
      type="button"
      onClick={onSelect}
      whileTap={{ scale: 0.97 }}
      className={`relative w-full overflow-hidden rounded-[1.1rem] border p-3 text-left transition-all duration-200 ${
        selected ? '' : 'border-white/8 bg-white/4 hover:border-white/18'
      }`}
      style={selected ? { borderColor: `${accentColor}60`, background: `${accentColor}10` } : {}}
    >
      {selected && (
        <motion.div
          layoutId="archive-scan"
          className="pointer-events-none absolute inset-0 rounded-[1.1rem]"
          style={{ boxShadow: `inset 0 0 0 1px ${accentColor}50, 0 0 18px ${accentColor}20` }}
        />
      )}
      <div className="font-mono text-xs font-black tracking-wider" style={{ color: selected ? accentColor : '#94a3b8' }}>
        {entry.display}
      </div>
      <div className="mt-1 text-[10px] text-slate-500">{entry.subtitle}</div>
      <div className="mt-2"><StatusBadge status={entry.status} /></div>
    </motion.button>
  )
}

// ─── Main modal ───────────────────────────────────────────────────

export function MissionBriefingModal({ open, subjectId, subjectTitle, category, onClose }: MissionBriefingProps) {
  const router = useRouter()
  const setMission = useMissionStore((s) => s.setMission)

  const [isAiMode, setIsAiMode] = useState(false)
  const [selectedYear, setSelectedYear] = useState<string | null>(null)
  const [difficulty, setDifficulty] = useState<MissionDifficulty>('standard')

  const accentColor = categoryColor(category)
  const archives = MOCK_ARCHIVES[subjectId] ?? DEFAULT_ARCHIVES
  const canDeploy = isAiMode || selectedYear !== null

  // Border: CET-4 → cyan, CET-6 → purple, kaoyan → accent
  const borderColor =
    category === 'cet4' ? 'rgba(6,182,212,0.5)' :
    category === 'cet6' ? 'rgba(139,92,246,0.5)' :
    `${accentColor}50`

  function handleDeploy() {
    const config: MissionConfig = {
      subjectId,
      subjectTitle,
      category,
      yearCode: isAiMode ? null : (selectedYear ?? archives[0]?.yearCode ?? null),
      isAiMode,
      difficulty,
    }
    setMission(config)

    const params = new URLSearchParams({
      mode: isAiMode ? 'ai' : 'archive',
      ...(config.yearCode ? { archiveId: config.yearCode } : {}),
      difficulty,
    })
    router.push(`/ops/deploy/${subjectId}?${params.toString()}`)
    onClose()
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="mission-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[400] flex items-end justify-center bg-slate-950/80 backdrop-blur-md sm:items-center sm:px-4"
          onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
        >
          <motion.div
            key="mission-card"
            initial={{ opacity: 0, y: 32, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ duration: 0.3, ease: [0.2, 1, 0.32, 1] }}
            className="relative flex w-full max-w-2xl flex-col overflow-hidden rounded-t-[2rem] bg-slate-900 sm:rounded-[2rem]"
            style={{
              border: `1px solid ${borderColor}`,
              boxShadow: `0 0 60px ${accentColor}18, 0 0 0 1px ${accentColor}10`,
              maxHeight: '92dvh',
            }}
          >
            {/* top glow */}
            <div
              className="pointer-events-none absolute inset-x-0 top-0 h-32 rounded-t-[2rem]"
              style={{ background: `linear-gradient(to bottom, ${accentColor}18, transparent)` }}
            />

            {/* Header */}
            <div className="relative shrink-0 border-b border-white/8 px-5 py-4 md:px-7 md:py-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.45em] text-slate-500">
                    Mission Briefing · {category.toUpperCase()}
                  </div>
                  <h2 className="mt-1.5 text-lg font-black text-slate-50 md:text-xl">
                    {subjectTitle}
                    <span className="ml-2 text-sm font-normal text-slate-400">任务准备简报</span>
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="mt-0.5 shrink-0 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-slate-400 hover:text-slate-200"
                >
                  ESC
                </button>
              </div>
            </div>

            {/* Scrollable body */}
            <div
              className="min-h-0 flex-1 overflow-y-auto px-5 py-5 md:px-7 md:py-6"
              style={{ scrollbarWidth: 'thin', scrollbarColor: `${accentColor}40 transparent` }}
            >
              <div className="space-y-6">

                {/* DIM-A: Mode */}
                <div className="space-y-3">
                  <SectionLabel dim="DIM-A" label="推演模式 Simulation Protocol" />
                  <ModeToggle isAi={isAiMode} accentColor={accentColor} onChange={(v) => { setIsAiMode(v); setSelectedYear(null) }} />
                  <AnimatePresence mode="wait">
                    {isAiMode ? (
                      <motion.div key="ai" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}
                        className="flex items-start gap-3 rounded-xl border border-purple-500/20 bg-purple-500/8 px-4 py-3">
                        <span className="relative mt-0.5 flex h-2 w-2 shrink-0">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-purple-400 opacity-60" />
                          <span className="relative inline-flex h-2 w-2 rounded-full bg-purple-400" />
                        </span>
                        <p className="text-xs leading-6 text-slate-300">
                          <span className="font-semibold text-purple-300">算力连接中...</span> Neural Simulation 将根据你的历史薄弱点动态生成专项题组，难度自适应，每次部署均不重复。
                        </p>
                      </motion.div>
                    ) : (
                      <motion.div key="hist" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}
                        className="flex items-start gap-3 rounded-xl border border-cyan-500/20 bg-cyan-500/8 px-4 py-3">
                        <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-400" />
                        <p className="text-xs leading-6 text-slate-300">
                          <span className="font-semibold text-cyan-300">Historical Records</span> 严格基于历年真题原文，保留原始题序与选项排列，模拟真实考场压力。
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* DIM-B: Archive (historical only) */}
                <AnimatePresence>
                  {!isAiMode && (
                    <motion.div key="archive" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
                      <div className="space-y-3 pt-1">
                        <SectionLabel dim="DIM-B" label="档案选择 Archive Selection" />
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                          {archives.map((entry) => (
                            <ArchiveCard
                              key={entry.yearCode}
                              entry={entry}
                              selected={selectedYear === entry.yearCode}
                              accentColor={accentColor}
                              onSelect={() => setSelectedYear(entry.yearCode)}
                            />
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* DIM-C: Difficulty */}
                <div className="space-y-3">
                  <SectionLabel dim="DIM-C" label="难度协议 Difficulty" />
                  <div className="flex gap-2">
                    {(['standard', 'hard', 'elite'] as const).map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setDifficulty(d)}
                        className={`flex-1 rounded-xl border py-2.5 text-xs font-bold uppercase tracking-widest transition-all ${
                          difficulty === d ? 'text-slate-50' : 'border-white/8 bg-white/4 text-slate-500 hover:text-slate-300'
                        }`}
                        style={difficulty === d ? { borderColor: `${accentColor}60`, background: `${accentColor}14`, color: accentColor } : {}}
                      >
                        {d === 'standard' ? 'Standard' : d === 'hard' ? 'Hard' : 'Elite'}
                      </button>
                    ))}
                  </div>
                </div>

              </div>
            </div>

            {/* Footer */}
            <div className="relative shrink-0 border-t border-white/8 px-5 py-4 md:px-7 md:py-5">
              <div className="flex items-center justify-between gap-4">
                <div className="text-xs text-slate-500">
                  {isAiMode ? 'Neural · 动态生成' : selectedYear
                    ? <span>已锁定 <span className="font-mono text-slate-300">{selectedYear}</span></span>
                    : '请选择档案年份'}
                </div>
                <button
                  type="button"
                  onClick={handleDeploy}
                  disabled={!canDeploy}
                  className="relative overflow-hidden rounded-xl px-6 py-3 text-sm font-black text-white transition-all disabled:cursor-not-allowed disabled:opacity-40"
                  style={{
                    background: canDeploy ? `linear-gradient(135deg, ${accentColor}cc, ${accentColor}88)` : 'rgba(255,255,255,0.06)',
                    border: `1px solid ${canDeploy ? accentColor + '60' : 'rgba(255,255,255,0.08)'}`,
                    boxShadow: canDeploy ? `0 0 24px ${accentColor}30` : 'none',
                  }}
                >
                  {canDeploy && (
                    <motion.div
                      className="pointer-events-none absolute inset-0 rounded-xl"
                      animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
                      style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.12) 50%, transparent 100%)', backgroundSize: '200% 100%' }}
                    />
                  )}
                  <span className="relative z-10">执行部署 Execute Deployment</span>
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ─── Shared sub-component ─────────────────────────────────────────

function SectionLabel({ dim, label }: { dim: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 font-mono text-[10px] font-bold text-slate-400">{dim}</span>
      <span className="text-sm font-bold text-slate-200">{label}</span>
    </div>
  )
}
