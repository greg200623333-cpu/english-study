import { useState, useCallback } from 'react'
import { ChatMessage, YoudaoChatSession, YoudaoDialogHistory } from '@/types/scenario'

interface UseYoudaoChatReturn {
  messages: ChatMessage[]
  isLoading: boolean
  session: YoudaoChatSession | null
  initializeChat: (topic: string) => Promise<void>
  sendMessage: (content: string) => Promise<void>
  sendAudioMessage: (audioBase64: string, voice?: string) => Promise<void>
  resetChat: () => void
}

export function useYoudaoChat(): UseYoudaoChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [session, setSession] = useState<YoudaoChatSession | null>(null)
  const initializeChat = useCallback(async (topic: string) => {
    setIsLoading(true)
    setMessages([])

    try {
      const topicResponse = await fetch('/api/portal/ai-dialog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_topic',
          topic
        })
      })

      const topicData = await topicResponse.json()

      if (topicData.code !== '0') {
        throw new Error('Failed to generate topic')
      }

      const taskId = topicData.data.taskId
      const scene = topicData.data.scene

      const dialogResponse = await fetch('/api/portal/ai-dialog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_dialog',
          taskId,
          scene,
          userLevel: '0',
          history: []
        })
      })

      const dialogData = await dialogResponse.json()

      if (dialogData.code !== '0') {
        throw new Error('Failed to generate dialog')
      }

      const aiMessage = dialogData.data.resultArr[0].result[0]

      setSession({
        taskId,
        scene,
        history: []
      })

      setMessages([
        {
          id: Date.now().toString(),
          role: 'assistant',
          content: aiMessage,
          timestamp: new Date()
        }
      ])
    } catch (error) {
      console.error('Initialize chat error:', error)
      setMessages([
        {
          id: Date.now().toString(),
          role: 'system',
          content: '初始化对话失败，请重试',
          timestamp: new Date()
        }
      ])
    } finally {
      setIsLoading(false)
    }
  }, [])

  const isEnglishInput = (text: string): boolean => {
    const cleanText = text.replace(/[\s\p{P}]/gu, '')
    if (!cleanText) return false

    const hasChinese = /[\u4e00-\u9fa5]/.test(cleanText)
    if (hasChinese) return false

    const englishChars = cleanText.match(/[a-zA-Z]/g)
    const englishRatio = englishChars ? englishChars.length / cleanText.length : 0

    return englishRatio >= 0.5
  }

  const sendMessage = useCallback(async (content: string) => {
    if (!session || !content.trim()) return

    if (!isEnglishInput(content.trim())) {
      setMessages(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'system',
          content: '请使用英文进行对话',
          timestamp: new Date()
        }
      ])
      return
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)

    try {
      const lastAiMessage = messages.filter(m => m.role === 'assistant').pop()

      const updatedHistory: YoudaoDialogHistory[] = [
        ...session.history
      ]

      if (lastAiMessage) {
        updatedHistory.push({
          speaker: 'System',
          content: lastAiMessage.content
        })
      }

      updatedHistory.push({
        speaker: 'User',
        content: content.trim()
      })

      // 调用有道 AI 生成回复
      const response = await fetch('/api/portal/ai-dialog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_dialog',
          taskId: session.taskId,
          scene: session.scene,
          userLevel: '0',
          history: updatedHistory
        })
      })

      const data = await response.json()

      if (data.code !== '0') {
        throw new Error('Failed to generate response')
      }

      const aiReply = data.data.resultArr[0].result[0]

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiReply,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])

      setSession({
        ...session,
        history: updatedHistory
      })
    } catch (error) {
      console.error('Send message error:', error)
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'system',
          content: '发送消息失败，请重试',
          timestamp: new Date()
        }
      ])
    } finally {
      setIsLoading(false)
    }
  }, [session, messages])

  const sendAudioMessage = useCallback(async (audioBase64: string, voice: string = '0') => {
    if (!session) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: '🎤 识别中...',
      timestamp: new Date(),
      audioBase64
    }

    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)

    try {
      console.log('[sendAudioMessage] Step 1: ASR recognition')
      console.log('[sendAudioMessage] Audio Base64 length:', audioBase64.length)

      const asrResponse = await fetch('/api/youdao/asr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioBase64,
          langType: 'en',
          rate: 16000,
          channel: 1,
        })
      })

      if (!asrResponse.ok) {
        throw new Error(`ASR API请求失败 (HTTP ${asrResponse.status})`)
      }

      const asrData = await asrResponse.json()
      console.log('[sendAudioMessage] ASR response:', asrData)

      if (asrData.errorCode && String(asrData.errorCode) !== '0') {
        const errorCode = String(asrData.errorCode)

        if (errorCode === '4304') {
          setMessages(prev => prev.filter(m => m.id !== userMessage.id))
          return
        }

        const errorMessages: Record<string, string> = {
          '108': 'APP_KEY不正确',
          '202': '签名验证失败',
          '401': '账户已经欠费',
          '411': '访问频率受限',
          '4305': '音频时长超过限制',
          '4306': '音频采样率不支持',
        }
        const errorMsg = errorMessages[errorCode] || `未知错误 (${errorCode})`
        throw new Error(`语音识别失败: ${errorMsg}`)
      }

      const recognizedText = asrData.result?.[0] || asrData.query || ''
      if (!recognizedText) {
        setMessages(prev => prev.filter(m => m.id !== userMessage.id))
        return
      }

      setMessages(prev => prev.map(m =>
        m.id === userMessage.id ? { ...m, content: recognizedText } : m
      ))

      console.log('[sendAudioMessage] Step 2: generate_dialog with text:', recognizedText)

      const lastAiMessage = messages.filter(m => m.role === 'assistant').pop()
      const updatedHistory = [...session.history]
      if (lastAiMessage) {
        updatedHistory.push({ speaker: 'System', content: lastAiMessage.content })
      }
      updatedHistory.push({ speaker: 'User', content: recognizedText })

      const response = await fetch('/api/youdao/aichat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId: session.taskId,
          scene: session.scene,
          userLevel: '0',
          history: updatedHistory,
        })
      })

      const data = await response.json()
      console.log('[sendAudioMessage] generate_dialog response:', data)

      if (String(data.code) !== '0') {
        throw new Error(`对话生成失败 (code: ${data.code}, msg: ${data.msg})`)
      }

      const aiReply: string = data.data?.resultArr?.[0]?.result?.[0] ?? ''

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiReply,
        timestamp: new Date(),
      }])

      setSession({ ...session, history: updatedHistory })
    } catch (error) {
      console.error('Send audio message error:', error)
      setMessages(prev => prev.filter(m => m.id !== userMessage.id))
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'system',
        content: error instanceof Error ? error.message : '语音识别失败，请重试',
        timestamp: new Date()
      }])
    } finally {
      setIsLoading(false)
    }
  }, [session, messages])

  const resetChat = useCallback(() => {
    setMessages([])
    setSession(null)
    setIsLoading(false)
  }, [])

  return {
    messages,
    isLoading,
    session,
    initializeChat,
    sendMessage,
    sendAudioMessage,
    resetChat
  }
}
