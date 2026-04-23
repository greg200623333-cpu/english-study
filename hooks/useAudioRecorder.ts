import { useState, useRef, useCallback } from 'react'
import RecordRTC from 'recordrtc'

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

  const recorderRef = useRef<RecordRTC | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const startTimeRef = useRef<number>(0)

  const startRecording = useCallback(async () => {
    try {
      setError(null)
      setRecordingState('recording')

      
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      })

      
      const RecordRTC = (await import('recordrtc')).default
      const { StereoAudioRecorder } = await import('recordrtc')

      
      streamRef.current = stream

      
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
    } catch (err: unknown) {
      console.error('启动录音失败:', err)
      if (err instanceof Error) {
        setError(err.message || '无法访问麦克风')
        if (err.name === 'NotAllowedError') {
          setError('麦克风权限被拒绝，请在浏览器设置中允许麦克风访问')
        }
      } else {
        setError('无法访问麦克风')
      }
      setRecordingState('error')
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
        } catch (err: unknown) {
          if (recorderRef.current) {
            recorderRef.current.destroy()
            recorderRef.current = null
          }
          console.error('停止录音错误:', err)
          if (err instanceof Error) {
            setError(err.message || '录音处理失败')
            reject(err)
          } else {
            setError('录音处理失败')
            reject(new Error('录音处理失败'))
          }
          setRecordingState('error')
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
