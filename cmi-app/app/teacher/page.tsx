'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Search, Filter, Download, Play, FileText, TrendingUp, Clock, Award, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { formatDuration, getLanguageName } from '@/lib/utils'
import { format } from 'date-fns'

interface Session {
  id: string
  student_id: string
  students: {
    first_name: string
    target_language: string
  }
  started_at: string
  completed_at: string | null
  overall_score: number | null
  raw_transcript: any
  audio_url: string | null
  score_breakdown: any
}

export default function TeacherDashboard() {
  const router = useRouter()
  const [sessions, setSessions] = useState<Session[]>([])
  const [filteredSessions, setFilteredSessions] = useState<Session[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [languageFilter, setLanguageFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')
  const [selectedSession, setSelectedSession] = useState<Session | null>(null)

  useEffect(() => {
    fetchSessions()
  }, [])

  useEffect(() => {
    filterSessions()
  }, [sessions, searchTerm, languageFilter, dateFilter])

  const fetchSessions = async () => {
    try {
      const params = new URLSearchParams()
      if (languageFilter !== 'all') params.append('language', languageFilter)
      if (searchTerm) params.append('studentName', searchTerm)
      
      const response = await fetch(`/api/teacher/sessions?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch sessions')
      }
      
      const data = await response.json()
      setSessions(data.sessions)
      
      // Update stats if provided
      if (data.stats) {
        console.log('Session stats:', data.stats)
      }
      
      setIsLoading(false)
    } catch (error) {
      console.error('Error fetching sessions:', error)
      setIsLoading(false)
    }
  }

  const filterSessions = () => {
    let filtered = [...sessions]

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(session => 
        session.students.first_name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Language filter
    if (languageFilter !== 'all') {
      filtered = filtered.filter(session => 
        session.students.target_language === languageFilter
      )
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date()
      const filterDate = new Date()
      
      switch (dateFilter) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0)
          break
        case 'week':
          filterDate.setDate(now.getDate() - 7)
          break
        case 'month':
          filterDate.setMonth(now.getMonth() - 1)
          break
      }
      
      filtered = filtered.filter(session => 
        new Date(session.started_at) >= filterDate
      )
    }

    setFilteredSessions(filtered)
  }

  const getScoreColor = (score: number | null) => {
    if (!score) return 'text-gray-400'
    if (score >= 90) return 'text-green-400'
    if (score >= 70) return 'text-amber-400'
    return 'text-red-400'
  }

  const calculateDuration = (start: string, end: string | null) => {
    if (!end) return 'In Progress'
    const duration = new Date(end).getTime() - new Date(start).getTime()
    return formatDuration(Math.floor(duration / 1000))
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Background gradient */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-gray-950 via-black to-gray-950" />
      
      <div className="relative z-10">
        <div className="container mx-auto px-6 py-8">
          {/* Navigation */}
          <nav className="flex justify-between items-center mb-8">
            <Link href="/" className="inline-flex items-center text-gray-400 hover:text-white transition-colors group">
              <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
              Back to Home
            </Link>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center orange-glow">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold gradient-text">CMI Teacher Dashboard</span>
            </div>
          </nav>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-4">
              <span className="gradient-text">Teacher Dashboard</span>
            </h1>
            <p className="text-gray-400">Review student assessments and track performance</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="glass-card-dark p-6 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">Total Sessions</span>
                <FileText className="w-5 h-5 text-orange-500" />
              </div>
              <div className="text-3xl font-bold gradient-text">{sessions.length}</div>
            </div>
            
            <div className="glass-card-dark p-6 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">Average Score</span>
                <TrendingUp className="w-5 h-5 text-orange-500" />
              </div>
              <div className="text-3xl font-bold gradient-text">
                {sessions.length > 0 
                  ? Math.round(sessions.reduce((acc, s) => acc + (s.overall_score || 0), 0) / sessions.length)
                  : 0}%
              </div>
            </div>
            
            <div className="glass-card-dark p-6 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">Today's Sessions</span>
                <Clock className="w-5 h-5 text-orange-500" />
              </div>
              <div className="text-3xl font-bold gradient-text">
                {sessions.filter(s => 
                  new Date(s.started_at).toDateString() === new Date().toDateString()
                ).length}
              </div>
            </div>
            
            <div className="glass-card-dark p-6 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">High Performers</span>
                <Award className="w-5 h-5 text-orange-500" />
              </div>
              <div className="text-3xl font-bold gradient-text">
                {sessions.filter(s => (s.overall_score || 0) >= 90).length}
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="glass-card-dark p-6 rounded-xl mb-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search students..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg 
                           focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all
                           placeholder-gray-500 text-white"
                />
              </div>

              {/* Language Filter */}
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                <select
                  value={languageFilter}
                  onChange={(e) => setLanguageFilter(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg 
                           focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all
                           text-white appearance-none cursor-pointer"
                >
                  <option value="all" className="bg-gray-900">All Languages</option>
                  <option value="en" className="bg-gray-900">English</option>
                  <option value="es" className="bg-gray-900">Spanish</option>
                  <option value="ar" className="bg-gray-900">Arabic</option>
                  <option value="ru" className="bg-gray-900">Russian</option>
                  <option value="uk" className="bg-gray-900">Ukrainian</option>
                </select>
              </div>

              {/* Date Filter */}
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg 
                           focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all
                           text-white appearance-none cursor-pointer"
                >
                  <option value="all" className="bg-gray-900">All Time</option>
                  <option value="today" className="bg-gray-900">Today</option>
                  <option value="week" className="bg-gray-900">This Week</option>
                  <option value="month" className="bg-gray-900">This Month</option>
                </select>
              </div>

              {/* Export Button */}
              <button className="flex items-center justify-center space-x-2 px-4 py-2 
                               glass-card-dark rounded-lg hover:bg-orange-500/10 transition-colors">
                <Download className="w-5 h-5" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {/* Sessions Table */}
          <div className="glass-card-dark rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left p-4 font-medium text-gray-300">Student</th>
                    <th className="text-left p-4 font-medium text-gray-300">Language</th>
                    <th className="text-left p-4 font-medium text-gray-300">Date</th>
                    <th className="text-left p-4 font-medium text-gray-300">Duration</th>
                    <th className="text-left p-4 font-medium text-gray-300">Score</th>
                    <th className="text-left p-4 font-medium text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="text-center p-8 text-gray-400">
                        Loading sessions...
                      </td>
                    </tr>
                  ) : filteredSessions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center p-8 text-gray-400">
                        No sessions found
                      </td>
                    </tr>
                  ) : (
                    filteredSessions.map((session) => (
                      <tr key={session.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="p-4">
                          <div className="font-medium">{session.students.first_name}</div>
                          <div className="text-xs text-gray-500">ID: {session.id.slice(0, 8)}...</div>
                        </td>
                        <td className="p-4">
                          <span className="px-2 py-1 text-xs rounded-full bg-orange-500/10 text-orange-400">
                            {getLanguageName(session.students.target_language)}
                          </span>
                        </td>
                        <td className="p-4 text-sm text-gray-400">
                          {format(new Date(session.started_at), 'MMM d, yyyy')}
                          <br />
                          <span className="text-xs">{format(new Date(session.started_at), 'h:mm a')}</span>
                        </td>
                        <td className="p-4">
                          <span className="font-mono text-sm">
                            {calculateDuration(session.started_at, session.completed_at)}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className={`text-2xl font-bold ${getScoreColor(session.overall_score)}`}>
                            {session.overall_score ? `${session.overall_score}%` : '-'}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => router.push(`/teacher/session/${session.id}`)}
                              className="p-2 glass-card-dark rounded-lg hover:bg-orange-500/10 transition-colors"
                              title="View Details"
                            >
                              <FileText className="w-4 h-4" />
                            </button>
                            {session.audio_url && (
                              <button
                                className="p-2 glass-card-dark rounded-lg hover:bg-orange-500/10 transition-colors"
                                title="Play Audio"
                              >
                                <Play className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 