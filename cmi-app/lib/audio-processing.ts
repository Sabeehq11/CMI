import { createServerSupabaseClient } from '@/lib/supabase/server'
import OpenAI from 'openai'

function getOpenAIClient() {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  })
}

// Audio processing utilities
export async function transcribeAudio(audioBuffer: Buffer, language: string = 'en'): Promise<string> {
  try {
    // Create a temporary file-like object for OpenAI
    const audioFile = new File([audioBuffer], 'audio.webm', { type: 'audio/webm' })
    
    const openai = getOpenAIClient()
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language: language, // Use the provided language code
      response_format: 'text'
    })
    
    return transcription
  } catch (error) {
    console.error('Transcription error:', error)
    throw new Error('Failed to transcribe audio')
  }
}

export async function generateFollowUpQuestion(
  transcript: Array<{ speaker: string; text: string }>,
  rubric: any,
  language: string,
  sessionContext: any
): Promise<string> {
  try {
    const conversationHistory = transcript
      .map(entry => `${entry.speaker === 'student' ? 'Student' : 'AI'}: ${entry.text}`)
      .join('\n')

    const criteriaDescription = rubric.criteria
      .map((c: any) => `${c.name} (${(c.weight * 100).toFixed(0)}% weight): ${c.description}`)
      .join('\n')

    const prompt = `You are an expert language interviewer conducting a 3-minute oral assessment in ${language}.

RUBRIC CRITERIA:
${criteriaDescription}

CONVERSATION SO FAR:
${conversationHistory}

Based on the student's responses and the rubric criteria, generate the next follow-up question that will:
1. Assess the student's proficiency in the target language
2. Be appropriate for their demonstrated level
3. Help evaluate the rubric criteria
4. Keep the conversation natural and engaging
5. Be in the target language (${language})

Respond with ONLY the question text, no additional formatting or explanation.`

    const openai = getOpenAIClient()
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: "You are an expert language assessment interviewer. Generate natural, appropriate follow-up questions based on student responses and assessment criteria."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 150
    })

    return completion.choices[0].message.content?.trim() || "Can you tell me more about that?"
  } catch (error) {
    console.error('Error generating follow-up question:', error)
    return "Can you tell me more about that?"
  }
}

export async function generateSpeech(text: string, language: string = 'en'): Promise<Buffer> {
  try {
    // Use ElevenLabs for high-quality TTS
    const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY
    if (!ELEVENLABS_API_KEY) {
      throw new Error('ElevenLabs API key not configured')
    }

    // Voice IDs for different languages (you can customize these)
    const voiceIds = {
      'en': 'pNInz6obpgDQGcFmaJgB', // Adam (English)
      'es': '9BWtsMINqrJLrRacOk9x', // Aria (Spanish)
      'ar': 'yoZ06aMxZJJ28mfd3POQ', // Sam (Arabic)
      'ru': 'Yko7PKHZNXotIFUBG7I9', // Antoni (Russian)
      'uk': 'EXAVITQu4vr4xnSDxMaL'  // Elli (Ukrainian)
    }

    const voiceId = voiceIds[language as keyof typeof voiceIds] || voiceIds['en']

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': ELEVENLABS_API_KEY
      },
      body: JSON.stringify({
        text: text,
        model_id: 'eleven_flash_v2', // Fast model for real-time
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5
        }
      })
    })

    if (!response.ok) {
      throw new Error(`ElevenLabs API error: ${response.status}`)
    }

    const audioBuffer = await response.arrayBuffer()
    return Buffer.from(audioBuffer)
  } catch (error) {
    console.error('TTS error:', error)
    
    // Fallback to OpenAI TTS
    try {
      const openai = getOpenAIClient()
      const mp3 = await openai.audio.speech.create({
        model: "tts-1",
        voice: "alloy",
        input: text,
      })
      
      const buffer = Buffer.from(await mp3.arrayBuffer())
      return buffer
    } catch (fallbackError) {
      console.error('Fallback TTS error:', fallbackError)
      throw new Error('Failed to generate speech')
    }
  }
}

// Update session transcript in database
export async function updateSessionTranscript(
  sessionId: string,
  transcript: Array<{ speaker: string; text: string; timestamp: Date }>,
  supabaseClient?: any
) {
  try {
    // Use provided client or create one
    let supabase = supabaseClient
    if (!supabase) {
      supabase = await createServerSupabaseClient()
    }
    
    const { error } = await supabase
      .from('oral_sessions')
      .update({
        raw_transcript: transcript
      })
      .eq('id', sessionId)

    if (error) {
      console.error('Error updating transcript:', error)
      throw error
    }
  } catch (error) {
    console.error('Failed to update session transcript:', error)
    throw error
  }
} 