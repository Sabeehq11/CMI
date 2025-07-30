import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionId = params.id
    const supabase = await createServerSupabaseClient()

    // Get session data with rubric
    const { data: session, error: sessionError } = await supabase
      .from('oral_sessions')
      .select(`
        *,
        rubrics (
          criteria
        )
      `)
      .eq('id', sessionId)
      .single()

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    if (!session.raw_transcript) {
      return NextResponse.json(
        { error: 'No transcript available for scoring' },
        { status: 400 }
      )
    }

    // Prepare rubric criteria for GPT
    const rubricCriteria = session.rubrics.criteria
    const criteriaPrompt = rubricCriteria.map((c: any) => 
      `${c.name} (${(c.weight * 100).toFixed(0)}% weight): ${c.description}`
    ).join('\n')

    // Create scoring prompt
    const scoringPrompt = `
You are an expert language assessor. Score the following oral interview transcript based on the provided rubric criteria.

RUBRIC CRITERIA:
${criteriaPrompt}

TRANSCRIPT:
${JSON.stringify(session.raw_transcript, null, 2)}

For each criterion, provide:
1. A score from 0-100
2. Specific examples from the transcript supporting your score
3. Brief feedback for improvement

Also provide an overall weighted score based on the criterion weights.

Return your response in the following JSON format:
{
  "overall_score": <number>,
  "criteria_scores": {
    "<criterion_name>": {
      "score": <number>,
      "examples": ["example1", "example2"],
      "feedback": "specific feedback"
    }
  },
  "general_feedback": "overall performance summary and key areas for improvement"
}
`

    // Call GPT-4 for scoring
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: "You are an expert language assessment specialist with deep knowledge of CEFR levels and oral proficiency evaluation."
        },
        {
          role: "user",
          content: scoringPrompt
        }
      ],
      temperature: 0.3,
      response_format: { type: "json_object" }
    })

    const scoringResult = JSON.parse(completion.choices[0].message.content || '{}')

    // Update session with scores
    const { error: updateError } = await supabase
      .from('oral_sessions')
      .update({
        overall_score: scoringResult.overall_score,
        score_breakdown: scoringResult.criteria_scores,
        completed_at: new Date().toISOString()
      })
      .eq('id', sessionId)

    if (updateError) {
      console.error('Error updating session scores:', updateError)
      return NextResponse.json(
        { error: 'Failed to save scores' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      session_id: sessionId,
      overall_score: scoringResult.overall_score,
      criteria_scores: scoringResult.criteria_scores,
      feedback: scoringResult.general_feedback,
      completed_at: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error scoring session:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 