'use client'

import { useEffect, useState } from 'react'
import { MissionBriefingModal } from '@/components/study-mode/MissionBriefingModal'
import { SelectionModal } from '@/components/study-mode/SelectionModal'
import { StrategyLawPanel } from '@/components/study-mode/StrategyLawPanel'
import { WarRoomDashboard } from '@/components/study-mode/WarRoomDashboard'
import { useReadingTracker, type ReadingAssessment } from '@/hooks/useReadingTracker'
import { createClient } from '@/lib/supabase/client'
import { applyRemoteStudyModeProfile, loadStudyModeProfile, logStudyModeEvent, saveStudyModeProfile } from '@/lib/studyModePersistence'
import { calcGDP } from '@/utils/calcGDP'
import { type ExamType, type LawKey, type WordAsset, useStudyModeStore } from '@/stores/useStudyModeStore'

type Word = {
  id: number
  word: string
  phonetic: string | null
  meaning: string | null
  example: string | null
  category: string | null
}

type WordRecord = {
  word_id: number
  status: 'new' | 'learning' | 'known'
}

const categoryLabels: Record<string, string> = {
  cet4: '四级',
  cet6: '六级',
  kaoyan: '考研',
  kaoyan1: '考研一',
  kaoyan2: '考研二',
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

export function StudyModeShell() {
  const {
    hasSeenBriefing,
    selectedExam,
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
  const tracker = useReadingTracker()

  useEffect(() => {
    async function loadWords() {
      setLoading(true)
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      setUserId(user?.id ?? null)

      if (user) {
        const remoteProfile = await loadStudyModeProfile(user.id).catch(() => null)
        if (remoteProfile) applyRemoteStudyModeProfile(remoteProfile)
      }

      const { data: wordData } = await supabase.from('words').select('*').order('id')
      const normalizedWords = (wordData ?? []) as Word[]
      setWords(normalizedWords)

      let records: WordRecord[] = []
      if (user) {
        const { data: recordData } = await supabase.from('word_records').select('word_id,status').eq('user_id', user.id)
        records = (recordData ?? []) as WordRecord[]
      }

      const recordMap = new Map(records.map((record) => [record.word_id, record.status]))
      const assets: WordAsset[] = normalizedWords.map((word) => {
        const status = recordMap.get(word.id) ?? 'new'
        return { id: word.id, word: word.word, category: word.category ?? 'general', status, difficultyWeight: difficultyFromCategory(word.category), masteryLevel: masteryFromStatus(status) }
      })

      const gdp = calcGDP(assets)
      const reviewDebt = assets.filter((asset) => asset.status !== 'known').length
      syncWordAssets(assets)
      if (gdp > 0) syncVocabularyGDP(gdp, buildGdpHistory(gdp))
      updateReviewDeficit(reviewDebt)
      setLoading(false)
    }
    loadWords()
  }, [syncVocabularyGDP, syncWordAssets, updateReviewDeficit])

  async function persistIfLoggedIn(eventType: string, payload: Record<string, unknown>) {
    if (!userId) return
    try {
      await saveStudyModeProfile(userId)
      await logStudyModeEvent(userId, eventType, 'words', payload)
    } catch (error) {
      console.error(`Failed to persist study mode event: ${eventType}`, error)
      setNotice('本地战情状态已更新，但 Supabase 同步失败。请先执行最新 supabase/schema.sql。')
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

    const nextAssets = wordAssets.map((asset) => asset.id === wordId ? { ...asset, status, masteryLevel: masteryFromStatus(status) } : asset)
    const nextGDP = calcGDP(nextAssets)

    syncWordAssets(nextAssets)
    syncVocabularyGDP(nextGDP, buildGdpHistory(nextGDP))
    updateReviewDeficit(nextAssets.filter((asset) => asset.status !== 'known').length)
    setNotice('词汇状态已同步，国家 GDP 与复习赤字已重新计算。')
    await persistIfLoggedIn('word_status_updated', { wordId, status, nextGDP })
  }

  const showBriefing = !hasSeenBriefing
  const showSelection = hasSeenBriefing && !selectedExam

  return (
    <div className="space-y-8 pb-10">
      <MissionBriefingModal open={showBriefing} onComplete={handleBriefingComplete} />
      <SelectionModal open={showSelection} onSelect={handleCampaignSelect} currentExam={selectedExam} />

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
          latestAssessment: latestAssessment ? { wpm: latestAssessment.wpm, accuracy: latestAssessment.accuracy, contributionScore: latestAssessment.contributionScore, warningMessage: latestAssessment.warning.message, isSuspicious: latestAssessment.warning.isSuspicious } : null,
        }}
      />

      <StrategyLawPanel laws={laws} administrativePower={administrativePower} onToggle={handleLawToggle} notice={notice} />

      <section className="glass rounded-[1.75rem] border border-white/10 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-emerald-300/80">Vocabulary Assets</p>
            <h2 className="mt-2 text-2xl font-black text-slate-50">词汇 GDP 资产池</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-400">已复用当前项目 Supabase 的 words 与 word_records，并增加 study_mode_profiles / study_mode_events 作为战情同步层。</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">当前资产 {wordAssets.length} 项</div>
        </div>

        {loading ? (
          <div className="mt-8 rounded-2xl border border-white/8 bg-white/5 p-8 text-center text-slate-400">正在接入词汇资产库...</div>
        ) : words.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-white/8 bg-white/5 p-8 text-center text-slate-400">暂无词汇资产，请先在后台或生成接口中写入 words 数据。</div>
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
                    <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs text-cyan-100">{categoryLabels[word.category ?? ''] ?? '通用'}</span>
                  </div>
                  <p className="mt-4 min-h-12 text-sm leading-6 text-slate-300">{word.meaning ?? '暂无释义'}</p>
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    {(['new', 'learning', 'known'] as const).map((nextStatus) => (
                      <button key={nextStatus} type="button" onClick={() => updateWordStatus(word.id, nextStatus)} className="rounded-xl border px-3 py-2 text-xs font-semibold transition" style={{ borderColor: status === nextStatus ? 'rgba(34,211,238,0.45)' : 'rgba(255,255,255,0.08)', background: status === nextStatus ? 'rgba(34,211,238,0.16)' : 'rgba(255,255,255,0.04)', color: status === nextStatus ? '#cffafe' : '#94a3b8' }}>
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
