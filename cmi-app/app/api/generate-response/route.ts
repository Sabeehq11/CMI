import { NextRequest, NextResponse } from 'next/server'
import { generateFollowUpQuestion, generateSpeech } from '@/lib/audio-processing'

export const runtime = 'nodejs'
export const maxDuration = 30

export async function POST(request: NextRequest) {
  try {
    const { transcript, rubric, language, sessionContext } = await request.json()

    if (!transcript || !Array.isArray(transcript)) {
      return NextResponse.json({ error: 'Invalid transcript data' }, { status: 400 })
    }

    console.log(`Generating response for ${transcript.length} messages in ${language}`)

    // Generate AI response
    const aiResponse = await generateFollowUpQuestion(
      transcript,
      rubric,
      language,
      sessionContext
    )

    // Generate speech audio
    const speechBuffer = await generateSpeech(aiResponse, language)
    const audioBase64 = speechBuffer.toString('base64')

    return NextResponse.json({
      response: aiResponse,
      audio: audioBase64,
      audioFormat: 'mp3',
      success: true
    })

  } catch (error) {
    console.error('Response generation API error:', error)
    return NextResponse.json({ 
      error: 'Failed to generate response',
      success: false,
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
