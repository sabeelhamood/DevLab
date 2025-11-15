import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card.jsx'
import Button from '../../components/ui/Button.jsx'
import { BookOpen, BarChart3, Clock, Target, Award } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore.js'
import { competitionsAIAPI } from '../../services/api/competitionsAI.js'

// Mock data for demonstration
const mockStats = {
  totalQuestions: 45,
  correctAnswers: 38,
  averageScore: 84.4,
  timeSpent: 120,
  currentStreak: 7,
  achievements: 12
}

const mockCourses = [
  {
    id: '1',
    name: 'Python Fundamentals',
    progress: 75,
    difficulty: 'Beginner',
    nextTopic: 'Functions and Modules'
  },
  {
    id: '2',
    name: 'JavaScript Advanced',
    progress: 45,
    difficulty: 'Intermediate',
    nextTopic: 'Async Programming'
  }
]

const mockRecentActivity = [
  {
    id: '1',
    course: 'Python Fundamentals',
    score: 85,
    date: '2 hours ago'
  },
  {
    id: '2',
    course: 'JavaScript Advanced',
    score: 78,
    date: '1 day ago'
  }
]

export default function Dashboard() {
  const { user } = useAuthStore()
  const [pendingCompetitions, setPendingCompetitions] = useState([])
  const [pendingLoading, setPendingLoading] = useState(false)
  const [pendingError, setPendingError] = useState(null)
  const [creationState, setCreationState] = useState({})

  useEffect(() => {
    const learnerId = user?.id
    if (!learnerId) {
      setPendingCompetitions([])
      return
    }

    let isMounted = true
    setPendingLoading(true)
    setPendingError(null)
    competitionsAIAPI
      .getPendingCompetitions(learnerId)
      .then((data) => {
        if (isMounted) {
          setPendingCompetitions(data)
        }
      })
      .catch((error) => {
        console.error('Failed to fetch pending competitions:', error)
        if (isMounted) {
          setPendingError(error.message || 'Unable to fetch pending competitions')
        }
      })
      .finally(() => {
        if (isMounted) {
          setPendingLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [user?.id])

  const handleEnterCompetition = async (course) => {
    const learnerId = user?.id
    if (!learnerId) {
      return
    }

    const courseKey = course.course_id
    setCreationState((prev) => ({
      ...prev,
      [courseKey]: { status: 'creating' }
    }))

    try {
      const response = await competitionsAIAPI.createCompetition({
        learner_id: learnerId,
        learner_name: user?.name || null,
        course_id: course.course_id,
        course_name: course.course_name
      })

      setCreationState((prev) => ({
        ...prev,
        [courseKey]: {
          status: 'ready',
          competitionId: response?.competition?.competition_id || null
        }
      }))
    } catch (error) {
      console.error('Failed to create AI competition:', error)
      setCreationState((prev) => ({
        ...prev,
        [courseKey]: {
          status: 'error',
          message: error.response?.data?.error || error.message || 'Unable to create competition'
        }
      }))
    }
  }

  const handleStartCompetition = (courseKey, competitionId) => {
    console.log('Start competition placeholder', { courseKey, competitionId })
    alert('Competition experience is coming soon!')
  }

  const formatCompletedAt = (timestamp) => {
    if (!timestamp) {
      return 'Recently completed'
    }

    try {
      const date = new Date(timestamp)
      return date.toLocaleString()
    } catch (error) {
      return timestamp
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Welcome back! Here's your learning progress.</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-primary-100 rounded-lg">
                <BookOpen className="h-6 w-6 text-primary-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Questions Solved</p>
                <p className="text-2xl font-bold text-gray-900">{mockStats.totalQuestions}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-success-100 rounded-lg">
                <Target className="h-6 w-6 text-success-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Accuracy</p>
                <p className="text-2xl font-bold text-gray-900">{mockStats.averageScore}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-warning-100 rounded-lg">
                <Clock className="h-6 w-6 text-warning-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Time Spent</p>
                <p className="text-2xl font-bold text-gray-900">{mockStats.timeSpent}h</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Award className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Achievements</p>
                <p className="text-2xl font-bold text-gray-900">{mockStats.achievements}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Courses */}
        <Card>
          <CardHeader>
            <CardTitle>Active Courses</CardTitle>
            <CardDescription>Continue your learning journey</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockCourses.map((course) => (
                <div key={course.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-gray-900">{course.name}</h3>
                    <span className="text-sm text-gray-500">{course.difficulty}</span>
                  </div>
                  <div className="mb-2">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Progress</span>
                      <span>{course.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-primary-600 h-2 rounded-full" 
                        style={{ width: `${course.progress}%` }}
                      />
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">Next: {course.nextTopic}</p>
                  <div className="mt-3 flex space-x-2">
                    <Button size="sm" asChild>
                      <Link to="/practice">Continue</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your latest learning activities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockRecentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center space-x-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <BookOpen className="h-4 w-4 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      Practice session in {activity.course}
                    </p>
                    <p className="text-xs text-gray-500">
                      Score: {activity.score}% • {activity.date}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Jump back into your learning flow</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button asChild className="h-20 flex-col space-y-2">
              <Link to="/practice">
                <BookOpen className="h-6 w-6" />
                <span>Start Practice</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-20 flex-col space-y-2">
              <Link to="/analytics">
                <BarChart3 className="h-6 w-6" />
                <span>View Analytics</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {user?.role === 'learner' && (
        <Card>
          <CardHeader>
            <CardTitle>Ready for a Competition?</CardTitle>
            <CardDescription>
              Turn your recent course completions into an AI challenge.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {pendingLoading && <p className="text-gray-500">Checking for new competitions...</p>}
            {pendingError && (
              <p className="text-red-600 text-sm mb-4">
                {pendingError}
              </p>
            )}
            {!pendingLoading && !pendingCompetitions.length && !pendingError && (
              <p className="text-gray-600">
                Complete a course to unlock a personalized AI competition.
              </p>
            )}
            <div className="space-y-4">
              {pendingCompetitions.map((course) => {
                const courseKey = course.course_id
                const status = creationState[courseKey]?.status || 'idle'
                const competitionId = creationState[courseKey]?.competitionId

                return (
                  <div
                    key={courseKey}
                    className="border rounded-xl p-4 flex flex-col md:flex-row md:items-center md:justify-between"
                  >
                    <div>
                      <h4 className="font-semibold text-gray-900">{course.course_name}</h4>
                      <p className="text-sm text-gray-500">
                        Completed on {formatCompletedAt(course.completed_at)}
                      </p>
                    </div>
                    <div className="mt-4 md:mt-0 flex flex-col md:flex-row md:items-center gap-3">
                      {status !== 'ready' && (
                        <Button
                          size="sm"
                          disabled={status === 'creating'}
                          onClick={() => handleEnterCompetition(course)}
                        >
                          {status === 'creating' ? 'Creating Competition...' : 'Enter Competition'}
                        </Button>
                      )}
                      {status === 'ready' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStartCompetition(courseKey, competitionId)}
                        >
                          Start Competition
                        </Button>
                      )}
                      {status === 'error' && (
                        <p className="text-xs text-red-600 max-w-sm">
                          {creationState[courseKey]?.message}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}