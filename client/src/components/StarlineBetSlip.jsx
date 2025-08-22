import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'

const StarlineBetSlip = ({
  game,
  rates = {},
  balance = 0,
  onPlaceBet,
  onCancel,
  isPlacing = false
}) => {
  const [betData, setBetData] = useState({
    betType: 'single digit',
    betNumber: '',
    betAmount: ''
  })

  const [errors, setErrors] = useState({})

  useEffect(() => {
    // Reset form when game changes
    setBetData({
      betType: 'single digit',
      betNumber: '',
      betAmount: ''
    })
    setErrors({})
  }, [game])

  const handleBetNumberChange = (value) => {
    const { betType } = betData

    // Clear previous errors
    setErrors({ ...errors, betNumber: '' })

    // Validate input based on bet type
    if (betType === 'single digit') {
      if (value.length <= 1 && /^\d*$/.test(value)) {
        setBetData({ ...betData, betNumber: value })
      }
    } else {
      // For pana types, allow 3 digits
      if (value.length <= 3 && /^\d*$/.test(value)) {
        setBetData({ ...betData, betNumber: value })
      }
    }
  }

  const handleBetAmountChange = (value) => {
    // Clear previous errors
    setErrors({ ...errors, betAmount: '' })

    // Only allow positive numbers
    if (value === '' || (/^\d+$/.test(value) && parseInt(value) >= 0)) {
      setBetData({ ...betData, betAmount: value })
    }
  }

  const handleBetTypeChange = (newBetType) => {
    setBetData({
      ...betData,
      betType: newBetType,
      betNumber: '' // Reset bet number when type changes
    })
    setErrors({})
  }

  const validateBetNumber = () => {
    const { betType, betNumber } = betData

    if (!betNumber) {
      return 'Please enter a bet number'
    }

    switch (betType) {
      case 'single digit':
        if (!/^[0-9]$/.test(betNumber)) {
          return 'Please enter a single digit (0-9)'
        }
        break
      case 'single pana':
        if (!/^[0-9]{3}$/.test(betNumber)) {
          return 'Please enter a 3-digit number (000-999)'
        }
        break
      case 'double pana':
        if (!/^[0-9]{3}$/.test(betNumber)) {
          return 'Please enter a 3-digit number (000-999)'
        }
        // Additional validation for double pana (exactly 2 same digits)
        const digits = betNumber.split('')
        const digitCount = {}
        digits.forEach(digit => {
          digitCount[digit] = (digitCount[digit] || 0) + 1
        })
        const counts = Object.values(digitCount)
        if (!(counts.includes(2) && counts.length === 2)) {
          return 'Double pana must have exactly 2 same digits (e.g., 112, 223)'
        }
        break
      case 'triple pana':
        if (!/^[0-9]{3}$/.test(betNumber)) {
          return 'Please enter a 3-digit number (000-999)'
        }
        // Additional validation for triple pana (all same digits)
        const tripleDigits = betNumber.split('')
        if (!(tripleDigits[0] === tripleDigits[1] && tripleDigits[1] === tripleDigits[2])) {
          return 'Triple pana must have all same digits (e.g., 000, 111, 222)'
        }
        break
      default:
        return 'Invalid bet type'
    }

    return null
  }

  const validateBetAmount = () => {
    const { betAmount } = betData
    const amount = parseInt(betAmount)

    if (!betAmount) {
      return 'Please enter bet amount'
    }

    if (amount < game.minBet) {
      return `Minimum bet amount is ₹${game.minBet}`
    }

    if (amount > game.maxBet) {
      return `Maximum bet amount is ₹${game.maxBet}`
    }

    if (amount > balance) {
      return 'Insufficient balance'
    }

    return null
  }

  const calculatePotentialWin = () => {
    const { betType, betAmount } = betData
    if (!betAmount || !rates[betType]) return 0

    const multiplier = rates[betType].multiplier
    return Math.floor(parseInt(betAmount) * multiplier)
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    const betNumberError = validateBetNumber()
    const betAmountError = validateBetAmount()

    if (betNumberError || betAmountError) {
      setErrors({
        betNumber: betNumberError,
        betAmount: betAmountError
      })
      return
    }

    // Clear errors and submit
    setErrors({})
    onPlaceBet({
      ...betData,
      betAmount: parseInt(betData.betAmount)
    })
  }

  const getBetTypeDescription = (betType) => {
    switch (betType) {
      case 'single digit':
        return 'Pick any single digit (0-9)'
      case 'single pana':
        return 'Pick any 3-digit number (000-999)'
      case 'double pana':
        return 'Pick a 3-digit number with exactly 2 same digits'
      case 'triple pana':
        return 'Pick a 3-digit number with all same digits (000, 111, etc.)'
      default:
        return ''
    }
  }

  const quickAmounts = [100, 500, 1000, 2000, 5000].filter(amount =>
    amount >= game.minBet && amount <= Math.min(game.maxBet, balance)
  )

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-medium text-gray-900">
            Place Bet - {game.gameName}
          </h3>
          {onCancel && (
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Game Info */}
          <div className="bg-gray-50 p-4 rounded-md">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Game Type:</span>
                <span className="ml-2 font-medium">{game.gameType}</span>
              </div>
              <div>
                <span className="text-gray-500">Your Balance:</span>
                <span className="ml-2 font-medium text-green-600">₹{balance.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-gray-500">Min Bet:</span>
                <span className="ml-2 font-medium">₹{game.minBet}</span>
              </div>
              <div>
                <span className="text-gray-500">Max Bet:</span>
                <span className="ml-2 font-medium">₹{game.maxBet}</span>
              </div>
            </div>
          </div>

          {/* Bet Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Supported Bet Types:</label>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <button
                type="button"
                onClick={() => handleBetTypeChange('single digit')}
                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                  betData.betType === 'single digit'
                    ? 'bg-blue-600 text-white'
                    : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
                }`}
              >
                single digit
              </button>
              <button
                type="button"
                onClick={() => handleBetTypeChange('single pana')}
                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                  betData.betType === 'single pana'
                    ? 'bg-green-600 text-white'
                    : 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
                }`}
              >
                single pana
              </button>
              <button
                type="button"
                onClick={() => handleBetTypeChange('double pana')}
                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                  betData.betType === 'double pana'
                    ? 'bg-yellow-600 text-white'
                    : 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100 border border-yellow-200'
                }`}
              >
                double pana
              </button>
              <button
                type="button"
                onClick={() => handleBetTypeChange('triple pana')}
                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                  betData.betType === 'triple pana'
                    ? 'bg-purple-600 text-white'
                    : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200'
                }`}
              >
                triple pana
              </button>
            </div>
            <p className="text-xs text-gray-500">{getBetTypeDescription(betData.betType)}</p>
            {rates[betData.betType] && (
              <p className="text-xs text-blue-600 font-medium mt-1">10x Rate</p>
            )}
          </div>

          {/* Bet Number Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {betData.betType === 'single digit' ? 'Pick Number (0-9)' : 'Pick Number (3 digits)'}
            </label>
            <input
              type="text"
              value={betData.betNumber}
              onChange={(e) => handleBetNumberChange(e.target.value)}
              placeholder={betData.betType === 'single digit' ? '0' : '000'}
              maxLength={betData.betType === 'single digit' ? '1' : '3'}
              className={`w-full px-4 py-3 text-2xl font-bold text-center border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.betNumber ? 'border-red-300' : 'border-gray-300'
                }`}
            />
            {errors.betNumber && (
              <p className="mt-1 text-sm text-red-600">{errors.betNumber}</p>
            )}
          </div>

          {/* Bet Amount Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Bet Amount</label>
            <input
              type="number"
              value={betData.betAmount}
              onChange={(e) => handleBetAmountChange(e.target.value)}
              placeholder="Enter amount"
              min={game.minBet}
              max={Math.min(game.maxBet, balance)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.betAmount ? 'border-red-300' : 'border-gray-300'
                }`}
            />
            {errors.betAmount && (
              <p className="mt-1 text-sm text-red-600">{errors.betAmount}</p>
            )}

            {/* Quick Amount Buttons */}
            {quickAmounts.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {quickAmounts.map(amount => (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => setBetData({ ...betData, betAmount: amount.toString() })}
                    className="px-3 py-1 text-xs border border-gray-300 rounded-md hover:bg-gray-50 transition-colors duration-200"
                  >
                    ₹{amount}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Potential Win Display */}
          {betData.betAmount && rates[betData.betType] && !errors.betAmount && (
            <div className="bg-green-50 p-4 rounded-md">
              <div className="flex justify-between items-center">
                <span className="text-sm text-green-700">Potential Win:</span>
                <span className="text-lg font-bold text-green-900">
                  ₹{calculatePotentialWin().toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center mt-1">
                <span className="text-xs text-green-600">Multiplier:</span>
                <span className="text-sm font-medium text-green-800">
                  {rates[betData.betType].multiplier}x
                </span>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isPlacing || !betData.betNumber || !betData.betAmount}
            className="w-full py-3 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium transition-colors duration-200 flex items-center justify-center space-x-2"
          >
            {isPlacing && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            )}
            <span>{isPlacing ? 'Placing Bet...' : 'Place Bet'}</span>
          </button>
        </form>
      </div>
    </div>
  )
}

StarlineBetSlip.propTypes = {
  game: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    gameName: PropTypes.string.isRequired,
    gameType: PropTypes.string.isRequired,
    minBet: PropTypes.number.isRequired,
    maxBet: PropTypes.number.isRequired
  }).isRequired,
  rates: PropTypes.object,
  balance: PropTypes.number,
  onPlaceBet: PropTypes.func.isRequired,
  onCancel: PropTypes.func,
  isPlacing: PropTypes.bool
}

export default StarlineBetSlip