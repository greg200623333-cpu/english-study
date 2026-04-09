'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  type ReviewRating,
  type SessionRecord,
  type WordReviewState,
  calculateNextReview,
  initialReviewState,
  isCritical,
  isDue,
  rateFromResponseTime,
} from '@/lib/ssaReviewAlgorithm'

type WordWithReview = {
  id: number
  word: string
  phonetic: string | null
  meaning: string | null
  category: string | null
  tier: string
  status: 'new' | 'learning' | 'known'
  frequency: number
  rootHint: string
  example: string | null
  stability: number
  difficulty: number
  last_review: number
  next_review: number
}

type SessionState = {
  currentWord: WordWithReview | null
  queue: WordWithReview[]
  isFlipped: boolean
  flipTime: number | null
  rating: ReviewRating | null
  manualOverride: boolean
}

export function useSsaSession(userId: string | null, category: string, tier: string) {
  const supabase = createClient()
  const [session, setSession] = useState<SessionState>({
    currentWord: null,
    queue: [],
    isFlipped: false,
    flipTime: null,
    rating: null,
    manualOverride: false,
  })
  const [loading, setLoading] = useState(true)
  const pendingUpdatesRef = useRef<SessionRecord[]>([])
  const flipStartRef = useRef<number | null>(null)

  // Load queue on mount
  useEffect(() => {
    if (!userId) return
    void loadQueue()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, category, tier])

  // Auto-merge recovery on mount
  useEffect(() => {
    if (!userId) return
    void recoverUnsynced()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  // Batch sync every 10 words or on unmount
  useEffect(() => {
    return () => {
      void syncPendingUpdates()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadQueue = useCallback(async () => {
    if (!userId) return

    setLoading(true)
    try {
      const { data: words, error } = await supabase
        .from('words')
        .select('*')
        .eq('category', category)
        .eq('tier', tier)
        .order('id')

      if (error) throw error

      const wordsWithReview: WordWithReview[] = (words || []).map((w) => ({
        id: w.id,
        word: w.word,
        phonetic: w.phonetic,
        meaning: w.meaning,
        category: w.category,
        tier: w.tier,
        status: w.status || 'new',
        frequency: w.frequency || 75,
        rootHint: w.root_hint || inferRootHint(w.word),
        example: w.example,
        stability: w.stability || 1,
        difficulty: w.difficulty || 1.5,
        last_review: w.last_review || Date.now(),
        next_review: w.next_review || Date.now(),
      }))

      // Separate into categories
      const newWords = wordsWithReview.filter((w) => w.status === 'new')
      const dueWords = wordsWithReview.filter((w) => w.status !== 'new' && isDue({ wordId: w.id, stability: w.stability, difficulty: w.difficulty, last_review: w.last_review, next_review: w.next_review }))
      const criticalWords = dueWords.filter((w) => isCritical({ wordId: w.id, stability: w.stability, difficulty: w.difficulty, last_review: w.last_review, next_review: w.next_review }))

      // Mix strategy: 2 new + 3 old (or 1 new + 4 old if Critical > 50)
      const criticalThreshold = 50
      const [newRatio, oldRatio] = criticalWords.length > criticalThreshold ? [1, 4] : [2, 3]

      const queue: WordWithReview[] = []
      let newIndex = 0
      let dueIndex = 0

      while (newIndex < newWords.length || dueIndex < dueWords.length) {
        // Add new words
        for (let i = 0; i < newRatio && newIndex < newWords.length; i++) {
          queue.push(newWords[newIndex++])
        }
        // Add due words
        for (let i = 0; i < oldRatio && dueIndex < dueWords.length; i++) {
          queue.push(dueWords[dueIndex++])
        }
      }

      setSession((prev) => ({
        ...prev,
        queue,
        currentWord: queue[0] || null,
      }))
    } catch (err) {
      console.error('Failed to load queue:', err)
    } finally {
      setLoading(false)
    }
  }, [userId, category, tier, supabase])

  const handleFlip = useCallback(() => {
    if (!session.currentWord || session.isFlipped) return

    flipStartRef.current = Date.now()
    setSession((prev) => ({ ...prev, isFlipped: true, flipTime: Date.now() }))
  }, [session.currentWord, session.isFlipped])

  const handleConfirm = useCallback(async () => {
    if (!session.currentWord || !session.isFlipped || !userId) return

    const responseTime = flipStartRef.current ? Date.now() - flipStartRef.current : 3000
    const autoRating = rateFromResponseTime(responseTime)
    const finalRating = session.manualOverride && session.rating ? session.rating : autoRating

    const current: WordReviewState = {
      wordId: session.currentWord.id,
      stability: session.currentWord.stability,
      difficulty: session.currentWord.difficulty,
      last_review: session.currentWord.last_review,
      next_review: session.currentWord.next_review,
    }

    const { stability, difficulty, next_review } = calculateNextReview(current, finalRating)

    // Save to pending updates
    const record: SessionRecord = {
      wordId: session.currentWord.id,
      stability,
      difficulty,
      last_review: Date.now(),
      response_time: responseTime,
      rating: finalRating,
      manual_override: session.manualOverride,
      synced: false,
    }

    pendingUpdatesRef.current.push(record)

    // Backup to localStorage
    backupToLocalStorage(userId, record)

    // Batch sync if >= 10
    if (pendingUpdatesRef.current.length >= 10) {
      await syncPendingUpdates()
    }

    // Move to next word
    const nextQueue = session.queue.slice(1)
    setSession({
      currentWord: nextQueue[0] || null,
      queue: nextQueue,
      isFlipped: false,
      flipTime: null,
      rating: null,
      manualOverride: false,
    })
    flipStartRef.current = null
  }, [session, userId])

  const handleDowngrade = useCallback(() => {
    if (!session.isFlipped) return

    // Cycle through ratings: perfect -> good -> hard -> forgot -> perfect
    const cycle: ReviewRating[] = ['perfect', 'good', 'hard', 'forgot']
    const currentIndex = session.rating ? cycle.indexOf(session.rating) : -1
    const nextRating = cycle[(currentIndex + 1) % cycle.length]

    setSession((prev) => ({
      ...prev,
      rating: nextRating,
      manualOverride: true,
    }))
  }, [session.isFlipped, session.rating])

  const syncPendingUpdates = useCallback(async () => {
    if (pendingUpdatesRef.current.length === 0) return

    try {
      const updates = pendingUpdatesRef.current.map((record) => ({
        id: record.wordId,
        stability: record.stability,
        difficulty: record.difficulty,
        last_review: record.last_review,
        next_review: record.last_review + record.stability * 24 * 60 * 60 * 1000,
      }))

      for (const update of updates) {
        await supabase.from('words').update(update).eq('id', update.id)
      }

      // Mark as synced
      pendingUpdatesRef.current = []

      // Clear localStorage backup
      if (userId) {
        localStorage.removeItem(`SSA_ACTIVE_SESSION_${userId}`)
      }
    } catch (err) {
      console.error('Failed to sync pending updates:', err)
    }
  }, [supabase, userId])

  const recoverUnsynced = useCallback(async () => {
    if (!userId) return

    const key = `SSA_ACTIVE_SESSION_${userId}`
    const stored = localStorage.getItem(key)
    if (!stored) return

    try {
      const records: SessionRecord[] = JSON.parse(stored)
      const unsynced = records.filter((r) => !r.synced)

      if (unsynced.length === 0) {
        localStorage.removeItem(key)
        return
      }

      // Merge into database
      for (const record of unsynced) {
        await supabase
          .from('words')
          .update({
            stability: record.stability,
            difficulty: record.difficulty,
            last_review: record.last_review,
            next_review: record.last_review + record.stability * 24 * 60 * 60 * 1000,
          })
          .eq('id', record.wordId)
      }

      // Archive to dated backup
      const date = new Date().toISOString().split('T')[0]
      localStorage.setItem(`SSA_ARCHIVE_${userId}_${date}`, JSON.stringify(unsynced))
      localStorage.removeItem(key)
    } catch (err) {
      console.error('Failed to recover unsynced records:', err)
    }
  }, [userId, supabase])

  const backupToLocalStorage = useCallback(
    (uid: string, record: SessionRecord) => {
      const key = `SSA_ACTIVE_SESSION_${uid}`
      const stored = localStorage.getItem(key)
      const records: SessionRecord[] = stored ? JSON.parse(stored) : []
      records.push(record)
      localStorage.setItem(key, JSON.stringify(records))
    },
    []
  )

  // Keyboard handlers
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.code === 'Space') {
        event.preventDefault()
        handleFlip()
      }

      if (event.key === 'Enter' || event.key.toLowerCase() === 'j') {
        event.preventDefault()
        void handleConfirm()
      }

      if (event.key.toLowerCase() === 'k') {
        event.preventDefault()
        handleDowngrade()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleFlip, handleConfirm, handleDowngrade])

  return {
    currentWord: session.currentWord,
    queue: session.queue,
    isFlipped: session.isFlipped,
    rating: session.rating,
    manualOverride: session.manualOverride,
    loading,
    handleFlip,
    handleConfirm,
    handleDowngrade,
    syncPendingUpdates,
  }
}

function inferRootHint(word: string) {
  if (word.includes('tion')) return 'tion / action'
  if (word.includes('sist')) return 'sist / stand'
  if (word.includes('loc')) return 'loc / place'
  if (word.includes('sess')) return 'sess / hold'
  return 'lex / semantic unit'
}
