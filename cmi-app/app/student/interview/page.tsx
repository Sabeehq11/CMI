'use client'

import { useState, useEffect, useRef, useCallback, Suspense } from 'react'
import dynamicImport from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Mic, MicOff, Loader2, Volume2, VolumeX, Clock, Sparkles, MessageSquare, User } from 'lucide-react'
import Link from 'next/link'
import { formatDuration } from '@/lib/utils'
import toast from 'react-hot-toast'
import { InterviewWebSocket, playAudioFromBase64 } from '@/lib/websocket-client'
import { motion, AnimatePresence } from 'framer-motion'

// Disable static generation for this page since it uses browser APIs
export const dynamic = 'force-dynamic'

// Simple placeholder for 3D component (can be implemented later)
const AIInterviewer3D = ({ state }: { state: string }) => (
  <div className="w-full h-full flex items-center justify-center">
    <div className="glass-card-silver rounded-2xl p-8 flex flex-col items-center space-y-4">
      <div className={`w-24 h-24 rounded-full border-4 transition-all duration-300 ${
        state === 'listening' ? 'border-green-400 bg-green-400/20 animate-pulse' :
        state === 'thinking' ? 'border-yellow-400 bg-yellow-400/20' :
        state === 'speaking' ? 'border-blue-400 bg-blue-400/20 animate-pulse' :
        'border-gray-400 bg-gray-400/20'
      }`}>
        <div className="w-full h-full rounded-full bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center">
          {state === 'listening' && <Mic className="w-8 h-8 text-green-400" />}
          {state === 'thinking' && <Loader2 className="w-8 h-8 text-yellow-400 animate-spin" />}
          {state === 'speaking' && <Volume2 className="w-8 h-8 text-blue-400" />}
          {state === 'idle' && <Sparkles className="w-8 h-8 text-gray-400" />}
        </div>
      </div>
      <div className="text-center">
        <div className="font-semibold text-white">AI Interviewer</div>
        <div className="text-sm text-gray-400 capitalize">{state}</div>
      </div>
    </div>
  </div>
)

// Dynamic import for RecordRTC to avoid SSR issues
let RecordRTC: any = null
if (typeof window !== 'undefined') {
  import('recordrtc').then((module) => {
    RecordRTC = module.default
  })
}

interface SessionData {
  student: {
    firstName: string
    targetLanguage: string
  }
  sessionId: string
  initialQuestion?: string
}

interface TranscriptEntry {
  speaker: 'user' | 'ai'
  text: string
  timestamp: Date
}

export default function InterviewPage() {
  const router = useRouter()
  const [sessionData, setSessionData] = useState<SessionData | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([])
  const [currentTranscription, setCurrentTranscription] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [isSessionActive, setIsSessionActive] = useState(false)
  const [wsConnected, setWsConnected] = useState(false)
  const [processingMessage, setProcessingMessage] = useState('')
  const [aiState, setAiState] = useState<'idle' | 'listening' | 'thinking' | 'speaking'>('idle')
  
  const recorderRef = useRef<any | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const transcriptEndRef = useRef<HTMLDivElement>(null)
  const wsRef = useRef<InterviewWebSocket | null>(null)

  // Initialize WebSocket
  useEffect(() => {
    const initializeWebSocket = async () => {
      const ws = new InterviewWebSocket({
        onSessionJoined: (data) => {
          console.log('Session joined:', data)
          setWsConnected(true)
          setIsSessionActive(true)
        },
        onTranscription: (text, speaker) => {
          const entry: TranscriptEntry = {
            speaker: speaker as 'user' | 'ai',
            text,
            timestamp: new Date()
          }
          setTranscript(prev => [...prev, entry])
          setCurrentTranscription('')
          setProcessingMessage('')
          setAiState('idle')
        },
        onAIResponse: (text, speaker) => {
          const entry: TranscriptEntry = {
            speaker: 'ai',
            text,
            timestamp: new Date()
          }
          setTranscript(prev => [...prev, entry])
          setAiState('speaking')
        },
        onAIAudio: async (audioData, format) => {
          try {
            await playAudioFromBase64(audioData, format)
            setProcessingMessage('')
            // Return to idle after speaking
            setTimeout(() => setAiState('idle'), 2000)
          } catch (error) {
            console.error('Error playing AI audio:', error)
            console.error('Failed to play AI response')
            setAiState('idle')
          }
        },
        onProcessing: (message) => {
          setProcessingMessage(message)
          setAiState('thinking')
        },
        onReady: () => {
          setProcessingMessage('')
          setIsProcessing(false)
        },
        onError: (message) => {
          alert(message)
          setProcessingMessage('')
          setIsProcessing(false)
          setAiState('idle')
        }
      })

      try {
        await ws.connect()
        wsRef.current = ws
      } catch (error) {
        console.error('Failed to connect WebSocket:', error)
                  alert('Connection Failed: The interview server is not running. Please ensure the WebSocket server is started.')
        
        // Redirect back to student page after delay
        setTimeout(() => {
          router.push('/student')
        }, 3000)
      }
    }

    initializeWebSocket()

    return () => {
      wsRef.current?.disconnect()
    }
  }, [])

  // Load session data from sessionStorage
  useEffect(() => {
    const storedSession = sessionStorage.getItem('currentSession')
    if (!storedSession) {
      alert('No session found. Please start a new assessment.')
      router.push('/student')
      return
    }
    
    const data = JSON.parse(storedSession) as SessionData
    setSessionData(data)
    
    // Start the session via API
    startSession(data)
  }, [router])

  // Auto-scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [transcript])

  // Timer for elapsed time
  useEffect(() => {
    if (isSessionActive && !isPaused) {
      timerRef.current = setInterval(() => {
        setElapsedTime(prev => {
          if (prev >= 180) { // 3 minutes
            endSession()
            return prev
          }
          return prev + 1
        })
      }, 1000)
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [isSessionActive, isPaused])

  const startSession = async (data: SessionData) => {
    try {
      const response = await fetch('/api/session/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: data.student.firstName,
          target_language: data.student.targetLanguage
        })
      })

      if (!response.ok) {
        throw new Error('Failed to start session')
      }

      const result = await response.json()
      
      // Update session data with server response
      const updatedSessionData = {
        ...data,
        sessionId: result.session_id,
        initialQuestion: result.initial_question
      }
      setSessionData(updatedSessionData)

      // Add initial AI question to transcript
      if (result.initial_question) {
        setTranscript([{
          speaker: 'ai',
          text: result.initial_question,
          timestamp: new Date()
        }])
        
        // Play the initial question via TTS (fallback if WebSocket not ready)
        if (!wsRef.current?.isConnected()) {
          playAIResponse(result.initial_question)
        }
      }

      // Join WebSocket session if connected
      if (wsRef.current?.isConnected()) {
        wsRef.current.joinSession(result.session_id, {
          language: data.student.targetLanguage,
          studentName: data.student.firstName,
          studentId: result.student_id,
          rubric: result.rubric
        })
      } else {
        setIsSessionActive(true)
      }
    } catch (error) {
      console.error('Error starting session:', error)
      alert('Failed to start interview session')
      router.push('/student')
    }
  }

  const startRecording = async () => {
    try {
      if (!RecordRTC) {
        alert('Recording library not loaded. Please refresh the page.')
        return
      }

      // Check microphone permission first
      try {
        const permission = await navigator.permissions.query({ name: 'microphone' as PermissionName })
        if (permission.state === 'denied') {
          alert('🎤 Microphone access is blocked!\n\nTo enable:\n1. Click the 🔒 lock icon in your browser address bar\n2. Allow microphone access\n3. Refresh the page and try again')
          return
        }
      } catch (permissionError) {
        console.warn('Could not check microphone permission:', permissionError)
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      })
      streamRef.current = stream

      const recorder = new RecordRTC(stream, {
        type: 'audio',
        mimeType: 'audio/wav', // WAV format is more compatible
        recorderType: RecordRTC.StereoAudioRecorder,
        timeSlice: 1000, // Larger chunks for better transcription accuracy (1 second)
        desiredSampRate: 16000, // Optimized for speech recognition
        numberOfAudioChannels: 1, // Mono audio
        bufferSize: 4096, // Smaller buffer for lower latency
        ondataavailable: (blob: Blob) => {
          // Only send if blob has meaningful data
          if (blob.size > 4096) { // Minimum 4KB to avoid noise
            sendAudioChunkToWebSocket(blob)
          } else {
            console.log('Skipping small audio chunk:', blob.size, 'bytes')
          }
        }
      })

      recorder.startRecording()
      recorderRef.current = recorder
      setIsRecording(true)
      setAiState('listening')
      
      console.log('Recording started successfully')
    } catch (error: any) {
      console.error('Error accessing microphone:', error)
      
      // Provide specific error messages based on error type
      if (error.name === 'NotAllowedError') {
        alert('🎤 MICROPHONE PERMISSION DENIED\n\nTo fix this:\n\n1. Click the 🔒 lock icon next to the URL\n2. Set microphone to "Allow"\n3. Refresh the page\n4. Try recording again\n\nNote: Microphone access is required for voice interviews.')
      } else if (error.name === 'NotFoundError') {
        alert('🎤 No microphone found!\n\nPlease:\n1. Connect a microphone\n2. Check it\'s working in system settings\n3. Refresh the page and try again')
      } else if (error.name === 'NotReadableError') {
        alert('🎤 Microphone is busy!\n\nPlease:\n1. Close other apps using the microphone\n2. Refresh the page\n3. Try again')
      } else {
        alert(`🎤 Microphone Error: ${error.message}\n\nTry:\n1. Refreshing the page\n2. Checking microphone permissions\n3. Using a different browser`)
      }
    }
  }

  const stopRecording = () => {
    if (recorderRef.current && isRecording) {
      recorderRef.current.stopRecording(() => {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop())
        }
        setIsRecording(false)
        setIsProcessing(true)
        setProcessingMessage('Processing your speech...')
        setAiState('thinking')
        
        // Notify WebSocket that audio has ended
        if (wsRef.current?.isConnected()) {
          wsRef.current.endAudio()
        }
        
        console.log('Recording stopped')
      })
    }
  }

  const sendAudioChunkToWebSocket = async (blob: Blob) => {
    if (!wsRef.current?.isConnected()) {
      console.warn('WebSocket not connected, cannot send audio chunk')
      return
    }

    // Increased chunk size limit for better quality
    const MAX_CHUNK_SIZE = 200 * 1024 // 200KB max per chunk
    if (blob.size > MAX_CHUNK_SIZE) {
      console.warn('Audio chunk too large:', blob.size, 'bytes. Skipping.')
      return
    }

    try {
      // Convert blob to ArrayBuffer with error handling
      const arrayBuffer = await blob.arrayBuffer()
      
      // Validate array buffer
      if (arrayBuffer.byteLength === 0) {
        console.warn('Empty audio chunk, skipping')
        return
      }
      
      // Send to WebSocket server
      wsRef.current.sendAudioChunk(arrayBuffer)
      
      console.log('Sent audio chunk:', blob.size, 'bytes')
    } catch (error) {
      console.error('Error sending audio chunk:', error)
      
      // Provide user feedback for persistent issues
      if (error instanceof RangeError) {
        console.error('Audio chunk too large for processing')
      } else if (error instanceof DOMException) {
        console.error('Audio format conversion failed')
      } else {
        // Don't spam the user, but log for debugging
        console.error('Unexpected error processing audio chunk')
      }
    }
  }

  const simulateUserSpeech = () => {
    if (!isRecording) return
    
    const sampleResponses = [
      "Hi, my name is John and I'm a software developer with 5 years of experience.",
      "I really enjoy working on challenging projects and learning new technologies.",
      "In my free time, I like to read books and go hiking with my friends.",
      "I think communication skills are very important in any profession.",
      "My goal is to become a technical lead and mentor other developers.",
      "I've worked with various programming languages including JavaScript, Python, and Java.",
      "One of my proudest achievements was leading a team project that improved efficiency by 40%."
    ]
    
    const response = sampleResponses[Math.floor(Math.random() * sampleResponses.length)]
    setCurrentTranscription(response)
    
    // Auto-submit after 2 seconds
    setTimeout(() => {
      handleUserSpeechEnd()
    }, 2000)
  }

  const playAIResponse = async (text: string) => {
    // In a real implementation, this would use ElevenLabs TTS
    // For now, we'll use browser's speech synthesis
    if ('speechSynthesis' in window && !isMuted) {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = sessionData?.student.targetLanguage || 'en'
      utterance.rate = 1.0
      utterance.pitch = 1.0
      window.speechSynthesis.speak(utterance)
    }
  }

  const handleUserSpeechEnd = () => {
    if (currentTranscription) {
      // Add user's speech to transcript
      setTranscript(prev => [...prev, {
        speaker: 'user',
        text: currentTranscription,
        timestamp: new Date()
      }])
      
      // Clear current transcription
      setCurrentTranscription('')
      
      // Simulate AI response
      setIsProcessing(true)
      setTimeout(() => {
        const aiResponses = [
          "That's very interesting! Can you tell me more about that?",
          "I see. How did that experience shape your perspective?",
          "Thank you for sharing that. What would you say was the most challenging part?",
          "That sounds fascinating. Can you give me a specific example?",
          "I understand. How do you think that has influenced your current goals?",
          "That's a great point. What advice would you give to someone in a similar situation?"
        ]
        const aiResponse = aiResponses[Math.floor(Math.random() * aiResponses.length)]
        setTranscript(prev => [...prev, {
          speaker: 'ai',
          text: aiResponse,
          timestamp: new Date()
        }])
        playAIResponse(aiResponse)
        setIsProcessing(false)
      }, 1500)
    }
  }

  const endSession = async () => {
    setIsSessionActive(false)
    stopRecording()
    
    // Clear timer
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }
    
    alert('Interview completed! Processing your results...')
    
    // In a real implementation, this would call the scoring API
    setTimeout(() => {
      router.push('/student/results')
    }, 2000)
  }

  const toggleMute = () => {
    setIsMuted(!isMuted)
    if (isMuted) {
      console.log('Audio unmuted')
    } else {
      console.log('Audio muted')
    }
  }

  if (!sessionData) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Animated background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-950 via-black to-gray-950" />
        <div className="absolute inset-0 cyber-grid opacity-10" />
        {/* Audio-reactive particles would go here */}
      </div>
      
      <div className="relative z-10 h-screen flex flex-col">
        {/* Top bar with session info */}
        <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-20">
          <Link href="/student" className="inline-flex items-center text-gray-400 hover:text-white transition-colors group">
            <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
            End Interview
          </Link>
          
          <div className="flex items-center space-x-4">
            {/* Session info */}
            <div className="glass-card-silver px-4 py-2 rounded-lg flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-2">
                <span className="text-gray-400">Language:</span>
                <span className="font-medium">{sessionData.student.targetLanguage.toUpperCase()}</span>
              </div>
              <div className="w-px h-4 bg-gray-600" />
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-gray-400" />
                <span className="font-mono">
                  {formatDuration(elapsedTime)} / 3:00
                </span>
              </div>
              <div className="w-px h-4 bg-gray-600" />
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-green-400' : 'bg-red-400'}`} />
                <span className="text-gray-400">
                  {wsConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>
            
            {/* Mute button */}
            <button
              onClick={toggleMute}
              className="p-2 glass-card-silver rounded-lg hover:bg-white/10 transition-colors"
            >
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Main content area */}
        <div className="flex-1 flex">
          {/* Left sidebar - Transcript */}
          <div className="w-96 p-4 pt-20">
            <div className="glass-card-silver h-full rounded-2xl p-4 flex flex-col">
              <div className="flex items-center space-x-2 mb-4">
                <MessageSquare className="w-5 h-5 text-gray-400" />
                <h2 className="text-lg font-semibold silver-text">Conversation</h2>
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                <AnimatePresence>
                  {transcript.map((entry, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                      className={`flex ${entry.speaker === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[85%] p-3 rounded-xl ${
                          entry.speaker === 'user'
                            ? 'bg-gradient-to-br from-gray-600 to-gray-800 text-white'
                            : 'bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700'
                        }`}
                      >
                        <div className="flex items-center space-x-2 mb-1">
                          {entry.speaker === 'user' ? (
                            <User className="w-3 h-3" />
                          ) : (
                            <Sparkles className="w-3 h-3 text-gray-400" />
                          )}
                          <span className="text-xs font-medium text-gray-300">
                            {entry.speaker === 'user' ? 'You' : 'AI Interviewer'}
                          </span>
                          <span className="text-xs text-gray-500">
                            {entry.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-sm leading-relaxed">{entry.text}</p>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                
                {/* Current transcription */}
                {currentTranscription && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-end"
                  >
                    <div className="max-w-[85%] p-3 rounded-xl bg-gradient-to-br from-gray-600/50 to-gray-800/50 text-white">
                      <p className="text-sm italic">{currentTranscription}</p>
                    </div>
                  </motion.div>
                )}
                
                {/* Processing indicator */}
                {(isProcessing || processingMessage) && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-start"
                  >
                    <div className="glass-card-silver p-3 rounded-xl">
                      <div className="flex items-center space-x-2">
                        <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                        <span className="text-sm text-gray-400">
                          {processingMessage || 'AI is thinking...'}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )}
                
                <div ref={transcriptEndRef} />
              </div>
            </div>
          </div>

          {/* Center - 3D AI Interviewer */}
          <div className="flex-1 flex items-center justify-center">
            <div className="w-full h-full max-w-2xl max-h-[600px] relative">
              <Suspense fallback={
                <div className="w-full h-full flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                </div>
              }>
                <AIInterviewer3D state={aiState} />
              </Suspense>
            </div>
          </div>

          {/* Right side - empty for balance */}
          <div className="w-96" />
        </div>

        {/* Bottom center - Recording controls */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
          <div className="flex flex-col items-center space-y-4">
            {/* Voice prompt */}
            <AnimatePresence>
              {isSessionActive && !isRecording && !isProcessing && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="text-gray-400 text-sm flex items-center space-x-2"
                >
                  <Mic className="w-4 h-4" />
                  <span>Speak when ready...</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Recording button */}
            <motion.button
              onClick={isRecording ? stopRecording : startRecording}
              disabled={!isSessionActive || isProcessing || !wsConnected}
              className={`relative group disabled:opacity-50 disabled:cursor-not-allowed`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className={`absolute inset-0 rounded-full blur-xl opacity-75 transition duration-200 ${
                isRecording 
                  ? 'bg-red-500 animate-pulse' 
                  : 'bg-gradient-to-r from-gray-600 to-gray-800 group-hover:opacity-100'
              }`} />
              <div className={`relative rounded-full p-6 font-semibold flex items-center justify-center transition-all ${
                isRecording 
                  ? 'bg-red-500 text-white shadow-lg shadow-red-500/50' 
                  : 'bg-gradient-to-br from-gray-700 to-gray-900 text-white shadow-lg group-hover:shadow-xl'
              }`}>
                {isRecording ? (
                  <MicOff className="w-8 h-8" />
                ) : (
                  <Mic className="w-8 h-8" />
                )}
              </div>
            </motion.button>

            {/* Demo button */}
            {isRecording && (
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={simulateUserSpeech}
                className="px-4 py-2 glass-card-silver rounded-lg hover:bg-white/10 transition-colors text-sm"
              >
                🎭 Simulate Speech (Demo)
              </motion.button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 