import React from 'react'
import PropTypes from 'prop-types'

const StarlineResultDisplay = ({ 
  result, 
  showDetails = true, 
  showStats = false, 
  className = '',
  size = 'medium' 
}) => {
  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const getResultSizeClasses = () => {
    switch (size) {
      case 'small':
        return {
          container: 'p-3',
          number: 'text-lg',
          title: 'text-sm',
          details: 'text-xs'
        }
      case 'large':
        return {
          container: 'p-8',
          number: 'text-4xl',
          title: 'text-xl',
          details: 'text-base'
        }
      default: // medium
        return {
          container: 'p-6',
          number: 'text-2xl',
          title: 'text-lg',
          details: 'text-sm'
        }
    }
  }

  const sizeClasses = getResultSizeClasses()

  const getGameTypeColor = (gameType) => {
    const colors = {
      'single digit': 'bg-blue-100 text-blue-800',
      'single pana': 'bg-green-100 text-green-800',
      'double pana': 'bg-yellow-100 text-yellow-800',
      'triple pana': 'bg-purple-100 text-purple-800'
    }
    return colors[gameType] || 'bg-gray-100 text-gray-800'
  }

  if (!result) {
    return (
      <div className={`bg-white rounded-lg shadow-sm ${sizeClasses.container} ${className}`}>
        <div className="text-center text-gray-500">
          <svg className="mx-auto h-8 w-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className={sizeClasses.details}>No result available</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm ${sizeClasses.container} ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className={`font-semibold text-gray-900 ${sizeClasses.title}`}>
            {result.gameName || result.gameId?.gameName}
          </h3>
          {showDetails && (
            <p className={`text-gray-500 mt-1 ${sizeClasses.details}`}>
              {formatDateTime(result.declaredAt)}
            </p>
          )}
        </div>
        {result.gameId?.gameType && (
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getGameTypeColor(result.gameId.gameType)}`}>
            {result.gameId.gameType}
          </span>
        )}
      </div>

      {/* Winning Number */}
      <div className="text-center mb-4">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-2">
          <span className={`font-bold text-white ${sizeClasses.number}`}>
            {result.winningNumber}
          </span>
        </div>
        <p className={`text-gray-600 ${sizeClasses.details}`}>Winning Number</p>
      </div>

      {/* Basic Stats */}
      {showDetails && (
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center">
            <p className={`font-semibold text-gray-900 ${sizeClasses.details}`}>
              {result.totalBets || 0}
            </p>
            <p className={`text-gray-500 ${sizeClasses.details}`}>Total Bets</p>
          </div>
          <div className="text-center">
            <p className={`font-semibold text-gray-900 ${sizeClasses.details}`}>
              {result.winningBets || 0}
            </p>
            <p className={`text-gray-500 ${sizeClasses.details}`}>Winners</p>
          </div>
        </div>
      )}

      {/* Detailed Stats */}
      {showStats && (
        <div className="border-t pt-4 space-y-3">
          <div className="flex justify-between">
            <span className={`text-gray-600 ${sizeClasses.details}`}>Total Bet Amount:</span>
            <span className={`font-medium text-gray-900 ${sizeClasses.details}`}>
              {formatCurrency(result.totalBetAmount || 0)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className={`text-gray-600 ${sizeClasses.details}`}>Total Payout:</span>
            <span className={`font-medium text-gray-900 ${sizeClasses.details}`}>
              {formatCurrency(result.totalPayout || 0)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className={`text-gray-600 ${sizeClasses.details}`}>Win Percentage:</span>
            <span className={`font-medium text-gray-900 ${sizeClasses.details}`}>
              {result.totalBets > 0 
                ? ((result.winningBets / result.totalBets) * 100).toFixed(1)
                : 0}%
            </span>
          </div>
          {result.declaredBy && (
            <div className="flex justify-between">
              <span className={`text-gray-600 ${sizeClasses.details}`}>Declared By:</span>
              <span className={`font-medium text-gray-900 ${sizeClasses.details}`}>
                {result.declaredBy.username || result.declaredBy.adminName || 'Admin'}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Bet Type Breakdown */}
      {showStats && result.betTypeBreakdown && (
        <div className="border-t pt-4 mt-4">
          <h4 className={`font-medium text-gray-900 mb-3 ${sizeClasses.details}`}>
            Breakdown by Bet Type
          </h4>
          <div className="space-y-2">
            {Object.entries(result.betTypeBreakdown).map(([type, data]) => {
              if (data.totalBets === 0) return null
              
              const typeName = type.replace(/([A-Z])/g, ' $1').toLowerCase()
              
              return (
                <div key={type} className="flex justify-between items-center">
                  <span className={`text-gray-600 capitalize ${sizeClasses.details}`}>
                    {typeName}:
                  </span>
                  <div className={`text-right ${sizeClasses.details}`}>
                    <div className="font-medium text-gray-900">
                      {data.winningBets}/{data.totalBets} bets
                    </div>
                    <div className="text-gray-500">
                      {formatCurrency(data.totalPayout)}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Status Badge */}
      {result.status && (
        <div className="mt-4 flex justify-center">
          <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
            result.status === 'completed' 
              ? 'bg-green-100 text-green-800' 
              : result.status === 'processing'
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-gray-100 text-gray-800'
          }`}>
            {result.status}
          </span>
        </div>
      )}
    </div>
  )
}

StarlineResultDisplay.propTypes = {
  result: PropTypes.shape({
    _id: PropTypes.string,
    gameName: PropTypes.string,
    gameId: PropTypes.shape({
      gameName: PropTypes.string,
      gameType: PropTypes.string
    }),
    winningNumber: PropTypes.string.isRequired,
    declaredAt: PropTypes.string,
    totalBets: PropTypes.number,
    winningBets: PropTypes.number,
    totalBetAmount: PropTypes.number,
    totalPayout: PropTypes.number,
    status: PropTypes.string,
    declaredBy: PropTypes.shape({
      username: PropTypes.string,
      adminName: PropTypes.string
    }),
    betTypeBreakdown: PropTypes.object
  }),
  showDetails: PropTypes.bool,
  showStats: PropTypes.bool,
  className: PropTypes.string,
  size: PropTypes.oneOf(['small', 'medium', 'large'])
}

export default StarlineResultDisplay