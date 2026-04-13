import { useState, useRef, useCallback } from 'react'

export type RecordingState = 'idle' | 'recording' | 'processing' | 'error'

interface UseAudioRecorderReturn {
  recordingState: RecordingState
  audioBlob: Blob | null
  audioBase64: string | null
  duration: number
  startRecording: () => Promise<void>
  stopRecording: () => Promise<void>
  clearRecording: () => void
  error: string | null
}

export function useAudioRecorder(): UseAudioRecorderReturn {
  const [recordingState, setRecordingState] = useState<RecordingState>('idle')
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioBase64, setAudioBase64] = useState<string | null>(null)
  const [duration, setDuration] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const recorderRef = useRef<any>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const startTimeRef = useRef<number>(0)

  const startRecording = useCallback(async () => {
    try {
      setError(null)
      setRecordingState('recording')

      // 请求麦克风权限 - 不强制指定采样率，让浏览器使用默认值
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      })

      // 动态导入 RecordRTC（避免 SSR 问题）
      const RecordRTC = (await import('recordrtc')).default
      const { StereoAudioRecorder } = await import('recordrtc')

      // 保存 stream 引用
      streamRef.current = stream

      // 初始化 RecordRTC - 使用更兼容的配置
      recorderRef.current = new RecordRTC(stream, {
        type: 'audio',
        mimeType: 'audio/wav',
        recorderType: StereoAudioRecorder,
        numberOfAudioChannels: 1, // 单声道
        desiredSampRate: 16000, // 目标采样率
        bufferSize: 16384, // 增加缓冲区大小
        timeSlice: 1000,
        ondataavailable: () => {
          // 可以在这里处理实时数据
        }
      })

      recorderRef.current.startRecording()
      startTimeRef.current = Date.now()

      console.log('录音已开始')
    } catch (err: any) {
      console.error('启动录音失败:', err)
      setError(err.message || '无法访问麦克风')
      setRecordingState('error')

      if (err.name === 'NotAllowedError') {
        setError('麦克风权限被拒绝，请在浏览器设置中允许麦克风访问')
      }
    }
  }, [])

  const stopRecording = useCallback(async () => {
    if (!recorderRef.current) return

    setRecordingState('processing')

    return new Promise<void>((resolve, reject) => {
      recorderRef.current!.stopRecording(async () => {
        // 停止所有音轨并销毁录音器（无论成功或失败都需要清理）
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track: MediaStreamTrack) => track.stop())
          streamRef.current = null
        }

        try {
          const blob = recorderRef.current!.getBlob()
          const recordDuration = (Date.now() - startTimeRef.current) / 1000

          // 销毁录音器
          recorderRef.current!.destroy()
          recorderRef.current = null

          // 验证录音时长（不说话时时长很短）
          if (recordDuration < 1.0) {
            setError('请说话后再停止录音（至少1秒）')
            setRecordingState('idle')
            resolve()
            return
          }

          // WAV 文件头约 44 字节，纯静音也会有头，需要更严格的大小检查
          // 1秒 16kHz 单声道 16bit WAV = 32044 字节，空/静音也会 > 1000
          // 但实际说话的录音通常会更大，这里主要靠时长判断
          if (blob.size < 1000) {
            setError('音频数据过小，请重新录制')
            setRecordingState('idle')
            resolve()
            return
          }

          console.log('录音信息:', {
            duration: recordDuration.toFixed(2) + '秒',
            size: (blob.size / 1024).toFixed(2) + 'KB',
            type: blob.type
          })

          setAudioBlob(blob)
          setDuration(recordDuration)

          // 转换为 Base64
          const reader = new FileReader()
          reader.onloadend = () => {
            const base64 = reader.result as string
            // 移除 data:audio/wav;base64, 前缀
            const base64Data = base64.split(',')[1]

            if (!base64Data || base64Data.length < 100) {
              setError('音频编码失败，请重试')
              setRecordingState('error')
              reject(new Error('音频编码失败'))
              return
            }

            setAudioBase64(base64Data)
            setRecordingState('idle')
            console.log('录音已停止，Base64长度:', base64Data.length)
            resolve()
          }
          reader.onerror = () => {
            setError('音频读取失败')
            setRecordingState('error')
            reject(new Error('音频读取失败'))
          }
          reader.readAsDataURL(blob)
        } catch (err: any) {
          if (recorderRef.current) {
            recorderRef.current.destroy()
            recorderRef.current = null
          }
          console.error('停止录音错误:', err)
          setError(err.message || '录音处理失败')
          setRecordingState('error')
          reject(err)
        }
      })
    })
  }, [])

  const clearRecording = useCallback(() => {
    setAudioBlob(null)
    setAudioBase64(null)
    setDuration(0)
    setError(null)
    setRecordingState('idle')
  }, [])

  return {
    recordingState,
    audioBlob,
    audioBase64,
    duration,
    startRecording,
    stopRecording,
    clearRecording,
    error
  }
}
