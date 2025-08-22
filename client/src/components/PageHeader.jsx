import React from 'react'
import { useNavigate } from 'react-router-dom'

const PageHeader = ({ 
  title, 
  subtitle, 
  showBackButton = true, 
  backPath = null,
  rightContent = null,
  bgColor = 'bg-green-800',
  textColor = 'text-white'
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
    <div className={`${bgColor} shadow-lg px-4 sm:px-6 py-3 sm:py-4`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 sm:space-x-4 flex-1 min-w-0">
          {showBackButton && (
            <button
              onClick={handleBack}
              className={`${textColor} hover:text-gray-200 transition-colors duration-200 flex-shrink-0 p-1`}
              aria-label="Go back"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          <div className="min-w-0 flex-1">
            <h1 className={`text-lg sm:text-xl font-bold ${textColor} truncate`}>{title}</h1>
            {subtitle && (
              <p className={`text-xs sm:text-sm ${textColor} opacity-90 mt-0.5 sm:mt-1 hidden sm:block`}>{subtitle}</p>
            )}
          </div>
        </div>
        
        {rightContent && (
          <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0 ml-2">
            {rightContent}
          </div>
        )}
      </div>
    </div>
  )
}

export default PageHeader
