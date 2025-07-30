import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { SUPPORTED_LANGUAGES } from '@/lib/utils'

export async function POST(request: NextRequest) {
  try {
    const { student_id, target_language, rubric_id, first_name } = await request.json()

    // Validate input
    if (!target_language || !SUPPORTED_LANGUAGES.some(lang => lang.code === target_language)) {
      return NextResponse.json(
        { error: 'Invalid target language' },
        { status: 400 }
      )
    }

    // Demo mode - return mock data if no Supabase URL is configured
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://your-project.supabase.co') {
      console.log('Running in demo mode - no Supabase configured')
      
      const mockSession = {
        session_id: 'demo-session-' + Date.now(),
        student_id: 'demo-student-' + Date.now(),
        language: target_language,
        rubric: {
          name: 'Basic Conversation Assessment',
          language: target_language,
          criteria: [
            { name: 'Accuracy', weight: 0.3, description: 'Grammar and vocabulary correctness' },
            { name: 'Fluency', weight: 0.3, description: 'Speech flow and natural expression' },
            { name: 'Content', weight: 0.4, description: 'Relevance and coherence of responses' }
          ]
        },
        initial_question: getInitialQuestion(target_language),
        session_data: {
          id: 'demo-session-' + Date.now(),
          student_name: first_name,
          started_at: new Date().toISOString()
        }
      }

      return NextResponse.json(mockSession)
    }

    // Real Supabase implementation
    const supabase = await createServerSupabaseClient()

    // If no student_id provided, create a new student
    let actualStudentId = student_id
    if (!actualStudentId && first_name) {
      const { data: newStudent, error: studentError } = await supabase
        .from('students')
        .insert({
          first_name,
          target_language
        })
        .select()
        .single()

      if (studentError) {
        console.error('Error creating student:', studentError)
        return NextResponse.json(
          { error: 'Failed to create student' },
          { status: 500 }
        )
      }

      actualStudentId = newStudent.id
    }

    // Get default rubric if not provided
    let actualRubricId = rubric_id
    if (!actualRubricId) {
      const { data: defaultRubric, error: rubricError } = await supabase
        .from('rubrics')
        .select('id')
        .eq('language', target_language)
        .limit(1)
        .single()

      if (rubricError || !defaultRubric) {
        console.error('Error fetching rubric:', rubricError)
        return NextResponse.json(
          { error: 'No rubric available for this language' },
          { status: 404 }
        )
      }

      actualRubricId = defaultRubric.id
    }

    // Create new session
    const { data: session, error: sessionError } = await supabase
      .from('oral_sessions')
      .insert({
        student_id: actualStudentId,
        rubric_id: actualRubricId
      })
      .select(`
        *,
        students (
          first_name,
          target_language
        ),
        rubrics (
          name,
          language,
          criteria
        )
      `)
      .single()

    if (sessionError) {
      console.error('Error creating session:', sessionError)
      return NextResponse.json(
        { error: 'Failed to create session' },
        { status: 500 }
      )
    }

    // Get initial question
    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select('*')
      .eq('language', target_language)
      .eq('difficulty', 'beginner')
      .limit(5)

    if (questionsError || !questions || questions.length === 0) {
      console.error('Error fetching questions:', questionsError)
      return NextResponse.json(
        { error: 'No questions available for this language' },
        { status: 404 }
      )
    }

    // Select a random question
    const initialQuestion = questions[Math.floor(Math.random() * questions.length)]

    return NextResponse.json({
      session_id: session.id,
      student_id: actualStudentId,
      language: target_language,
      rubric: session.rubrics,
      initial_question: initialQuestion.question_text,
      session_data: session
    })
  } catch (error) {
    console.error('Error in session start:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function getInitialQuestion(language: string): string {
  const questions = {
    'en': "Hello! I'm your AI interviewer. Can you please introduce yourself and tell me a bit about your background?",
    'es': "¡Hola! Soy tu entrevistador de IA. ¿Puedes presentarte y contarme un poco sobre tu experiencia?",
    'ar': "مرحبا! أنا المحاور الذكي الخاص بك. هل يمكنك أن تقدم نفسك وتخبرني قليلاً عن خلفيتك؟",
    'ru': "Привет! Я ваш ИИ-интервьюер. Можете ли вы представиться и рассказать немного о своем опыте?",
    'uk': "Привіт! Я ваш ШІ-інтерв'юер. Чи можете ви представитися і розповісти трохи про свій досвід?"
  }
  
  return questions[language as keyof typeof questions] || questions['en']
} 