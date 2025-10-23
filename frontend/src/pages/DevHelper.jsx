import React from 'react'
import { useAuthStore } from '../store/authStore'
import { useNavigate } from 'react-router-dom'

const DevHelper = () => {
  const { login, user } = useAuthStore()
  const navigate = useNavigate()

  const handleQuickLogin = async (email, password) => {
    try {
      await login(email, password)
      navigate('/dashboard')
    } catch (error) {
      console.error('Login failed:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-center mb-6">DEVLAB Development Helper</h1>
        
        {user ? (
          <div className="text-center">
            <p className="text-green-600 mb-4">✅ Logged in as: {user.name}</p>
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
            >
              Go to Dashboard
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold mb-4">Quick Login (Development)</h2>
            
            <button
              onClick={() => handleQuickLogin('learner@devlab.com', 'learner123')}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700"
            >
              Login as Learner
            </button>
            
            <button
              onClick={() => handleQuickLogin('trainer@devlab.com', 'trainer123')}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
            >
              Login as Trainer
            </button>
            
            <button
              onClick={() => handleQuickLogin('admin@devlab.com', 'admin123')}
              className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700"
            >
              Login as Admin
            </button>
            
            <div className="mt-6 p-4 bg-gray-100 rounded-lg">
              <h3 className="font-semibold mb-2">Demo Credentials:</h3>
              <div className="text-sm space-y-1">
                <p><strong>Learner:</strong> learner@devlab.com / learner123</p>
                <p><strong>Trainer:</strong> trainer@devlab.com / trainer123</p>
                <p><strong>Admin:</strong> admin@devlab.com / admin123</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default DevHelper

