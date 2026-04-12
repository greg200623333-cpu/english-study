import { useState, useCallback } from 'react'
import { ChatMessage, YoudaoChatSession, YoudaoDialogHistory } from '@/types/scenario'

interface UseYoudaoChatReturn {
  messages: ChatMessage[]
  isLoading: boolean
  session: YoudaoChatSession | null
  initializeChat: (topic: string) => Promise<void>
  sendMessage: (content: string) => Promise<void>
  resetChat: () => void
}

export function useYoudaoChat(): UseYoudaoChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [session, setSession] = useState<YoudaoChatSession | null>(null)

  // 初始化对话会话
  const initializeChat = useCallback(async (topic: string) => {
    setIsLoading(true)
    setMessages([])

    try {
      // 1. 生成场景
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

      // 2. 生成第一句对话
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

      // 初始化会话状态
      setSession({
        taskId,
        scene,
        history: []
      })

      // 添加 AI 的第一条消息
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

  // 发送消息
  const sendMessage = useCallback(async (content: string) => {
    if (!session || !content.trim()) return

    // 添加用户消息
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)

    try {
      // 更新历史记录
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

      // 添加 AI 回复
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiReply,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])

      // 更新会话历史
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

  // 重置对话
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
    resetChat
  }
}
