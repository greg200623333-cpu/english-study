'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { OnboardingBriefingModal } from '@/components/study-mode/OnboardingBriefingModal'
import { SelectionModal } from '@/components/study-mode/SelectionModal'
import { type ExamType, useStudyModeStore } from '@/stores/useStudyModeStore'
import { useSession } from '@/lib/useSession'
import { loadStudyModeProfile, applyRemoteStudyModeProfile } from '@/lib/studyModePersistence'

export function HomeOnboardingFlow() {
  const router = useRouter()
  const { session, loading: sessionLoading } = useSession()
  const { hasSeenBriefing, selectedExam, setHasSeenBriefing, initializeCampaign, _hasHydrated } = useStudyModeStore()
  const [showBriefing, setShowBriefing] = useState(false)
  const [showSelection, setShowSelection] = useState(false)
  const [profileLoaded, setProfileLoaded] = useState(false)
  const [autoStart, setAutoStart] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('onboarding') === '1') setAutoStart(true)
  }, [])

  useEffect(() => {
    async function loadUserProfile() {
      if (!_hasHydrated) return
      if (!session?.id) { setProfileLoaded(true); return }

      try {
        const remoteProfile = await loadStudyModeProfile(session.id)
        if (remoteProfile) {
          applyRemoteStudyModeProfile(remoteProfile)
        }
      } catch (error) {
        console.error('Failed to load study mode profile:', error)
      } finally {
        setProfileLoaded(true)
      }
    }

    loadUserProfile()
  }, [session?.id, _hasHydrated])

  // Auto-trigger onboarding after registration redirect
  useEffect(() => {
    if (!autoStart || sessionLoading || !_hasHydrated || !profileLoaded) return
    if (!session) { router.push('/login'); return }
    handleStart()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart, sessionLoading, _hasHydrated, profileLoaded, session])

  /**
   * AI辅助调试：DeepSeek-Coder，2026-04-10
   * 用途：新用户动员令流程分流（已看简报走选词书，未看简报走签署流程）
   * 采纳率：约10%（参考了状态数据穿透的排查思路）
   */
  function handleStart() {
    if (hasSeenBriefing) {
      setShowSelection(true)
    } else {
      setShowBriefing(true)
    }
  }

  function handleBriefingComplete() {
    setHasSeenBriefing(true)
    setShowBriefing(false)
    setShowSelection(true)
  }

  function handleExamSelect(exam: ExamType) {
    initializeCampaign(exam)
    setShowSelection(false)
    router.push('/dashboard')
  }

  async function handleStartWithHydrationCheck() {
    if (sessionLoading || !_hasHydrated || !profileLoaded) {
      requestAnimationFrame(handleStartWithHydrationCheck)
      return
    }

    if (!session) {
      // Check if there's a stored username from previous login
      const storedUsername = localStorage.getItem('last_username')
      if (storedUsername) {
        router.push(`/login?username=${encodeURIComponent(storedUsername)}`)
      } else {
        router.push('/login')
      }
      return
    }

    if (hasSeenBriefing && selectedExam) {
      router.push('/dashboard')
      return
    }
    handleStart()
  }

  return (
    <>
      <button
        type="button"
        onClick={handleStartWithHydrationCheck}
        className="btn-glow rounded-2xl px-8 py-4 text-lg font-bold text-white"
      >
        进入学习模式
      </button>

      <OnboardingBriefingModal open={showBriefing} onComplete={handleBriefingComplete} />

      <SelectionModal
        open={showSelection}
        onSelect={handleExamSelect}
        redirectToSsa={false}
      />
    </>
  )
}
