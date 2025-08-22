import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import axios from 'axios'
import { 
  validateBetNumber, 
  formatBetNumber, 
  getBetTypeDisplayName,
  getSessionDisplayName,
  getCurrentDate,
  isBettingAllowed 
} from '../utils/matka'
import { getPayoutRange, validateBetAmount } from '../utils/gameRates'

const BettingBase = ({ 
  betType, 
  title, 
  description, 
  inputPlaceholder,
  children 
}) => {
  const { user, API_URL } = useAuth()
  const navigate = useNavigate()
  const { gameId } = useParams()

  // Map frontend bet types to backend bet types
  const mapBetType = (frontendBetType) => {
    const mapping = {
      'single': 'single',
      'jodi': 'jodi',
      'single_panna': 'singlePanna',
      'double_panna': 'doublePanna',
      'triple_panna': 'triplePanna',
      'half_sangam': 'halfSangam',
      'full_sangam': 'fullSangam'
    }
    return mapping[frontendBetType] || frontendBetType
  }

  // Game state
  const [games, setGames] = useState([])
  const [selectedGame, setSelectedGame] = useState(null)
  const [gameRates, setGameRates] = useState(null)
  
  // Betting state
  const [session, setSession] = useState('open')
  const [betNumber, setBetNumber] = useState('')
  const [betAmount, setBetAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  
  // Validation state
  const [errors, setErrors] = useState({})

  // Load initial data
  useEffect(() => {
    loadGames()
    loadGameRates()
  }, [])

  const loadGames = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`${API_URL}/games`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      const gamesList = response.data
      setGames(gamesList)
      
      // Pre-select game based on gameId from URL params
      if (gameId && gamesList.length > 0) {
        const preselectedGame = gamesList.find(game => game._id === gameId)
        if (preselectedGame) {
          setSelectedGame(preselectedGame)
        } else {
          // If gameId doesn't match any game, select first game
          setSelectedGame(gamesList[0])
        }
      } else if (gamesList.length > 0) {
        // Auto-select first game if no gameId provided
        setSelectedGame(gamesList[0])
      }
    } catch (error) {
      console.error('Error loading games:', error)
      toast.error('Failed to load games')
    } finally {
      setLoading(false)
    }
  }

  const loadGameRates = async () => {
    try {
      const response = await axios.get(`${API_URL}/gamerates`)
      setGameRates(response.data)
    } catch (error) {
      console.error('Error loading game rates:', error)
      toast.error('Failed to load game rates')
    }
  }

  // Validate form fields
  const validateForm = () => {
    const newErrors = {}

    if (!selectedGame) {
      newErrors.game = 'Please select a game'
    }

    // Format bet number for validation
    let validationBetNumber = betNumber
    let validationBetType = betType
    
    if (betType === 'full_sangam' && betNumber.length === 6 && !betNumber.includes('-')) {
      // Convert "123456" to "123-456" format for validation
      validationBetNumber = `${betNumber.slice(0, 3)}-${betNumber.slice(3, 6)}`
    } else if (betType === 'half_sangam') {
      // For half sangam, use the session-specific validation type
      validationBetType = session === 'open' ? 'half_sangam_open' : 'half_sangam_close'
    }

    const numberValidation = validateBetNumber(validationBetType, validationBetNumber)
    if (!numberValidation.valid) {
      newErrors.number = numberValidation.message
    }

    const amountValidation = validateBetAmount(
      betAmount,
      10,
      10000,
      user?.balance || 0
    )
    if (!amountValidation.valid) {
      newErrors.amount = amountValidation.message
    }

    // Check betting timing - skip for Full Sangam as it doesn't use sessions
    if (selectedGame && betType !== 'full_sangam') {
      const timingCheck = isBettingAllowed(
        selectedGame.openTime,
        selectedGame.closeTime,
        session
      )
      if (!timingCheck.allowed) {
        newErrors.timing = timingCheck.message
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    try {
      setSubmitting(true)
      
      // Format bet number based on bet type
      let formattedBetNumber = betNumber
      if (betType === 'full_sangam' && betNumber.length === 6 && !betNumber.includes('-')) {
        // Convert "123456" to "123-456" format for Full Sangam
        formattedBetNumber = `${betNumber.slice(0, 3)}-${betNumber.slice(3, 6)}`
      }
      
      // Handle session for different bet types
      let betSession = session
      if (betType === 'full_sangam') {
        betSession = null // Full Sangam doesn't use sessions
      }
      // For half_sangam, use the selected session directly
      
      const betData = {
        gameId: selectedGame._id,
        betType: mapBetType(betType),
        session: betSession,
        betNumber: formattedBetNumber,
        betAmount: parseFloat(betAmount),
        gameDate: getCurrentDate()
      }

      console.log('Sending bet data:', betData)

      const response = await axios.post(`${API_URL}/bets`, betData, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      })

      toast.success('Bet placed successfully!')
      
      // Show new balance if returned
      if (response.data.newBalance !== undefined) {
        toast.success(`New balance: ₹${response.data.newBalance}`)
      }
      
      // Reset form
      setBetNumber('')
      setBetAmount('')
      setErrors({})
      
      // Navigate back to dashboard
      setTimeout(() => {
        navigate('/dashboard')
      }, 1500)

    } catch (error) {
      console.error('Error placing bet:', error)
      console.log('Error response:', error.response?.data)
      console.log('Bet data sent:', betData)
      const message = error.response?.data?.message || 'Failed to place bet'
      const errors = error.response?.data?.errors
      
      if (errors && Array.isArray(errors)) {
        errors.forEach(err => toast.error(err.msg))
      } else {
        toast.error(message)
      }
    } finally {
      setSubmitting(false)
    }
  }

  const calculatePotentialWin = () => {
    if (!betAmount || !gameRates || !selectedGame) return '₹0'
    
    try {
      // Use the original frontend betType, not the mapped backend version
      return getPayoutRange(parseFloat(betAmount), betType, gameRates)
    } catch (error) {
      console.error('Error calculating potential win:', error)
      return '₹0'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading games...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-green-800 shadow-lg px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2 rounded-md text-white hover:bg-green-700 transition-colors duration-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-xl font-bold text-white">{title}</h1>
          </div>
          <div className="flex items-center space-x-2 text-white">
            <span className="font-bold">₹{user?.balance || 0}</span>
            <span className="text-lg">💰</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 lg:p-6">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
          {/* Description */}
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {getBetTypeDisplayName(betType)}
            </h2>
            <p className="text-gray-600">{description}</p>
          </div>

          {/* Betting Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            

            {/* Session Selection - Hidden only for Full Sangam */}
            {betType !== 'full_sangam' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Session
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSession('open')}
                    className={`py-2 px-4 rounded-md font-medium transition-colors duration-200 ${
                      session === 'open'
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Open
                  </button>
                  <button
                    type="button"
                    onClick={() => setSession('close')}
                    className={`py-2 px-4 rounded-md font-medium transition-colors duration-200 ${
                      session === 'close'
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Close
                  </button>
                </div>
                {errors.timing && (
                  <p className="text-red-500 text-xs mt-1">{errors.timing}</p>
                )}
              </div>
            )}

            {/* Custom bet input (from children) */}
            {children && children({ 
              betNumber, 
              setBetNumber, 
              errors, 
              inputPlaceholder 
            })}

            {/* Default bet number input if no children */}
            {!children && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enter {getBetTypeDisplayName(betType)} Number
                </label>
                <input
                  type="text"
                  value={betNumber}
                  onChange={(e) => setBetNumber(e.target.value)}
                  placeholder={inputPlaceholder}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
                {errors.number && (
                  <p className="text-red-500 text-xs mt-1">{errors.number}</p>
                )}
              </div>
            )}

            {/* Bet Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bet Amount
              </label>
              <input
                type="number"
                value={betAmount}
                onChange={(e) => setBetAmount(e.target.value)}
                placeholder="Enter amount (min ₹10)"
                min="10"
                max="10000"
                step="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
              {errors.amount && (
                <p className="text-red-500 text-xs mt-1">{errors.amount}</p>
              )}
            </div>

            {/* Potential Win Display */}
            {betAmount && selectedGame && gameRates && (
              <div className="bg-green-50 p-3 rounded-md">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">
                    Potential Win:
                  </span>
                  <span className="text-lg font-bold text-green-600">
                    {calculatePotentialWin()}
                  </span>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-green-600 text-white py-3 px-4 rounded-md font-semibold hover:bg-green-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Placing Bet...' : 'Place Bet'}
            </button>
          </form>

          {/* Selected bet summary */}
          {selectedGame && betNumber && (
            <div className="mt-4 p-3 bg-gray-50 rounded-md">
              <h3 className="font-semibold text-gray-700 mb-2">Bet Summary:</h3>
              <div className="text-sm text-gray-600 space-y-1">
                <p><strong>Game:</strong> {selectedGame.gameName}</p>
                {betType !== 'full_sangam' && (
                  <p><strong>Session:</strong> {getSessionDisplayName(session)}</p>
                )}
                <p><strong>Bet:</strong> {formatBetNumber(betType, betNumber)}</p>
                {betAmount && <p><strong>Amount:</strong> ₹{betAmount}</p>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default BettingBase
