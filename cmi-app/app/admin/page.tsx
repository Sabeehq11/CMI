'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Plus, Edit2, Trash2, Save, X, FileText, HelpCircle, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { SUPPORTED_LANGUAGES } from '@/lib/utils'
import toast from 'react-hot-toast'

interface Rubric {
  id: string
  name: string
  language: string
  criteria: any[]
}

interface Question {
  id: string
  topic: string
  language: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  question_text: string
}

export default function AdminPanel() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'rubrics' | 'questions'>('rubrics')
  
  // Rubric states
  const [rubrics, setRubrics] = useState<Rubric[]>([
    {
      id: '1',
      name: 'Basic English Conversation',
      language: 'en',
      criteria: [
        {
          name: 'Accuracy',
          weight: 0.3,
          description: 'Grammar, vocabulary, and pronunciation correctness'
        },
        {
          name: 'Fluency',
          weight: 0.3,
          description: 'Speech flow, pace, and natural expression'
        },
        {
          name: 'Content',
          weight: 0.4,
          description: 'Relevance, depth, and coherence of responses'
        }
      ]
    }
  ])
  const [editingRubric, setEditingRubric] = useState<Rubric | null>(null)
  const [isCreatingRubric, setIsCreatingRubric] = useState(false)

  // Question states
  const [questions, setQuestions] = useState<Question[]>([
    {
      id: '1',
      topic: 'Daily Life',
      language: 'en',
      difficulty: 'beginner',
      question_text: 'Can you describe your typical morning routine?'
    },
    {
      id: '2',
      topic: 'Work/Study',
      language: 'en',
      difficulty: 'intermediate',
      question_text: 'What are the main challenges you face in your work or studies?'
    }
  ])
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null)
  const [isCreatingQuestion, setIsCreatingQuestion] = useState(false)

  // Rubric handlers
  const handleCreateRubric = () => {
    const newRubric: Rubric = {
      id: Date.now().toString(),
      name: '',
      language: 'en',
      criteria: [
        {
          name: '',
          weight: 0.33,
          description: ''
        }
      ]
    }
    setEditingRubric(newRubric)
    setIsCreatingRubric(true)
  }

  const handleSaveRubric = () => {
    if (!editingRubric) return

    if (!editingRubric.name || !editingRubric.language) {
      toast.error('Please fill in all required fields')
      return
    }

    const totalWeight = editingRubric.criteria.reduce((sum, c) => sum + c.weight, 0)
    if (Math.abs(totalWeight - 1) > 0.01) {
      toast.error('Criteria weights must sum to 1.0')
      return
    }

    if (isCreatingRubric) {
      setRubrics([...rubrics, editingRubric])
      toast.success('Rubric created successfully')
    } else {
      setRubrics(rubrics.map(r => r.id === editingRubric.id ? editingRubric : r))
      toast.success('Rubric updated successfully')
    }

    setEditingRubric(null)
    setIsCreatingRubric(false)
  }

  const handleDeleteRubric = (id: string) => {
    if (confirm('Are you sure you want to delete this rubric?')) {
      setRubrics(rubrics.filter(r => r.id !== id))
      toast.success('Rubric deleted successfully')
    }
  }

  const handleAddCriterion = () => {
    if (!editingRubric) return
    setEditingRubric({
      ...editingRubric,
      criteria: [...editingRubric.criteria, { name: '', weight: 0, description: '' }]
    })
  }

  const handleRemoveCriterion = (index: number) => {
    if (!editingRubric) return
    setEditingRubric({
      ...editingRubric,
      criteria: editingRubric.criteria.filter((_, i) => i !== index)
    })
  }

  // Question handlers
  const handleCreateQuestion = () => {
    const newQuestion: Question = {
      id: Date.now().toString(),
      topic: '',
      language: 'en',
      difficulty: 'beginner',
      question_text: ''
    }
    setEditingQuestion(newQuestion)
    setIsCreatingQuestion(true)
  }

  const handleSaveQuestion = () => {
    if (!editingQuestion) return

    if (!editingQuestion.topic || !editingQuestion.question_text) {
      toast.error('Please fill in all required fields')
      return
    }

    if (isCreatingQuestion) {
      setQuestions([...questions, editingQuestion])
      toast.success('Question created successfully')
    } else {
      setQuestions(questions.map(q => q.id === editingQuestion.id ? editingQuestion : q))
      toast.success('Question updated successfully')
    }

    setEditingQuestion(null)
    setIsCreatingQuestion(false)
  }

  const handleDeleteQuestion = (id: string) => {
    if (confirm('Are you sure you want to delete this question?')) {
      setQuestions(questions.filter(q => q.id !== id))
      toast.success('Question deleted successfully')
    }
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
              <span className="text-lg font-bold gradient-text">CMI Admin Panel</span>
            </div>
          </nav>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-4">
              <span className="gradient-text">Admin Panel</span>
            </h1>
            <p className="text-gray-400">Manage rubrics and question banks</p>
          </div>

          {/* Tabs */}
          <div className="flex space-x-1 mb-8">
            <button
              onClick={() => setActiveTab('rubrics')}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                activeTab === 'rubrics'
                  ? 'button-orange'
                  : 'glass-card-dark hover:bg-orange-500/10'
              }`}
            >
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5" />
                <span>Rubrics</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('questions')}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                activeTab === 'questions'
                  ? 'button-orange'
                  : 'glass-card-dark hover:bg-orange-500/10'
              }`}
            >
              <div className="flex items-center space-x-2">
                <HelpCircle className="w-5 h-5" />
                <span>Questions</span>
              </div>
            </button>
          </div>

          {/* Content */}
          {activeTab === 'rubrics' ? (
            <div>
              {/* Create Button */}
              <div className="flex justify-end mb-6">
                <button
                  onClick={handleCreateRubric}
                  className="flex items-center space-x-2 px-4 py-2 button-orange rounded-lg hover:scale-105 transition-transform"
                >
                  <Plus className="w-5 h-5" />
                  <span>Create Rubric</span>
                </button>
              </div>

              {/* Rubrics List */}
              <div className="space-y-4">
                {rubrics.map((rubric) => (
                  <div key={rubric.id} className="glass-card-dark p-6 rounded-xl">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-semibold mb-1">{rubric.name}</h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-400">
                          <span>Language: {rubric.language.toUpperCase()}</span>
                          <span>Criteria: {rubric.criteria.length}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setEditingRubric(rubric)
                            setIsCreatingRubric(false)
                          }}
                          className="p-2 glass-card-dark rounded-lg hover:bg-orange-500/10 transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteRubric(rubric.id)}
                          className="p-2 glass-card-dark rounded-lg hover:bg-red-500/20 transition-colors text-red-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      {rubric.criteria.map((criterion, index) => (
                        <div key={index} className="flex items-center justify-between text-sm">
                          <span className="text-gray-300">{criterion.name}</span>
                          <span className="text-gray-500">{(criterion.weight * 100).toFixed(0)}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Edit/Create Modal */}
              {editingRubric && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 z-50">
                  <div className="glass-card-dark rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                    <h2 className="text-2xl font-bold mb-6">
                      {isCreatingRubric ? 'Create New Rubric' : 'Edit Rubric'}
                    </h2>

                    <div className="space-y-6">
                      {/* Name */}
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Rubric Name
                        </label>
                        <input
                          type="text"
                          value={editingRubric.name}
                          onChange={(e) => setEditingRubric({ ...editingRubric, name: e.target.value })}
                          className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg 
                                   focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all
                                   placeholder-gray-500 text-white"
                          placeholder="e.g., Basic English Conversation"
                        />
                      </div>

                      {/* Language */}
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Language
                        </label>
                        <select
                          value={editingRubric.language}
                          onChange={(e) => setEditingRubric({ ...editingRubric, language: e.target.value })}
                          className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg 
                                   focus:border-gray-500 focus:ring-2 focus:ring-gray-500/20 transition-all
                                   text-white appearance-none cursor-pointer"
                        >
                          {SUPPORTED_LANGUAGES.map(lang => (
                            <option key={lang.code} value={lang.code} className="bg-gray-900">
                              {lang.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Criteria */}
                      <div>
                        <div className="flex justify-between items-center mb-4">
                          <label className="text-sm font-medium text-gray-300">
                            Criteria
                          </label>
                          <button
                            onClick={handleAddCriterion}
                            className="text-sm text-gray-400 hover:text-white transition-colors"
                          >
                            + Add Criterion
                          </button>
                        </div>
                        
                        <div className="space-y-4">
                          {editingRubric.criteria.map((criterion, index) => (
                            <div key={index} className="glass-card-dark p-4 rounded-lg">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <input
                                  type="text"
                                  value={criterion.name}
                                  onChange={(e) => {
                                    const newCriteria = [...editingRubric.criteria]
                                    newCriteria[index].name = e.target.value
                                    setEditingRubric({ ...editingRubric, criteria: newCriteria })
                                  }}
                                  className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg 
                                           focus:border-gray-500 focus:ring-2 focus:ring-gray-500/20 transition-all
                                           placeholder-gray-500 text-white text-sm"
                                  placeholder="Criterion name"
                                />
                                <input
                                  type="number"
                                  value={criterion.weight}
                                  onChange={(e) => {
                                    const newCriteria = [...editingRubric.criteria]
                                    newCriteria[index].weight = parseFloat(e.target.value) || 0
                                    setEditingRubric({ ...editingRubric, criteria: newCriteria })
                                  }}
                                  className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg 
                                           focus:border-gray-500 focus:ring-2 focus:ring-gray-500/20 transition-all
                                           placeholder-gray-500 text-white text-sm"
                                  placeholder="Weight (0-1)"
                                  step="0.1"
                                  min="0"
                                  max="1"
                                />
                                <div className="flex items-center space-x-2">
                                  <input
                                    type="text"
                                    value={criterion.description}
                                    onChange={(e) => {
                                      const newCriteria = [...editingRubric.criteria]
                                      newCriteria[index].description = e.target.value
                                      setEditingRubric({ ...editingRubric, criteria: newCriteria })
                                    }}
                                    className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg 
                                             focus:border-gray-500 focus:ring-2 focus:ring-gray-500/20 transition-all
                                             placeholder-gray-500 text-white text-sm"
                                    placeholder="Description"
                                  />
                                  <button
                                    onClick={() => handleRemoveCriterion(index)}
                                    className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        <div className="mt-2 text-sm text-gray-400">
                          Total weight: {editingRubric.criteria.reduce((sum, c) => sum + c.weight, 0).toFixed(2)} (must equal 1.0)
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end space-x-4 mt-8">
                      <button
                        onClick={() => {
                          setEditingRubric(null)
                          setIsCreatingRubric(false)
                        }}
                        className="px-6 py-2 glass-card-dark rounded-lg hover:bg-orange-500/10 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveRubric}
                        className="px-6 py-2 button-orange rounded-lg hover:scale-105 transition-transform flex items-center space-x-2"
                      >
                        <Save className="w-4 h-4" />
                        <span>Save Rubric</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div>
              {/* Create Button */}
              <div className="flex justify-end mb-6">
                <button
                  onClick={handleCreateQuestion}
                  className="flex items-center space-x-2 px-4 py-2 button-orange rounded-lg hover:scale-105 transition-transform"
                >
                  <Plus className="w-5 h-5" />
                  <span>Create Question</span>
                </button>
              </div>

              {/* Questions List */}
              <div className="space-y-4">
                {questions.map((question) => (
                  <div key={question.id} className="glass-card-dark p-6 rounded-xl">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="text-lg mb-2">{question.question_text}</p>
                        <div className="flex items-center space-x-4 text-sm">
                          <span className="px-2 py-1 bg-orange-500/10 text-orange-400 rounded-full">
                            {question.topic}
                          </span>
                          <span className="text-gray-400">
                            {question.language.toUpperCase()}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            question.difficulty === 'beginner' ? 'bg-green-500/20 text-green-400' :
                            question.difficulty === 'intermediate' ? 'bg-amber-500/20 text-amber-400' :
                            'bg-red-500/20 text-red-400'
                          }`}>
                            {question.difficulty}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={() => {
                            setEditingQuestion(question)
                            setIsCreatingQuestion(false)
                          }}
                          className="p-2 glass-card-dark rounded-lg hover:bg-orange-500/10 transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteQuestion(question.id)}
                          className="p-2 glass-card-dark rounded-lg hover:bg-red-500/20 transition-colors text-red-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Edit/Create Modal */}
              {editingQuestion && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 z-50">
                  <div className="glass-card-dark rounded-2xl p-8 max-w-2xl w-full">
                    <h2 className="text-2xl font-bold mb-6">
                      {isCreatingQuestion ? 'Create New Question' : 'Edit Question'}
                    </h2>

                    <div className="space-y-6">
                      {/* Question Text */}
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Question Text
                        </label>
                        <textarea
                          value={editingQuestion.question_text}
                          onChange={(e) => setEditingQuestion({ ...editingQuestion, question_text: e.target.value })}
                          className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg 
                                   focus:border-gray-500 focus:ring-2 focus:ring-gray-500/20 transition-all
                                   placeholder-gray-500 text-white"
                          placeholder="Enter the question..."
                          rows={3}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Topic */}
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Topic
                          </label>
                          <input
                            type="text"
                            value={editingQuestion.topic}
                            onChange={(e) => setEditingQuestion({ ...editingQuestion, topic: e.target.value })}
                            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg 
                                     focus:border-gray-500 focus:ring-2 focus:ring-gray-500/20 transition-all
                                     placeholder-gray-500 text-white"
                            placeholder="e.g., Daily Life"
                          />
                        </div>

                        {/* Language */}
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Language
                          </label>
                          <select
                            value={editingQuestion.language}
                            onChange={(e) => setEditingQuestion({ ...editingQuestion, language: e.target.value })}
                            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg 
                                     focus:border-gray-500 focus:ring-2 focus:ring-gray-500/20 transition-all
                                     text-white appearance-none cursor-pointer"
                          >
                            {SUPPORTED_LANGUAGES.map(lang => (
                              <option key={lang.code} value={lang.code} className="bg-gray-900">
                                {lang.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Difficulty */}
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Difficulty
                          </label>
                          <select
                            value={editingQuestion.difficulty}
                            onChange={(e) => setEditingQuestion({ ...editingQuestion, difficulty: e.target.value as any })}
                            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg 
                                     focus:border-gray-500 focus:ring-2 focus:ring-gray-500/20 transition-all
                                     text-white appearance-none cursor-pointer"
                          >
                            <option value="beginner" className="bg-gray-900">Beginner</option>
                            <option value="intermediate" className="bg-gray-900">Intermediate</option>
                            <option value="advanced" className="bg-gray-900">Advanced</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end space-x-4 mt-8">
                      <button
                        onClick={() => {
                          setEditingQuestion(null)
                          setIsCreatingQuestion(false)
                        }}
                        className="px-6 py-2 glass-card-dark rounded-lg hover:bg-orange-500/10 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveQuestion}
                        className="px-6 py-2 button-orange rounded-lg hover:scale-105 transition-transform flex items-center space-x-2"
                      >
                        <Save className="w-4 h-4" />
                        <span>Save Question</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 