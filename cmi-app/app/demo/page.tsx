'use client'

import { useState, useRef } from 'react'

// Very simple demo page to test transcription without complex dependencies
export default function DemoPage() {
  const [isRecording, setIsRecording] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [aiResponse, setAiResponse] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState('')
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  const startRecording = async () => {
    try {
      setError('')
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      })

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      })

      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data)
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        await processAudio(audioBlob)
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
      console.log('Recording started')
    } catch (err) {
      setError('Failed to start recording: ' + (err instanceof Error ? err.message : 'Unknown error'))
      console.error('Recording error:', err)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      console.log('Recording stopped')
    }
  }

  const processAudio = async (audioBlob: Blob) => {
    setIsProcessing(true)
    try {
      console.log('Processing audio blob:', audioBlob.size, 'bytes')

      // Create form data for transcription
      const formData = new FormData()
      formData.append('audio', audioBlob, 'recording.webm')
      formData.append('language', 'en')

      // Send to transcription API
      const transcribeResponse = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData
      })

      if (!transcribeResponse.ok) {
        const errorData = await transcribeResponse.json()
        throw new Error(errorData.details || 'Transcription failed')
      }

      const transcribeResult = await transcribeResponse.json()
      const transcription = transcribeResult.transcription || ''
      
      setTranscript(transcription)
      console.log('Transcription:', transcription)

      if (transcription.trim()) {
        // Generate AI response
        const responseResponse = await fetch('/api/generate-response', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            transcript: [
              { speaker: 'student', text: transcription, timestamp: new Date() }
            ],
            rubric: {
              name: 'Demo Rubric',
              language: 'en',
              criteria: [{ name: 'Demo', weight: 1.0, description: 'Demo criteria' }]
            },
            language: 'en',
            sessionContext: { demo: true }
          })
        })

        if (responseResponse.ok) {
          const responseResult = await responseResponse.json()
          setAiResponse(responseResult.response || 'No response generated')
          
          // Play audio if available
          if (responseResult.audio) {
            try {
              const audioData = atob(responseResult.audio)
              const audioArray = new Uint8Array(audioData.length)
              for (let i = 0; i < audioData.length; i++) {
                audioArray[i] = audioData.charCodeAt(i)
              }
              const audioBlob = new Blob([audioArray], { type: 'audio/mp3' })
              const audioUrl = URL.createObjectURL(audioBlob)
              const audio = new Audio(audioUrl)
              await audio.play()
              URL.revokeObjectURL(audioUrl)
            } catch (audioError) {
              console.error('Audio playback error:', audioError)
            }
          }
        }
      }
    } catch (err) {
      setError('Processing failed: ' + (err instanceof Error ? err.message : 'Unknown error'))
      console.error('Processing error:', err)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#000', 
      color: '#fff', 
      padding: '20px',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ textAlign: 'center', marginBottom: '40px' }}>
          🎤 Voice Transcription Demo
        </h1>

        {error && (
          <div style={{ 
            backgroundColor: '#dc2626', 
            padding: '10px', 
            borderRadius: '5px', 
            marginBottom: '20px' 
          }}>
            Error: {error}
          </div>
        )}

        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isProcessing}
            style={{
              backgroundColor: isRecording ? '#dc2626' : '#059669',
              color: 'white',
              border: 'none',
              borderRadius: '50%',
              width: '100px',
              height: '100px',
              fontSize: '24px',
              cursor: isProcessing ? 'not-allowed' : 'pointer',
              opacity: isProcessing ? 0.5 : 1
            }}
          >
            {isRecording ? '🛑' : '🎤'}
          </button>
          
          <div style={{ marginTop: '10px', fontSize: '14px', color: '#888' }}>
            {isRecording ? 'Click to stop recording' : 
             isProcessing ? 'Processing...' : 'Click to start recording'}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div style={{ 
            backgroundColor: '#1f2937', 
            padding: '20px', 
            borderRadius: '10px' 
          }}>
            <h3>📝 Your Speech:</h3>
            <div style={{ 
              minHeight: '100px', 
              backgroundColor: '#374151', 
              padding: '10px', 
              borderRadius: '5px',
              marginTop: '10px'
            }}>
              {transcript || 'Your transcribed speech will appear here...'}
            </div>
          </div>

          <div style={{ 
            backgroundColor: '#1f2937', 
            padding: '20px', 
            borderRadius: '10px' 
          }}>
            <h3>🤖 AI Response:</h3>
            <div style={{ 
              minHeight: '100px', 
              backgroundColor: '#374151', 
              padding: '10px', 
              borderRadius: '5px',
              marginTop: '10px'
            }}>
              {aiResponse || 'AI response will appear here...'}
            </div>
          </div>
        </div>

        <div style={{ 
          marginTop: '40px', 
          textAlign: 'center', 
          fontSize: '14px', 
          color: '#888' 
        }}>
          <p>🔊 Make sure your microphone is enabled and speak clearly.</p>
          <p>⚡ This demo uses OpenAI Whisper for transcription and GPT for responses.</p>
        </div>
      </div>
    </div>
  )
}
