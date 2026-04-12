'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { categoryColor, findSubject, type SubjectCategory } from '@/config/subjects'
import { useMissionStore } from '@/stores/useMissionStore'

// ─── Difficulty label map ─────────────────────────────────────────

const DIFFICULTY_LABEL: Record<string, string> = {
  standard: 'Standard · 标准压力',
  hard:     'Hard · 高压演练',
  elite:    'Elite · 精英歼灭',
}

// ─── Stat row ─────────────────────────────────────────────────────

function StatRow({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-white/8 bg-white/4 px-4 py-3">
      <span className="text-sm text-slate-400">{label}</span>
      <span className="font-mono text-sm font-bold" style={{ color: accent }}>{value}</span>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────

export default function DeployPage({ params }: { params: { subjectId: string } }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { activeMission, setMission } = useMissionStore()

  const mode       = searchParams.get('mode') ?? 'archive'
  const archiveId  = searchParams.get('archiveId')
  const difficulty = (searchParams.get('difficulty') ?? 'standard') as 'standard' | 'hard' | 'elite'

  // Reconstruct mission from URL params if store is empty (e.g. page refresh)
  useEffect(() => {
    if (!activeMission) {
      // Try to infer category from the URL — fall back to cet4
      // A real implementation would look up the subject across all categories
      const inferredCategory: SubjectCategory = 'cet4'
      const subject = findSubject(inferredCategory, params.subjectId)
      if (subject) {
        setMission({
          subjectId: params.subjectId,
          subjectTitle: subject.title,
          category: inferredCategory,
          yearCode: mode === 'ai' ? null : (archiveId ?? null),
          isAiMode: mode === 'ai',
          difficulty,
        })
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Use store as source of truth; fall back to URL params
  const mission = activeMission ?? {
    subjectId: params.subjectId,
    subjectTitle: params.subjectId,
    category: 'cet4' as SubjectCategory,
    yearCode: archiveId,
    isAiMode: mode === 'ai',
    difficulty,
  }

  const accent = categoryColor(mission.category)
  const isAi   = mission.isAiMode

  // Route to the actual quiz page, passing archiveId if in archive mode
  function handleEngage() {
    // 写作题目跳转到 /essay 页面
    if (mission.subjectId === 'writing' || mission.subjectId === 'writing_small' || mission.subjectId === 'writing_big') {
      router.push('/essay')
      return
    }

    const params = new URLSearchParams()
    if (!isAi && mission.yearCode) {
      params.set('archiveId', mission.yearCode)
    }
    const qs = params.toString()

    // 篇章词汇跳转到专门页面
    if (mission.subjectId === 'reading_cloze') {
      router.push(`/quiz/${mission.category}/${mission.subjectId}/cloze${qs ? `?${qs}` : ''}`)
      return
    }

    // 翻译跳转到专门页面
    if (mission.subjectId === 'translation') {
      router.push(`/quiz/${mission.category}/${mission.subjectId}/translation${qs ? `?${qs}` : ''}`)
      return
    }

    router.push(`/quiz/${mission.category}/${mission.subjectId}${qs ? `?${qs}` : ''}`)
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">

      {/* Header card */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="relative overflow-hidden rounded-[2rem] border bg-slate-900 p-6 md:p-8"
        style={{ borderColor: `${accent}40`, boxShadow: `0 0 60px ${accent}14` }}
      >
        {/* glow */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-40 rounded-t-[2rem]"
          style={{ background: `linear-gradient(to bottom, ${accent}18, transparent)` }}
        />

        <div className="relative">
          <div className="text-[10px] uppercase tracking-[0.45em] text-slate-500">
            Deployment Order · {mission.category.toUpperCase()}
          </div>
          <h1 className="mt-2 text-2xl font-black text-slate-50 md:text-3xl">
            {mission.subjectTitle}
          </h1>

          {/* Mode badge */}
          <div className="mt-4 flex flex-wrap gap-2">
            {isAi ? (
              <span className="flex items-center gap-1.5 rounded-full border border-purple-500/30 bg-purple-500/12 px-3 py-1 text-xs font-bold text-purple-300">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-purple-400 opacity-60" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-purple-400" />
                </span>
                Neural Simulation · AI 模式
              </span>
            ) : (
              <span className="flex items-center gap-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/12 px-3 py-1 text-xs font-bold text-cyan-300">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                Historical Records · 真题模式
              </span>
            )}
            <span
              className="rounded-full border px-3 py-1 text-xs font-bold"
              style={{ color: accent, borderColor: `${accent}40`, background: `${accent}12` }}
            >
              {DIFFICULTY_LABEL[mission.difficulty] ?? mission.difficulty}
            </span>
          </div>
        </div>
      </motion.section>

      {/* Config summary */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.08 }}
        className="glass rounded-[1.75rem] border border-white/10 p-5 md:p-6"
      >
        <div className="mb-4 text-xs uppercase tracking-[0.3em] text-slate-500">Mission Config</div>
        <div className="space-y-2">
          <StatRow label="科目 Subject"    value={mission.subjectTitle}                                  accent={accent} />
          <StatRow label="战区 Category"   value={mission.category.toUpperCase()}                        accent={accent} />
          <StatRow label="推演模式 Mode"   value={isAi ? 'Neural Simulation' : 'Historical Records'}    accent={accent} />
          <StatRow label="档案 Archive"    value={isAi ? 'N/A — AI Generated' : (mission.yearCode ?? '—')} accent={accent} />
          <StatRow label="难度 Difficulty" value={DIFFICULTY_LABEL[mission.difficulty] ?? mission.difficulty} accent={accent} />
        </div>
      </motion.section>

      {/* AI mode notice */}
      {isAi && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="flex items-start gap-3 rounded-[1.5rem] border border-purple-500/20 bg-purple-500/8 px-5 py-4"
        >
          <span className="relative mt-1 flex h-2 w-2 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-purple-400 opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-purple-400" />
          </span>
          <p className="text-sm leading-7 text-slate-300">
            <span className="font-semibold text-purple-300">算力连接中...</span> 系统将在进入练习后实时调用 AI 生成专项题组。题目基于你的历史薄弱点动态构建，每次部署均不重复。
          </p>
        </motion.div>
      )}

      {/* Action buttons */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.18 }}
        className="flex flex-col gap-3 sm:flex-row"
      >
        <button
          type="button"
          onClick={handleEngage}
          className="relative flex-1 overflow-hidden rounded-2xl py-4 text-base font-black text-white"
          style={{
            background: `linear-gradient(135deg, ${accent}cc, ${accent}88)`,
            border: `1px solid ${accent}60`,
            boxShadow: `0 0 32px ${accent}30`,
          }}
        >
          <motion.div
            className="pointer-events-none absolute inset-0 rounded-2xl"
            animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
            style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.12) 50%, transparent 100%)', backgroundSize: '200% 100%' }}
          />
          <span className="relative z-10">进入战场 Engage</span>
        </button>

        <Link
          href="/quiz"
          className="flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-sm font-semibold text-slate-300 transition hover:border-white/20 hover:text-slate-100"
        >
          重新选择科目
        </Link>
      </motion.div>

    </div>
  )
}
