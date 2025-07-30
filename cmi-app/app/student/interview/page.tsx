'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Mic, MicOff, Loader2, Volume2, VolumeX, Clock, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { formatDuration } from '@/lib/utils'
import toast from 'react-hot-toast'
import RecordRTC from 'recordrtc'

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
  
  const recorderRef = useRef<RecordRTC | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const transcriptEndRef = useRef<HTMLDivElement>(null)

  // Load session data from sessionStorage
  useEffect(() => {
    const storedSession = sessionStorage.getItem('currentSession')
    if (!storedSession) {
      toast.error('No session found. Please start a new assessment.')
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
      setSessionData({
        ...data,
        sessionId: result.session_id,
        initialQuestion: result.initial_question
      })

      // Add initial AI question to transcript
      if (result.initial_question) {
        setTranscript([{
          speaker: 'ai',
          text: result.initial_question,
          timestamp: new Date()
        }])
        
        // Play the initial question via TTS
        playAIResponse(result.initial_question)
      }

      setIsSessionActive(true)
    } catch (error) {
      console.error('Error starting session:', error)
      toast.error('Failed to start interview session')
      router.push('/student')
    }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const recorder = new RecordRTC(stream, {
        type: 'audio',
        mimeType: 'audio/webm',
        recorderType: RecordRTC.StereoAudioRecorder,
        timeSlice: 1000, // Get data every second
        ondataavailable: (blob: Blob) => {
          // Send audio chunk to server for processing
          sendAudioChunk(blob)
        }
      })

      recorder.startRecording()
      recorderRef.current = recorder
      setIsRecording(true)
      
      toast.success('Recording started')
    } catch (error) {
      console.error('Error accessing microphone:', error)
      toast.error('Failed to access microphone. Please check permissions.')
    }
  }

  const stopRecording = () => {
    if (recorderRef.current && isRecording) {
      recorderRef.current.stopRecording(() => {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop())
        }
        setIsRecording(false)
        toast.success('Recording stopped')
      })
    }
  }

  const sendAudioChunk = async (blob: Blob) => {
    // In a real implementation, this would send to WebSocket
    // For now, we'll simulate transcription
    console.log('Sending audio chunk:', blob.size)
    
    // Simulate transcription with more realistic responses
    const sampleResponses = [
      "Hi, my name is John and I'm a software developer with 5 years of experience.",
      "I really enjoy working on challenging projects and learning new technologies.",
      "In my free time, I like to read books and go hiking with my friends.",
      "I think communication skills are very important in any profession.",
      "My goal is to become a technical lead and mentor other developers."
    ]
    
    setTimeout(() => {
      const response = sampleResponses[Math.floor(Math.random() * sampleResponses.length)]
      setCurrentTranscription(response)
      
      // Auto-submit after 3 seconds
      setTimeout(() => {
        handleUserSpeechEnd()
      }, 3000)
    }, 500)
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
    
    toast.success('Interview completed! Processing your results...')
    
    // In a real implementation, this would call the scoring API
    setTimeout(() => {
      router.push('/student/results')
    }, 2000)
  }

  const toggleMute = () => {
    setIsMuted(!isMuted)
    if (isMuted) {
      toast.success('Audio unmuted')
    } else {
      toast.success('Audio muted')
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
    <div className="min-h-screen bg-black text-white">
      {/* Background effects */}
      <div className="fixed inset-0 -z-10 cyber-grid opacity-20" />
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-gray-950/20 via-black to-gray-950/20" />
      
      <div className="relative z-10">
        <div className="container mx-auto px-6 py-8">
          {/* Navigation */}
          <nav className="flex justify-between items-center mb-8">
            <Link href="/student" className="inline-flex items-center text-gray-400 hover:text-white transition-colors group">
              <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
              End Interview
            </Link>
            <div className="flex items-center space-x-4">
              {/* Timer */}
              <div className="flex items-center space-x-2 glass-card-silver px-4 py-2 rounded-lg">
                <Clock className="w-4 h-4 text-gray-400" />
                <span className="font-mono text-sm">
                  {formatDuration(elapsedTime)} / 3:00
                </span>
              </div>
              {/* Mute button */}
              <button
                onClick={toggleMute}
                className="p-2 glass-card-silver rounded-lg hover:bg-white/10 transition-colors"
              >
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
            </div>
          </nav>

          <div className="max-w-4xl mx-auto">
            {/* Main Interview Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Transcript Panel */}
              <div className="lg:col-span-2">
                <div className="glass-card-silver p-6 metallic-border rounded-2xl h-[600px] flex flex-col">
                  <h2 className="text-xl font-semibold mb-4 silver-text">Interview Transcript</h2>
                  
                  <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                    {transcript.map((entry, index) => (
                      <div
                        key={index}
                        className={`flex ${entry.speaker === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] p-4 rounded-xl ${
                            entry.speaker === 'user'
                              ? 'bg-gradient-to-br from-gray-600 to-gray-800 text-white'
                              : 'glass-card-silver'
                          }`}
                        >
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="text-xs font-medium text-gray-300">
                              {entry.speaker === 'user' ? 'You' : 'AI Interviewer'}
                            </span>
                            <span className="text-xs text-gray-500">
                              {entry.timestamp.toLocaleTimeString()}
                            </span>
                          </div>
                          <p className="text-sm">{entry.text}</p>
                        </div>
                      </div>
                    ))}
                    
                    {/* Current transcription */}
                    {currentTranscription && (
                      <div className="flex justify-end">
                        <div className="max-w-[80%] p-4 rounded-xl bg-gradient-to-br from-gray-600/50 to-gray-800/50 text-white animate-pulse">
                          <p className="text-sm italic">{currentTranscription}</p>
                        </div>
                      </div>
                    )}
                    
                    {/* Processing indicator */}
                    {isProcessing && (
                      <div className="flex justify-start">
                        <div className="glass-card-silver p-4 rounded-xl">
                          <div className="flex items-center space-x-2">
                            <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                            <span className="text-sm text-gray-400">AI is thinking...</span>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div ref={transcriptEndRef} />
                  </div>
                </div>
              </div>

              {/* Controls Panel */}
              <div className="space-y-6">
                {/* Student Info */}
                <div className="glass-card-silver p-6 metallic-border rounded-2xl">
                  <h3 className="font-semibold mb-3">Session Info</h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-400">Name:</span>
                      <span className="ml-2">{sessionData.student.firstName}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Language:</span>
                      <span className="ml-2">{sessionData.student.targetLanguage.toUpperCase()}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Session ID:</span>
                      <span className="ml-2 text-xs font-mono">{sessionData.sessionId.slice(0, 8)}...</span>
                    </div>
                  </div>
                </div>

                {/* Recording Controls */}
                <div className="glass-card-silver p-6 metallic-border rounded-2xl">
                  <h3 className="font-semibold mb-4">Recording Controls</h3>
                  
                  {/* Microphone Button */}
                  <button
                    onClick={isRecording ? stopRecording : startRecording}
                    disabled={!isSessionActive || isProcessing}
                    className={`w-full relative group disabled:opacity-50 disabled:cursor-not-allowed mb-4`}
                  >
                    <div className={`absolute inset-0 rounded-xl blur opacity-75 transition duration-200 ${
                      isRecording 
                        ? 'bg-red-500 animate-pulse' 
                        : 'bg-gradient-to-r from-gray-600 to-gray-800 group-hover:opacity-100'
                    }`}></div>
                    <div className={`relative rounded-xl py-4 px-6 font-semibold flex items-center justify-center space-x-3 transition-transform ${
                      isRecording 
                        ? 'bg-red-500 text-white' 
                        : 'button-silver group-hover:scale-[1.02]'
                    }`}>
                      {isRecording ? (
                        <>
                          <MicOff className="w-5 h-5" />
                          <span>Stop Recording</span>
                        </>
                      ) : (
                        <>
                          <Mic className="w-5 h-5" />
                          <span>Start Recording</span>
                        </>
                      )}
                    </div>
                  </button>

                  {/* Status Indicator */}
                  <div className="flex items-center justify-center space-x-2 mb-4">
                    <div className={`w-3 h-3 rounded-full ${
                      isRecording ? 'bg-red-500 animate-pulse' : 'bg-gray-600'
                    }`} />
                    <span className="text-sm text-gray-400">
                      {isRecording ? 'Recording...' : 'Not recording'}
                    </span>
                  </div>

                  {/* Demo Speech Button */}
                  {isRecording && (
                    <button
                      onClick={simulateUserSpeech}
                      className="w-full px-4 py-2 glass-card-silver rounded-lg hover:bg-white/10 transition-colors text-sm"
                    >
                      🎭 Simulate Speech (Demo)
                    </button>
                  )}
                </div>

                {/* Instructions */}
                <div className="glass-card-silver p-4 rounded-xl">
                  <div className="flex items-start space-x-3">
                    <Sparkles className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-gray-400">
                      <p className="mb-2">Tips for best results:</p>
                      <ul className="space-y-1 text-xs">
                        <li>• Speak clearly and naturally</li>
                        <li>• Pause briefly after speaking</li>
                        <li>• Stay close to your microphone</li>
                        <li>• Minimize background noise</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 