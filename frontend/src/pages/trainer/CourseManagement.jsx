import React, { useState, useEffect } from 'react'
import { 
  BookOpen, 
  PlusCircle, 
  Edit, 
  Trash2, 
  Users, 
  Target,
  Clock,
  TrendingUp,
  CheckCircle,
  AlertCircle
} from 'lucide-react'

const CourseManagement = () => {
  const [courses, setCourses] = useState([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [newCourse, setNewCourse] = useState({
    title: '',
    description: '',
    difficulty: 'Beginner',
    duration: '',
    skills: [],
    questions: []
  })
  
  useEffect(() => {
    // Mock data
    setCourses([
      {
        id: 1,
        title: 'Python Fundamentals',
        description: 'Learn the basics of Python programming',
        difficulty: 'Beginner',
        duration: '4 weeks',
        students: 45,
        completion: 85,
        skills: ['Python', 'Variables', 'Functions', 'Loops'],
        questions: 25,
        status: 'Active',
        created: '2024-01-15'
      },
      {
        id: 2,
        title: 'Data Structures & Algorithms',
        description: 'Master data structures and algorithmic thinking',
        difficulty: 'Intermediate',
        duration: '6 weeks',
        students: 32,
        completion: 72,
        skills: ['Arrays', 'Linked Lists', 'Trees', 'Graphs'],
        questions: 40,
        status: 'Active',
        created: '2024-01-10'
      },
      {
        id: 3,
        title: 'JavaScript Advanced',
        description: 'Advanced JavaScript concepts and frameworks',
        difficulty: 'Advanced',
        duration: '8 weeks',
        students: 28,
        completion: 68,
        skills: ['ES6+', 'React', 'Node.js', 'Async Programming'],
        questions: 35,
        status: 'Draft',
        created: '2024-01-20'
      }
    ])
  }, [])
  
  const handleAddCourse = () => {
    const course = {
      id: courses.length + 1,
      ...newCourse,
      students: 0,
      completion: 0,
      questions: 0,
      status: 'Draft',
      created: new Date().toISOString().split('T')[0]
    }
    
    setCourses([course, ...courses])
    setShowAddModal(false)
    setNewCourse({
      title: '',
      description: '',
      difficulty: 'Beginner',
      duration: '',
      skills: [],
      questions: []
    })
  }
  
  const handleDeleteCourse = (id) => {
    setCourses(courses.filter(c => c.id !== id))
  }
  
  const handleEditCourse = (course) => {
    setSelectedCourse(course)
    setNewCourse(course)
    setShowAddModal(true)
  }
  
  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Beginner':
        return 'bg-green-100 text-green-800'
      case 'Intermediate':
        return 'bg-yellow-100 text-yellow-800'
      case 'Advanced':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800'
      case 'Draft':
        return 'bg-gray-100 text-gray-800'
      case 'Archived':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-teal-600 rounded-xl p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">Course Management</h1>
        <p className="text-green-100">
          Create and manage courses for your organization
        </p>
      </div>
      
      {/* Course Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => (
          <div key={course.id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{course.title}</h3>
                  <p className="text-sm text-gray-600 mb-3">{course.description}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleEditCourse(course)}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteCourse(course.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Difficulty</span>
                  <span className={`px-2 py-1 text-xs rounded-full ${getDifficultyColor(course.difficulty)}`}>
                    {course.difficulty}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Duration</span>
                  <span className="text-sm font-medium text-gray-900">{course.duration}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Students</span>
                  <span className="text-sm font-medium text-gray-900">{course.students}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Completion</span>
                  <span className="text-sm font-medium text-gray-900">{course.completion}%</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Questions</span>
                  <span className="text-sm font-medium text-gray-900">{course.questions}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Status</span>
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(course.status)}`}>
                    {course.status}
                  </span>
                </div>
              </div>
              
              <div className="mt-4">
                <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                  <span>Progress</span>
                  <span>{course.completion}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${course.completion}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Skills Covered</h4>
                <div className="flex flex-wrap gap-1">
                  {course.skills.slice(0, 3).map((skill, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full"
                    >
                      {skill}
                    </span>
                  ))}
                  {course.skills.length > 3 && (
                    <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                      +{course.skills.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Add Course Button */}
      <div className="flex justify-center">
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <PlusCircle className="w-5 h-5" />
          <span>Add New Course</span>
        </button>
      </div>
      
      {/* Add Course Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                {selectedCourse ? 'Edit Course' : 'Add New Course'}
              </h3>
              <button
                onClick={() => {
                  setShowAddModal(false)
                  setSelectedCourse(null)
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Course Title</label>
                <input
                  type="text"
                  value={newCourse.title}
                  onChange={(e) => setNewCourse({...newCourse, title: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter course title..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={newCourse.description}
                  onChange={(e) => setNewCourse({...newCourse, description: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter course description..."
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty</label>
                  <select
                    value={newCourse.difficulty}
                    onChange={(e) => setNewCourse({...newCourse, difficulty: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Duration</label>
                  <input
                    type="text"
                    value={newCourse.duration}
                    onChange={(e) => setNewCourse({...newCourse, duration: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., 4 weeks"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowAddModal(false)
                  setSelectedCourse(null)
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleAddCourse}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {selectedCourse ? 'Update Course' : 'Add Course'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CourseManagement


