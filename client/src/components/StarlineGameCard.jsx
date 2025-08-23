import React from 'react'
import PropTypes from 'prop-types'

const StarlineGameCard = ({ 
  game, 
  onBetClick, 
  showBetButton = true, 
  showLastResult = true,
  className = '' 
}) => {
  const getGameStatus = (game) => {
    const now = new Date()
    const currentTime = now.toTimeString().slice(0, 5)
    
    const openTime = game.openTime
    const closeTime = game.closeTime
    const resultTime = game.resultTime
    
    if (currentTime < openTime) {
      return { status: 'closed', color: 'bg-gray-100 text-gray-800', canBet: false }
    } else if (currentTime >= openTime && currentTime <= closeTime) {
      return { status: 'open', color: 'bg-green-100 text-green-800', canBet: true }
    } else if (currentTime > closeTime && currentTime < resultTime) {
      return { status: 'betting closed', color: 'bg-yellow-100 text-yellow-800', canBet: false }
    } else {
      return { status: 'result pending', color: 'bg-red-100 text-red-800', canBet: false }
    }
  }

  const getGameTypeColor = (gameType) => {
    const colors = {
      'single digit': 'bg-blue-100 text-blue-800',
      'single pana': 'bg-green-100 text-green-800',
      'double pana': 'bg-yellow-100 text-yellow-800',
      'triple pana': 'bg-purple-100 text-purple-800'
    }
    return colors[gameType] || 'bg-gray-100 text-gray-800'
  }

  const gameStatus = getGameStatus(game)

  return (
    <div className={`bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200 ${className}`}>
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 truncate">{game.gameName}</h3>
            {game.gameNameHindi && (
              <p className="text-sm text-gray-500 truncate">{game.gameNameHindi}</p>
            )}
          </div>
          <span className={`px-2 py-1 text-xs font-semibold rounded-full whitespace-nowrap ml-2 ${gameStatus.color}`}>
            {gameStatus.status}
          </span>
        </div>

        {/* Game Type Badge */}
        <div className="mb-4">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getGameTypeColor(game.gameType)}`}>
            {game.gameType}
          </span>
        </div>

        {/* Game Details */}
        <div className="space-y-2 text-sm text-gray-600 mb-4">
          <div className="flex justify-between">
            <span>Open Time:</span>
            <span className="font-medium">{game.openTime}</span>
          </div>
          <div className="flex justify-between">
            <span>Close Time:</span>
            <span className="font-medium">{game.closeTime}</span>
          </div>
          <div className="flex justify-between">
            <span>Result Time:</span>
            <span className="font-medium">{game.resultTime}</span>
          </div>
          <div className="flex justify-between">
            <span>Bet Range:</span>
            <span className="font-medium">₹{game.minBet} - ₹{game.maxBet}</span>
          </div>
        </div>

        {/* Last Result */}
        {showLastResult && (game.currentResult || game.currentDigit) && (
          <div className="mb-4 p-3 bg-blue-50 rounded-md">
            <div className="flex justify-between items-center">
              <span className="text-sm text-blue-700">Last Result:</span>
              <span className="text-lg font-bold text-blue-900">
                {game.currentDigit !== undefined ? `${game.currentResult || '***'}-${game.currentDigit}` : (game.currentResult || '***')}
              </span>
            </div>
          </div>
        )}

        {/* Action Button */}
        {showBetButton && (
          <button
            onClick={() => onBetClick && onBetClick(game)}
            disabled={!gameStatus.canBet}
            className={`w-full py-3 px-4 rounded-md font-medium transition-colors duration-200 ${
              gameStatus.canBet
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {gameStatus.canBet ? 'Place Bet' : 'Betting Closed'}
          </button>
        )}
      </div>
    </div>
  )
}

StarlineGameCard.propTypes = {
  game: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    gameName: PropTypes.string.isRequired,
    gameNameHindi: PropTypes.string,
    gameType: PropTypes.oneOf(['single digit', 'single pana', 'double pana', 'triple pana']).isRequired,
    openTime: PropTypes.string.isRequired,
    closeTime: PropTypes.string.isRequired,
    resultTime: PropTypes.string.isRequired,
    minBet: PropTypes.number.isRequired,
    maxBet: PropTypes.number.isRequired,
    currentResult: PropTypes.string,
    currentDigit: PropTypes.number,
    isActive: PropTypes.bool
  }).isRequired,
  onBetClick: PropTypes.func,
  showBetButton: PropTypes.bool,
  showLastResult: PropTypes.bool,
  className: PropTypes.string
}

export default StarlineGameCard