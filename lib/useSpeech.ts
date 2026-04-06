'use client'
import { useCallback, useEffect, useRef, useState } from 'react'

export function useSpeech() {
  const [speaking, setSpeaking] = useState(false)
  const [supported, setSupported] = useState(false)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)

  useEffect(() => {
    setSupported(typeof window !== 'undefined' && 'speechSynthesis' in window)
    return () => { window.speechSynthesis?.cancel() }
  }, [])

  const speak = useCallback((text: string, rate = 0.9, lang = 'en-US') => {
    if (!supported) return
    window.speechSynthesis.cancel()
    const utter = new SpeechSynthesisUtterance(text)
    utter.lang = lang
    utter.rate = rate
    utter.pitch = 1
    const voices = window.speechSynthesis.getVoices()
    const enVoice = voices.find(v => v.lang.startsWith('en') && v.name.toLowerCase().includes('female'))
      ?? voices.find(v => v.lang.startsWith('en-US'))
      ?? voices.find(v => v.lang.startsWith('en'))
    if (enVoice) utter.voice = enVoice
    utter.onstart = () => setSpeaking(true)
    utter.onend = () => setSpeaking(false)
    utter.onerror = () => setSpeaking(false)
    utteranceRef.current = utter
    window.speechSynthesis.speak(utter)
  }, [supported])

  const stop = useCallback(() => {
    window.speechSynthesis?.cancel()
    setSpeaking(false)
  }, [])

  return { speak, stop, speaking, supported }
}
