import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth()

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-matka-grey-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-matka-green-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading...</p>
        </div>
      </div>
    )
  }

  // Redirect to auth if not logged in
  if (!user) {
    return <Navigate to="/auth" replace />
  }

  // Redirect to auth if user is not admin or subadmin
  if (user.role !== 'admin' && user.role !== 'subadmin') {
    console.log(`Admin access denied for user: ${user.name} (${user.mobileNumber}) - Role: ${user.role}`)
    return <Navigate to="/auth" replace />
  }

  // User is authenticated and is admin, render the protected content
  return children
}

export default ProtectedRoute 