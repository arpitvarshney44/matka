import React from 'react'
import { useNavigate } from 'react-router-dom'

const PageHeader = ({ 
  title, 
  subtitle, 
  showBackButton = true, 
  backPath = '/admin-dashboard',
  rightContent = null,
  bgColor = 'bg-blue-600',
  textColor = 'text-white',
  children
}) => {
  const navigate = useNavigate()

  const handleBack = () => {
    if (backPath) {
      navigate(backPath)
    } else {
      navigate(-1)
    }
  }

  return (
    <div className={`${bgColor} shadow-lg px-4 sm:px-6 py-4`}>
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div className="flex items-center space-x-3 sm:space-x-4">
            {showBackButton && (
              <button
                onClick={handleBack}
                className={`${textColor} hover:text-gray-200 transition-colors duration-200 flex-shrink-0`}
                aria-label="Go back"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            <div className="min-w-0 flex-1">
              <h1 className={`text-lg sm:text-2xl font-bold ${textColor} truncate`}>{title}</h1>
              {subtitle && (
                <p className={`text-xs sm:text-sm ${textColor} opacity-90 mt-1`}>{subtitle}</p>
              )}
            </div>
          </div>
          
          {(rightContent || children) && (
            <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
              {rightContent || children}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default PageHeader
