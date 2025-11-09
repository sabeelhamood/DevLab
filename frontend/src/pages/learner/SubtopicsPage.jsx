import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { mockMicroservices } from '../../services/mockMicroservices'

function SubtopicsPage() {
  const { courseId } = useParams()
  const navigate = useNavigate()
  const [subtopics, setSubtopics] = useState([])
  const [userQuota, setUserQuota] = useState(4)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const practiceQuota = 4
    setUserQuota(practiceQuota)

    const topics = mockMicroservices.contentStudio.getTopics(courseId)
    
    console.log('Course ID:', courseId)
    console.log('Topics found:', topics)
    
    if (topics.length === 0) {
      console.log('No topics found for course:', courseId)
      setSubtopics([])
      setLoading(false)
      return
    }
    
    // Transform topics data to match component expectations
    const transformedTopics = topics.map(topic => ({
      topicId: topic.topic_id,
      name: topic.topic_name,
      description: `Master ${topic.topic_name.toLowerCase()} concepts and techniques`,
      macroSkills: topic.macro_skills,
      microSkillsPractices: topic.nano_skills.map((skill, index) => ({
        practiceId: parseInt(`${topic.topic_id}${index + 1}`),
        name: `${skill} Practice`,
        description: `Practice ${skill.toLowerCase()} concepts and implementations`,
        questionType: index % 2 === 0 ? "code" : "theoretical",
        questionCount: practiceQuota,
        progressPercentage: Math.floor(Math.random() * 100)
      })),
      difficulty: "intermediate",
      progressPercentage: Math.floor(Math.random() * 100)
    }))

    console.log('Transformed topics:', transformedTopics)
    setSubtopics(transformedTopics)
    setLoading(false)
  }, [courseId])

  const handlePracticeClick = (courseId, topicId, practiceId) => {
    navigate(`/practice/${courseId}/${topicId}/${practiceId}`)
  }

  const getCourseName = (courseId) => {
    const courseNames = {
      203: 'Advanced JavaScript Functions',
      204: 'Algorithm Optimization',
      201: 'JavaScript Fundamentals',
      202: 'Data Structures & Algorithms'
    }
    return courseNames[courseId] || `Course ${courseId}`
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <button 
            onClick={() => navigate('/dashboard')}
            className="mb-4 text-indigo-600 hover:text-indigo-800 font-medium"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-900">
            {getCourseName(courseId)} - Sub Topics
          </h1>
        </div>

        {/* Learning Progress */}
        <div className="quota-info">
          <h4 className="quota-header">📊 Your Learning Progress</h4>
          <div className="quota-details">
            <span className="quota-item">Questions per Practice: {userQuota} questions</span>
            <span className="quota-item">Daily Limit: {userQuota} questions</span>
            <span className="quota-item">Used Today: 2/{userQuota}</span>
          </div>
        </div>

        {/* Subtopics List */}
        {subtopics.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 mb-4">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Topics Available</h3>
            <p className="text-gray-500 mb-4">This course doesn't have any topics yet.</p>
            <button 
              onClick={() => navigate('/dashboard')}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
            >
              Back to Dashboard
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {subtopics.map((subtopic) => (
            <div key={subtopic.topicId} className={`subtopic-item ${subtopic.progressPercentage === 100 ? 'subtopic-item-completed' : ''}`}>
              {/* Subtopic Header */}
              <div className="subtopic-header">
                <div className="flex-1">
                  <h3 className="subtopic-title">
                    {subtopic.name}
                  </h3>
                  <p className="subtopic-description">{subtopic.description}</p>
                </div>
                <div className="subtopic-progress">
                  <svg className="progress-circle" width="64" height="64">
                    <circle className="progress-ring-bg" strokeWidth="6" stroke="currentColor" fill="transparent" r="25" cx="32" cy="32" />
                    <circle
                      className={`${subtopic.progressPercentage === 100 ? 'progress-ring-fill-completed' : 'progress-ring-fill'}`}
                      strokeWidth="6"
                      strokeDasharray={2 * Math.PI * 25}
                      strokeDashoffset={(2 * Math.PI * 25) * (100 - subtopic.progressPercentage) / 100}
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="transparent"
                      r="25"
                      cx="32"
                      cy="32"
                      style={{ transition: 'stroke-dashoffset 0.5s ease-in-out' }}
                    />
                  </svg>
                  <span className="progress-text">{subtopic.progressPercentage}%</span>
                </div>
              </div>

              {/* Subtopic Details */}
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h5 className="font-semibold text-gray-900 mb-3">Macro Skills:</h5>
                  <div className="flex flex-wrap gap-2">
                    {subtopic.macroSkills.map((skill, index) => (
                      <span 
                        key={index}
                        className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Difficulty:</span>
                    <span className={`font-semibold ${
                      subtopic.difficulty === 'beginner' ? 'text-green-600' :
                      subtopic.difficulty === 'intermediate' ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {subtopic.difficulty}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Micro Skills Practices:</span>
                    <span className="font-semibold">{subtopic.microSkillsPractices.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Questions:</span>
                    <span className="font-semibold">{subtopic.microSkillsPractices.length * userQuota}</span>
                  </div>
                </div>
              </div>

              {/* Micro Skills Practices */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h5 className="font-semibold text-gray-900 mb-4">Micro Skills Practices:</h5>
                <div className="space-y-3">
                  {subtopic.microSkillsPractices.map((practice) => {
                    const isCompleted = practice.progressPercentage === 100
                    return (
                      <div key={practice.practiceId} className={`bg-white p-4 rounded-lg border-2 ${
                        isCompleted ? 'border-green-200 bg-green-50' : 'border-gray-200'
                      }`}>
                        <div className="flex justify-between items-center">
                          <div className="flex-1">
                            <h6 className="font-semibold text-gray-900">{practice.name}</h6>
                            <p className="text-sm text-gray-600 mb-2">{practice.description}</p>
                            <div className="flex gap-4 text-sm">
                              <span className={`px-2 py-1 rounded ${
                                practice.questionType === 'code' 
                                  ? 'bg-blue-100 text-blue-800' 
                                  : 'bg-green-100 text-green-800'
                              }`}>
                                {practice.questionType === 'code' ? '💻' : '🧠'} {practice.questionType.toUpperCase()}
                              </span>
                              <span className="text-gray-600">{practice.questionCount} questions</span>
                              <span className="text-gray-600">{practice.progressPercentage}% complete</span>
                            </div>
                          </div>
                          <div className="ml-4">
                            {isCompleted ? (
                              <button 
                                disabled
                                className="bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-semibold opacity-70 cursor-not-allowed"
                              >
                                ✅ Completed
                              </button>
                            ) : (
                              <button 
                                onClick={() => handlePracticeClick(courseId, subtopic.topicId, practice.practiceId)}
                                className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors"
                              >
                                Practice
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default SubtopicsPage
