export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      students: {
        Row: {
          id: string
          first_name: string
          target_language: string
          created_at: string
        }
        Insert: {
          id?: string
          first_name: string
          target_language: string
          created_at?: string
        }
        Update: {
          id?: string
          first_name?: string
          target_language?: string
          created_at?: string
        }
      }
      rubrics: {
        Row: {
          id: string
          name: string
          language: string
          criteria: Json
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          language: string
          criteria: Json
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          language?: string
          criteria?: Json
          created_at?: string
        }
      }
      oral_sessions: {
        Row: {
          id: string
          student_id: string
          rubric_id: string
          started_at: string
          completed_at: string | null
          overall_score: number | null
          raw_transcript: Json | null
          audio_url: string | null
          score_breakdown: Json | null
        }
        Insert: {
          id?: string
          student_id: string
          rubric_id: string
          started_at?: string
          completed_at?: string | null
          overall_score?: number | null
          raw_transcript?: Json | null
          audio_url?: string | null
          score_breakdown?: Json | null
        }
        Update: {
          id?: string
          student_id?: string
          rubric_id?: string
          started_at?: string
          completed_at?: string | null
          overall_score?: number | null
          raw_transcript?: Json | null
          audio_url?: string | null
          score_breakdown?: Json | null
        }
      }
      questions: {
        Row: {
          id: string
          topic: string
          language: string
          difficulty: string
          question_text: string
          created_at: string
        }
        Insert: {
          id?: string
          topic: string
          language: string
          difficulty: string
          question_text: string
          created_at?: string
        }
        Update: {
          id?: string
          topic?: string
          language?: string
          difficulty?: string
          question_text?: string
          created_at?: string
        }
      }
    }
  }
}

export type Student = Database['public']['Tables']['students']['Row']
export type Rubric = Database['public']['Tables']['rubrics']['Row']
export type OralSession = Database['public']['Tables']['oral_sessions']['Row']
export type Question = Database['public']['Tables']['questions']['Row']

export type TranscriptEntry = {
  speaker: 'student' | 'ai'
  text: string
  timestamp?: number
}

export type RubricCriteria = {
  name: string
  weight: number
  description: string
  levels: {
    score: number
    description: string
  }[]
}

export type SessionScore = {
  overall_score: number
  criteria_scores: {
    [criterionName: string]: {
      score: number
      feedback: string
    }
  }
} 