import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import axios from 'axios'

const WinnerManagement = () => {
  const { user, API_URL } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [games, setGames] = useState([])
  const [starlineGames, setStarlineGames] = useState([])
  const [selectedGame, setSelectedGame] = useState('')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [gameType, setGameType] = useState('regular') // 'regular' or 'starline'
  const [winners, setWinners] = useState([])
  const [editingBet, setEditingBet] = useState(null)
  const [newBetNumber, setNewBetNumber] = useState('')
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    if (user?.role !== 'admin' && user?.role !== 'subadmin') {
      navigate('/dashboard')
      return
    }
    fetchGames()
  }, [user, navigate])

  const fetchGames = async () => {
    try {
      setLoading(true)

      // Fetch regular games
      const regularResponse = await axios.get(`${API_URL}/admin/games`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      // Fetch starline games
      const starlineResponse = await axios.get(`${API_URL}/starline/games`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (regularResponse.data.games) {
        setGames(regularResponse.data.games)
      }

      if (starlineResponse.data.success && starlineResponse.data.data.games) {
        setStarlineGames(starlineResponse.data.data.games)
      }
    } catch (error) {
      console.error('Error fetching games:', error)
      toast.error('Failed to fetch games')
    } finally {
      setLoading(false)
    }
  }

  const fetchWinners = async () => {
    if (!selectedGame || !selectedDate) {
      toast.error('Please select game and date')
      return
    }

    try {
      setLoading(true)
      const endpoint = gameType === 'regular' ? '/admin/bets' : '/starline/bets'

      const response = await axios.get(`${API_URL}${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        params: {
          gameId: selectedGame,
          date: selectedDate,
          status: 'won',
          limit: 100
        }
      })

      if (gameType === 'regular' && response.data.bets) {
        setWinners(response.data.bets)
      } else if (gameType === 'starline' && response.data.success && response.data.data.bets) {
        setWinners(response.data.data.bets)
      } else {
        setWinners([])
      }

      if (winners.length === 0) {
        toast('No winners found for selected criteria', { icon: 'ℹ️' })
      }
    } catch (error) {
      console.error('Error fetching winners:', error)
      toast.error('Failed to fetch winners')
      setWinners([])
    } finally {
      setLoading(false)
    }
  }

  const handleEditBet = (bet) => {
    setEditingBet(bet)
    setNewBetNumber(bet.betNumber)
  }

  const handleUpdateBetNumber = async () => {
    if (!editingBet || !newBetNumber) {
      toast.error('Please enter a valid bet number')
      return
    }

    if (newBetNumber === editingBet.betNumber) {
      toast.error('New number must be different from current number')
      return
    }

    // Validate bet number format based on bet type
    const validateBetNumber = (betType, number) => {
      switch (betType) {
        case 'single':
        case 'single digit':
          return /^[0-9]$/.test(number)
        case 'jodi':
          return /^[0-9]{2}$/.test(number)
        case 'singlePanna':
        case 'doublePanna':
        case 'triplePanna':
        case 'single pana':
        case 'double pana':
        case 'triple pana':
          return /^[0-9]{3}$/.test(number)
        case 'halfSangam':
        case 'fullSangam':
          return number.length > 0 // More complex validation needed
        default:
          return true
      }
    }

    if (!validateBetNumber(editingBet.betType, newBetNumber)) {
      toast.error(`Invalid bet number format for ${editingBet.betType}`)
      return
    }

    // Confirmation dialog
    const confirmed = window.confirm(
      `Are you sure you want to change bet number from "${editingBet.betNumber}" to "${newBetNumber}"?\n\n` +
      `This will:\n` +
      `- Remove ₹${editingBet.winAmount} from user's balance\n` +
      `- Re-evaluate bet status based on actual result\n` +
      `- Likely change status to 'lost' (unless new number also wins)\n\n` +
      `User: ${editingBet.userId?.name} (${editingBet.userId?.mobileNumber})`
    )

    if (!confirmed) {
      return
    }

    try {
      setUpdating(true)
      const endpoint = gameType === 'regular' ? '/admin/update-bet-number' : '/admin/update-starline-bet-number'

      const response = await axios.put(`${API_URL}${endpoint}`, {
        betId: editingBet._id,
        newBetNumber: newBetNumber,
        reason: 'Admin correction to remove from winners'
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.data.success) {
        toast.success('Bet number updated successfully')
        setEditingBet(null)
        setNewBetNumber('')
        // Refresh winners list
        fetchWinners()
      }
    } catch (error) {
      console.error('Error updating bet number:', error)
      toast.error(error.response?.data?.message || 'Failed to update bet number')
    } finally {
      setUpdating(false)
    }
  }

  const cancelEdit = () => {
    setEditingBet(null)
    setNewBetNumber('')
  }

  const currentGames = gameType === 'regular' ? games : starlineGames

  if (loading && winners.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
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
            <h1 className="text-xl font-bold text-white">Winner Management</h1>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6 max-w-7xl mx-auto">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Filter Winners</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Game Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Game Type
              </label>
              <select
                value={gameType}
                onChange={(e) => {
                  setGameType(e.target.value)
                  setSelectedGame('')
                  setWinners([])
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="regular">Regular Games</option>
                <option value="starline">Starline Games</option>
              </select>
            </div>

            {/* Game Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Game
              </label>
              <select
                value={selectedGame}
                onChange={(e) => {
                  setSelectedGame(e.target.value)
                  setWinners([])
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Game</option>
                {currentGames.map((game) => (
                  <option key={game._id} value={game._id}>
                    {game.gameName}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Date
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value)
                  setWinners([])
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Search Button */}
            <div className="flex items-end">
              <button
                onClick={fetchWinners}
                disabled={!selectedGame || !selectedDate || loading}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Loading...' : 'Search Winners'}
              </button>
            </div>
          </div>
        </div>

        {/* Winners List */}
        {winners.length > 0 && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">
                Winners ({winners.length})
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Click "Edit" to change bet number and remove from winners list
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Bet Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Bet Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Bet Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Win Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Result
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {winners.map((bet) => (
                    <tr key={bet._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {bet.userId?.name || 'N/A'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {bet.userId?.mobileNumber || 'N/A'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {bet.betType}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingBet && editingBet._id === bet._id ? (
                          <div className="flex items-center space-x-2">
                            <input
                              type="text"
                              value={newBetNumber}
                              onChange={(e) => setNewBetNumber(e.target.value)}
                              className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="New number"
                            />
                          </div>
                        ) : (
                          <span className="text-sm font-mono font-bold text-gray-900">
                            {bet.betNumber}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ₹{bet.betAmount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                        ₹{bet.winAmount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {bet.result || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {editingBet && editingBet._id === bet._id ? (
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={handleUpdateBetNumber}
                              disabled={updating}
                              className="text-green-600 hover:text-green-900 disabled:opacity-50"
                            >
                              {updating ? 'Saving...' : 'Save'}
                            </button>
                            <button
                              onClick={cancelEdit}
                              disabled={updating}
                              className="text-gray-600 hover:text-gray-900 disabled:opacity-50"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleEditBet(bet)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Edit
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* No Winners Message */}
        {winners.length === 0 && selectedGame && selectedDate && !loading && (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Winners Found</h3>
            <p className="text-gray-600">No winning bets found for the selected game and date.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default WinnerManagement