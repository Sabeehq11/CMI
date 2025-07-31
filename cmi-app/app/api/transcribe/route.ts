import { NextRequest, NextResponse } from 'next/server'
import { transcribeAudio } from '@/lib/audio-processing'

export const runtime = 'nodejs'
export const maxDuration = 30

export async function POST(request: NextRequest) {
  try {
    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ 
        error: 'OpenAI API key not configured',
        success: false,
        details: 'Please set OPENAI_API_KEY in your .env file'
      }, { status: 500 })
    }

    const formData = await request.formData()
    const audioFile = formData.get('audio') as File
    const language = formData.get('language') as string || 'en'

    if (!audioFile) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 })
    }

    // Check file size (OpenAI has 25MB limit)
    if (audioFile.size > 25 * 1024 * 1024) {
      return NextResponse.json({ 
        error: 'Audio file too large (max 25MB)',
        success: false 
      }, { status: 400 })
    }

    // Convert file to buffer
    const arrayBuffer = await audioFile.arrayBuffer()
    const audioBuffer = Buffer.from(arrayBuffer)

    console.log(`Transcribing audio: ${audioBuffer.length} bytes, language: ${language}`)

    // Transcribe the audio
    const transcription = await transcribeAudio(audioBuffer, language)

    return NextResponse.json({ 
      transcription,
      success: true,
      audioSize: audioBuffer.length
    })

  } catch (error) {
    console.error('Transcription API error:', error)
    return NextResponse.json({ 
      error: 'Failed to transcribe audio',
      success: false,
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
