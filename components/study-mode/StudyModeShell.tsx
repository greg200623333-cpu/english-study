'use client'

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { MissionBriefingModal } from '@/components/study-mode/MissionBriefingModal'
import { SelectionModal } from '@/components/study-mode/SelectionModal'
import { StrategyLawPanel } from '@/components/study-mode/StrategyLawPanel'
import { WarRoomDashboard } from '@/components/study-mode/WarRoomDashboard'
import { useReadingTracker, type ReadingAssessment } from '@/hooks/useReadingTracker'
import { createClient } from '@/lib/supabase/client'
import { applyRemoteStudyModeProfile, describeStudyModeError, loadStudyModeProfile, logStudyModeEvent, saveStudyModeProfile } from '@/lib/studyModePersistence'
import { calcGDP } from '@/utils/calcGDP'
import { type ExamType, type LawKey, type WordAsset, type WordTier, useStudyModeStore } from '@/stores/useStudyModeStore'

type Word = {
  id: number
  word: string
  phonetic: string | null
  meaning: string | null
  example: string | null
  category: string | null
  tier?: WordTier | null
}

type WordRecord = {
  word_id: number
  status: 'new' | 'learning' | 'known'
}

type TierCompletion = {
  total: number
  known: number
  learning: number
  completionRate: number
}

const categoryLabels: Record<string, string> = {
  cet4: '四级',
  cet6: '六级',
  kaoyan: '考研',
  kaoyan1: '考研一',
  kaoyan2: '考研二',
}

const tierCopy: Record<WordTier, { label: string; title: string; description: string }> = {
  core: {
    label: '核心词汇',
    title: '精锐资产池',
    description: '优先吃透高价值核心词汇，适合快速稳住主战线。',
  },
  full: {
    label: '总词汇',
    title: '全量资产池',
    description: '扩展到完整词库，适合拉高词汇上限和覆盖面。',
  },
}

function masteryFromStatus(status: WordRecord['status']) {
  if (status === 'known') return 0.92
  if (status === 'learning') return 0.58
  return 0.2
}

function difficultyFromCategory(category: string | null) {
  if (category === 'cet4') return 1
  if (category === 'cet6') return 1.35
  if (category?.startsWith('kaoyan')) return 1.65
  return 1.18
}

function buildGdpHistory(gdp: number) {
  return [
    { label: 'D-6', value: Math.round(gdp * 0.68) },
    { label: 'D-5', value: Math.round(gdp * 0.74) },
    { label: 'D-4', value: Math.round(gdp * 0.81) },
    { label: 'D-3', value: Math.round(gdp * 0.88) },
    { label: 'D-2', value: Math.round(gdp * 0.93) },
    { label: 'D-1', value: Math.round(gdp * 0.97) },
    { label: 'Today', value: gdp },
  ]
}

function buildTierCompletion(wordIds: number[], statusMap: Map<number, 'new' | 'learning' | 'known'>): TierCompletion {
  const total = wordIds.length
  let known = 0
  let learning = 0

  wordIds.forEach((id) => {
    const status = statusMap.get(id) ?? 'new'
    if (status === 'known') known += 1
    if (status === 'learning') learning += 1
  })

  return {
    total,
    known,
    learning,
    completionRate: total > 0 ? Math.round((known / total) * 100) : 0,
  }
}

export function StudyModeShell() {
  const {
    hasSeenBriefing,
    selectedExam,
    selectedWordTier,
    hasChosenWordTier,
    examLabel,
    daysToExam,
    administrativePower,
    vocabularyGDP,
    reviewDeficit,
    gdpHistory,
    skillBalance,
    activeBuffs,
    laws,
    wordAssets,
    setHasSeenBriefing,
    setWordTier,
    initializeCampaign,
    syncVocabularyGDP,
    syncWordAssets,
    updateReviewDeficit,
    syncSkillBalance,
    enactLaw,
  } = useStudyModeStore()

  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [words, setWords] = useState<Word[]>([])
  const [notice, setNotice] = useState('')
  const [wordCount, setWordCount] = useState(420)
  const [correctAnswers, setCorrectAnswers] = useState(4)
  const [totalQuestions, setTotalQuestions] = useState(5)
  const [latestAssessment, setLatestAssessment] = useState<ReadingAssessment | null>(null)
  const [completion, setCompletion] = useState<{ core: TierCompletion; full: TierCompletion }>({
    core: { total: 0, known: 0, learning: 0, completionRate: 0 },
    full: { total: 0, known: 0, learning: 0, completionRate: 0 },
  })
  const tracker = useReadingTracker()

  useEffect(() => {
    async function loadWords() {
      setLoading(true)
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUserId(user?.id ?? null)

      if (user) {
        const remoteProfile = await loadStudyModeProfile(user.id).catch(() => null)
        if (remoteProfile) applyRemoteStudyModeProfile(remoteProfile)
      }

      const allWordsQuery = selectedExam
        ? supabase.from('words').select('*').eq('category', selectedExam).order('id')
        : supabase.from('words').select('*').order('id')

      const { data: allWordsData, error: allWordsError } = await allWordsQuery
      if (allWordsError) {
        setNotice(`词汇资产加载失败：${describeStudyModeError(allWordsError)}`)
        setWords([])
        syncWordAssets([])
        syncVocabularyGDP(0, buildGdpHistory(0))
        updateReviewDeficit(0)
        setLoading(false)
        return
      }

      const normalizedAllWords = (allWordsData ?? []) as Word[]
      const normalizedWords = normalizedAllWords.filter((word) => (word.tier ?? 'full') === selectedWordTier)
      setWords(normalizedWords)

      let records: WordRecord[] = []
      if (user) {
        const { data: recordData } = await supabase.from('word_records').select('word_id,status').eq('user_id', user.id)
        records = (recordData ?? []) as WordRecord[]
      }

      const statusMap = new Map(records.map((record) => [record.word_id, record.status]))
      const assets: WordAsset[] = normalizedWords.map((word) => {
        const status = statusMap.get(word.id) ?? 'new'
        return {
          id: word.id,
          word: word.word,
          category: word.category ?? 'general',
          tier: word.tier ?? selectedWordTier,
          status,
          difficultyWeight: difficultyFromCategory(word.category),
          masteryLevel: masteryFromStatus(status),
        }
      })

      const coreIds = normalizedAllWords.filter((word) => (word.tier ?? 'full') === 'core').map((word) => word.id)
      const fullIds = normalizedAllWords.filter((word) => (word.tier ?? 'full') === 'full').map((word) => word.id)
      setCompletion({
        core: buildTierCompletion(coreIds, statusMap),
        full: buildTierCompletion(fullIds, statusMap),
      })

      const gdp = calcGDP(assets)
      const reviewDebt = assets.filter((asset) => asset.status !== 'known').length
      syncWordAssets(assets)
      syncVocabularyGDP(gdp, buildGdpHistory(gdp))
      updateReviewDeficit(reviewDebt)
      setLoading(false)
    }

    void loadWords()
  }, [selectedExam, selectedWordTier, syncVocabularyGDP, syncWordAssets, updateReviewDeficit])

  async function persistIfLoggedIn(eventType: string, payload: Record<string, unknown>) {
    if (!userId) return
    try {
      await saveStudyModeProfile(userId)
      await logStudyModeEvent(userId, eventType, 'words', payload)
    } catch (error) {
      const details = describeStudyModeError(error)
      console.error(`Failed to persist study mode event: ${eventType}`, details, error)
      setNotice(`本地战情状态已更新，但 Supabase 同步失败：${details}。请先执行最新 supabase/schema.sql。`)
    }
  }

  async function handleBriefingComplete() {
    setHasSeenBriefing(true)
    await persistIfLoggedIn('briefing_seen', { hasSeenBriefing: true })
  }

  async function handleCampaignSelect(exam: ExamType) {
    const result = initializeCampaign(exam)
    if (!result.ok) {
      setNotice(result.reason ?? '战略改向失败。')
      return
    }
    setNotice(`已签署 ${exam === 'cet4' ? 'CET-4 基础建设' : exam === 'cet6' ? 'CET-6 全面扩张' : '考研英语 核心攻坚'} 动员令。`)
    await persistIfLoggedIn('campaign_selected', { exam })
  }

  async function handleLawToggle(lawKey: LawKey) {
    const result = enactLaw(lawKey)
    setNotice(result.ok ? '法案状态已更新，Buff 已写入全局战备状态。' : result.reason ?? '法案签署失败。')
    if (result.ok) await persistIfLoggedIn('law_toggled', { lawKey, active: !laws[lawKey] })
  }

  async function handleFinishReading() {
    const result = tracker.finishReading(wordCount, correctAnswers, totalQuestions)
    setLatestAssessment(result)
    if (!result.warning.isSuspicious) {
      syncSkillBalance({ reading: Math.min(100, Math.round(skillBalance.reading + result.contributionScore / 10)) })
      updateReviewDeficit(Math.max(0, reviewDeficit - 1))
      await persistIfLoggedIn('reading_assessment', { wpm: result.wpm, accuracy: result.accuracy, contributionScore: result.contributionScore })
    }
  }

  async function updateWordStatus(wordId: number, status: WordRecord['status']) {
    if (!userId) {
      setNotice('当前为游客模式，登录后可同步词汇 GDP 与复习状态。')
      return
    }

    const supabase = createClient()
    await supabase.from('word_records').upsert({ user_id: userId, word_id: wordId, status, updated_at: new Date().toISOString() }, { onConflict: 'user_id,word_id' })

    const nextAssets = wordAssets.map((asset) => (asset.id === wordId ? { ...asset, status, masteryLevel: masteryFromStatus(status) } : asset))
    const nextGDP = calcGDP(nextAssets)

    syncWordAssets(nextAssets)
    syncVocabularyGDP(nextGDP, buildGdpHistory(nextGDP))
    updateReviewDeficit(nextAssets.filter((asset) => asset.status !== 'known').length)
    setNotice('词汇状态已同步，国家 GDP 与复习赤字已重新计算。')
    await persistIfLoggedIn('word_status_updated', { wordId, status, nextGDP, tier: selectedWordTier })
  }

  const showBriefing = !hasSeenBriefing
  const showSelection = hasSeenBriefing && !selectedExam
  const showTierCommand = !!selectedExam && !hasChosenWordTier
  const currentTierMeta = tierCopy[selectedWordTier]

  return (
    <div className="space-y-8 pb-10">
      <MissionBriefingModal open={showBriefing} onComplete={handleBriefingComplete} />
      <SelectionModal open={showSelection} onSelect={handleCampaignSelect} currentExam={selectedExam} />

      {showTierCommand ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/85 px-4 backdrop-blur-md">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="glass-strong w-full max-w-5xl rounded-[2rem] border border-cyan-400/15 p-8">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-cyan-300/80">Vocabulary Command</p>
                <h2 className="mt-2 text-3xl font-black text-slate-50">签署词汇战区指令</h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400">在进入 {examLabel || '当前战略方向'} 的词汇财政部前，请先确认本轮调用的是核心词汇还是总词汇资产池。</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">当前主战方向：{examLabel || '待签署'}</div>
            </div>

            <div className="mt-8 grid gap-5 lg:grid-cols-2">
              {(['core', 'full'] as WordTier[]).map((tier) => {
                const meta = tierCopy[tier]
                const stat = completion[tier]
                return (
                  <button
                    key={tier}
                    type="button"
                    onClick={() => setWordTier(tier)}
                    className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6 text-left transition hover:-translate-y-1 hover:border-cyan-300/20 hover:bg-cyan-300/10"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <div className="text-sm font-semibold text-cyan-100">{meta.label}</div>
                        <div className="mt-2 text-2xl font-black text-slate-50">{meta.title}</div>
                      </div>
                      <div className="rounded-full border border-cyan-300/15 bg-cyan-300/10 px-3 py-1 text-xs text-cyan-100">进入战区</div>
                    </div>
                    <p className="mt-4 text-sm leading-7 text-slate-400">{meta.description}</p>
                    <div className="mt-5 rounded-2xl border border-white/8 bg-slate-950/40 p-4">
                      <div className="flex items-center justify-between text-sm"><span className="text-slate-400">当前完成率</span><span className="font-semibold text-slate-100">{stat.completionRate}%</span></div>
                      <div className="mt-3 h-2 rounded-full bg-white/5"><div className="h-2 rounded-full bg-cyan-300" style={{ width: `${stat.completionRate}%` }} /></div>
                      <div className="mt-3 flex items-center justify-between text-xs text-slate-500"><span>掌握 {stat.known} / {stat.total}</span><span>推进中 {stat.learning}</span></div>
                    </div>
                  </button>
                )
              })}
            </div>
          </motion.div>
        </div>
      ) : null}

      <WarRoomDashboard
        examLabel={examLabel}
        daysToExam={daysToExam}
        vocabularyGDP={vocabularyGDP}
        administrativePower={administrativePower}
        reviewDeficit={reviewDeficit}
        gdpHistory={gdpHistory.length ? gdpHistory : buildGdpHistory(Math.max(vocabularyGDP, 1200))}
        skillBalance={skillBalance}
        activeBuffs={activeBuffs}
        readingOps={{
          elapsedSeconds: tracker.elapsedSeconds,
          isTracking: tracker.isTracking,
          wordCount,
          correctAnswers,
          totalQuestions,
          onWordCountChange: setWordCount,
          onCorrectAnswersChange: setCorrectAnswers,
          onTotalQuestionsChange: setTotalQuestions,
          onStart: tracker.startTracking,
          onFinish: handleFinishReading,
          latestAssessment: latestAssessment
            ? {
                wpm: latestAssessment.wpm,
                accuracy: latestAssessment.accuracy,
                contributionScore: latestAssessment.contributionScore,
                warningMessage: latestAssessment.warning.message,
                isSuspicious: latestAssessment.warning.isSuspicious,
              }
            : null,
        }}
      />

      <StrategyLawPanel laws={laws} administrativePower={administrativePower} onToggle={handleLawToggle} notice={notice} />

      <section className="glass rounded-[1.75rem] border border-white/10 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-emerald-300/80">Vocabulary Assets</p>
            <h2 className="mt-2 text-2xl font-black text-slate-50">词汇 GDP 资产池</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-400">进入词汇部后可自由切换核心词汇与总词汇，两套词库按当前主战方向分别调度。</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">当前资产 {wordAssets.length} 项</div>
        </div>

        <div className="mt-6 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="grid gap-3 sm:grid-cols-2">
            {(['core', 'full'] as WordTier[]).map((tier) => {
              const active = selectedWordTier === tier
              const meta = tierCopy[tier]
              const stat = completion[tier]
              return (
                <button
                  key={tier}
                  type="button"
                  onClick={() => setWordTier(tier)}
                  className="rounded-[1.5rem] border p-5 text-left transition"
                  style={{
                    borderColor: active ? 'rgba(34,211,238,0.32)' : 'rgba(255,255,255,0.08)',
                    background: active ? 'rgba(34,211,238,0.12)' : 'rgba(255,255,255,0.04)',
                  }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-cyan-100">{meta.label}</div>
                      <div className="mt-2 text-xl font-black text-slate-50">{meta.title}</div>
                    </div>
                    <div className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300">{active ? '当前战区' : '切换'}</div>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-slate-400">{meta.description}</p>
                  <div className="mt-4 flex items-center justify-between text-xs text-slate-500"><span>掌握 {stat.known} / {stat.total}</span><span>{stat.completionRate}%</span></div>
                </button>
              )
            })}
          </div>
          <div className="rounded-[1.5rem] border border-white/8 bg-white/5 p-5">
            <div className="text-xs uppercase tracking-[0.25em] text-slate-500">Current Deployment</div>
            <div className="mt-3 text-2xl font-black text-slate-50">{currentTierMeta.label}</div>
            <div className="mt-3 text-sm leading-7 text-slate-400">当前词汇部门将优先载入 {examLabel || '当前战略方向'} 下的 {currentTierMeta.label}。</div>
            <div className="mt-4 space-y-3 rounded-2xl border border-cyan-300/15 bg-cyan-300/10 px-4 py-4 text-sm text-cyan-100">
              <div className="flex items-center justify-between"><span>当前完成率</span><span>{completion[selectedWordTier].completionRate}%</span></div>
              <div className="flex items-center justify-between"><span>掌握词汇</span><span>{completion[selectedWordTier].known} / {completion[selectedWordTier].total}</span></div>
              <div className="flex items-center justify-between"><span>推进中</span><span>{completion[selectedWordTier].learning}</span></div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="mt-8 rounded-2xl border border-white/8 bg-white/5 p-8 text-center text-slate-400">正在接入词汇资产库...</div>
        ) : words.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-white/8 bg-white/5 p-8 text-center text-slate-400">当前战区暂无词汇资产，请先完成带 `tier` 字段的词库导入。</div>
        ) : (
          <div className="mt-6 grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {words.slice(0, 12).map((word) => {
              const asset = wordAssets.find((item) => item.id === word.id)
              const status = asset?.status ?? 'new'
              return (
                <div key={word.id} className="rounded-[1.5rem] border border-white/8 bg-white/5 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-xl font-black text-slate-50">{word.word}</h3>
                      <p className="mt-1 text-sm text-slate-500">{word.phonetic ?? 'phonetic pending'}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs text-cyan-100">{categoryLabels[word.category ?? ''] ?? '通用'}</span>
                      <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs text-emerald-100">{tierCopy[word.tier ?? selectedWordTier].label}</span>
                    </div>
                  </div>
                  <p className="mt-4 min-h-12 text-sm leading-6 text-slate-300">{word.meaning ?? '暂无释义'}</p>
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    {(['new', 'learning', 'known'] as const).map((nextStatus) => (
                      <button
                        key={nextStatus}
                        type="button"
                        onClick={() => updateWordStatus(word.id, nextStatus)}
                        className="rounded-xl border px-3 py-2 text-xs font-semibold transition"
                        style={{
                          borderColor: status === nextStatus ? 'rgba(34,211,238,0.45)' : 'rgba(255,255,255,0.08)',
                          background: status === nextStatus ? 'rgba(34,211,238,0.16)' : 'rgba(255,255,255,0.04)',
                          color: status === nextStatus ? '#cffafe' : '#94a3b8',
                        }}
                      >
                        {nextStatus === 'new' ? '未学' : nextStatus === 'learning' ? '推进' : '掌握'}
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
