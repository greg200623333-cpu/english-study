import { createClient } from '@/lib/supabase/client'
import { getStudyModeSnapshot, useStudyModeStore, type StudyModeSnapshot } from '@/stores/useStudyModeStore'

export type TrendRow = {
  day: string
  quiz_attempts: number
  essay_submissions: number
  events: number
  avg_quiz_accuracy: number | null
  gdp_gain: number
}

export type WinRateRow = {
  category: string
  quiz_type: string
  attempts: number
  wins: number
  win_rate: number | null
}

export type LawRoiRow = {
  law_key: string
  toggle_count: number
  currently_active: boolean
  estimated_memory_bonus_pct: number
  estimated_review_efficiency_pct: number
  estimated_focus_bonus_pct: number
  estimated_gdp_bonus_pct: number
}

export async function loadStudyModeProfile(userId: string) {
  const supabase = createClient()
  const { data, error } = await supabase.from('study_mode_profiles').select('*').eq('user_id', userId).maybeSingle()
  if (error) throw error
  return data
}

export async function saveStudyModeProfile(userId: string) {
  const supabase = createClient()
  const snapshot = getStudyModeSnapshot(useStudyModeStore.getState())
  const payload = buildProfilePayload(userId, snapshot)
  const { error } = await supabase.from('study_mode_profiles').upsert(payload, { onConflict: 'user_id' })
  if (error) throw error
}

export async function logStudyModeEvent(userId: string, eventType: string, source: string, payload: Record<string, unknown>) {
  const supabase = createClient()
  const { error } = await supabase.from('study_mode_events').insert({ user_id: userId, event_type: eventType, source, payload })
  if (error) throw error
}

export async function fetchStudyModeAnalytics(userId: string) {
  const supabase = createClient()
  const [trendRes, winRateRes, lawRoiRes] = await Promise.all([
    supabase.rpc('get_study_mode_7d_trends', { target_user: userId }),
    supabase.rpc('get_study_mode_type_win_rates', { target_user: userId }),
    supabase.rpc('get_study_mode_law_roi', { target_user: userId }),
  ])

  if (trendRes.error) throw trendRes.error
  if (winRateRes.error) throw winRateRes.error
  if (lawRoiRes.error) throw lawRoiRes.error

  return { trends: (trendRes.data ?? []) as TrendRow[], winRates: (winRateRes.data ?? []) as WinRateRow[], lawRoi: (lawRoiRes.data ?? []) as LawRoiRow[] }
}

export function applyRemoteStudyModeProfile(profile: {
  has_seen_briefing?: boolean
  selected_exam?: StudyModeSnapshot['selectedExam']
  exam_label?: string
  days_to_exam?: number
  administrative_power?: number
  base_administrative_power?: number
  vocabulary_gdp?: number
  baseline_wpm?: number
  skill_balance?: StudyModeSnapshot['skillBalance']
  review_deficit?: number
  laws?: StudyModeSnapshot['laws']
  active_buffs?: StudyModeSnapshot['activeBuffs']
  gdp_history?: StudyModeSnapshot['gdpHistory']
  last_briefing_at?: string | null
}) {
  useStudyModeStore.getState().hydrateProgress({
    hasSeenBriefing: profile.has_seen_briefing ?? false,
    selectedExam: profile.selected_exam ?? null,
    examLabel: profile.exam_label ?? '',
    daysToExam: profile.days_to_exam ?? 0,
    administrativePower: profile.administrative_power ?? 0,
    baseAdministrativePower: profile.base_administrative_power ?? 0,
    vocabularyGDP: profile.vocabulary_gdp ?? 0,
    baselineWpm: profile.baseline_wpm ?? 0,
    skillBalance: profile.skill_balance ?? { listening: 0, speaking: 0, reading: 0, writing: 0 },
    reviewDeficit: profile.review_deficit ?? 0,
    laws: profile.laws ?? { morningReading: false, deficitFreeze: false, nightReview: false, focusBudget: false },
    activeBuffs: profile.active_buffs ?? { memoryRate: 0, reviewEfficiency: 0, focusRate: 0, gdpBonus: 0 },
    gdpHistory: profile.gdp_history ?? [],
    lastBriefingAt: profile.last_briefing_at ?? null,
  })
}

function buildProfilePayload(userId: string, snapshot: StudyModeSnapshot) {
  return {
    user_id: userId,
    has_seen_briefing: snapshot.hasSeenBriefing,
    selected_exam: snapshot.selectedExam,
    exam_label: snapshot.examLabel,
    days_to_exam: snapshot.daysToExam,
    administrative_power: snapshot.administrativePower,
    base_administrative_power: snapshot.baseAdministrativePower,
    vocabulary_gdp: snapshot.vocabularyGDP,
    baseline_wpm: snapshot.baselineWpm,
    skill_balance: snapshot.skillBalance,
    review_deficit: snapshot.reviewDeficit,
    laws: snapshot.laws,
    active_buffs: snapshot.activeBuffs,
    gdp_history: snapshot.gdpHistory,
    last_briefing_at: snapshot.lastBriefingAt,
    updated_at: new Date().toISOString(),
  }
}
