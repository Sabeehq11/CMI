'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Mic, MicOff, Loader2, Volume2, VolumeX, Clock, Sparkles, MessageSquare, User, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { formatDuration } from '@/lib/utils'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  SimpleAudioRecorder, 
  transcribeAudioBlob, 
  generateAIResponse, 
  playAudioFromBase64 
} from '@/lib/simple-recorder'

export const dynamic = 'force-dynamic'

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

export default function SimpleInterviewPage() {
  const router = useRouter()
  const [sessionData, setSessionData] = useState<SessionData | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [isSessionActive, setIsSessionActive] = useState(false)
  const [processingMessage, setProcessingMessage] = useState('')
  const [aiState, setAiState] = useState<'idle' | 'listening' | 'thinking' | 'speaking'>('idle')
  const [error, setError] = useState<string | null>(null)
  
  const recorderRef = useRef<SimpleAudioRecorder | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const transcriptEndRef = useRef<HTMLDivElement>(null)

  // Load session data and initialize
  useEffect(() => {
    const initializeSession = async () => {
      const storedSession = sessionStorage.getItem('currentSession')
      if (!storedSession) {
        setError('No session found. Please start a new assessment.')
        return
      }
      
      const data = JSON.parse(storedSession) as SessionData
      setSessionData(data)
      
      // Start with demo session
      const demoData = {
        ...data,
        sessionId: `demo-${Date.now()}`,
        initialQuestion: getInitialQuestion(data.student.targetLanguage)
      }
      setSessionData(demoData)
      
      // Add initial AI question to transcript
      if (demoData.initialQuestion) {
        setTranscript([{
          speaker: 'ai',
          text: demoData.initialQuestion,
          timestamp: new Date()
        }])
        
        // Play initial question
        if (!isMuted) {
          speakText(demoData.initialQuestion)
        }
      }
      
      // Initialize audio recorder
      try {
        const recorder = new SimpleAudioRecorder({
          onDataAvailable: handleAudioData,
          onError: handleRecorderError
        })
        await recorder.initialize()
        recorderRef.current = recorder
        setIsSessionActive(true)
        setError(null)
      } catch (error) {
        console.error('Failed to initialize recorder:', error)
        setError('Failed to access microphone. Please check permissions and try again.')
      }
    }

    initializeSession()

    return () => {
      recorderRef.current?.cleanup()
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [])

  // Auto-scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [transcript])

  // Timer for elapsed time
  useEffect(() => {
    if (isSessionActive && !isProcessing) {
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
  }, [isSessionActive, isProcessing])

  const getInitialQuestion = (language: string): string => {
    const questions = {
      'en': "Hello! I'm your AI interviewer. Could you please introduce yourself and tell me a bit about your background?",
      'es': "¡Hola! Soy tu entrevistador de IA. ¿Podrías presentarte y contarme un poco sobre tu trasfondo?",
      'ar': "مرحبا! أنا مقابلك الذكي. هل يمكنك أن تقدم نفسك وتخبرني قليلا عن خلفيتك؟",
      'ru': "Привет! Я ваш ИИ-интервьюер. Не могли бы вы представиться и рассказать немного о своем опыте?",
      'uk': "Привіт! Я ваш ШІ-інтерв'юер. Чи могли б ви представитися та розповісти трохи про свій досвід?"
    }
    return questions[language as keyof typeof questions] || questions.en
  }

  const handleAudioData = async (audioBlob: Blob) => {
    if (isProcessing) return

    setIsProcessing(true)
    setProcessingMessage('Transcribing your speech...')
    setAiState('thinking')

    try {
      console.log('Processing audio blob:', audioBlob.size, 'bytes', audioBlob.type)
      
      // Transcribe audio
      const transcription = await transcribeAudioBlob(
        audioBlob, 
        sessionData?.student.targetLanguage || 'en'
      )

      if (!transcription.trim()) {
        console.log('Empty transcription, skipping')
        setIsProcessing(false)
        setProcessingMessage('')
        setAiState('idle')
        return
      }

      console.log('Transcription result:', transcription)

      // Add to transcript
      const userEntry: TranscriptEntry = {
        speaker: 'user',
        text: transcription,
        timestamp: new Date()
      }
      setTranscript(prev => [...prev, userEntry])

      // Generate AI response
      setProcessingMessage('Generating AI response...')
      
      const response = await generateAIResponse(
        [...transcript, userEntry],
        getDemoRubric(sessionData?.student.targetLanguage || 'en'),
        sessionData?.student.targetLanguage || 'en',
        { sessionId: sessionData?.sessionId }
      )

      // Add AI response to transcript
      const aiEntry: TranscriptEntry = {
        speaker: 'ai',
        text: response.response,
        timestamp: new Date()
      }
      setTranscript(prev => [...prev, aiEntry])

      // Play AI response
      setProcessingMessage('Playing AI response...')
      setAiState('speaking')
      
      if (!isMuted) {
        await playAudioFromBase64(response.audio, response.audioFormat)
      }

      setProcessingMessage('')
      setAiState('idle')
      
    } catch (error) {
      console.error('Error processing audio:', error)
      toast.error('Failed to process your speech. Please try again.')
      setAiState('idle')
    } finally {
      setIsProcessing(false)
      setProcessingMessage('')
    }
  }

  const handleRecorderError = (error: Error) => {
    console.error('Recorder error:', error)
    toast.error('Recording error: ' + error.message)
    setIsRecording(false)
    setAiState('idle')
  }

  const startRecording = () => {
    if (!recorderRef.current || isProcessing) {
      toast.error('Recorder not ready or currently processing')
      return
    }

    recorderRef.current.startRecording()
    setIsRecording(true)
    setAiState('listening')
  }

  const stopRecording = () => {
    if (!recorderRef.current || !isRecording) return

    recorderRef.current.stopRecording()
    setIsRecording(false)
    setAiState('thinking')
  }

  const speakText = async (text: string) => {
    if ('speechSynthesis' in window && !isMuted) {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = sessionData?.student.targetLanguage || 'en'
      utterance.rate = 1.0
      utterance.pitch = 1.0
      window.speechSynthesis.speak(utterance)
    }
  }

  const endSession = async () => {
    setIsSessionActive(false)
    if (isRecording) {
      stopRecording()
    }
    
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }
    
    toast.success('Interview completed! Processing your results...')
    
    setTimeout(() => {
      router.push('/student/results')
    }, 2000)
  }

  const toggleMute = () => {
    setIsMuted(!isMuted)
    toast.success(isMuted ? 'Audio enabled' : 'Audio muted')
  }

  const getDemoRubric = (language: string) => ({
    name: 'Basic Conversation Assessment',
    language,
    criteria: [
      { name: 'Accuracy', weight: 0.3, description: 'Grammar and vocabulary correctness' },
      { name: 'Fluency', weight: 0.3, description: 'Speech flow and natural expression' },
      { name: 'Content', weight: 0.4, description: 'Relevance and coherence of responses' }
    ]
  })

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="glass-card-silver p-8 rounded-xl max-w-md text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-4">Session Error</h2>
          <p className="text-gray-300 mb-6">{error}</p>
          <Link 
            href="/student"
            className="inline-flex items-center px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Student Portal
          </Link>
        </div>
      </div>
    )
  }

  if (!sessionData) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    )
  }

  // Simple AI avatar component
  const AIAvatar = ({ state }: { state: string }) => (
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

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-950 via-black to-gray-950" />
      </div>
      
      <div className="relative z-10 h-screen flex flex-col">
        {/* Top bar */}
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
                <div className="w-2 h-2 rounded-full bg-green-400" />
                <span className="text-gray-400">Ready</span>
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

        {/* Main content */}
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
                
                {/* Processing indicator */}
                {isProcessing && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-start"
                  >
                    <div className="glass-card-silver p-3 rounded-xl">
                      <div className="flex items-center space-x-2">
                        <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                        <span className="text-sm text-gray-400">
                          {processingMessage || 'Processing...'}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )}
                
                <div ref={transcriptEndRef} />
              </div>
            </div>
          </div>

          {/* Center - AI Avatar */}
          <div className="flex-1 flex items-center justify-center">
            <div className="w-full h-full max-w-2xl max-h-[600px] relative">
              <AIAvatar state={aiState} />
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
                  <span>Hold to speak, release when done</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Recording button */}
            <motion.button
              onMouseDown={startRecording}
              onMouseUp={stopRecording}
              onTouchStart={startRecording}
              onTouchEnd={stopRecording}
              disabled={!isSessionActive || isProcessing}
              className={`relative group disabled:opacity-50 disabled:cursor-not-allowed select-none`}
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

            {/* Instructions */}
            {isProcessing && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center text-sm text-gray-400"
              >
                {processingMessage}
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
