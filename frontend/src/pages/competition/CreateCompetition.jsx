import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Trophy, 
  Plus, 
  Trash2, 
  Clock, 
  Users, 
  Star,
  Target,
  Award,
  Settings,
  Save,
  ArrowLeft
} from 'lucide-react'

function CreateCompetition() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'coding',
    difficulty: 'intermediate',
    duration: '2',
    maxParticipants: 100,
    prize: '',
    points: 100,
    startDate: '',
    startTime: '',
    rules: ['No external libraries allowed', 'Code must be syntactically correct'],
    questions: []
  })

  const [currentQuestion, setCurrentQuestion] = useState({
    title: '',
    description: '',
    difficulty: 'medium',
    points: 50,
    timeLimit: 15,
    testCases: 3,
    category: '',
    solution: ''
  })

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleQuestionChange = (field, value) => {
    setCurrentQuestion(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const addQuestion = () => {
    if (currentQuestion.title && currentQuestion.description) {
      setFormData(prev => ({
        ...prev,
        questions: [...prev.questions, { ...currentQuestion, id: Date.now() }]
      }))
      setCurrentQuestion({
        title: '',
        description: '',
        difficulty: 'medium',
        points: 50,
        timeLimit: 15,
        testCases: 3,
        category: '',
        solution: ''
      })
    }
  }

  const removeQuestion = (questionId) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.filter(q => q.id !== questionId)
    }))
  }

  const addRule = () => {
    setFormData(prev => ({
      ...prev,
      rules: [...prev.rules, '']
    }))
  }

  const updateRule = (index, value) => {
    setFormData(prev => ({
      ...prev,
      rules: prev.rules.map((rule, i) => i === index ? value : rule)
    }))
  }

  const removeRule = (index) => {
    setFormData(prev => ({
      ...prev,
      rules: prev.rules.filter((_, i) => i !== index)
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    // Here you would typically save the competition to the backend
    console.log('Creating competition:', formData)
    navigate('/competition')
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <button 
            onClick={() => navigate('/competition')}
            className="mb-4 text-indigo-600 hover:text-indigo-800 font-medium flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Competitions</span>
          </button>
          
          <div className="flex items-center space-x-3">
            <Trophy className="w-8 h-8 text-yellow-500" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Create Competition</h1>
              <p className="text-gray-600">Design an engaging coding competition for developers</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <Settings className="w-6 h-6 text-indigo-600 mr-2" />
              Basic Information
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Competition Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="e.g., JavaScript Master Challenge"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Competition Type *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => handleInputChange('type', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="coding">Coding Challenge</option>
                  <option value="algorithm">Algorithm Competition</option>
                  <option value="frontend">Frontend Development</option>
                  <option value="database">Database Design</option>
                  <option value="debugging">Debugging Challenge</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Difficulty Level *
                </label>
                <select
                  value={formData.difficulty}
                  onChange={(e) => handleInputChange('difficulty', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="easy">Easy</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="hard">Hard</option>
                  <option value="expert">Expert</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration (hours) *
                </label>
                <input
                  type="number"
                  value={formData.duration}
                  onChange={(e) => handleInputChange('duration', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  min="1"
                  max="24"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Participants *
                </label>
                <input
                  type="number"
                  value={formData.maxParticipants}
                  onChange={(e) => handleInputChange('maxParticipants', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  min="10"
                  max="10000"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prize
                </label>
                <input
                  type="text"
                  value={formData.prize}
                  onChange={(e) => handleInputChange('prize', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="e.g., Premium Course Access"
                />
              </div>
            </div>
            
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                rows="4"
                placeholder="Describe your competition..."
                required
              />
            </div>
          </div>

          {/* Competition Questions */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <Target className="w-6 h-6 text-indigo-600 mr-2" />
              Competition Questions
            </h2>
            
            {/* Add Question Form */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-gray-900 mb-4">Add New Question</h3>
              
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Question Title *
                  </label>
                  <input
                    type="text"
                    value={currentQuestion.title}
                    onChange={(e) => handleQuestionChange('title', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="e.g., Array Manipulation Master"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <input
                    type="text"
                    value={currentQuestion.category}
                    onChange={(e) => handleQuestionChange('category', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="e.g., Algorithms"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Points
                  </label>
                  <input
                    type="number"
                    value={currentQuestion.points}
                    onChange={(e) => handleQuestionChange('points', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    min="1"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Time Limit (minutes)
                  </label>
                  <input
                    type="number"
                    value={currentQuestion.timeLimit}
                    onChange={(e) => handleQuestionChange('timeLimit', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    min="1"
                  />
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Question Description *
                </label>
                <textarea
                  value={currentQuestion.description}
                  onChange={(e) => handleQuestionChange('description', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  rows="3"
                  placeholder="Describe the problem to solve..."
                />
              </div>
              
              <button
                type="button"
                onClick={addQuestion}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add Question</span>
              </button>
            </div>
            
            {/* Questions List */}
            <div className="space-y-4">
              {formData.questions.map((question, index) => (
                <div key={question.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-900">{question.title}</h4>
                    <button
                      type="button"
                      onClick={() => removeQuestion(question.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-gray-600 text-sm mb-2">{question.description}</p>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span className="flex items-center space-x-1">
                      <Star className="w-4 h-4" />
                      <span>{question.points} pts</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>{question.timeLimit} min</span>
                    </span>
                    <span className="px-2 py-1 bg-indigo-100 text-indigo-800 text-xs rounded-full">
                      {question.category}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Competition Rules */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <Award className="w-6 h-6 text-indigo-600 mr-2" />
              Competition Rules
            </h2>
            
            <div className="space-y-3">
              {formData.rules.map((rule, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={rule}
                    onChange={(e) => updateRule(index, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter a rule..."
                  />
                  <button
                    type="button"
                    onClick={() => removeRule(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            
            <button
              type="button"
              onClick={addRule}
              className="mt-4 text-indigo-600 hover:text-indigo-800 flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Rule</span>
            </button>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/competition')}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>Create Competition</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateCompetition

