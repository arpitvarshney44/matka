import React from 'react'
import { useNavigate } from 'react-router-dom'

const Layout = ({ 
  children, 
  title = "RAJ KALYAN MATKA",
  showBackButton = true,
  backPath = null,
  showBalance = false,
  balance = 0,
  headerActions = null,
  backgroundColor = "bg-gray-50",
  headerColor = "bg-green-800"
}) => {
  const navigate = useNavigate()

  return (
    <div className={`min-h-screen ${backgroundColor}`}>
      {/* Consistent Header */}
      <div className={`${headerColor} shadow-lg px-6 py-4`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {showBackButton && (
              <button
                onClick={() => backPath ? navigate(backPath) : navigate(-1)}
                className="text-white hover:text-gray-200 transition-colors duration-200"
                aria-label="Go back"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            <h1 className="text-xl font-bold text-white">{title}</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            {showBalance && (
              <button 
                onClick={() => navigate('/wallet')}
                className="flex items-center space-x-2 text-white hover:bg-green-700 px-3 py-2 rounded-lg transition-colors duration-200"
              >
                <span className="font-bold">₹{balance}</span>
                <span className="text-lg">💰</span>
              </button>
            )}
            {headerActions}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="min-h-screen">
        {children}
      </main>
    </div>
  )
}

export default Layout
