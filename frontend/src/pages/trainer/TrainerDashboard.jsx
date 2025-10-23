import React, { useState, useEffect } from 'react'
import { 
  BookOpen, 
  PlusCircle, 
  BarChart3, 
  Users, 
  TrendingUp,
  Target,
  Award,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react'

const TrainerDashboard = () => {
  const [stats, setStats] = useState({})
  const [recentActivity, setRecentActivity] = useState([])
  const [courses, setCourses] = useState([])
  const [questions, setQuestions] = useState([])
  const [studentProgress, setStudentProgress] = useState([])
  
  useEffect(() => {
    // Mock data
    setStats({
      totalCourses: 8,
      totalQuestions: 156,
      activeStudents: 245,
      completionRate: 78.5,
      averageScore: 82.3,
      totalHours: 1240
    })
    
    setRecentActivity([
      { id: 1, type: 'question', title: 'Added new Python question', time: '2 hours ago', status: 'success' },
      { id: 2, type: 'course', title: 'Updated Data Structures course', time: '1 day ago', status: 'success' },
      { id: 3, type: 'student', title: 'Student completed JavaScript basics', time: '2 days ago', status: 'info' },
      { id: 4, type: 'question', title: 'AI validation failed for new question', time: '3 days ago', status: 'warning' }
    ])
    
    setCourses([
      { id: 1, title: 'Python Fundamentals', students: 45, completion: 85, difficulty: 'Beginner' },
      { id: 2, title: 'Data Structures & Algorithms', students: 32, completion: 72, difficulty: 'Intermediate' },
      { id: 3, title: 'JavaScript Advanced', students: 28, completion: 68, difficulty: 'Advanced' },
      { id: 4, title: 'Database Design', students: 35, completion: 91, difficulty: 'Intermediate' }
    ])
    
    setQuestions([
      { id: 1, title: 'Two Sum Problem', difficulty: 'Easy', language: 'Python', status: 'Published', created: '2 days ago' },
      { id: 2, title: 'Binary Tree Traversal', difficulty: 'Medium', language: 'Java', status: 'Draft', created: '1 week ago' },
      { id: 3, title: 'Dynamic Programming', difficulty: 'Hard', language: 'C++', status: 'Review', created: '3 days ago' }
    ])
    
    setStudentProgress([
      { id: 1, name: 'John Doe', course: 'Python Fundamentals', progress: 85, score: 92, lastActive: '2 hours ago' },
      { id: 2, name: 'Jane Smith', course: 'Data Structures', progress: 72, score: 88, lastActive: '1 day ago' },
      { id: 3, name: 'Mike Johnson', course: 'JavaScript Advanced', progress: 68, score: 85, lastActive: '3 days ago' }
    ])
  }, [])
  
  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-yellow-600" />
      case 'info':
        return <TrendingUp className="w-4 h-4 text-blue-600" />
      default:
        return <Clock className="w-4 h-4 text-gray-600" />
    }
  }
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'success':
        return 'text-green-600'
      case 'warning':
        return 'text-yellow-600'
      case 'info':
        return 'text-blue-600'
      default:
        return 'text-gray-600'
    }
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-xl p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">Trainer Dashboard</h1>
        <p className="text-green-100">
          Manage your courses, questions, and track student progress
        </p>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Courses</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalCourses}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Questions</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalQuestions}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <PlusCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Students</p>
              <p className="text-2xl font-bold text-gray-900">{stats.activeStudents}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completion Rate</p>
              <p className="text-2xl font-bold text-gray-900">{stats.completionRate}%</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Target className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Average Score</p>
              <p className="text-2xl font-bold text-gray-900">{stats.averageScore}%</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Award className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Hours</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalHours}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Recent Activity</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    {getStatusIcon(activity.status)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                    <p className={`text-sm ${getStatusColor(activity.status)}`}>{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Course Overview */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Course Overview</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {courses.map((course) => (
                <div key={course.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900">{course.title}</h3>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      course.difficulty === 'Beginner' ? 'bg-green-100 text-green-800' :
                      course.difficulty === 'Intermediate' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {course.difficulty}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>{course.students} students</span>
                    <span>{course.completion}% completion</span>
                  </div>
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${course.completion}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Questions Management */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Recent Questions</h2>
            <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <PlusCircle className="w-4 h-4" />
              <span>Add Question</span>
            </button>
          </div>
        </div>
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Question</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Difficulty</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Language</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {questions.map((question) => (
                  <tr key={question.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{question.title}</div>
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
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        question.status === 'Published' ? 'bg-green-100 text-green-800' :
                        question.status === 'Draft' ? 'bg-gray-100 text-gray-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {question.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{question.created}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      {/* Student Progress */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Student Progress</h2>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {studentProgress.map((student) => (
              <div key={student.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="font-medium text-gray-900">{student.name}</h3>
                    <p className="text-sm text-gray-600">{student.course}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{student.score}% score</p>
                    <p className="text-xs text-gray-500">Last active: {student.lastActive}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex-1">
                    <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                      <span>Progress</span>
                      <span>{student.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full" 
                        style={{ width: `${student.progress}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default TrainerDashboard


