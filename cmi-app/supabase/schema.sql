-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Students table
CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name TEXT NOT NULL,
    target_language TEXT NOT NULL CHECK (target_language IN ('en', 'es', 'ar', 'ru', 'uk')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rubrics table
CREATE TABLE rubrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    language TEXT NOT NULL CHECK (language IN ('en', 'es', 'ar', 'ru', 'uk')),
    criteria JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Questions table
CREATE TABLE questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    topic TEXT NOT NULL,
    language TEXT NOT NULL CHECK (language IN ('en', 'es', 'ar', 'ru', 'uk')),
    difficulty TEXT NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
    question_text TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Oral sessions table
CREATE TABLE oral_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    rubric_id UUID NOT NULL REFERENCES rubrics(id) ON DELETE CASCADE,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    overall_score REAL CHECK (overall_score >= 0 AND overall_score <= 100),
    raw_transcript JSONB,
    audio_url TEXT,
    score_breakdown JSONB,
    CONSTRAINT valid_session_times CHECK (completed_at IS NULL OR completed_at > started_at)
);

-- Indexes for better query performance
CREATE INDEX idx_students_language ON students(target_language);
CREATE INDEX idx_rubrics_language ON rubrics(language);
CREATE INDEX idx_questions_language_difficulty ON questions(language, difficulty);
CREATE INDEX idx_sessions_student ON oral_sessions(student_id);
CREATE INDEX idx_sessions_completed ON oral_sessions(completed_at);

-- Sample rubric data
INSERT INTO rubrics (name, language, criteria) VALUES
(
    'Basic English Conversation',
    'en',
    '[
        {
            "name": "Accuracy",
            "weight": 0.3,
            "description": "Grammar, vocabulary, and pronunciation correctness",
            "levels": [
                {"score": 100, "description": "Near-native accuracy with minimal errors"},
                {"score": 80, "description": "Good accuracy with occasional minor errors"},
                {"score": 60, "description": "Generally accurate with some noticeable errors"},
                {"score": 40, "description": "Frequent errors but message is understandable"},
                {"score": 20, "description": "Many errors that impede understanding"}
            ]
        },
        {
            "name": "Fluency",
            "weight": 0.3,
            "description": "Speech flow, pace, and natural expression",
            "levels": [
                {"score": 100, "description": "Natural, smooth flow like a native speaker"},
                {"score": 80, "description": "Generally fluent with minor hesitations"},
                {"score": 60, "description": "Some pauses and hesitations but maintains flow"},
                {"score": 40, "description": "Frequent pauses and slow speech"},
                {"score": 20, "description": "Very hesitant and fragmented speech"}
            ]
        },
        {
            "name": "Content",
            "weight": 0.4,
            "description": "Relevance, depth, and coherence of responses",
            "levels": [
                {"score": 100, "description": "Highly relevant, detailed, and well-organized"},
                {"score": 80, "description": "Relevant and coherent with good detail"},
                {"score": 60, "description": "Generally relevant with adequate detail"},
                {"score": 40, "description": "Basic relevance but lacks detail"},
                {"score": 20, "description": "Minimal relevance or very limited content"}
            ]
        }
    ]'::jsonb
);

-- Sample questions
INSERT INTO questions (topic, language, difficulty, question_text) VALUES
('Daily Life', 'en', 'beginner', 'Can you describe your typical morning routine?'),
('Daily Life', 'en', 'intermediate', 'How has your daily routine changed over the past year, and what caused these changes?'),
('Work/Study', 'en', 'beginner', 'What do you study or what is your job?'),
('Work/Study', 'en', 'intermediate', 'What are the main challenges you face in your work or studies?'),
('Future Plans', 'en', 'advanced', 'Where do you see yourself professionally in five years, and what steps are you taking to achieve those goals?'); 