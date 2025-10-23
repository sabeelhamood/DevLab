import React, { useState, useEffect } from 'react'
import { 
  PlusCircle, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye, 
  CheckCircle, 
  XCircle,
  Clock,
  Target,
  BookOpen,
  Code,
  AlertCircle
} from 'lucide-react'

const QuestionManagement = () => {
  const [questions, setQuestions] = useState([])
  const [filteredQuestions, setFilteredQuestions] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterDifficulty, setFilterDifficulty] = useState('all')
  const [filterLanguage, setFilterLanguage] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedQuestion, setSelectedQuestion] = useState(null)
  const [newQuestion, setNewQuestion] = useState({
    title: '',
    description: '',
    difficulty: 'Easy',
    language: 'JavaScript',
    category: '',
    testCases: [],
    hints: [],
    solution: ''
  })
  
  useEffect(() => {
    // Mock data
    setQuestions([
      {
        id: 1,
        title: 'Two Sum Problem',
        description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.',
        difficulty: 'Easy',
        language: 'JavaScript',
        category: 'Array',
        status: 'Published',
        created: '2024-01-15',
        updated: '2024-01-16',
        testCases: 3,
        hints: 3,
        aiValidation: 'Passed',
        usage: 45
      },
      {
        id: 2,
        title: 'Binary Tree Traversal',
        description: 'Implement inorder, preorder, and postorder traversal of a binary tree.',
        difficulty: 'Medium',
        language: 'Python',
        category: 'Tree',
        status: 'Draft',
        created: '2024-01-14',
        updated: '2024-01-15',
        testCases: 5,
        hints: 3,
        aiValidation: 'Pending',
        usage: 0
      },
      {
        id: 3,
        title: 'Dynamic Programming - Fibonacci',
        description: 'Implement an efficient solution to calculate the nth Fibonacci number using dynamic programming.',
        difficulty: 'Hard',
        language: 'Java',
        category: 'Dynamic Programming',
        status: 'Review',
        created: '2024-01-13',
        updated: '2024-01-14',
        testCases: 4,
        hints: 3,
        aiValidation: 'Failed',
        usage: 0
      }
    ])
  }, [])
  
  useEffect(() => {
    let filtered = questions
    
    if (searchTerm) {
      filtered = filtered.filter(q => 
        q.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    
    if (filterDifficulty !== 'all') {
      filtered = filtered.filter(q => q.difficulty === filterDifficulty)
    }
    
    if (filterLanguage !== 'all') {
      filtered = filtered.filter(q => q.language === filterLanguage)
    }
    
    if (filterStatus !== 'all') {
      filtered = filtered.filter(q => q.status === filterStatus)
    }
    
    setFilteredQuestions(filtered)
  }, [questions, searchTerm, filterDifficulty, filterLanguage, filterStatus])
  
  const handleAddQuestion = () => {
    // Mock AI validation
    const aiValidation = Math.random() > 0.3 ? 'Passed' : 'Failed'
    
    const question = {
      id: questions.length + 1,
      ...newQuestion,
      status: aiValidation === 'Passed' ? 'Published' : 'Review',
      created: new Date().toISOString().split('T')[0],
      updated: new Date().toISOString().split('T')[0],
      aiValidation,
      usage: 0
    }
    
    setQuestions([question, ...questions])
    setShowAddModal(false)
    setNewQuestion({
      title: '',
      description: '',
      difficulty: 'Easy',
      language: 'JavaScript',
      category: '',
      testCases: [],
      hints: [],
      solution: ''
    })
  }
  
  const handleDeleteQuestion = (id) => {
    setQuestions(questions.filter(q => q.id !== id))
  }
  
  const handleEditQuestion = (question) => {
    setSelectedQuestion(question)
    setShowAddModal(true)
  }
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'Published':
        return 'bg-green-100 text-green-800'
      case 'Draft':
        return 'bg-gray-100 text-gray-800'
      case 'Review':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }
  
  const getValidationColor = (validation) => {
    switch (validation) {
      case 'Passed':
        return 'text-green-600'
      case 'Failed':
        return 'text-red-600'
      case 'Pending':
        return 'text-yellow-600'
      default:
        return 'text-gray-600'
    }
  }
  
  const getValidationIcon = (validation) => {
    switch (validation) {
      case 'Passed':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'Failed':
        return <XCircle className="w-4 h-4 text-red-600" />
      case 'Pending':
        return <Clock className="w-4 h-4 text-yellow-600" />
      default:
        return <AlertCircle className="w-4 h-4 text-gray-600" />
    }
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">Question Management</h1>
        <p className="text-purple-100">
          Create, manage, and validate coding questions for your courses
        </p>
      </div>
      
      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search questions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <select
              value={filterDifficulty}
              onChange={(e) => setFilterDifficulty(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Difficulties</option>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
            
            <select
              value={filterLanguage}
              onChange={(e) => setFilterLanguage(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Languages</option>
              <option value="JavaScript">JavaScript</option>
              <option value="Python">Python</option>
              <option value="Java">Java</option>
              <option value="C++">C++</option>
              <option value="Go">Go</option>
              <option value="Rust">Rust</option>
            </select>
            
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="Published">Published</option>
              <option value="Draft">Draft</option>
              <option value="Review">Review</option>
            </select>
          </div>
          
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Question</span>
          </button>
        </div>
      </div>
      
      {/* Questions Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Questions ({filteredQuestions.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Question</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Difficulty</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Language</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">AI Validation</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usage</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredQuestions.map((question) => (
                <tr key={question.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <Code className="w-5 h-5 text-gray-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{question.title}</p>
                        <p className="text-sm text-gray-500 truncate">{question.description}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-xs text-gray-500">{question.category}</span>
                          <span className="text-xs text-gray-400">•</span>
                          <span className="text-xs text-gray-500">{question.testCases} test cases</span>
                          <span className="text-xs text-gray-400">•</span>
                          <span className="text-xs text-gray-500">{question.hints} hints</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      question.difficulty === 'Easy' ? 'bg-green-100 text-green-800' :
                      question.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {question.difficulty}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{question.language}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(question.status)}`}>
                      {question.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {getValidationIcon(question.aiValidation)}
                      <span className={`text-sm ${getValidationColor(question.aiValidation)}`}>
                        {question.aiValidation}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{question.usage} times</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setSelectedQuestion(question)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEditQuestion(question)}
                        className="text-green-600 hover:text-green-900"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteQuestion(question.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Add Question Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                {selectedQuestion ? 'Edit Question' : 'Add New Question'}
              </h3>
              <button
                onClick={() => {
                  setShowAddModal(false)
                  setSelectedQuestion(null)
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Question Title</label>
                <input
                  type="text"
                  value={newQuestion.title}
                  onChange={(e) => setNewQuestion({...newQuestion, title: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter question title..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={newQuestion.description}
                  onChange={(e) => setNewQuestion({...newQuestion, description: e.target.value})}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter question description..."
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty</label>
                  <select
                    value={newQuestion.difficulty}
                    onChange={(e) => setNewQuestion({...newQuestion, difficulty: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
                  <select
                    value={newQuestion.language}
                    onChange={(e) => setNewQuestion({...newQuestion, language: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="JavaScript">JavaScript</option>
                    <option value="Python">Python</option>
                    <option value="Java">Java</option>
                    <option value="C++">C++</option>
                    <option value="Go">Go</option>
                    <option value="Rust">Rust</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <input
                    type="text"
                    value={newQuestion.category}
                    onChange={(e) => setNewQuestion({...newQuestion, category: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Array, Tree, DP"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Solution</label>
                <textarea
                  value={newQuestion.solution}
                  onChange={(e) => setNewQuestion({...newQuestion, solution: e.target.value})}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                  placeholder="Enter the solution code..."
                />
              </div>
            </div>
            
            <div className="flex items-center justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowAddModal(false)
                  setSelectedQuestion(null)
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleAddQuestion}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {selectedQuestion ? 'Update Question' : 'Add Question'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default QuestionManagement


