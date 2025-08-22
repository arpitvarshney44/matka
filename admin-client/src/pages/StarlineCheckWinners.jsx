import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import axios from 'axios'
import PageHeader from '../components/PageHeader'

const StarlineCheckWinners = () => {
  const { user, API_URL } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [checking, setChecking] = useState(false)
  const [games, setGames] = useState([])
  const [winners, setWinners] = useState([])
  const [allBets, setAllBets] = useState([])
  const [winnerStats, setWinnerStats] = useState({
    totalBets: 0,
    totalBetAmount: 0,
    totalWinners: 0,
    totalWinAmount: 0,
    profitLoss: 0
  })
  const [formData, setFormData] = useState({
    date: searchParams.get('date') || new Date().toISOString().split('T')[0],
    gameId: searchParams.get('gameId') || '',
    winningNumber: searchParams.get('winningNumber') || ''
  })

  useEffect(() => {
    if (user?.role !== 'admin' && user?.role !== 'subadmin') {
      navigate('/auth')
      return
    }
    fetchGames()
    
    // If we have all required params from URL, auto-fetch winners
    if (formData.date && formData.gameId) {
      handleCheckWinners()
    }
  }, [user, navigate])

  const fetchGames = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`${API_URL}/starline/games`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (response.data.success) {
        setGames(response.data.data.games || [])
      }
    } catch (error) {
      console.error('Error fetching games:', error)
      toast.error('Failed to fetch games')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleWinningNumberChange = (value) => {
    // Only allow 3 digits
    if (value.length <= 3 && /^\d*$/.test(value)) {
      setFormData(prev => ({
        ...prev,
        winningNumber: value
      }))
    }
  }

  const handleCheckWinners = async () => {
    if (!formData.date || !formData.gameId) {
      toast.error('Please select date and game')
      return
    }

    try {
      setChecking(true)
      
      const queryParams = new URLSearchParams({
        gameId: formData.gameId,
        date: formData.date,
        ...(formData.winningNumber && { winningNumber: formData.winningNumber })
      })

      console.log('Making starline request to:', `${API_URL}/admin/starline-check-winners?${queryParams}`)
      
      const response = await axios.get(`${API_URL}/admin/starline-check-winners?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      console.log('Starline check winners response:', response.data)

      if (response.data.success) {
        const data = response.data.data
        setWinners(data.winners || [])
        setAllBets(data.allBets || [])
        setWinnerStats(data.stats || {
          totalBets: 0,
          totalBetAmount: 0,
          totalWinners: 0,
          totalWinAmount: 0,
          profitLoss: 0
        })
        
        console.log('Starline winners found:', data.winners?.length || 0)
        console.log('Starline all bets found:', data.allBets?.length || 0)
        
        if (formData.winningNumber) {
          toast.success(`Found ${data.winners?.length || 0} winners for number ${formData.winningNumber}`)
        } else {
          toast.success(`Found ${data.allBets?.length || 0} pending bets`)
        }
      } else {
        toast.error(response.data.message || 'Failed to check winners')
        resetResults()
      }
    } catch (error) {
      console.error('Error checking winners:', error)
      const errorMessage = error.response?.data?.message || 'Failed to check winners'
      toast.error(errorMessage)
      resetResults()
    } finally {
      setChecking(false)
    }
  }

  const resetResults = () => {
    setWinners([])
    setAllBets([])
    setWinnerStats({
      totalBets: 0,
      totalBetAmount: 0,
      totalWinners: 0,
      totalWinAmount: 0,
      profitLoss: 0
    })
  }

  const getBetTypeDisplayName = (betType) => {
    const names = {
      'single digit': 'Single Digit',
      'single pana': 'Single Pana',
      'double pana': 'Double Pana',
      'triple pana': 'Triple Pana'
    }
    return names[betType] || betType
  }

  const formatCurrency = (amount) => {
    return `₹${amount?.toLocaleString() || 0}`
  }

  const selectedGame = games.find(game => game._id === formData.gameId)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading games...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader 
        title="Starline Check Winners" 
        subtitle="Check potential winners for Starline games"
        showBackButton={true}
      />

      <div className="p-4 sm:p-6 max-w-6xl mx-auto">
        {/* Filter Form */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="space-y-6">
            {/* Date Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Date
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-center text-blue-600 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Game Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Game
              </label>
              <select
                value={formData.gameId}
                onChange={(e) => handleInputChange('gameId', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-center text-blue-600 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Game</option>
                {games.map((game) => (
                  <option key={game._id} value={game._id}>
                    {game.gameName} ({game.gameType})
                  </option>
                ))}
              </select>
            </div>

            {/* Winning Number (Optional) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Winning Number (Optional - 3 digits)
              </label>
              <input
                type="text"
                value={formData.winningNumber}
                onChange={(e) => handleWinningNumberChange(e.target.value)}
                placeholder="000"
                maxLength={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-center font-mono text-2xl font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="mt-1 text-xs text-gray-500">
                Leave empty to see all pending bets, or enter 3-digit number to check potential winners
              </p>
            </div>

            {/* Check Winners Button */}
            <button
              onClick={handleCheckWinners}
              disabled={checking || !formData.gameId || !formData.date}
              className="w-full bg-blue-600 text-white px-6 py-4 rounded-lg font-semibold text-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {checking ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Checking...
                </div>
              ) : (
                formData.winningNumber ? 'Check Winners' : 'View Pending Bets'
              )}
            </button>
          </div>
        </div>

        {/* Statistics */}
        {(winners.length > 0 || allBets.length > 0) && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {formData.winningNumber ? 'Winner Statistics' : 'Bet Statistics'}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{winnerStats.totalBets}</div>
                <div className="text-sm text-blue-800">Total Bets</div>
              </div>
              <div className="bg-orange-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-orange-600">{formatCurrency(winnerStats.totalBetAmount)}</div>
                <div className="text-sm text-orange-800">Total Bet Amount</div>
              </div>
              {formData.winningNumber && (
                <>
                  <div className="bg-green-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">{winnerStats.totalWinners}</div>
                    <div className="text-sm text-green-800">Winners</div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-purple-600">{formatCurrency(winnerStats.totalWinAmount)}</div>
                    <div className="text-sm text-purple-800">Total Payout</div>
                  </div>
                  <div className={`rounded-lg p-4 text-center ${winnerStats.profitLoss >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                    <div className={`text-2xl font-bold ${winnerStats.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(winnerStats.profitLoss)}
                    </div>
                    <div className={`text-sm ${winnerStats.profitLoss >= 0 ? 'text-green-800' : 'text-red-800'}`}>
                      Profit/Loss
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Winners List */}
        {formData.winningNumber && winners.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Winners for Number: {formData.winningNumber}
            </h2>
            <div className="space-y-3">
              {winners.map((winner, index) => (
                <div key={winner._id || index} className="border border-green-200 rounded-lg p-4 bg-green-50">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="text-xl">🏆</span>
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {winner.userId?.name || winner.userId?.username || 'Unknown User'}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {getBetTypeDisplayName(winner.betType)} • {selectedGame?.gameName}
                          </p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                        <div>
                          <span className="text-gray-500">Number:</span>
                          <div className="font-mono font-medium">{winner.betNumber}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Bet:</span>
                          <div className="font-medium text-red-600">{formatCurrency(winner.betAmount)}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Win:</span>
                          <div className="font-medium text-green-600">{formatCurrency(winner.winAmount)}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Multiplier:</span>
                          <div className="font-medium">{winner.multiplier}x</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All Bets List */}
        {allBets.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {formData.winningNumber ? 'All Bets' : 'Pending Bets'}
            </h2>
            <div className="space-y-3">
              {allBets.map((bet, index) => {
                const isWinner = formData.winningNumber && winners.some(w => w._id === bet._id)
                return (
                  <div key={bet._id || index} className={`border rounded-lg p-4 ${isWinner ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <span className="text-xl">{isWinner ? '🏆' : '🎯'}</span>
                          <div>
                            <h4 className="font-medium text-gray-900">
                              {bet.userId?.name || bet.userId?.username || 'Unknown User'}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {getBetTypeDisplayName(bet.betType)} • {selectedGame?.gameName}
                            </p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                          <div>
                            <span className="text-gray-500">Number:</span>
                            <div className="font-mono font-medium">{bet.betNumber}</div>
                          </div>
                          <div>
                            <span className="text-gray-500">Amount:</span>
                            <div className="font-medium text-blue-600">{formatCurrency(bet.betAmount)}</div>
                          </div>
                          <div>
                            <span className="text-gray-500">Date:</span>
                            <div className="font-medium">{new Date(bet.createdAt).toLocaleDateString()}</div>
                          </div>
                        </div>
                      </div>
                      
                      {isWinner && (
                        <div className="mt-2 sm:mt-0 sm:ml-4">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                            Winner!
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* No Results */}
        {!checking && allBets.length === 0 && formData.gameId && formData.date && (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="text-4xl mb-4">🎯</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Bets Found</h3>
            <p className="text-gray-500">
              No pending bets found for {selectedGame?.gameName} on {new Date(formData.date).toLocaleDateString()}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default StarlineCheckWinners