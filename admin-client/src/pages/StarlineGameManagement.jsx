import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import axios from 'axios'

const StarlineGameManagement = () => {
  const { API_URL } = useAuth()
  const navigate = useNavigate()
  const [games, setGames] = useState([])
  const [filteredGames, setFilteredGames] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [gameResults, setGameResults] = useState({})
  const [selectedGame, setSelectedGame] = useState(null)
  const [showModal, setShowModal] = useState(false)

  const [formData, setFormData] = useState({
    gameName: '',
    gameNameHindi: '',
    openTime: ''
  })

  useEffect(() => {
    fetchGames()
  }, [])

  useEffect(() => {
    // Filter games based on search term
    const filtered = games.filter(game =>
      game.gameName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (game.gameNameHindi && game.gameNameHindi.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    setFilteredGames(filtered)
  }, [games, searchTerm])

  const fetchGames = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const [gamesResponse, resultsResponse] = await Promise.all([
        axios.get(`${API_URL}/starline/games?limit=100`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }),
        axios.get(`${API_URL}/starline/results?date=${new Date().toISOString().split('T')[0]}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }).catch(() => ({ data: { results: [] } })) // Handle if endpoint fails
      ])

      if (gamesResponse.data.success) {
        setGames(gamesResponse.data.data.games)
      }

      // Create a map of game results for today
      const resultsMap = {}
      if (resultsResponse.data.results) {
        resultsResponse.data.results.forEach(result => {
          const gameId = result.gameId._id || result.gameId
          resultsMap[gameId] = result
        })
      }
      setGameResults(resultsMap)

    } catch (error) {
      console.error('Error fetching games:', error)
      toast.error('Failed to fetch games')
    } finally {
      setLoading(false)
    }
  }

  // Function to get market status based on current time and results
  const getMarketStatus = (game) => {
    if (!game.isActive) {
      return { status: 'Inactive', color: 'text-gray-500' }
    }

    // Check if result has been declared for today (starline games have single result)
    const todayResult = gameResults[game._id]
    if (todayResult && todayResult.winningNumber) {
      return { status: 'Market Closed - Result Declared', color: 'text-blue-600' }
    }

    const now = new Date()
    const currentTime = now.toTimeString().slice(0, 5) // Get HH:MM format

    const timeToMinutes = (timeStr) => {
      const [hours, minutes] = timeStr.split(':').map(Number)
      return hours * 60 + minutes
    }

    const currentMinutes = timeToMinutes(currentTime)
    const openMinutes = timeToMinutes(game.openTime)

    // Starline games are open from start of day (00:00) until open time, then closed
    if (currentMinutes <= openMinutes) {
      return { status: 'Market Open', color: 'text-green-600' }
    } else {
      return { status: 'Market Closed', color: 'text-red-600' }
    }
  }

  const toggleGameStatus = async (gameId) => {
    try {
      const response = await axios.patch(`${API_URL}/starline/games/${gameId}/toggle-status`, {}, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      // Update the games list with the new status
      setGames(prevGames =>
        prevGames.map(game =>
          game._id === gameId ? { ...game, isActive: response.data.data.isActive } : game
        )
      )

      toast.success(`Game ${response.data.data.isActive ? 'activated' : 'deactivated'} successfully`)
    } catch (error) {
      console.error('Error toggling game status:', error)
      toast.error('Failed to update game status')
    }
  }

  const handleEdit = (gameId) => {
    const game = games.find(g => g._id === gameId)
    setSelectedGame(game)
    setFormData({
      gameName: game.gameName,
      gameNameHindi: game.gameNameHindi || '',
      openTime: game.openTime
    })
    setShowModal(true)
  }

  const handleCreateGame = async (e) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem('token')
      const response = await axios.post(`${API_URL}/starline/games`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (response.data.success) {
        toast.success('Game created successfully')
        setShowModal(false)
        resetForm()
        fetchGames()
      }
    } catch (error) {
      console.error('Create game error:', error)
      const errorMessage = error.response?.data?.message || 'Failed to create game'
      toast.error(errorMessage)
    }
  }

  const handleUpdateGame = async (e) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem('token')
      const response = await axios.put(`${API_URL}/starline/games/${selectedGame._id}`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (response.data.success) {
        toast.success('Game updated successfully')
        setShowModal(false)
        setSelectedGame(null)
        resetForm()
        fetchGames()
      }
    } catch (error) {
      console.error('Update game error:', error)
      toast.error(error.response?.data?.message || 'Failed to update game')
    }
  }

  const resetForm = () => {
    setFormData({
      gameName: '',
      gameNameHindi: '',
      openTime: ''
    })
  }

  const handleAddGame = () => {
    resetForm()
    setSelectedGame(null)
    setShowModal(true)
  }

  const handleBack = () => {
    navigate('/admin-dashboard')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading games...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-blue-600 text-white p-4 flex items-center">
        <button
          onClick={handleBack}
          className="mr-4 p-2 hover:bg-blue-700 rounded-lg transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-xl font-bold">Starline Game Management</h1>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="bg-white rounded-lg shadow-sm">
          {/* Title and Search */}
          <div className="p-4 border-b">
            <h2 className="text-2xl font-bold text-blue-600 mb-4">Starline Game List</h2>

            {/* Search Bar */}
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Add Game Button */}
            <button
              onClick={handleAddGame}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Add Game
            </button>
          </div>

          {/* Games Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-blue-600 text-white">
                <tr>
                  <th className="px-4 py-3 text-left">S.No</th>
                  <th className="px-4 py-3 text-left">Game Name</th>
                  <th className="px-4 py-3 text-left">Open Time</th>
                  <th className="px-4 py-3 text-left">Market Active</th>
                  <th className="px-4 py-3 text-left">Current Status</th>
                  <th className="px-4 py-3 text-left">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredGames.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                      {searchTerm ? 'No games found matching your search' : 'No games available'}
                    </td>
                  </tr>
                ) : (
                  filteredGames.map((game, index) => (
                    <tr key={game._id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3">{index + 1}</td>
                      <td className="px-4 py-3">
                        <div>
                          <div className="font-medium">{game.gameName}</div>
                          {game.gameNameHindi && (
                            <div className="text-sm text-gray-500">{game.gameNameHindi}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">{game.openTime}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => toggleGameStatus(game._id, game.isActive)}
                          className={`px-3 py-1 rounded-full text-white text-sm font-medium ${game.isActive
                            ? 'bg-green-500 hover:bg-green-600'
                            : 'bg-red-500 hover:bg-red-600'
                            } transition-colors`}
                          title={`Click to ${game.isActive ? 'deactivate' : 'activate'} market`}
                        >
                          {game.isActive ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        {(() => {
                          const marketStatus = getMarketStatus(game)
                          return (
                            <span className={`font-medium ${marketStatus.color}`}>
                              {marketStatus.status}
                            </span>
                          )
                        })()}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleEdit(game._id)}
                          className="bg-blue-600 text-white px-4 py-1 rounded text-sm font-medium hover:bg-blue-700 transition-colors"
                        >
                          EDIT
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create/Edit Game Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {selectedGame ? 'Edit Game' : 'Create New Game'}
                </h3>
                <button
                  onClick={() => {
                    setShowModal(false)
                    setSelectedGame(null)
                    resetForm()
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={selectedGame ? handleUpdateGame : handleCreateGame} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Game Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.gameName}
                    onChange={(e) => setFormData({ ...formData, gameName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Game Name (Hindi)</label>
                  <input
                    type="text"
                    value={formData.gameNameHindi}
                    onChange={(e) => setFormData({ ...formData, gameNameHindi: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Open Time *</label>
                  <input
                    type="time"
                    required
                    value={formData.openTime}
                    onChange={(e) => setFormData({ ...formData, openTime: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false)
                      setSelectedGame(null)
                      resetForm()
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    {selectedGame ? 'Update Game' : 'Create Game'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default StarlineGameManagement