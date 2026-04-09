'use client'

import { useCallback } from 'react'
import { getCurrentUser } from '@/lib/auth'
import { describeStudyModeError, logStudyModeEvent, saveStudyModeProfile } from '@/lib/studyModePersistence'
import { useStudyModeStore, type StudyModeState } from '@/stores/useStudyModeStore'

type SkillKey = keyof StudyModeState['skillBalance']

type QuizSyncInput = {
  type: string
  category?: string
  correct: number
  total: number
  passageWordCount?: number
}

type EssaySyncInput = {
  score: number
  category: string
  wordCount: number
}

function clampSkill(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)))
}

function skillFromQuizType(type: string): SkillKey {
  if (type.startsWith('listening')) return 'listening'
  if (type.includes('reading') || type.includes('cloze') || type.includes('new_type')) return 'reading'
  if (type.includes('writing') || type.includes('translation')) return 'writing'
  return 'reading'
}

function buildHistory(currentGDP: number, nextGDP: number) {
  const start = currentGDP || Math.max(800, nextGDP * 0.88)
  return [
    { label: 'D-4', value: Math.round(start * 0.92) },
    { label: 'D-3', value: Math.round(start * 0.96) },
    { label: 'D-2', value: Math.round(start * 0.99) },
    { label: 'D-1', value: Math.round((start + nextGDP) / 2) },
    { label: 'Now', value: nextGDP },
  ]
}

async function persist(source: string, eventType: string, payload: Record<string, unknown>) {
  const user = await getCurrentUser()
  if (!user) return

  try {
    await saveStudyModeProfile(user.id)
    await logStudyModeEvent(user.id, eventType, source, payload)
  } catch (error) {
    console.error(`Failed to persist war room sync event: ${eventType}`, describeStudyModeError(error), error)
  }
}

export function useWarRoomSync() {
  const skillBalance = useStudyModeStore((state) => state.skillBalance)
  const reviewDeficit = useStudyModeStore((state) => state.reviewDeficit)
  const vocabularyGDP = useStudyModeStore((state) => state.vocabularyGDP)
  const activeBuffs = useStudyModeStore((state) => state.activeBuffs)
  const syncSkillBalance = useStudyModeStore((state) => state.syncSkillBalance)
  const updateReviewDeficit = useStudyModeStore((state) => state.updateReviewDeficit)
  const syncVocabularyGDP = useStudyModeStore((state) => state.syncVocabularyGDP)

  const syncQuizAttempt = useCallback(
    async ({ type, category, correct, total, passageWordCount = 0 }: QuizSyncInput) => {
      if (total <= 0) return

      const skill = skillFromQuizType(type)
      const accuracy = correct / total
      const difficultyFactor = category?.startsWith('kaoyan') ? 1.2 : 1
      const volumeFactor = passageWordCount > 0 ? Math.min(1.35, 1 + passageWordCount / 2200) : 1
      const buffFactor = 1 + activeBuffs.focusRate + activeBuffs.reviewEfficiency * 0.5
      const delta = (accuracy >= 0.6 ? 1.1 : 0.35) * total * difficultyFactor * volumeFactor * buffFactor

      syncSkillBalance({
        [skill]: clampSkill(skillBalance[skill] + delta),
      })

      const deficitDelta = accuracy >= 0.7 ? -Math.max(1, Math.round(total / 2)) : Math.max(1, Math.round((1 - accuracy) * total))
      updateReviewDeficit(reviewDeficit + deficitDelta)

      await persist('quiz', 'quiz_completion', {
        type,
        category,
        skill,
        correct,
        total,
        accuracy,
        passageWordCount,
      })
    },
    [activeBuffs.focusRate, activeBuffs.reviewEfficiency, reviewDeficit, skillBalance, syncSkillBalance, updateReviewDeficit]
  )

  const syncEssayCompletion = useCallback(
    async ({ score, category, wordCount }: EssaySyncInput) => {
      const normalizedScore = Math.max(0, Math.min(100, score))
      const wordFactor = wordCount >= 160 ? 1.15 : wordCount >= 100 ? 1 : 0.78
      const buffFactor = 1 + activeBuffs.focusRate
      const writingDelta = ((normalizedScore / 100) * 4.5 + 0.4) * wordFactor * buffFactor
      const nextWriting = clampSkill(skillBalance.writing + writingDelta)
      const gdpGain = Math.round((normalizedScore * 2.2 + wordCount * 0.18) * (1 + activeBuffs.gdpBonus))
      const nextGDP = vocabularyGDP + gdpGain

      syncSkillBalance({ writing: nextWriting })
      syncVocabularyGDP(nextGDP, buildHistory(vocabularyGDP, nextGDP))
      updateReviewDeficit(Math.max(0, reviewDeficit - (normalizedScore >= 75 ? 2 : 1)))

      await persist('essay', 'essay_completion', {
        category,
        score: normalizedScore,
        wordCount,
        gdpGain,
      })
    },
    [activeBuffs.focusRate, activeBuffs.gdpBonus, reviewDeficit, skillBalance.writing, syncSkillBalance, syncVocabularyGDP, updateReviewDeficit, vocabularyGDP]
  )

  return { syncQuizAttempt, syncEssayCompletion }
}




