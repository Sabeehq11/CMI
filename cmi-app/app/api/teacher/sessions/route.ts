import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    // Demo mode - return mock data if no Supabase URL is configured
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://your-project.supabase.co') {
      console.log('Running teacher sessions API in demo mode')
      
      const mockSessions = [
        {
          id: 'demo-session-1',
          student_id: 'demo-student-1',
          students: {
            first_name: 'Alice',
            target_language: 'en'
          },
          started_at: new Date(Date.now() - 86400000).toISOString(), // Yesterday
          completed_at: new Date(Date.now() - 86400000 + 180000).toISOString(), // 3 minutes later
          overall_score: 92,
          raw_transcript: [
            { speaker: 'AI', text: 'Hello! Can you introduce yourself?' },
            { speaker: 'S', text: 'Hi, I\'m Alice and I work as a marketing manager.' },
            { speaker: 'AI', text: 'That\'s great! What do you enjoy most about your work?' },
            { speaker: 'S', text: 'I love creating campaigns that connect with people emotionally.' }
          ],
          audio_url: null,
          score_breakdown: {
            accuracy: 90,
            fluency: 94,
            content: 92
          }
        },
        {
          id: 'demo-session-2',
          student_id: 'demo-student-2',
          students: {
            first_name: 'Carlos',
            target_language: 'es'
          },
          started_at: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
          completed_at: new Date(Date.now() - 3600000 + 180000).toISOString(),
          overall_score: 78,
          raw_transcript: [
            { speaker: 'AI', text: '¡Hola! ¿Puedes presentarte?' },
            { speaker: 'S', text: 'Hola, soy Carlos y soy estudiante de ingeniería.' },
            { speaker: 'AI', text: '¡Excelente! ¿Qué te gusta más de tus estudios?' },
            { speaker: 'S', text: 'Me gusta resolver problemas complejos y trabajar en equipo.' }
          ],
          audio_url: null,
          score_breakdown: {
            accuracy: 75,
            fluency: 80,
            content: 82
          }
        },
        {
          id: 'demo-session-3',
          student_id: 'demo-student-3',
          students: {
            first_name: 'Mohammed',
            target_language: 'ar'
          },
          started_at: new Date().toISOString(), // Now
          completed_at: null, // In progress
          overall_score: null,
          raw_transcript: [
            { speaker: 'AI', text: 'مرحبا! هل يمكنك أن تقدم نفسك؟' },
            { speaker: 'S', text: 'مرحبا، اسمي محمد وأعمل في مجال التكنولوجيا.' }
          ],
          audio_url: null,
          score_breakdown: null
        },
        {
          id: 'demo-session-4',
          student_id: 'demo-student-4',
          students: {
            first_name: 'Elena',
            target_language: 'ru'
          },
          started_at: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
          completed_at: new Date(Date.now() - 7200000 + 180000).toISOString(),
          overall_score: 85,
          raw_transcript: [
            { speaker: 'AI', text: 'Привет! Можете представиться?' },
            { speaker: 'S', text: 'Привет, меня зовут Елена, я работаю врачом.' },
            { speaker: 'AI', text: 'Замечательно! Что вам нравится в вашей профессии?' },
            { speaker: 'S', text: 'Мне нравится помогать людям и решать сложные медицинские задачи.' }
          ],
          audio_url: null,
          score_breakdown: {
            accuracy: 88,
            fluency: 82,
            content: 85
          }
        }
      ]

      // Apply filters (simplified for demo)
      const searchParams = request.nextUrl.searchParams
      const language = searchParams.get('language')
      const studentName = searchParams.get('studentName')

      let filteredSessions = mockSessions

      if (language && language !== 'all') {
        filteredSessions = filteredSessions.filter(s => s.students.target_language === language)
      }

      if (studentName) {
        filteredSessions = filteredSessions.filter(s => 
          s.students.first_name.toLowerCase().includes(studentName.toLowerCase())
        )
      }

      // Calculate statistics
      const completedSessions = filteredSessions.filter(s => s.completed_at)
      const stats = {
        totalSessions: filteredSessions.length,
        averageScore: completedSessions.length 
          ? Math.round(completedSessions.reduce((acc, s) => acc + (s.overall_score || 0), 0) / completedSessions.length)
          : 0,
        todaySessions: filteredSessions.filter(s => {
          const sessionDate = new Date(s.started_at).toDateString()
          const today = new Date().toDateString()
          return sessionDate === today
        }).length,
        highPerformers: completedSessions.filter(s => (s.overall_score || 0) >= 90).length
      }

      return NextResponse.json({
        sessions: filteredSessions,
        stats
      })
    }

    // Real Supabase implementation
    const supabase = await createServerSupabaseClient()

    // Get query parameters for filtering
    const searchParams = request.nextUrl.searchParams
    const language = searchParams.get('language')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const studentName = searchParams.get('studentName')

    // Build query
    let query = supabase
      .from('oral_sessions')
      .select(`
        *,
        students (
          first_name,
          target_language
        ),
        rubrics (
          name,
          language
        )
      `)
      .order('started_at', { ascending: false })

    // Apply filters
    if (language && language !== 'all') {
      query = query.eq('students.target_language', language)
    }

    if (dateFrom) {
      query = query.gte('started_at', dateFrom)
    }

    if (dateTo) {
      query = query.lte('started_at', dateTo)
    }

    if (studentName) {
      query = query.ilike('students.first_name', `%${studentName}%`)
    }

    const { data: sessions, error } = await query

    if (error) {
      console.error('Error fetching sessions:', error)
      return NextResponse.json(
        { error: 'Failed to fetch sessions' },
        { status: 500 }
      )
    }

    // Calculate statistics
    const stats = {
      totalSessions: sessions?.length || 0,
      averageScore: sessions?.length 
        ? Math.round(sessions.reduce((acc, s) => acc + (s.overall_score || 0), 0) / sessions.length)
        : 0,
      todaySessions: sessions?.filter(s => {
        const sessionDate = new Date(s.started_at).toDateString()
        const today = new Date().toDateString()
        return sessionDate === today
      }).length || 0,
      highPerformers: sessions?.filter(s => (s.overall_score || 0) >= 90).length || 0
    }

    return NextResponse.json({
      sessions: sessions || [],
      stats
    })
  } catch (error) {
    console.error('Error in teacher sessions API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 