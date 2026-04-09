import { getCurrentUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/client'
import { getStudyModeSnapshot, useStudyModeStore, type StudyModeSnapshot } from '@/stores/useStudyModeStore'

type SupabaseLikeError = {
  message?: string
  code?: string
  details?: string
  hint?: string
  name?: string
}

function extractMissingColumn(error: unknown) {
  if (!error || typeof error !== 'object') return null
  const value = error as SupabaseLikeError
  const message = value.message ?? ''
  const match = message.match(/Could not find the '([^']+)' column/)
  return match?.[1] ?? null
}

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

export function describeStudyModeError(error: unknown) {
  if (!error) return 'Unknown Supabase error'
  if (typeof error === 'string') return error
  if (error instanceof Error) return error.message
  if (typeof error === 'object') {
    const value = error as SupabaseLikeError
    const parts = [
      value.message ? `message=${value.message}` : '',
      value.code ? `code=${value.code}` : '',
      value.details ? `details=${value.details}` : '',
      value.hint ? `hint=${value.hint}` : '',
      value.name ? `name=${value.name}` : '',
    ].filter(Boolean)

    if (parts.length) return parts.join(' | ')

    try {
      return JSON.stringify(error)
    } catch {
      return Object.prototype.toString.call(error)
    }
  }
  return String(error)
}

async function ensureProfileRow(_userId: string) {
  // profiles row is created at registration; nothing to do here
}

export async function loadStudyModeProfile(userId: string) {
  const supabase = createClient()
  const { data, error } = await supabase.from('study_mode_profiles').select('*').eq('user_id', userId).maybeSingle()
  if (error) throw new Error(error.message)
  return data
}

export async function saveStudyModeProfile(userId: string) {
  await ensureProfileRow(userId)

  const supabase = createClient()
  const snapshot = getStudyModeSnapshot(useStudyModeStore.getState())
  const payload = buildProfilePayload(userId, snapshot) as Record<string, unknown>
  const mutablePayload: Record<string, unknown> = { ...payload }

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const { error } = await supabase.from('study_mode_profiles').upsert(mutablePayload, { onConflict: 'user_id' })
    if (!error) return

    if (error.code !== 'PGRST204') throw new Error(error.message)

    const missingColumn = extractMissingColumn(error)
    if (!missingColumn || !(missingColumn in mutablePayload)) throw new Error(error.message)

    delete mutablePayload[missingColumn]
  }

  throw new Error('Failed to persist study_mode_profiles after schema-compatible retries')
}

export async function logStudyModeEvent(userId: string, eventType: string, source: string, payload: Record<string, unknown>) {
  await ensureProfileRow(userId)

  const supabase = createClient()
  const { error } = await supabase.from('study_mode_events').insert({ user_id: userId, event_type: eventType, source, payload })
  if (error) throw new Error(error.message)
}

export async function fetchStudyModeAnalytics(userId: string) {
  const supabase = createClient()
  const [trendRes, winRateRes, lawRoiRes] = await Promise.all([
    supabase.rpc('get_study_mode_7d_trends', { target_user: userId }),
    supabase.rpc('get_study_mode_type_win_rates', { target_user: userId }),
    supabase.rpc('get_study_mode_law_roi', { target_user: userId }),
  ])

  if (trendRes.error) throw new Error(trendRes.error.message)
  if (winRateRes.error) throw new Error(winRateRes.error.message)
  if (lawRoiRes.error) throw new Error(lawRoiRes.error.message)

  return { trends: (trendRes.data ?? []) as TrendRow[], winRates: (winRateRes.data ?? []) as WinRateRow[], lawRoi: (lawRoiRes.data ?? []) as LawRoiRow[] }
}

export function applyRemoteStudyModeProfile(profile: {
  has_seen_briefing?: boolean
  selected_exam?: StudyModeSnapshot['selectedExam']
  selected_word_tier?: StudyModeSnapshot['selectedWordTier']
  exam_label?: string
  days_to_exam?: number
  administrative_power?: number
  base_administrative_power?: number
  base_assets?: number
  session_gains?: number
  last_session_gain?: number
  has_ssa_exchange?: boolean
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
    selectedWordTier: profile.selected_word_tier ?? 'core',
    examLabel: profile.exam_label ?? '',
    daysToExam: profile.days_to_exam ?? 0,
    administrativePower: profile.administrative_power ?? 0,
    baseAdministrativePower: profile.base_administrative_power ?? 0,
    baseAssets: profile.base_assets ?? 0,
    sessionGains: profile.has_ssa_exchange ? (profile.session_gains ?? 0) : 0,
    lastSessionGain: profile.has_ssa_exchange ? (profile.last_session_gain ?? 0) : 0,
    hasSsaExchange: profile.has_ssa_exchange ?? false,
    vocabularyGDP: profile.has_ssa_exchange ? (profile.vocabulary_gdp ?? 0) : 0,
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
    selected_word_tier: snapshot.selectedWordTier,
    exam_label: snapshot.examLabel,
    days_to_exam: snapshot.daysToExam,
    administrative_power: snapshot.administrativePower,
    base_administrative_power: snapshot.baseAdministrativePower,
    base_assets: snapshot.baseAssets,
    session_gains: snapshot.sessionGains,
    last_session_gain: snapshot.lastSessionGain,
    has_ssa_exchange: snapshot.hasSsaExchange,
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
