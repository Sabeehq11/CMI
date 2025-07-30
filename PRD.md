# 🧾 Product Requirements Document (PRD) – Conversational Mastery Interviewer (CMI)

## 1. Overview

**Goal:** Build a browser-based oral assessment bot that:

- Conducts a 3-minute spoken interview in 5 supported languages.
- Adapts its follow-up questions based on user responses in real time.  
- Auto-scores performance using a rubric and stores full transcript + audio.

## 2. Core Features (MUST-HAVE)

### ✅ 2.1 Start Session
- `POST /api/session/start`
- Accepts: `student_id`, `target_language`, and `rubric_id`
- Returns: `session_id`, `language`, `rubric`, and initial system question

### ✅ 2.2 Live Audio Input & Streaming
- User speaks into the mic via Web Audio API
- Stream audio as chunks to backend via WebSocket (`/api/session/{id}/stream`)
- Convert using OpenAI Whisper v3 (partial transcription streaming)

### ✅ 2.3 AI Response (Adaptive Follow-up)
After pause detected (silence for ~1 sec), GPT-4o uses:
- Transcript so far
- Rubric
- CEFR level
- Language code

GPT returns the next question → passed to ElevenLabs TTS (WebSocket stream) → audio plays

### ✅ 2.4 Scoring the Interview
At session end, `POST /api/session/{id}/score`

GPT-4o scores based on:
- Rubric criteria (Accuracy, Fluency, Content)
- Full transcript (JSON)

Returns:
- Overall Score
- Per-Criterion Breakdown

### ✅ 2.5 Audio & Transcript Storage
Save transcript as structured JSON:
```json
[
  { "speaker": "S", "text": "..." }, 
  { "speaker": "AI", "text": "..." }
]
```
- Save audio as blob URL or upload to storage (e.g., Supabase Bucket)
- Store all results in Postgres

## 3. User Interface

### 🎙️ Student View
- Language Selector (EN, ES, AR, RU, UKR)
- "Start Interview" button
- Mic input + streaming waveform visualization
- Transcripts display in real-time (user + bot turns)
- Audio reply from bot plays automatically
- Session ends at 3 minutes or max turns
- Message: "Thank you! Your results are being scored..."

### 📊 Teacher Dashboard
- List of sessions
- Student name, language, timestamp, % score
- Click a row to:
  - View transcript
  - Play audio (scrubber)
  - View rubric breakdown

### ⚙️ Admin Panel
- Edit rubrics (stored as JSONB)
- Edit question bank (topic, language, difficulty)
- No redeploy required for updates

## 4. API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/session/start` | POST | Starts new interview |
| `/api/session/{id}/stream` | WebSocket | Streams audio to backend |
| `/api/session/{id}/score` | POST | Scores session and returns results |
| `/api/admin/rubrics` | GET/POST/PUT | Admin rubric management |
| `/api/admin/questions` | GET/POST/PUT | Admin question bank management |
| `/api/teacher/sessions` | GET | Lists all sessions |
| `/api/teacher/sessions/:id` | GET | Returns details, transcript, audio |

## 5. Database Tables

### students
```sql
id UUID PRIMARY KEY,
first_name TEXT,
target_language TEXT
```

### rubrics
```sql
id UUID PRIMARY KEY,
name TEXT,
language TEXT,
criteria JSONB,
created_at TIMESTAMPTZ
```

### oral_sessions
```sql
id UUID PRIMARY KEY,
student_id UUID REFERENCES students,
rubric_id UUID REFERENCES rubrics,
started_at TIMESTAMPTZ,
completed_at TIMESTAMPTZ,
overall_score REAL,
raw_transcript JSONB,
audio_url TEXT
```

## 6. Tech Stack

| Layer | Tool |
|-------|------|
| Frontend | Next.js 15 + React 18 |
| Audio | Web Audio API |
| Speech-to-Text | OpenAI Whisper v3 (streaming) |
| AI Reasoning | GPT-4o with function calling |
| Text-to-Speech | ElevenLabs (Flash model via WebSocket) |
| Backend | Node 18 with Fastify |
| DB & Auth | Supabase (Postgres + email magic link) |
| Deployment | Vercel or Docker (if needed) |

## 7. Success Criteria

- ⏱️ **Latency** from student end of speech → bot audio reply: ≤ 400ms
- ✅ **Accurate and contextual** bot follow-ups
- ✅ **Fully auto-scored** and stored session
- ✅ **Replayable + reviewable** by teacher

## 8. Stretch Goals (Optional)

- Emotion tagging on student responses (GPT sentiment analysis)
- Voice cloning for AI bot (based on 10s teacher sample)
- React Native wrapper (mobile support)
- Confidence vs. anxiety graphing 