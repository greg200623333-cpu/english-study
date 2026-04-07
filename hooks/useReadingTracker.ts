'use client'

import { useEffect, useRef, useState } from 'react'

type WarningCode = 'TOO_FAST' | 'TOO_SHORT' | 'TOO_SLOW' | 'INVALID_QUIZ'

export type ReadingAssessment = {
  elapsedSeconds: number
  wpm: number
  accuracy: number
  contributionScore: number
  warning: {
    isSuspicious: boolean
    code: WarningCode | null
    message: string
  }
}

const MIN_VALID_SECONDS = 20
const MAX_HUMAN_WPM = 1100

function buildWarning(code: WarningCode | null): ReadingAssessment['warning'] {
  switch (code) {
    case 'TOO_FAST':
      return {
        isSuspicious: true,
        code,
        message: '工程质量低下：阅读速度超出人类极限，疑似瞬拉到底。',
      }
    case 'TOO_SHORT':
      return {
        isSuspicious: true,
        code,
        message: '工程质量低下：有效阅读时长过短，本次基建数据已降权。',
      }
    case 'TOO_SLOW':
      return {
        isSuspicious: true,
        code,
        message: '基建效率异常低，请确认是否存在中断或挂机。',
      }
    case 'INVALID_QUIZ':
      return {
        isSuspicious: true,
        code,
        message: '答题数据无效，无法生成可信的阅读基建评估。',
      }
    default:
      return {
        isSuspicious: false,
        code: null,
        message: '数据可信，已计入阅读基建。',
      }
  }
}

export function useReadingTracker() {
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [isTracking, setIsTracking] = useState(false)
  const startedAtRef = useRef<number | null>(null)
  const tickRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (tickRef.current) {
        window.clearInterval(tickRef.current)
      }
    }
  }, [])

  function startTracking() {
    if (tickRef.current) {
      window.clearInterval(tickRef.current)
    }

    startedAtRef.current = Date.now()
    setElapsedSeconds(0)
    setIsTracking(true)

    tickRef.current = window.setInterval(() => {
      if (!startedAtRef.current) {
        return
      }
      setElapsedSeconds(Math.round((Date.now() - startedAtRef.current) / 1000))
    }, 1000)
  }

  function resetTracking() {
    if (tickRef.current) {
      window.clearInterval(tickRef.current)
      tickRef.current = null
    }
    startedAtRef.current = null
    setElapsedSeconds(0)
    setIsTracking(false)
  }

  function finishReading(wordCount: number, correctAnswers: number, totalQuestions: number): ReadingAssessment {
    const finalSeconds =
      startedAtRef.current != null ? Math.max(1, Math.round((Date.now() - startedAtRef.current) / 1000)) : elapsedSeconds

    if (tickRef.current) {
      window.clearInterval(tickRef.current)
      tickRef.current = null
    }

    setElapsedSeconds(finalSeconds)
    setIsTracking(false)

    if (totalQuestions <= 0 || correctAnswers < 0 || correctAnswers > totalQuestions) {
      return {
        elapsedSeconds: finalSeconds,
        wpm: 0,
        accuracy: 0,
        contributionScore: 0,
        warning: buildWarning('INVALID_QUIZ'),
      }
    }

    const minutes = finalSeconds / 60
    const rawWpm = minutes > 0 ? wordCount / minutes : 0
    const accuracy = totalQuestions > 0 ? correctAnswers / totalQuestions : 0

    let warningCode: WarningCode | null = null
    let trustFactor = 1

    if (finalSeconds < MIN_VALID_SECONDS) {
      warningCode = 'TOO_SHORT'
      trustFactor = 0.2
    } else if (rawWpm > MAX_HUMAN_WPM) {
      warningCode = 'TOO_FAST'
      trustFactor = 0.1
    } else if (rawWpm < 40) {
      warningCode = 'TOO_SLOW'
      trustFactor = 0.6
    }

    const normalizedWpm = Math.min(rawWpm / 320, 1.2)
    const contributionScore = Math.max(
      0,
      Math.round((normalizedWpm * 55 + accuracy * 45) * 100 * trustFactor) / 100
    )

    return {
      elapsedSeconds: finalSeconds,
      wpm: Math.round(rawWpm),
      accuracy: Math.round(accuracy * 100),
      contributionScore,
      warning: buildWarning(warningCode),
    }
  }

  return {
    elapsedSeconds,
    isTracking,
    startTracking,
    resetTracking,
    finishReading,
  }
}
