import { WebSocketServer, WebSocket } from 'ws'
import { transcribeAudio, generateFollowUpQuestion, generateSpeech, updateSessionTranscript } from './lib/audio-processing'
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// Load environment variables from .env
config({ path: '.env' })

interface SessionConnection {
  ws: WebSocket
  sessionId: string
  studentId: string
  language: string
  rubric: any
  transcript: Array<{ speaker: string; text: string; timestamp: Date }>
  audioChunks: Buffer[]
  isProcessing: boolean
  silenceTimer?: NodeJS.Timeout
  isDemo?: boolean
}

const connections = new Map<string, SessionConnection>()

// Create Supabase client for standalone server
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

let supabase: any = null
let isDemoMode = false

// Check if we should run in demo mode
if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('your-project') || supabaseKey === 'placeholder') {
  console.log('Running WebSocket server in DEMO MODE - Supabase not configured')
  isDemoMode = true
} else {
  supabase = createClient(supabaseUrl, supabaseKey)
}

const PORT = 3001

console.log('Starting WebSocket server on port', PORT)
console.log('Mode:', isDemoMode ? 'DEMO' : 'PRODUCTION')

const wss = new WebSocketServer({ 
  port: PORT,
  path: '/websocket'
})

wss.on('connection', async (ws: WebSocket) => {
  console.log('New WebSocket connection established')

  ws.on('message', async (data: Buffer) => {
    try {
      const message = JSON.parse(data.toString())
      await handleWebSocketMessage(ws, message)
    } catch (error) {
      console.error('Error handling WebSocket message:', error)
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Failed to process message'
      }))
    }
  })

  ws.on('close', () => {
    // Clean up connection
    for (const [sessionId, connection] of connections.entries()) {
      if (connection.ws === ws) {
        if (connection.silenceTimer) {
          clearTimeout(connection.silenceTimer)
        }
        connections.delete(sessionId)
        console.log(`Connection closed for session: ${sessionId}`)
        break
      }
    }
  })

  ws.on('error', (error) => {
    console.error('WebSocket error:', error)
  })
})

async function handleWebSocketMessage(ws: WebSocket, message: any) {
  const { type, sessionId, data } = message

  switch (type) {
    case 'join_session':
      await handleJoinSession(ws, sessionId, data)
      break
    
    case 'audio_chunk':
      await handleAudioChunk(sessionId, Buffer.from(data.audio, 'base64'))
      break
    
    case 'audio_end':
      await handleAudioEnd(sessionId)
      break
    
    case 'ping':
      ws.send(JSON.stringify({ type: 'pong' }))
      break
    
    default:
      console.warn('Unknown message type:', type)
  }
}

async function handleJoinSession(ws: WebSocket, sessionId: string, data: any) {
  try {
    // Handle demo sessions
    if (isDemoMode || sessionId.startsWith('demo-')) {
      console.log('Handling demo session:', sessionId)
      
      // Use data passed from client for demo sessions
      const language = data?.language || 'en'
      const rubric = data?.rubric || {
        name: 'Basic Conversation Assessment',
        language: language,
        criteria: [
          { name: 'Accuracy', weight: 0.3, description: 'Grammar and vocabulary correctness' },
          { name: 'Fluency', weight: 0.3, description: 'Speech flow and natural expression' },
          { name: 'Content', weight: 0.4, description: 'Relevance and coherence of responses' }
        ]
      }
      
      // Store demo connection
      connections.set(sessionId, {
        ws,
        sessionId,
        studentId: data?.studentId || 'demo-student',
        language,
        rubric,
        transcript: [],
        audioChunks: [],
        isProcessing: false,
        isDemo: true
      })

      ws.send(JSON.stringify({
        type: 'session_joined',
        sessionId,
        language,
        rubric,
        data: { demo: true }
      }))

      console.log(`Demo client joined session: ${sessionId}`)
      return
    }

    // Production mode - use Supabase
    if (!supabase) {
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Database not configured'
      }))
      return
    }

    // Get session details from Supabase
    const { data: session, error } = await supabase
      .from('oral_sessions')
      .select(`
        *,
        students (
          id,
          first_name,
          target_language
        ),
        rubrics (
          name,
          language,
          criteria
        )
      `)
      .eq('id', sessionId)
      .single()

    if (error || !session) {
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Session not found'
      }))
      return
    }

    // Store connection
    connections.set(sessionId, {
      ws,
      sessionId,
      studentId: session.student_id,
      language: session.students.target_language,
      rubric: session.rubrics,
      transcript: session.raw_transcript || [],
      audioChunks: [],
      isProcessing: false
    })

    ws.send(JSON.stringify({
      type: 'session_joined',
      sessionId,
      language: session.students.target_language,
      rubric: session.rubrics
    }))

    console.log(`Client joined session: ${sessionId}`)
  } catch (error) {
    console.error('Error joining session:', error)
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Failed to join session'
    }))
  }
}

async function handleAudioChunk(sessionId: string, audioChunk: Buffer) {
  const connection = connections.get(sessionId)
  if (!connection) {
    console.error('No connection found for session:', sessionId)
    return
  }

  // Add audio chunk to buffer
  connection.audioChunks.push(audioChunk)

  // Send real-time feedback that audio is being received
  connection.ws.send(JSON.stringify({
    type: 'processing',
    message: 'Listening...'
  }))

  // Reset silence timer
  if (connection.silenceTimer) {
    clearTimeout(connection.silenceTimer)
  }

  // Set new silence timer (1 second of silence triggers processing)
  connection.silenceTimer = setTimeout(() => {
    processAudioBuffer(sessionId)
  }, 1000)
}

async function handleAudioEnd(sessionId: string) {
  const connection = connections.get(sessionId)
  if (!connection) {
    return
  }

  if (connection.silenceTimer) {
    clearTimeout(connection.silenceTimer)
  }

  await processAudioBuffer(sessionId)
}

async function processAudioBuffer(sessionId: string) {
  const connection = connections.get(sessionId)
  if (!connection || connection.isProcessing || connection.audioChunks.length === 0) {
    return
  }

  connection.isProcessing = true

  try {
    // Combine audio chunks
    const audioBuffer = Buffer.concat(connection.audioChunks)
    connection.audioChunks = [] // Clear buffer

    // Send processing status
    connection.ws.send(JSON.stringify({
      type: 'processing',
      message: 'Transcribing audio...'
    }))

    // Transcribe audio
    const transcription = await transcribeAudio(audioBuffer, connection.language)
    
    if (!transcription.trim()) {
      connection.isProcessing = false
      return
    }

    // Add student response to transcript
    const studentEntry = {
      speaker: 'student',
      text: transcription,
      timestamp: new Date()
    }
    connection.transcript.push(studentEntry)

    // Send transcription to client
    connection.ws.send(JSON.stringify({
      type: 'transcription',
      text: transcription,
      speaker: 'student'
    }))

    // Generate AI follow-up question
    connection.ws.send(JSON.stringify({
      type: 'processing',
      message: 'Generating response...'
    }))

    const followUpQuestion = await generateFollowUpQuestion(
      connection.transcript,
      connection.rubric,
      connection.language,
      { sessionId }
    )

    // Add AI response to transcript
    const aiEntry = {
      speaker: 'ai',
      text: followUpQuestion,
      timestamp: new Date()
    }
    connection.transcript.push(aiEntry)

    // Send AI question to client
    connection.ws.send(JSON.stringify({
      type: 'ai_response',
      text: followUpQuestion,
      speaker: 'ai'
    }))

    // Generate speech
    connection.ws.send(JSON.stringify({
      type: 'processing',
      message: 'Generating speech...'
    }))

    const speechBuffer = await generateSpeech(followUpQuestion, connection.language)

    // Send audio to client
    connection.ws.send(JSON.stringify({
      type: 'ai_audio',
      audio: speechBuffer.toString('base64'),
      format: 'mp3'
    }))

    // Update database with transcript (skip for demo sessions)
    if (!connection.isDemo && supabase) {
      await updateSessionTranscript(sessionId, connection.transcript, supabase)
    }

    connection.ws.send(JSON.stringify({
      type: 'ready',
      message: 'Ready for next input'
    }))

  } catch (error) {
    console.error('Error processing audio:', error)
    connection.ws.send(JSON.stringify({
      type: 'error',
      message: 'Failed to process audio'
    }))
  } finally {
    connection.isProcessing = false
  }
}

console.log(`WebSocket server running on ws://localhost:${PORT}/websocket`) 