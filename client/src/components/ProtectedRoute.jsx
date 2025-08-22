import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/auth" replace />
  }

  // If admin user tries to access user dashboard, redirect to admin panel
  if (user.role === 'admin') {
    // Redirect to admin client (different domain/port)
    window.location.href = 'http://localhost:3001'
    return null
  }

  return children
}

export default ProtectedRoute
