import { NextRequest, NextResponse } from 'next/server'
import { SUPPORTED_LANGUAGES } from '@/lib/utils'

export async function POST(request: NextRequest) {
  console.log('Session start API called')
  
  // Check if we should run in demo mode first
  const isDemoMode = !process.env.FIREBASE_SERVICE_ACCOUNT_KEY || 
                     !process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 
                     process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID === 'your_firebase_project_id'
  
  console.log('Demo mode:', isDemoMode)
  console.log('FIREBASE_SERVICE_ACCOUNT_KEY exists:', !!process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
  
  try {
    const { student_id, target_language, rubric_id, first_name } = await request.json()
    console.log('Request data:', { student_id, target_language, rubric_id, first_name })

    // Validate input
    if (!target_language || !SUPPORTED_LANGUAGES.some(lang => lang.code === target_language)) {
      return NextResponse.json(
        { error: 'Invalid target language' },
        { status: 400 }
      )
    }

    // Demo mode - return mock data if Firebase is not configured
    if (isDemoMode) {
      console.log('Running in demo mode - Firebase not fully configured')
      
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
          student_name: first_name || 'Demo User',
          started_at: new Date().toISOString()
        }
      }

      return NextResponse.json(mockSession)
    }

    // Real Firebase implementation - only import if not in demo mode
    const { createStudentServer, getDefaultRubric } = await import('@/lib/firebase/database')
    const { adminDb } = await import('@/lib/firebase/admin')

    let actualStudentId = student_id

    // If no student_id provided, create a new student
    if (!actualStudentId && first_name) {
      try {
        actualStudentId = await createStudentServer({
          firstName: first_name,
          targetLanguage: target_language
        })
      } catch (error) {
        console.error('Error creating student:', error)
        return NextResponse.json(
          { error: 'Failed to create student' },
          { status: 500 }
        )
      }
    }

    // Get default rubric if not provided
    let actualRubricId = rubric_id
    if (!actualRubricId) {
      try {
        const defaultRubric = await getDefaultRubric(target_language)
        if (!defaultRubric) {
          return NextResponse.json(
            { error: 'No rubric available for this language' },
            { status: 404 }
          )
        }
        actualRubricId = defaultRubric.id
      } catch (error) {
        console.error('Error fetching rubric:', error)
        return NextResponse.json(
          { error: 'Failed to fetch rubric' },
          { status: 500 }
        )
      }
    }

    // Create new session
    let sessionId: string
    try {
      sessionId = await adminDb.collection('sessions').add({
        studentId: actualStudentId,
        rubricId: actualRubricId,
        startedAt: new Date()
      }).then((doc: any) => doc.id)
    } catch (error) {
      console.error('Error creating session:', error)
      return NextResponse.json(
        { error: 'Failed to create session' },
        { status: 500 }
      )
    }

    // Get session details
    const [sessionDoc, studentDoc, rubricDoc] = await Promise.all([
      adminDb.collection('sessions').doc(sessionId).get(),
      adminDb.collection('students').doc(actualStudentId).get(),
      adminDb.collection('rubrics').doc(actualRubricId).get()
    ])

    if (!sessionDoc.exists || !studentDoc.exists || !rubricDoc.exists) {
      return NextResponse.json(
        { error: 'Failed to retrieve session details' },
        { status: 500 }
      )
    }

    const session = { id: sessionDoc.id, ...sessionDoc.data() }
    const student = { id: studentDoc.id, ...studentDoc.data() } as any
    const rubric = { id: rubricDoc.id, ...rubricDoc.data() }

    // Get initial question
    const initialQuestion = getInitialQuestionFromRubric(target_language)

    return NextResponse.json({
      session_id: sessionId,
      student_id: actualStudentId,
      language: target_language,
      rubric: rubric,
      initial_question: initialQuestion,
      session_data: {
        ...session,
        student_name: student.firstName
      }
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

function getInitialQuestionFromRubric(language: string): string {
  // This could be enhanced to select questions based on rubric criteria
  return getInitialQuestion(language)
} 