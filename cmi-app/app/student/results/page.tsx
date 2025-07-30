'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Download, Award, TrendingUp, Clock, CheckCircle, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { formatDuration } from '@/lib/utils'

interface SessionResults {
  sessionId: string
  studentName: string
  language: string
  duration: number
  overallScore: number
  scoreBreakdown: {
    accuracy: number
    fluency: number
    content: number
  }
  feedback: string
  completedAt: Date
}

export default function ResultsPage() {
  const router = useRouter()
  const [results, setResults] = useState<SessionResults | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // In a real implementation, this would fetch from the API
    // For now, we'll use mock data
    setTimeout(() => {
      setResults({
        sessionId: 'demo-session-123',
        studentName: 'John',
        language: 'en',
        duration: 156, // seconds
        overallScore: 85,
        scoreBreakdown: {
          accuracy: 80,
          fluency: 85,
          content: 90
        },
        feedback: 'Great job! You demonstrated strong communication skills with clear pronunciation and good vocabulary usage. To improve further, try to use more complex sentence structures and vary your expressions.',
        completedAt: new Date()
      })
      setIsLoading(false)
    }, 1500)
  }, [])

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-400'
    if (score >= 70) return 'text-yellow-400'
    return 'text-red-400'
  }

  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Excellent'
    if (score >= 80) return 'Very Good'
    if (score >= 70) return 'Good'
    if (score >= 60) return 'Fair'
    return 'Needs Improvement'
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-600 border-t-gray-300 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Analyzing your performance...</p>
        </div>
      </div>
    )
  }

  if (!results) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 mb-4">No results found</p>
          <Link href="/student" className="text-gray-300 hover:text-white underline">
            Start a new assessment
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Background effects */}
      <div className="fixed inset-0 -z-10 cyber-grid opacity-20" />
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-gray-950/20 via-black to-gray-950/20" />
      
      <div className="relative z-10">
        <div className="container mx-auto px-6 py-8">
          {/* Navigation */}
          <nav className="flex justify-between items-center mb-8">
            <Link href="/student" className="inline-flex items-center text-gray-400 hover:text-white transition-colors group">
              <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
              New Assessment
            </Link>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center silver-glow">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold silver-text">CMI Results</span>
            </div>
          </nav>

          <div className="max-w-4xl mx-auto">
            {/* Success Message */}
            <div className="text-center mb-12">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-green-500/20 to-green-700/20 mb-6">
                <CheckCircle className="w-10 h-10 text-green-400" />
              </div>
              <h1 className="text-4xl font-bold mb-4">
                <span className="gradient-text">Assessment Complete!</span>
              </h1>
              <p className="text-gray-400 text-lg">
                Great job, {results.studentName}! Here are your results.
              </p>
            </div>

            {/* Overall Score Card */}
            <div className="glass-card-silver p-8 metallic-border rounded-2xl mb-8">
              <div className="text-center">
                <h2 className="text-2xl font-semibold mb-6 silver-text">Overall Performance</h2>
                <div className="relative inline-flex items-center justify-center">
                  <div className="w-48 h-48 rounded-full border-8 border-gray-700 relative">
                    <div 
                      className="absolute inset-0 rounded-full border-8 border-transparent"
                      style={{
                        borderTopColor: results.overallScore >= 90 ? '#10b981' : results.overallScore >= 70 ? '#f59e0b' : '#ef4444',
                        transform: `rotate(${(results.overallScore / 100) * 360}deg)`,
                        transition: 'transform 1s ease-out'
                      }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div>
                        <div className={`text-6xl font-bold ${getScoreColor(results.overallScore)}`}>
                          {results.overallScore}
                        </div>
                        <div className="text-gray-400 text-sm">out of 100</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-6">
                  <span className={`text-2xl font-semibold ${getScoreColor(results.overallScore)}`}>
                    {getScoreLabel(results.overallScore)}
                  </span>
                </div>
              </div>
            </div>

            {/* Score Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="glass-card-silver p-6 metallic-border rounded-xl">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-gray-400">Accuracy</span>
                  <Award className="w-5 h-5 text-gray-500" />
                </div>
                <div className={`text-3xl font-bold ${getScoreColor(results.scoreBreakdown.accuracy)}`}>
                  {results.scoreBreakdown.accuracy}%
                </div>
                <div className="mt-2 h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-gray-500 to-gray-300 transition-all duration-1000"
                    style={{ width: `${results.scoreBreakdown.accuracy}%` }}
                  />
                </div>
              </div>

              <div className="glass-card-silver p-6 metallic-border rounded-xl">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-gray-400">Fluency</span>
                  <TrendingUp className="w-5 h-5 text-gray-500" />
                </div>
                <div className={`text-3xl font-bold ${getScoreColor(results.scoreBreakdown.fluency)}`}>
                  {results.scoreBreakdown.fluency}%
                </div>
                <div className="mt-2 h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-gray-500 to-gray-300 transition-all duration-1000"
                    style={{ width: `${results.scoreBreakdown.fluency}%` }}
                  />
                </div>
              </div>

              <div className="glass-card-silver p-6 metallic-border rounded-xl">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-gray-400">Content</span>
                  <CheckCircle className="w-5 h-5 text-gray-500" />
                </div>
                <div className={`text-3xl font-bold ${getScoreColor(results.scoreBreakdown.content)}`}>
                  {results.scoreBreakdown.content}%
                </div>
                <div className="mt-2 h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-gray-500 to-gray-300 transition-all duration-1000"
                    style={{ width: `${results.scoreBreakdown.content}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Feedback */}
            <div className="glass-card-silver p-8 metallic-border rounded-2xl mb-8">
              <h3 className="text-xl font-semibold mb-4 silver-text">AI Feedback</h3>
              <p className="text-gray-300 leading-relaxed">
                {results.feedback}
              </p>
            </div>

            {/* Session Details */}
            <div className="glass-card-silver p-6 metallic-border rounded-xl mb-8">
              <h3 className="text-lg font-semibold mb-4 silver-text">Session Details</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Session ID:</span>
                  <span className="ml-2 font-mono">{results.sessionId}</span>
                </div>
                <div>
                  <span className="text-gray-400">Language:</span>
                  <span className="ml-2">{results.language.toUpperCase()}</span>
                </div>
                <div>
                  <span className="text-gray-400">Duration:</span>
                  <span className="ml-2">{formatDuration(results.duration)}</span>
                </div>
                <div>
                  <span className="text-gray-400">Completed:</span>
                  <span className="ml-2">{results.completedAt.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-center space-x-4">
              <button className="flex items-center space-x-2 px-6 py-3 glass-card-silver rounded-lg hover:bg-white/10 transition-colors">
                <Download className="w-5 h-5" />
                <span>Download Report</span>
              </button>
              <Link href="/student">
                <button className="flex items-center space-x-2 px-6 py-3 button-silver rounded-lg hover:scale-105 transition-transform">
                  <Sparkles className="w-5 h-5" />
                  <span>New Assessment</span>
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 