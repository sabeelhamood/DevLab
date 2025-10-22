import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card'
import { BarChart3, Users, BookOpen, TrendingUp, Target, Clock } from 'lucide-react'

export default function Analytics() {
  const mockAnalytics = {
    totalLearners: 250,
    activeSessions: 45,
    totalQuestions: 150,
    averageScore: 82.5,
    completionRate: 0.75,
    timeSpent: 1800
  }

  const mockCourseStats = [
    {
      courseId: '1',
      name: 'Python Fundamentals',
      learners: 120,
      completionRate: 0.85,
      averageScore: 88.2,
      timeSpent: 2400
    },
    {
      courseId: '2',
      name: 'JavaScript Advanced',
      learners: 80,
      completionRate: 0.70,
      averageScore: 76.8,
      timeSpent: 1800
    },
    {
      courseId: '3',
      name: 'Data Structures',
      learners: 60,
      completionRate: 0.65,
      averageScore: 72.1,
      timeSpent: 3600
    }
  ]

  const mockQuestionStats = [
    {
      questionId: '1',
      title: 'Python Hello World',
      attempts: 150,
      successRate: 0.85,
      averageTime: 120
    },
    {
      questionId: '2',
      title: 'JavaScript Variables',
      attempts: 120,
      successRate: 0.70,
      averageTime: 180
    },
    {
      questionId: '3',
      title: 'Data Structures',
      attempts: 80,
      successRate: 0.60,
      averageTime: 300
    }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
        <p className="text-gray-600">Track learner progress and question performance</p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-primary-100 rounded-lg">
                <Users className="h-6 w-6 text-primary-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Learners</p>
                <p className="text-2xl font-bold text-gray-900">{mockAnalytics.totalLearners}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-success-100 rounded-lg">
                <BookOpen className="h-6 w-6 text-success-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Sessions</p>
                <p className="text-2xl font-bold text-gray-900">{mockAnalytics.activeSessions}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-warning-100 rounded-lg">
                <BarChart3 className="h-6 w-6 text-warning-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Average Score</p>
                <p className="text-2xl font-bold text-gray-900">{mockAnalytics.averageScore}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Course Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Course Performance</CardTitle>
            <CardDescription>Performance metrics by course</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockCourseStats.map((course) => (
                <div key={course.courseId} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-gray-900">{course.name}</h3>
                    <span className="text-sm text-gray-500">{course.learners} learners</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-gray-600">Completion Rate</span>
                        <span className="font-semibold">{(course.completionRate * 100).toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-success-600 h-2 rounded-full" 
                          style={{ width: `${course.completionRate * 100}%` }}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-gray-600">Average Score</span>
                        <span className="font-semibold">{course.averageScore}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-primary-600 h-2 rounded-full" 
                          style={{ width: `${course.averageScore}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-3 flex items-center text-sm text-gray-600">
                    <Clock className="h-4 w-4 mr-1" />
                    <span>Avg. time: {Math.floor(course.timeSpent / 60)} minutes</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Question Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Question Performance</CardTitle>
            <CardDescription>How your questions are performing</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockQuestionStats.map((question) => (
                <div key={question.questionId} className="border rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">{question.title}</h3>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-gray-600">Success Rate</span>
                        <span className="font-semibold">{(question.successRate * 100).toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-primary-600 h-2 rounded-full" 
                          style={{ width: `${question.successRate * 100}%` }}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-gray-600">Attempts</span>
                        <span className="font-semibold">{question.attempts}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-3 flex items-center text-sm text-gray-600">
                    <Clock className="h-4 w-4 mr-1" />
                    <span>Avg. time: {question.averageTime} seconds</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Learning Trends</CardTitle>
          <CardDescription>Recent activity and performance trends</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <TrendingUp className="h-8 w-8 text-success-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Completion Rate</h3>
              <p className="text-2xl font-bold text-success-600">+12%</p>
              <p className="text-sm text-gray-600">vs last month</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Target className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Average Score</h3>
              <p className="text-2xl font-bold text-primary-600">+5.2%</p>
              <p className="text-sm text-gray-600">vs last month</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Users className="h-8 w-8 text-warning-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Active Learners</h3>
              <p className="text-2xl font-bold text-warning-600">+18</p>
              <p className="text-sm text-gray-600">new this week</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

