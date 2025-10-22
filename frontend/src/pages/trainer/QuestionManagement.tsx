import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { Plus, Search, Filter, Edit, Trash2, Eye } from 'lucide-react'

export default function QuestionManagement() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterDifficulty, setFilterDifficulty] = useState('all')

  const mockQuestions = [
    {
      id: '1',
      title: 'Python Hello World',
      type: 'code',
      difficulty: 'beginner',
      language: 'python',
      status: 'approved',
      createdAt: '2024-01-15',
      courseId: '1',
      topicId: '1'
    },
    {
      id: '2',
      title: 'JavaScript Variables',
      type: 'theoretical',
      difficulty: 'intermediate',
      status: 'pending',
      createdAt: '2024-01-14',
      courseId: '1',
      topicId: '2'
    },
    {
      id: '3',
      title: 'Data Structures in Python',
      type: 'code',
      difficulty: 'advanced',
      language: 'python',
      status: 'approved',
      createdAt: '2024-01-13',
      courseId: '2',
      topicId: '3'
    }
  ]

  const filteredQuestions = mockQuestions.filter(question => {
    const matchesSearch = question.title.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === 'all' || question.type === filterType
    const matchesDifficulty = filterDifficulty === 'all' || question.difficulty === filterDifficulty
    return matchesSearch && matchesType && matchesDifficulty
  })

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Question Management</h1>
          <p className="text-gray-600">Create and manage your questions</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Question
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              placeholder="Search questions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={<Search className="h-4 w-4" />}
            />
            
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="h-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Types</option>
              <option value="code">Code</option>
              <option value="theoretical">Theoretical</option>
            </select>
            
            <select
              value={filterDifficulty}
              onChange={(e) => setFilterDifficulty(e.target.value)}
              className="h-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Difficulties</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
            
            <Button variant="outline" className="flex items-center">
              <Filter className="h-4 w-4 mr-2" />
              More Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Questions List */}
      <Card>
        <CardHeader>
          <CardTitle>Questions ({filteredQuestions.length})</CardTitle>
          <CardDescription>Manage your question repository</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredQuestions.map((question) => (
              <div key={question.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="font-semibold text-gray-900">{question.title}</h3>
                      <span className={`text-xs px-2 py-1 rounded ${
                        question.status === 'approved' 
                          ? 'bg-success-100 text-success-800' 
                          : question.status === 'pending'
                          ? 'bg-warning-100 text-warning-800'
                          : 'bg-error-100 text-error-800'
                      }`}>
                        {question.status}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                      <span className="capitalize">{question.type}</span>
                      <span>•</span>
                      <span className="capitalize">{question.difficulty}</span>
                      {question.language && (
                        <>
                          <span>•</span>
                          <span>{question.language}</span>
                        </>
                      )}
                      <span>•</span>
                      <span>{question.createdAt}</span>
                    </div>
                    
                    <div className="text-sm text-gray-500">
                      Course: {question.courseId} • Topic: {question.topicId}
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" className="text-error-600 hover:text-error-700">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            
            {filteredQuestions.length === 0 && (
              <div className="text-center py-8">
                <div className="text-gray-500 mb-4">No questions found</div>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Question
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

