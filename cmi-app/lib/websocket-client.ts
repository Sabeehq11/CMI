export interface WebSocketMessage {
  type: string
  sessionId?: string
  data?: any
  text?: string
  speaker?: string
  audio?: string
  format?: string
  message?: string
}

export interface WebSocketCallbacks {
  onSessionJoined?: (data: any) => void
  onTranscription?: (text: string, speaker: string) => void
  onAIResponse?: (text: string, speaker: string) => void
  onAIAudio?: (audioData: string, format: string) => void
  onProcessing?: (message: string) => void
  onReady?: () => void
  onError?: (message: string) => void
}

export class InterviewWebSocket {
  private ws: WebSocket | null = null
  private callbacks: WebSocketCallbacks = {}
  private sessionId: string | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectInterval = 1000

  constructor(callbacks: WebSocketCallbacks) {
    this.callbacks = callbacks
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
        const wsUrl = `${protocol}//localhost:3001/websocket`
        
        this.ws = new WebSocket(wsUrl)

        this.ws.onopen = () => {
          console.log('WebSocket connected')
          this.reconnectAttempts = 0
          resolve()
        }

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data)
            this.handleMessage(message)
          } catch (error) {
            console.error('Error parsing WebSocket message:', error)
          }
        }

        this.ws.onclose = (event) => {
          console.log('WebSocket disconnected:', event.code, event.reason)
          this.attemptReconnect()
        }

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error)
          reject(error)
        }
      } catch (error) {
        reject(error)
      }
    })
  }

  private handleMessage(message: WebSocketMessage) {
    switch (message.type) {
      case 'session_joined':
        this.callbacks.onSessionJoined?.(message.data)
        break
      
      case 'transcription':
        this.callbacks.onTranscription?.(message.text || '', message.speaker || 'student')
        break
      
      case 'ai_response':
        this.callbacks.onAIResponse?.(message.text || '', message.speaker || 'ai')
        break
      
      case 'ai_audio':
        this.callbacks.onAIAudio?.(message.audio || '', message.format || 'mp3')
        break
      
      case 'processing':
        this.callbacks.onProcessing?.(message.message || 'Processing...')
        break
      
      case 'ready':
        this.callbacks.onReady?.()
        break
      
      case 'error':
        this.callbacks.onError?.(message.message || 'Unknown error')
        break
      
      case 'pong':
        // Handle ping/pong for keep-alive
        break
      
      default:
        console.warn('Unknown message type:', message.type)
    }
  }

  joinSession(sessionId: string, data?: any): void {
    this.sessionId = sessionId
    this.send({
      type: 'join_session',
      sessionId,
      data
    })
  }

  sendAudioChunk(audioBuffer: ArrayBuffer): void {
    if (!this.sessionId) {
      console.error('No session ID set')
      return
    }

    // Convert ArrayBuffer to base64 more efficiently
    const uint8Array = new Uint8Array(audioBuffer)
    let binary = ''
    const chunkSize = 8192 // Process in chunks to avoid stack overflow
    
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.slice(i, Math.min(i + chunkSize, uint8Array.length))
      binary += String.fromCharCode.apply(null, Array.from(chunk))
    }
    
    const base64Audio = btoa(binary)
    
    this.send({
      type: 'audio_chunk',
      sessionId: this.sessionId,
      data: {
        audio: base64Audio
      }
    })
  }

  endAudio(): void {
    if (!this.sessionId) {
      console.error('No session ID set')
      return
    }

    this.send({
      type: 'audio_end',
      sessionId: this.sessionId
    })
  }

  private send(message: WebSocketMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message))
    } else {
      console.error('WebSocket not connected')
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached')
      this.callbacks.onError?.('Connection lost. Please refresh the page.')
      return
    }

    this.reconnectAttempts++
    console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`)

    setTimeout(() => {
      this.connect().then(() => {
        if (this.sessionId) {
          this.joinSession(this.sessionId)
        }
      }).catch((error) => {
        console.error('Reconnection failed:', error)
      })
    }, this.reconnectInterval * this.reconnectAttempts)
  }

  ping(): void {
    this.send({ type: 'ping' })
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN
  }
}

// Utility function to play audio from base64 data
export function playAudioFromBase64(base64Data: string, format: string = 'mp3'): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const audioBlob = base64ToBlob(base64Data, `audio/${format}`)
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

function base64ToBlob(base64: string, mimeType: string): Blob {
  const byteCharacters = atob(base64)
  const byteNumbers = new Array(byteCharacters.length)
  
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i)
  }
  
  const byteArray = new Uint8Array(byteNumbers)
  return new Blob([byteArray], { type: mimeType })
} 