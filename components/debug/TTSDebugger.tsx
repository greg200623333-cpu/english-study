import { useState } from 'react'

export default function TTSDebugger() {
  const [testWord, setTestWord] = useState('hello')
  const [status, setStatus] = useState('')

  const testTTS = async () => {
    setStatus('Testing...')
    try {
      const response = await fetch(`/api/tts?word=${encodeURIComponent(testWord)}`)

      if (!response.ok) {
        const error = await response.json()
        setStatus(`Error: ${JSON.stringify(error)}`)
        return
      }

      const contentType = response.headers.get('content-type')
      setStatus(`Success! Content-Type: ${contentType}`)

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const audio = new Audio(url)

      audio.onloadedmetadata = () => {
        setStatus(`Audio loaded, duration: ${audio.duration}s`)
      }

      audio.onerror = (e) => {
        setStatus(`Audio error: ${e}`)
      }

      audio.play()
    } catch (error) {
      setStatus(`Fetch error: ${error}`)
    }
  }

  return (
    <div className="p-4 bg-gray-800 text-white rounded">
      <h3 className="text-lg font-bold mb-4">TTS API Debugger</h3>
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={testWord}
          onChange={(e) => setTestWord(e.target.value)}
          className="px-3 py-2 bg-gray-700 rounded"
          placeholder="Enter word to test"
        />
        <button
          onClick={testTTS}
          className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700"
        >
          Test TTS
        </button>
      </div>
      {status && (
        <div className="p-3 bg-gray-700 rounded">
          <pre className="text-sm">{status}</pre>
        </div>
      )}
    </div>
  )
}
