'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Mic, Sparkles, User, Globe, HeadphonesIcon } from 'lucide-react'
import Link from 'next/link'
import { SUPPORTED_LANGUAGES } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function StudentPortal() {
  const router = useRouter()
  const [firstName, setFirstName] = useState('')
  const [targetLanguage, setTargetLanguage] = useState('en')
  const [isStarting, setIsStarting] = useState(false)

  const handleStartInterview = async () => {
    if (!firstName.trim()) {
      toast.error('Please enter your first name')
      return
    }

    setIsStarting(true)
    
    try {
      // In a real implementation, this would create a student record and session
      // For now, we'll simulate it
      const sessionData = {
        student: { firstName, targetLanguage },
        sessionId: 'demo-session-' + Date.now()
      }
      
      // Store in sessionStorage for the interview page
      sessionStorage.setItem('currentSession', JSON.stringify(sessionData))
      
      // Navigate to interview page
      router.push('/student/interview')
    } catch (error) {
      console.error('Error starting interview:', error)
      toast.error('Failed to start interview. Please try again.')
      setIsStarting(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Background gradient */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-gray-950 via-black to-gray-950" />
      
      <div className="relative z-10">
        <div className="container mx-auto px-6 py-8">
          {/* Navigation */}
          <nav className="flex justify-between items-center mb-16">
            <Link href="/" className="inline-flex items-center text-gray-400 hover:text-white transition-colors group">
              <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
              Back to Home
            </Link>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center orange-glow">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold gradient-text">CMI</span>
            </div>
          </nav>

          <div className="max-w-2xl mx-auto">
            {/* Main Card */}
            <div className="glass-card-dark p-10 rounded-3xl">
              <div className="text-center mb-10">
                <h1 className="text-4xl font-bold mb-4">
                  <span className="gradient-text">Start Your Assessment</span>
                </h1>
                <p className="text-gray-400">
                  Begin your AI-powered oral language assessment
                </p>
              </div>

              <div className="space-y-8">
                {/* Name Input */}
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-300 mb-3">
                    First Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <User className="w-5 h-5 text-gray-500" />
                    </div>
                    <input
                      type="text"
                      id="firstName"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl 
                               focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all
                               placeholder-gray-500 text-white"
                      placeholder="Enter your first name"
                    />
                  </div>
                </div>

                {/* Language Selection */}
                <div>
                  <label htmlFor="language" className="block text-sm font-medium text-gray-300 mb-3">
                    Target Language
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Globe className="w-5 h-5 text-gray-500" />
                    </div>
                    <select
                      id="language"
                      value={targetLanguage}
                      onChange={(e) => setTargetLanguage(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl 
                               focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all
                               text-white appearance-none cursor-pointer"
                    >
                      {SUPPORTED_LANGUAGES.map(lang => (
                        <option key={lang.code} value={lang.code} className="bg-gray-900">
                          {lang.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Info Cards */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="glass-card-dark p-4 rounded-xl">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center orange-glow">
                        <Mic className="w-5 h-5 text-orange-400" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold">Voice Interview</div>
                        <div className="text-xs text-gray-400">3 minutes max</div>
                      </div>
                    </div>
                  </div>

                  <div className="glass-card-dark p-4 rounded-xl">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center orange-glow">
                        <HeadphonesIcon className="w-5 h-5 text-orange-400" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold">AI Responses</div>
                        <div className="text-xs text-gray-400">Natural voice</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Assessment Info */}
                <div className="glass-card-dark p-6 rounded-xl space-y-4">
                  <h3 className="font-semibold text-lg gradient-text-yellow">Assessment Process</h3>
                  <div className="space-y-3 text-sm text-gray-400">
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs text-orange-400 font-bold">1</span>
                      </div>
                      <p>AI will ask you questions in {SUPPORTED_LANGUAGES.find(l => l.code === targetLanguage)?.name}</p>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs text-orange-400 font-bold">2</span>
                      </div>
                      <p>Speak naturally and clearly into your microphone</p>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs text-orange-400 font-bold">3</span>
                      </div>
                      <p>Your responses will be automatically scored based on accuracy, fluency, and content</p>
                    </div>
                  </div>
                </div>

                {/* Start Button */}
                <button
                  onClick={handleStartInterview}
                  disabled={isStarting}
                  className="w-full relative group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl blur opacity-75 
                                group-hover:opacity-100 transition duration-200 disabled:opacity-50"></div>
                  <div className="relative button-orange rounded-xl py-4 px-6 
                                font-semibold flex items-center justify-center space-x-3
                                group-hover:scale-[1.02] transition-transform">
                    {isStarting ? (
                      <span>Initializing...</span>
                    ) : (
                      <>
                        <Mic className="w-5 h-5" />
                        <span>Begin Assessment</span>
                      </>
                    )}
                  </div>
                </button>
              </div>
            </div>

            {/* Bottom Stats */}
            <div className="mt-12 grid grid-cols-3 gap-6 text-center">
              <div className="glass-card-dark p-3 rounded-lg">
                <div className="text-2xl font-bold gradient-text">5</div>
                <div className="text-xs text-gray-500">Languages</div>
              </div>
              <div className="glass-card-dark p-3 rounded-lg">
                <div className="text-2xl font-bold gradient-text">400ms</div>
                <div className="text-xs text-gray-500">Response Time</div>
              </div>
              <div className="glass-card-dark p-3 rounded-lg">
                <div className="text-2xl font-bold gradient-text">99%</div>
                <div className="text-xs text-gray-500">Accuracy</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 