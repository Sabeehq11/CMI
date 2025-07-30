'use client'

import Link from 'next/link'
import { Mail, Phone, Globe, ChevronRight, Sparkles, Code, FileText, Users, Settings, GraduationCap, Cpu, Languages, Award } from 'lucide-react'
import Image from 'next/image'

export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white overflow-hidden">
      <div className="flex h-screen">
        {/* Left Side - Profile Section */}
        <div className="w-1/2 relative bg-gradient-to-br from-gray-950 to-black p-12 flex flex-col">
          {/* Navigation */}
          <nav className="flex items-center justify-between mb-16">
            <button className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-2">
              <ChevronRight className="w-4 h-4 rotate-180" />
              Open to work
            </button>
            <button className="px-4 py-2 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-white text-sm font-medium hover:shadow-orange-glow transition-all">
              Download CV
            </button>
          </nav>

          {/* Main Content */}
          <div className="flex-1 flex flex-col justify-center">
            <p className="text-orange-500 text-sm font-medium mb-4">CMI Platform</p>
            <h1 className="text-6xl font-bold mb-8">
              <span className="block">Conversational</span>
              <span className="block">Mastery</span>
            </h1>

            {/* Contact Info */}
            <div className="space-y-3 mb-12">
              <a href="mailto:info@cmi-platform.com" className="flex items-center gap-3 text-gray-400 hover:text-white transition-colors">
                <Mail className="w-4 h-4" />
                <span className="text-sm">info@cmi-platform.com</span>
              </a>
              <a href="tel:+1404-555-0678" className="flex items-center gap-3 text-gray-400 hover:text-white transition-colors">
                <Phone className="w-4 h-4" />
                <span className="text-sm">+1 404-555-0678</span>
              </a>
              <a href="#" className="flex items-center gap-3 text-gray-400 hover:text-white transition-colors">
                <Globe className="w-4 h-4" />
                <span className="text-sm">Atlanta, US</span>
              </a>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <Link href="/student" className="flex-1">
                <button className="w-full px-6 py-3 rounded-lg bg-white text-black font-medium hover:bg-gray-100 transition-colors flex items-center justify-center gap-2">
                  <GraduationCap className="w-5 h-5" />
                  Student
                </button>
              </Link>
              <Link href="/teacher" className="flex-1">
                <button className="w-full px-6 py-3 rounded-lg border border-gray-700 hover:border-gray-500 transition-colors flex items-center justify-center gap-2">
                  <Users className="w-5 h-5" />
                  Teacher
                </button>
              </Link>
              <Link href="/admin" className="flex-1">
                <button className="w-full px-6 py-3 rounded-lg border border-gray-700 hover:border-gray-500 transition-colors flex items-center justify-center gap-2">
                  <Settings className="w-5 h-5" />
                  Admin
                </button>
              </Link>
            </div>
          </div>

          {/* Shadow overlay for depth */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-black/50 pointer-events-none" />
        </div>

        {/* Right Side - Project Showcase */}
        <div className="w-1/2 bg-black p-12 overflow-y-auto">
          {/* Tech Stack Icons */}
          <div className="mb-16">
            <div className="flex justify-end mb-8">
              <button className="px-4 py-2 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-white text-sm font-medium">
                Powered by OpenAI
              </button>
            </div>
            
            <div className="grid grid-cols-4 gap-4 mb-12">
              {/* Tech Icons */}
              <div className="tech-icon flex flex-col items-center justify-center aspect-square">
                <Cpu className="w-8 h-8 text-gray-400 mb-2" />
                <span className="text-xs text-gray-500">AI</span>
              </div>
              <div className="tech-icon flex flex-col items-center justify-center aspect-square">
                <Code className="w-8 h-8 text-gray-400 mb-2" />
                <span className="text-xs text-gray-500">Next.js</span>
              </div>
              <div className="tech-icon flex flex-col items-center justify-center aspect-square">
                <FileText className="w-8 h-8 text-gray-400 mb-2" />
                <span className="text-xs text-gray-500">TypeScript</span>
              </div>
              <div className="tech-icon flex flex-col items-center justify-center aspect-square">
                <Sparkles className="w-8 h-8 text-gray-400 mb-2" />
                <span className="text-xs text-gray-500">Tailwind</span>
              </div>
            </div>
          </div>

          {/* Languages Section */}
          <div className="mb-16">
            <h2 className="text-2xl font-bold mb-8 gradient-text-yellow">Languages</h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-400">English</span>
                  <span className="text-xs text-gray-500">Native</span>
                </div>
                <div className="progress-bar h-2">
                  <div className="progress-fill" style={{ width: '100%' }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-400">Spanish</span>
                  <span className="text-xs text-gray-500">Advanced</span>
                </div>
                <div className="progress-bar h-2">
                  <div className="progress-fill" style={{ width: '85%' }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-400">French</span>
                  <span className="text-xs text-gray-500">Intermediate</span>
                </div>
                <div className="progress-bar h-2">
                  <div className="progress-fill" style={{ width: '60%' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Features Section */}
          <div className="mb-16">
            <h2 className="text-2xl font-bold mb-8 gradient-text-yellow">Features & Capabilities</h2>
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-2 h-2 rounded-full bg-orange-500 mt-2" />
                <div>
                  <h3 className="font-semibold mb-1">Real-time Transcription</h3>
                  <p className="text-sm text-gray-400">Powered by OpenAI Whisper v3 for accurate speech-to-text in 5 languages</p>
                  <p className="text-xs text-orange-500 mt-2">August 2024</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-2 h-2 rounded-full bg-orange-500 mt-2" />
                <div>
                  <h3 className="font-semibold mb-1">Adaptive AI Interviewer</h3>
                  <p className="text-sm text-gray-400">GPT-4 powered conversational agent with context-aware follow-up questions</p>
                  <p className="text-xs text-orange-500 mt-2">September 2024</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-2 h-2 rounded-full bg-orange-500 mt-2" />
                <div>
                  <h3 className="font-semibold mb-1">Instant Scoring & Analytics</h3>
                  <p className="text-sm text-gray-400">Comprehensive rubric-based evaluation with detailed performance metrics</p>
                  <p className="text-xs text-orange-500 mt-2">October 2024</p>
                </div>
              </div>
            </div>
          </div>

          {/* Project Preview */}
          <div className="relative">
            <div className="glass-card-dark p-8 rounded-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">CMI Platform</h3>
                <Link href="/student" className="text-sm text-orange-500 hover:text-orange-400 transition-colors flex items-center gap-1">
                  Try Demo
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
              <p className="text-sm text-gray-400 mb-6">
                AI-powered oral language assessment platform designed for educational institutions. 
                Features real-time transcription, adaptive questioning, and instant scoring across 5 languages.
              </p>
              
              {/* Mock laptop display */}
              <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <Sparkles className="w-16 h-16 text-orange-500 mx-auto mb-4" />
                    <p className="text-gray-500">Interactive Demo</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
