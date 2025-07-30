# CMI - Conversational Mastery Interviewer

An AI-powered oral language assessment platform that conducts adaptive interviews in 5 languages with real-time transcription and automatic scoring.

## Features

### ✅ Core Functionality
- **Multi-language Support**: English, Spanish, Arabic, Russian, and Ukrainian
- **Real-time Audio Recording**: Browser-based audio capture with visual feedback
- **AI-Powered Interviews**: Adaptive questioning based on student responses
- **Automatic Scoring**: GPT-4 powered assessment based on customizable rubrics
- **Text-to-Speech**: Natural voice responses using browser TTS (ElevenLabs ready)

### 📊 Three Main Portals

1. **Student Portal** (`/student`)
   - Start oral assessments
   - Real-time interview with AI
   - View results and feedback

2. **Teacher Dashboard** (`/teacher`)
   - View all student sessions
   - Filter by language, date, and performance
   - Access detailed transcripts and scores

3. **Admin Panel** (`/admin`)
   - Manage assessment rubrics
   - Create and edit question banks
   - Configure scoring criteria

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **AI**: OpenAI GPT-4 & Whisper v3
- **Audio**: Web Audio API, RecordRTC
- **Styling**: Custom silver/metallic theme with glassmorphism

## Getting Started

### Prerequisites

- Node.js 18+
- Supabase account
- OpenAI API key
- (Optional) ElevenLabs API key

### Installation

1. Clone the repository:
```bash
cd cmi-app
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp env.example .env.local
```

Edit `.env.local` with your credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
OPENAI_API_KEY=your_openai_api_key
ELEVENLABS_API_KEY=your_elevenlabs_api_key
```

4. Set up the database:
   - Create a new Supabase project
   - Run the SQL schema from `supabase/schema.sql`

5. Start the development server:
```bash
npm run dev
```

Visit `http://localhost:3000` to see the app.

## Current Implementation Status

### ✅ Completed
- Landing page with navigation to all portals
- Student registration and session initialization
- Interview page with recording controls and transcript display
- Teacher dashboard with session listings and filters
- Admin panel for rubric and question management
- Results page with score visualization
- API endpoints for session management
- Database schema and sample data

### 🚧 In Progress / Simulated
- WebSocket audio streaming (currently simulated)
- OpenAI Whisper integration (using mock transcription)
- ElevenLabs TTS (using browser speech synthesis)
- Real-time scoring (mock data provided)

### 📋 TODO
- Implement actual WebSocket server for audio streaming
- Integrate OpenAI Whisper API for real transcription
- Connect ElevenLabs for high-quality TTS
- Add authentication with Supabase Auth
- Implement file upload for audio storage
- Add export functionality for results
- Create mobile-responsive optimizations

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/session/start` | POST | Start new interview session |
| `/api/session/[id]/score` | POST | Score completed session |
| `/api/teacher/sessions` | GET | Get all sessions with filters |
| `/api/admin/rubrics` | GET/POST/PUT | Manage rubrics |
| `/api/admin/questions` | GET/POST/PUT | Manage questions |

## Development Notes

- The app uses a custom silver/metallic design theme
- All components are built with accessibility in mind
- Toast notifications provide user feedback
- Responsive design works on desktop and tablet

## License

This project is licensed under the MIT License.
