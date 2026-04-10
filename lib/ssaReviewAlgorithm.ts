/** Stability threshold for graduation to permanent mastery */
export const GRADUATION_STABILITY = 365


export type ReviewRating = 'perfect' | 'good' | 'hard' | 'forgot'

export interface WordReviewState {
  wordId: number
  stability: number   // days until forgetting (starts at 1)
  difficulty: number  // 1.0 (easy) to 3.0 (hard)
  last_review: number // timestamp ms
  next_review: number // timestamp ms
}

export interface SessionRecord {
  wordId: number
  stability: number
  difficulty: number
  last_review: number
  response_time: number            // ms to flip card (Space key)
  rating: ReviewRating
  manual_override: boolean         // user pressed K to downgrade
  synced: boolean
}

/**
 * Determine rating from response time (ms to Space flip)
 * Can be overridden by manual K press → 'hard'
 */
export function rateFromResponseTime(ms: number): ReviewRating {
  if (ms < 1200) return 'perfect'
  if (ms < 3000) return 'good'
  if (ms < 5000) return 'hard'
  return 'forgot'
}

/**
 * Core SM-2 variant: compute new stability + difficulty
 */
export function calculateNextReview(
  current: Pick<WordReviewState, 'stability' | 'difficulty'>,
  rating: ReviewRating,
): { stability: number; difficulty: number; next_review: number } {
  const now = Date.now()
  let { stability, difficulty } = current

  switch (rating) {
    case 'perfect':
      stability = stability * 4
      difficulty = Math.max(1.0, difficulty - 0.15)
      break
    case 'good':
      stability = stability * 2
      difficulty = Math.max(1.0, difficulty - 0.05)
      break
    case 'hard':
      stability = Math.min(stability * 1.2, 30)
      difficulty = Math.min(3.0, difficulty + 0.2)
      break
    case 'forgot':
      stability = 0.1
      difficulty = Math.min(3.0, difficulty + 0.4)
      break
  }

  stability = Number(stability.toFixed(2))
  difficulty = Number(difficulty.toFixed(2))
  const next_review = now + stability * 24 * 60 * 60 * 1000

  return { stability, difficulty, next_review }
}

/** Initial review state for a brand-new word */
export function initialReviewState(wordId: number): WordReviewState {
  const now = Date.now()
  return {
    wordId,
    stability: 1,
    difficulty: 1.5,
    last_review: now,
    next_review: now, // due immediately
  }
}

/** Is a word critical? (overdue > 12 hours) */
export function isCritical(state: WordReviewState): boolean {
  return Date.now() > state.next_review + 12 * 60 * 60 * 1000
}

/** Is a word due for review? */
export function isDue(state: WordReviewState): boolean {
  return Date.now() >= state.next_review
}
