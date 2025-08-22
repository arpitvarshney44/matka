import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import axios from 'axios'

const CheckWinners = () => {
  const { user, API_URL } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [checking, setChecking] = useState(false)
  const [games, setGames] = useState([])
  const [winners, setWinners] = useState([])
  const [recentWinners, setRecentWinners] = useState([])
  const [winnerStats, setWinnerStats] = useState({
    totalWinners: 0,
    totalWinAmount: 0,
    totalBetAmount: 0
  })
  const [formData, setFormData] = useState({
    date: searchParams.get('date') || new Date().toISOString().split('T')[0],
    gameId: searchParams.get('gameId') || '',
    session: searchParams.get('session') || '',
    pana: searchParams.get('pana') || '',
    digit: searchParams.get('digit') || ''
  })

  useEffect(() => {
    if (user?.role !== 'admin' && user?.role !== 'subadmin') {
      navigate('/auth')
      return
    }
    fetchGames()
    fetchRecentWinners()
    
    // If we have all required params from URL, auto-fetch winners
    if (formData.date && formData.gameId && formData.session) {
      handleCheckWinners()
    }
  }, [user, navigate])

  const fetchGames = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`${API_URL}/games`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      setGames(response.data || [])
    } catch (error) {
      console.error('Error fetching games:', error)
      toast.error('Failed to fetch games')
    } finally {
      setLoading(false)
    }
  }

  const fetchRecentWinners = async () => {
    try {
      // Fetch recent winning bets from the bets endpoint
      const response = await axios.get(`${API_URL}/admin/bets`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        params: {
          status: 'won',
          limit: 10
        }
      })
      
      if (response.data && response.data.bets) {
        setRecentWinners(response.data.bets)
      }
    } catch (error) {
      console.error('Error fetching recent winners:', error)
      // Don't show error toast for this as it's background data
    }
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleCheckWinners = async () => {
    if (!formData.date || !formData.gameId || !formData.session) {
      toast.error('Please select date, game, and session')
      return
    }

    try {
      setChecking(true)
      
      const queryParams = new URLSearchParams({
        date: formData.date,
        gameId: formData.gameId,
        session: formData.session,
        ...(formData.pana && { pana: formData.pana }),
        ...(formData.digit && { digit: formData.digit })
      })

      console.log('Making request to:', `${API_URL}/admin/check-winners?${queryParams}`)
      
      const response = await axios.get(`${API_URL}/admin/check-winners?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      console.log('Check winners response:', response.data)

      if (response.data.success) {
        setWinners(response.data.winners || [])
        setWinnerStats(response.data.stats || {
          totalWinners: 0,
          totalWinAmount: 0,
          totalBetAmount: 0
        })
        console.log('Winners found:', response.data.winners?.length || 0)
        toast.success(`Found ${response.data.winners?.length || 0} winners`)
      } else {
        toast.error(response.data.message || 'Failed to check winners')
        setWinners([])
        setWinnerStats({
          totalWinners: 0,
          totalWinAmount: 0,
          totalBetAmount: 0
        })
      }
    } catch (error) {
      console.error('Error checking winners:', error)
      const errorMessage = error.response?.data?.message || 'Failed to check winners'
      toast.error(errorMessage)
      setWinners([])
      setWinnerStats({
        totalWinners: 0,
        totalWinAmount: 0,
        totalBetAmount: 0
      })
    } finally {
      setChecking(false)
    }
  }

  const getBetTypeDisplayName = (betType) => {
    const names = {
      single: 'Single',
      jodi: 'Jodi',
      singlePanna: 'Single Panna',
      doublePanna: 'Double Panna',
      triplePanna: 'Triple Panna',
      halfSangam: 'Half Sangam',
      fullSangam: 'Full Sangam'
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
      {/* Header */}
      <div className="bg-blue-600 shadow-lg px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="text-white hover:text-gray-200 transition-colors duration-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-xl font-bold text-white">Check Winners</h1>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6 max-w-4xl mx-auto">
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
                    {game.gameName}
                  </option>
                ))}
              </select>
            </div>

            {/* Session Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Session
              </label>
              <select
                value={formData.session}
                onChange={(e) => handleInputChange('session', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-center text-blue-600 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Session</option>
                <option value="open">Open</option>
                <option value="close">Close</option>
              </select>
            </div>

            {/* Optional Result Filters */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pana (Optional)
                </label>
                <input
                  type="text"
                  value={formData.pana}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 3)
                    handleInputChange('pana', value)
                  }}
                  placeholder="Pana"
                  maxLength={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-center font-mono text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Digit (Optional)
                </label>
                <input
                  type="text"
                  value={formData.digit}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 1)
                    handleInputChange('digit', value)
                  }}
                  placeholder="Digit"
                  maxLength={1}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-center font-mono text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Check Winners Button */}
            <button
              onClick={handleCheckWinners}
              disabled={checking || !formData.gameId || !formData.session || !formData.date}
              className="w-full bg-blue-600 text-white px-6 py-4 rounded-lg font-semibold text-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {checking ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Checking Winners...
                </div>
              ) : (
                'Check Winners'
              )}
            </button>
          </div>
        </div>

        {/* Winner Statistics */}
        {winners.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Winner Statistics</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{winnerStats.totalWinners}</div>
                <div className="text-sm text-green-800">Total Winners</div>
              </div>
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{formatCurrency(winnerStats.totalWinAmount)}</div>
                <div className="text-sm text-blue-800">Total Winnings</div>
              </div>
              <div className="bg-orange-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-orange-600">{formatCurrency(winnerStats.totalBetAmount)}</div>
                <div className="text-sm text-orange-800">Total Bets</div>
              </div>
            </div>
          </div>
        )}

        {/* Winners List */}
        {winners.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Winners Found ({winners.length})</h2>
            <div className="space-y-3">
              {winners.map((winner, index) => (
                <div key={winner._id || index} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="text-xl">🎯</span>
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {winner.userName || winner.userId?.name || 'Unknown User'}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {winner.userMobile || winner.userId?.mobileNumber || 'No phone'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                        <div>
                          <span className="text-gray-500">Type:</span>
                          <div className="font-medium">{getBetTypeDisplayName(winner.betType)}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Number:</span>
                          <div className="font-mono font-medium">{winner.betNumber}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Bet Amount:</span>
                          <div className="font-medium text-red-600">{formatCurrency(winner.betAmount)}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Win Amount:</span>
                          <div className="font-medium text-green-600">{formatCurrency(winner.winAmount)}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Result:</span>
                          <div className="font-mono font-medium">{winner.result || 'N/A'}</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-2 sm:mt-0 sm:ml-4">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {winner.winAmount && winner.betAmount ? (winner.winAmount / winner.betAmount).toFixed(1) + 'x' : '0x'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No Winners Message */}
        {!checking && winners.length === 0 && formData.gameId && formData.session && formData.date && (formData.pana || formData.digit) && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="text-center text-gray-500 py-8">
              <div className="text-4xl mb-2">🎯</div>
              <p className="text-lg font-medium">No Winners Found</p>
              <p className="text-sm mt-2">
                No winning bets found for the selected criteria.
                {formData.pana && formData.digit && (
                  <span className="block mt-1">
                    Searched for: Pana {formData.pana}, Digit {formData.digit}
                  </span>
                )}
              </p>
            </div>
          </div>
        )}

        

        {/* Recent Winners Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mt-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Winners</h2>
            <button
              onClick={fetchRecentWinners}
              className="text-blue-600 hover:text-blue-800 transition-colors duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>

          {recentWinners.length > 0 ? (
            <div className="space-y-3">
              {recentWinners.map((winner, index) => (
                <div key={winner._id || index} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="text-xl">🏆</span>
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {winner.userId?.name || 'Unknown User'}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {getBetTypeDisplayName(winner.betType)} • {winner.gameId?.gameName || 'Unknown Game'}
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
                          <span className="text-gray-500">Won:</span>
                          <div className="font-medium text-green-600">{formatCurrency(winner.winAmount)}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Date:</span>
                          <div className="font-medium">{new Date(winner.betDate).toLocaleDateString()}</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-2 sm:mt-0 sm:ml-4">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {winner.winAmount && winner.betAmount ? (winner.winAmount / winner.betAmount).toFixed(1) + 'x' : '0x'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              <div className="text-4xl mb-2">🏆</div>
              <p>No recent winners found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default CheckWinners
