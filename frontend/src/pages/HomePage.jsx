import React from 'react'
import { Link } from 'react-router-dom'

function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl font-bold text-gray-900 mb-6">
                Master Your Skills with <span className="text-indigo-600">DEVLAB</span>
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                Interactive AI-powered practice for coding and theoretical questions.
              </p>
              <div className="flex gap-4">
                <Link 
                  to="/register" 
                  className="bg-indigo-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
                >
                  Get Started
                </Link>
                <Link 
                  to="/login" 
                  className="border-2 border-indigo-600 text-indigo-600 px-8 py-3 rounded-lg font-semibold hover:bg-indigo-50 transition-colors"
                >
                  Login
                </Link>
              </div>
            </div>
            <div className="lg:order-last">
              <img 
                src="https://via.placeholder.com/600x400?text=DEVLAB+Learning" 
                alt="DEVLAB Learning Platform"
                className="rounded-lg shadow-xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">
            Why Choose DEVLAB?
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center p-6 rounded-lg bg-blue-50">
              <div className="text-4xl mb-4">💡</div>
              <h3 className="text-xl font-semibold mb-3">AI-Powered Learning</h3>
              <p className="text-gray-600">
                Dynamic questions, personalized feedback, and intelligent hints powered by Gemini.
              </p>
            </div>
            <div className="text-center p-6 rounded-lg bg-green-50">
              <div className="text-4xl mb-4">💻</div>
              <h3 className="text-xl font-semibold mb-3">Secure Code Sandbox</h3>
              <p className="text-gray-600">
                Practice coding in a safe, isolated environment supporting multiple languages.
              </p>
            </div>
            <div className="text-center p-6 rounded-lg bg-purple-50">
              <div className="text-4xl mb-4">🏆</div>
              <h3 className="text-xl font-semibold mb-3">Anonymous Competitions</h3>
              <p className="text-gray-600">
                Challenge peers and climb leaderboards without revealing your identity.
              </p>
            </div>
            <div className="text-center p-6 rounded-lg bg-orange-50">
              <div className="text-4xl mb-4">📈</div>
              <h3 className="text-xl font-semibold mb-3">Skill-Based Progression</h3>
              <p className="text-gray-600">
                Exercises tailored to your macro and nano skills, ensuring targeted development.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Dashboard Preview */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">
            What You'll Find
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-lg shadow-lg">
              <h3 className="text-2xl font-semibold mb-4">📚 Courses & Topics</h3>
              <p className="text-gray-600 mb-6">Structured learning paths with detailed sub-topics.</p>
              <Link 
                to="/dashboard" 
                className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors inline-block"
              >
                View Courses
              </Link>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-lg">
              <h3 className="text-2xl font-semibold mb-4">📝 Practice Sessions</h3>
              <p className="text-gray-600 mb-6">Interactive coding and theoretical exercises.</p>
              <button className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors">
                Start Practice
              </button>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-lg">
              <h3 className="text-2xl font-semibold mb-4">⚡ Live Competition</h3>
              <p className="text-gray-600 mb-6">Compete with other learners in real-time coding battles</p>
              <button className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors">
                Join Now
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default HomePage


