'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

type PlaybackState = 'idle' | 'loading' | 'playing' | 'paused'

// Split text into sentences for chunked playback
function splitIntoSentences(text: string): string[] {
  // Split by common sentence endings, keeping punctuation
  const sentences = text
    .split(/(?<=[.!?;])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 0)

  // Further split sentences that are too long (>100 chars for Youdao API limit)
  const chunks: string[] = []
  for (const sentence of sentences) {
    if (sentence.length <= 100) {
      chunks.push(sentence)
    } else {
      // Split long sentences by commas or at word boundaries
      const parts = sentence.split(/,\s+/)
      for (const part of parts) {
        if (part.length <= 100) {
          chunks.push(part)
        } else {
          // Split at word boundaries if still too long
          const words = part.split(/\s+/)
          let currentChunk = ''
          for (const word of words) {
            if ((currentChunk + ' ' + word).length <= 100) {
              currentChunk = currentChunk ? currentChunk + ' ' + word : word
            } else {
              if (currentChunk) chunks.push(currentChunk)
              currentChunk = word
            }
          }
          if (currentChunk) chunks.push(currentChunk)
        }
      }
    }
  }

  return chunks.filter(c => c.length > 0)
}

export function useYoudaoTTS() {
  const [state, setState] = useState<PlaybackState>('idle')
  const [speed, setSpeed] = useState(0.9)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const queueRef = useRef<string[]>([])
  const currentIndexRef = useRef(0)
  const abortControllerRef = useRef<AbortController | null>(null)

  const cleanup = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = ''
      audioRef.current = null
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    queueRef.current = []
    currentIndexRef.current = 0
  }, [])

  const playNextChunk = useCallback(async () => {
    if (currentIndexRef.current >= queueRef.current.length) {
      setState('idle')
      cleanup()
      return
    }

    const chunk = queueRef.current[currentIndexRef.current]
    setState('loading')

    try {
      abortControllerRef.current = new AbortController()
      const response = await fetch(`/api/tts?word=${encodeURIComponent(chunk)}`, {
        signal: abortControllerRef.current.signal,
      })

      if (!response.ok) {
        console.error('TTS API error:', response.status)
        // Try next chunk instead of stopping completely
        currentIndexRef.current++
        if (currentIndexRef.current < queueRef.current.length) {
          playNextChunk()
        } else {
          setState('idle')
          cleanup()
        }
        return
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)

      const audio = new Audio(url)
      audio.playbackRate = speed
      audioRef.current = audio

      audio.onended = () => {
        URL.revokeObjectURL(url)
        currentIndexRef.current++
        playNextChunk()
      }

      audio.onerror = (err) => {
        console.error('Audio playback error:', err)
        URL.revokeObjectURL(url)
        // Try next chunk
        currentIndexRef.current++
        if (currentIndexRef.current < queueRef.current.length) {
          playNextChunk()
        } else {
          setState('idle')
          cleanup()
        }
      }

      await audio.play()
      setState('playing')
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        console.error('TTS fetch error:', err)
      }
      setState('idle')
      cleanup()
    }
  }, [speed, cleanup])

  const speak = useCallback((text: string, playbackSpeed: number = 0.9) => {
    cleanup()
    setSpeed(playbackSpeed)

    const sentences = splitIntoSentences(text)
    queueRef.current = sentences
    currentIndexRef.current = 0

    playNextChunk()
  }, [cleanup, playNextChunk])

  const pause = useCallback(() => {
    if (audioRef.current && state === 'playing') {
      audioRef.current.pause()
      setState('paused')
    }
  }, [state])

  const resume = useCallback(() => {
    if (audioRef.current && state === 'paused') {
      audioRef.current.play()
      setState('playing')
    }
  }, [state])

  const stop = useCallback(() => {
    setState('idle')
    cleanup()
  }, [cleanup])

  const changeSpeed = useCallback((newSpeed: number) => {
    setSpeed(newSpeed)
    if (audioRef.current) {
      audioRef.current.playbackRate = newSpeed
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup()
    }
  }, [cleanup])

  return {
    speak,
    pause,
    resume,
    stop,
    changeSpeed,
    state,
    speed,
    speaking: state === 'playing' || state === 'loading',
  }
}
