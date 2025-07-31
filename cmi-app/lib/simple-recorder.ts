// Simple audio recorder that records full utterances instead of streaming chunks
export class SimpleAudioRecorder {
  private mediaRecorder: MediaRecorder | null = null
  private stream: MediaStream | null = null
  private audioChunks: Blob[] = []
  private isRecording = false
  private onDataAvailable?: (audioBlob: Blob) => void
  private onError?: (error: Error) => void

  constructor(callbacks: {
    onDataAvailable?: (audioBlob: Blob) => void
    onError?: (error: Error) => void
  }) {
    this.onDataAvailable = callbacks.onDataAvailable
    this.onError = callbacks.onError
  }

  async initialize(): Promise<void> {
    try {
      console.log('Requesting microphone access...')
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000,
        }
      })

      // Check for supported audio formats
      const mimeTypes = [
        'audio/wav',
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4',
        'audio/ogg;codecs=opus'
      ]

      let selectedMimeType = 'audio/webm' // fallback
      for (const mimeType of mimeTypes) {
        if (MediaRecorder.isTypeSupported(mimeType)) {
          selectedMimeType = mimeType
          break
        }
      }

      console.log('Using audio format:', selectedMimeType)

      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType: selectedMimeType,
        audioBitsPerSecond: 128000 // Good quality for speech
      })

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          this.audioChunks.push(event.data)
        }
      }

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: selectedMimeType })
        this.audioChunks = []
        
        if (audioBlob.size > 1024) { // Only process if we have meaningful audio
          this.onDataAvailable?.(audioBlob)
        } else {
          console.log('Audio too small, skipping:', audioBlob.size, 'bytes')
        }
      }

      this.mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event)
        this.onError?.(new Error('Recording failed'))
      }

      console.log('Audio recorder initialized successfully')
    } catch (error) {
      console.error('Failed to initialize audio recorder:', error)
      this.onError?.(error instanceof Error ? error : new Error('Failed to initialize recorder'))
      throw error
    }
  }

  startRecording(): void {
    if (!this.mediaRecorder || this.isRecording) {
      console.warn('Cannot start recording: recorder not initialized or already recording')
      return
    }

    try {
      this.audioChunks = []
      this.mediaRecorder.start()
      this.isRecording = true
      console.log('Recording started')
    } catch (error) {
      console.error('Failed to start recording:', error)
      this.onError?.(error instanceof Error ? error : new Error('Failed to start recording'))
    }
  }

  stopRecording(): void {
    if (!this.mediaRecorder || !this.isRecording) {
      console.warn('Cannot stop recording: not currently recording')
      return
    }

    try {
      this.mediaRecorder.stop()
      this.isRecording = false
      console.log('Recording stopped')
    } catch (error) {
      console.error('Failed to stop recording:', error)
      this.onError?.(error instanceof Error ? error : new Error('Failed to stop recording'))
    }
  }

  cleanup(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop())
      this.stream = null
    }
    this.mediaRecorder = null
    this.isRecording = false
    this.audioChunks = []
    console.log('Audio recorder cleaned up')
  }

  getIsRecording(): boolean {
    return this.isRecording
  }
}

// Utility functions for audio processing
export async function transcribeAudioBlob(
  audioBlob: Blob, 
  language: string = 'en'
): Promise<string> {
  const formData = new FormData()
  formData.append('audio', audioBlob, 'recording.webm')
  formData.append('language', language)

  const response = await fetch('/api/transcribe', {
    method: 'POST',
    body: formData
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.details || 'Transcription failed')
  }

  const result = await response.json()
  return result.transcription || ''
}

export async function generateAIResponse(
  transcript: Array<{ speaker: string; text: string; timestamp: Date }>,
  rubric: any,
  language: string,
  sessionContext: any
): Promise<{ response: string; audio: string; audioFormat: string }> {
  const response = await fetch('/api/generate-response', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      transcript,
      rubric,
      language,
      sessionContext
    })
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.details || 'Response generation failed')
  }

  const result = await response.json()
  return {
    response: result.response,
    audio: result.audio,
    audioFormat: result.audioFormat
  }
}

export function playAudioFromBase64(base64Audio: string, format: string = 'mp3'): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      // Convert base64 to blob
      const byteCharacters = atob(base64Audio)
      const byteNumbers = new Array(byteCharacters.length)
      
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i)
      }
      
      const byteArray = new Uint8Array(byteNumbers)
      const audioBlob = new Blob([byteArray], { type: `audio/${format}` })
      const audioUrl = URL.createObjectURL(audioBlob)
      
      const audio = new Audio(audioUrl)
      
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl)
        resolve()
      }
      
      audio.onerror = (error) => {
        URL.revokeObjectURL(audioUrl)
        reject(error)
      }
      
      audio.play()
    } catch (error) {
      reject(error)
    }
  })
}
